import { animate } from "./component_script_utils"
import {
  createPopover,
  setPopoverPosition,
  attachPopoverEventListeners,
  PopoverOptions,
  escapeLeadingIdNumber,
} from "./popover_helpers"

const EXTERNAL_IFRAME_SANDBOX =
  "allow-forms allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
const EXTERNAL_PREVIEW_LOADED_EVENT = "quartz:externalPreviewLoaded"
// A frameable origin can still be slow; swap in the card rather than hanging on `load`.
const EXTERNAL_PREVIEW_TIMEOUT_MS = 5000

/**
 * Preview metadata baked onto the anchor at build time by the AddLinkPreviews transformer.
 */
interface ExternalPreviewData {
  frameable: boolean
  title: string
  description: string
}

/**
 * Reads the build-time preview data off an anchor.
 *
 * A cross-origin iframe blocked by X-Frame-Options or CSP still fires `load`, so there is
 * no client-side signal for "blocked". The build-time probe is the only evidence we have,
 * and its absence (never crawled, or the crawl failed) must mean "do not frame".
 */
function readExternalPreviewData(
  linkElement: HTMLAnchorElement,
  targetUrl: URL,
): ExternalPreviewData {
  return {
    frameable: linkElement.dataset.previewFrameable === "true",
    title:
      linkElement.dataset.previewTitle?.trim() ||
      linkElement.textContent?.trim() ||
      targetUrl.hostname,
    description: linkElement.dataset.previewDescription?.trim() ?? "",
  }
}

/**
 * Builds a `<p><strong>Label:</strong> value</p>` row from DOM nodes only, never from an
 * HTML string.
 *
 * Everything here may be remote-controlled, so values are only ever set as text.
 */
function createLabeledRow(label: string, value: string): HTMLParagraphElement {
  const rowElement = document.createElement("p")
  const labelElement = document.createElement("strong")
  labelElement.textContent = `${label}:`
  rowElement.appendChild(labelElement)
  rowElement.appendChild(document.createTextNode(` ${value}`))
  return rowElement
}

function buildExternalLinkSummary(targetUrl: URL, previewData: ExternalPreviewData): HTMLElement {
  const summaryElement = document.createElement("section")
  summaryElement.classList.add("external-link-preview")

  const titleElement = document.createElement("h3")
  titleElement.textContent = previewData.title
  summaryElement.appendChild(titleElement)

  if (previewData.description) {
    const descriptionElement = document.createElement("p")
    descriptionElement.classList.add("external-link-preview-description")
    descriptionElement.textContent = previewData.description
    summaryElement.appendChild(descriptionElement)
  }

  summaryElement.appendChild(createLabeledRow("Domain", targetUrl.hostname))
  summaryElement.appendChild(createLabeledRow("URL", targetUrl.href))
  return summaryElement
}

/**
 * Builds the card popover: the default for every external link whose origin has not been
 * proven frameable, and the fallback when creating a popover throws.
 */
function createExternalCardPopover(targetUrl: URL, previewData: ExternalPreviewData): HTMLElement {
  const popoverElement = document.createElement("div")
  popoverElement.classList.add("popover")
  const popoverInner = document.createElement("div")
  popoverInner.classList.add("popover-inner", "popover-inner--external")
  popoverInner.dataset.contentType = "text/html;external-fallback"
  popoverInner.appendChild(buildExternalLinkSummary(targetUrl, previewData))
  popoverElement.appendChild(popoverInner)
  return popoverElement
}

/**
 * Builds the iframe popover. Only ever called for origins the build-time probe proved
 * frameable.
 *
 * The pending timeout is cancelled by the frame's own load and error events, and its
 * callback bails out if the popover has since been detached, so a fast mouseout can never
 * leave a timer to mutate a dead popover.
 */
function createExternalPreviewPopover(
  targetUrl: URL,
  previewData: ExternalPreviewData,
): HTMLElement {
  const popoverElement = document.createElement("div")
  popoverElement.classList.add("popover")

  const popoverInner = document.createElement("div")
  popoverInner.classList.add("popover-inner", "popover-inner--external")
  popoverInner.dataset.contentType = "text/html;external-preview"
  popoverElement.appendChild(popoverInner)

  const headerElement = document.createElement("header")
  headerElement.classList.add("external-preview-header")
  const headerTitle = document.createElement("strong")
  headerTitle.textContent = previewData.title
  const headerHostname = document.createElement("span")
  headerHostname.textContent = targetUrl.hostname
  headerElement.appendChild(headerTitle)
  headerElement.appendChild(headerHostname)
  popoverInner.appendChild(headerElement)

  const frameWrapper = document.createElement("div")
  frameWrapper.classList.add("external-preview-frame")

  const previewFrame = document.createElement("iframe")
  previewFrame.src = targetUrl.toString()
  previewFrame.loading = "lazy"
  previewFrame.title = `Preview of ${targetUrl.hostname}`
  previewFrame.referrerPolicy = "no-referrer"
  previewFrame.setAttribute("sandbox", EXTERNAL_IFRAME_SANDBOX)

  let fallbackTimer: ReturnType<typeof setTimeout> | undefined
  const clearFallbackTimer = () => {
    if (fallbackTimer !== undefined) {
      clearTimeout(fallbackTimer)
      fallbackTimer = undefined
    }
  }

  const showFallbackCard = () => {
    clearFallbackTimer()
    // The popover may already have been torn down while we were waiting.
    if (!popoverElement.isConnected) return
    frameWrapper.replaceChildren(buildExternalLinkSummary(targetUrl, previewData))
    frameWrapper.classList.add("external-preview-frame--fallback")
    popoverElement.dispatchEvent(new CustomEvent(EXTERNAL_PREVIEW_LOADED_EVENT))
  }

  previewFrame.addEventListener("load", () => {
    clearFallbackTimer()
    popoverElement.dispatchEvent(new CustomEvent(EXTERNAL_PREVIEW_LOADED_EVENT))
  })

  previewFrame.addEventListener("error", showFallbackCard)

  fallbackTimer = setTimeout(showFallbackCard, EXTERNAL_PREVIEW_TIMEOUT_MS)

  frameWrapper.appendChild(previewFrame)
  popoverInner.appendChild(frameWrapper)

  return popoverElement
}

