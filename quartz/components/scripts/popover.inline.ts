import { animate } from "./component_script_utils"
import {
  createPopover,
  setPopoverPosition,
  attachPopoverEventListeners,
  PopoverOptions,
  escapeLeadingIdNumber,
} from "./popover_helpers"

/**
 * Creates a simple fallback popover for external links
 */
function createExternalLinkPopover(linkElement: HTMLAnchorElement, targetUrl: URL): HTMLElement {
  const popoverElement = document.createElement("div")
  popoverElement.classList.add("popover")
  const popoverInner = document.createElement("div")
  popoverInner.classList.add("popover-inner")
  popoverElement.appendChild(popoverInner)

  // Create content for external link
  const domain = targetUrl.hostname
  const linkText = linkElement.textContent || linkElement.innerText || targetUrl.href
  
  popoverInner.innerHTML = `
    <div class="external-link-preview">
      <h3>${linkText}</h3>
      <p><strong>Domain:</strong> ${domain}</p>
      <p><strong>URL:</strong> ${targetUrl.href}</p>
    </div>
  `

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

    try {
      // For external links, use the fallback popover instead of fetching content
      if (isExternalUrl(targetUrl)) {
        popoverElement = createExternalLinkPopover(this, targetUrl)
      } else {
        popoverElement = await createPopover(popoverOptions)
      }
    } catch (error) {
      // If createPopover fails (e.g., CORS, 404, etc.), create a fallback popover
      console.warn("Failed to create popover for", targetUrl.href, error)
      popoverElement = createExternalLinkPopover(this, targetUrl)
    }

    if (!popoverElement) {
      throw new Error("Failed to create popover")
    }

    parentOfPopover.prepend(popoverElement)

    const updatePosition = () => {
      setPopoverPosition(popoverElement, this)
    }

    updatePosition()

    window.addEventListener("resize", updatePosition)

    const cleanup = attachPopoverEventListeners(popoverElement, this)

    // skipcq: JS-0098
    void popoverElement.offsetWidth

    popoverElement.classList.add("popover-visible")

    if (hash !== "" && !isExternalUrl(targetUrl)) {
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
