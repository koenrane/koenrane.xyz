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

function buildExternalLinkSummary(linkElement: HTMLAnchorElement, targetUrl: URL): HTMLElement {
  const summaryElement = document.createElement("section")
  summaryElement.classList.add("external-link-preview")
  const linkText = linkElement.textContent?.trim() || linkElement.innerText?.trim() || targetUrl.hostname
  summaryElement.innerHTML = `
    <h3>${linkText}</h3>
    <p><strong>Domain:</strong> ${targetUrl.hostname}</p>
    <p><strong>URL:</strong> ${targetUrl.href}</p>
  `
  return summaryElement
}

function createExternalFallbackPopover(linkElement: HTMLAnchorElement, targetUrl: URL): HTMLElement {
  const popoverElement = document.createElement("div")
  popoverElement.classList.add("popover")
  const popoverInner = document.createElement("div")
  popoverInner.classList.add("popover-inner", "popover-inner--external")
  popoverInner.dataset.contentType = "text/html;external-fallback"
  popoverInner.appendChild(buildExternalLinkSummary(linkElement, targetUrl))
  popoverElement.appendChild(popoverInner)
  return popoverElement
}

function createExternalPreviewPopover(linkElement: HTMLAnchorElement, targetUrl: URL): HTMLElement {
  const popoverElement = document.createElement("div")
  popoverElement.classList.add("popover")

  const popoverInner = document.createElement("div")
  popoverInner.classList.add("popover-inner", "popover-inner--external")
  popoverInner.dataset.contentType = "text/html;external-preview"
  popoverElement.appendChild(popoverInner)

  const headerElement = document.createElement("header")
  headerElement.classList.add("external-preview-header")
  headerElement.innerHTML = `
    <strong>${linkElement.textContent?.trim() || targetUrl.hostname}</strong>
    <span>${targetUrl.hostname}</span>
  `
  popoverInner.appendChild(headerElement)

  const frameWrapper = document.createElement("div")
  frameWrapper.classList.add("external-preview-frame")

  const previewFrame = document.createElement("iframe")
  previewFrame.src = targetUrl.toString()
  previewFrame.loading = "lazy"
  previewFrame.title = `Preview of ${targetUrl.hostname}`
  previewFrame.referrerPolicy = "no-referrer"
  previewFrame.setAttribute("sandbox", EXTERNAL_IFRAME_SANDBOX)

  previewFrame.addEventListener("load", () => {
    popoverElement.dispatchEvent(new CustomEvent(EXTERNAL_PREVIEW_LOADED_EVENT))
  })

  previewFrame.addEventListener("error", () => {
    frameWrapper.replaceChildren(buildExternalLinkSummary(linkElement, targetUrl))
    frameWrapper.classList.add("external-preview-frame--fallback")
    popoverElement.dispatchEvent(new CustomEvent(EXTERNAL_PREVIEW_LOADED_EVENT))
  })

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

    try {
      popoverElement = targetIsExternal
        ? createExternalPreviewPopover(this, targetUrl)
        : await createPopover(popoverOptions)
    } catch (error) {
      // If createPopover fails (e.g., CORS, 404, etc.), create a fallback popover
      console.warn("Failed to create popover for", targetUrl.href, error)
      popoverElement = createExternalFallbackPopover(this, targetUrl)
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
        popoverElement.removeEventListener(EXTERNAL_PREVIEW_LOADED_EVENT, handleExternalPreviewLoaded)
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