/**
 * Checks if a URL is external (different domain from current site)
 */
function isExternalUrl(url: URL): boolean {
  return url.hostname !== window.location.hostname
}

/**
 * Handles the mouse enter event for link elements
 * @returns A cleanup function to remove event listeners and timeout
 */
function mouseEnterHandler(this: HTMLAnchorElement) {
  const parentOfPopover = document.getElementById("quartz-root")
  if (!parentOfPopover || this.dataset.noPopover === "true") {
    return
  }

  const thisUrl = new URL(document.location.href)
  thisUrl.hash = ""
  thisUrl.search = ""
  const targetUrl = new URL(this.href)
  let hash = targetUrl.hash
  targetUrl.hash = ""
  targetUrl.search = ""

  const popoverOptions: PopoverOptions = {
    parentElement: parentOfPopover,
    targetUrl,
    linkElement: this,
  }

  const showPopover = async () => {
    let popoverElement: HTMLElement
    const targetIsExternal = isExternalUrl(targetUrl)
    const previewData = readExternalPreviewData(this, targetUrl)

    try {
      if (!targetIsExternal) {
        popoverElement = await createPopover(popoverOptions)
      } else if (previewData.frameable) {
        popoverElement = createExternalPreviewPopover(targetUrl, previewData)
      } else {
        popoverElement = createExternalCardPopover(targetUrl, previewData)
      }
    } catch (error) {
      // If createPopover fails (e.g., CORS, 404, etc.), create a fallback popover
      console.warn("Failed to create popover for", targetUrl.href, error)
      popoverElement = createExternalCardPopover(targetUrl, previewData)
    }

    if (!popoverElement) {
      throw new Error("Failed to create popover")
    }

    parentOfPopover.prepend(popoverElement)

    const updatePosition = () => {
      setPopoverPosition(popoverElement, this)
    }

    updatePosition()

    const handleExternalPreviewLoaded = () => {
      updatePosition()
    }

    if (targetIsExternal) {
      popoverElement.addEventListener(EXTERNAL_PREVIEW_LOADED_EVENT, handleExternalPreviewLoaded)
    }

    window.addEventListener("resize", updatePosition)

    const cleanup = attachPopoverEventListeners(popoverElement, this)

    // skipcq: JS-0098
    void popoverElement.offsetWidth

    popoverElement.classList.add("popover-visible")

    if (hash !== "" && !targetIsExternal) {
      hash = `${hash}-popover`
      hash = escapeLeadingIdNumber(hash)
      const heading = popoverElement.querySelector(hash) as HTMLElement | null
      if (heading) {
        const popoverInner = popoverElement.querySelector(".popover-inner") as HTMLElement

        popoverInner.scroll({ top: heading.offsetTop - 12, behavior: "instant" })
      }
    }

    return () => {
      cleanup()
      window.removeEventListener("resize", updatePosition)
      if (targetIsExternal) {
        popoverElement.removeEventListener(
          EXTERNAL_PREVIEW_LOADED_EVENT,
          handleExternalPreviewLoaded,
        )
      }
    }
  }

  // Use requestAnimationFrame to delay showing the popover
  const cleanupShow = () => {
    return animate(
      300,
      () => undefined,
      async () => {
        await showPopover()
      },
    )
  }

  const cleanup = cleanupShow()

  return () => {
    cleanup()
    window.removeEventListener("resize", showPopover)
  }
}

// Add event listeners to all links (both internal and external)
document.addEventListener("nav", () => {
  const links = [...document.getElementsByTagName("a")] as HTMLAnchorElement[]
  for (const link of links) {
    // Skip links that explicitly disable popovers
    // if (link.dataset.noPopover === "true") continue

    // Optional: Skip mailto and tel links
    if (link.href.startsWith("mailto:") || link.href.startsWith("tel:")) continue

    // Optional: Skip anchor links on the same page
    if (link.href.startsWith("#")) continue

    // Define handlers outside to ensure they can be removed
    let cleanup: (() => void) | undefined

    const handleMouseEnter = async () => {
      if (cleanup) cleanup()
      cleanup = mouseEnterHandler.call(link)
    }

    const handleMouseLeave = () => {
      if (cleanup) cleanup()
    }

    link.addEventListener("mouseenter", handleMouseEnter)
    link.addEventListener("mouseleave", handleMouseLeave)
  }
})
