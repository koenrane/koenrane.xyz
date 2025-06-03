import { normalizeRelativeURLs } from "../../util/path"
import { animate } from "./component_script_utils"

export interface PopoverOptions {
  parentElement: HTMLElement
  targetUrl: URL
  linkElement: HTMLLinkElement
  customFetch?: typeof fetch
}

const parser = new DOMParser()

/**
 * Fetches content while following HTML meta refresh redirects.
 * @param url - The URL to fetch
 * @param customFetch - Optional custom fetch implementation
 * @param maxRedirects - Maximum number of redirects to follow (default: 3)
 * @returns The final response after following any meta refreshes
 */
export async function fetchWithMetaRedirect(
  url: URL,
  customFetch: typeof fetch = fetch,
  maxRedirects = 3,
): Promise<Response> {
  let currentUrl = url
  let redirectCount = 0

  while (redirectCount < maxRedirects) {
    const response = await customFetch(currentUrl.toString())

    // If not HTML or response not OK, return as-is
    const contentType = response.headers.get("Content-Type")
    if (!response.ok || !contentType?.includes("text/html")) {
      return response
    }

    const html = await response.text()
    const metaRefresh = html.match(/<meta[^>]*?http-equiv=["']?refresh["']?[^>]*?>/i)

    if (!metaRefresh) {
      // No meta refresh found, return response with the HTML content
      return new Response(html, {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
      })
    }

    // Extract URL from content="[timeout]; url=[url]"
    const urlMatch = metaRefresh[0].match(/url=(.*?)["'\s>]/i)
    if (!urlMatch) {
      return response
    }

    // Update URL for next iteration
    currentUrl = new URL(urlMatch[1], currentUrl)
    redirectCount++
  }

  throw new Error(`Maximum number of redirects (${maxRedirects}) exceeded`)
}

/**
 * Creates a popover element based on the provided options
 * @param options - The options for creating the popover
 * @returns A Promise that resolves to the created popover element
 */
export async function createPopover(options: PopoverOptions): Promise<HTMLElement> {
  const { targetUrl, linkElement, customFetch = fetch } = options

  // Check if the link is a footnote back arrow
  const footnoteRefRegex = /^#user-content-fnref-\d+$/
  if (footnoteRefRegex.test(linkElement.getAttribute("href") || "")) {
    throw new Error("Footnote back arrow links are not supported for popovers")
  }

  const popoverElement = document.createElement("div")
  popoverElement.classList.add("popover")
  const popoverInner = document.createElement("div")
  popoverInner.classList.add("popover-inner")
  popoverElement.appendChild(popoverInner)

  const response = await fetchWithMetaRedirect(targetUrl, customFetch)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const contentType = response.headers.get("Content-Type")
  if (!contentType) throw new Error("No content type received")

  const [contentTypeCategory, typeInfo] = contentType.split("/")
  popoverInner.dataset.contentType = contentType

  let img: HTMLImageElement | null = null
  let contents: string | null = null
  let html: Document | null = null
  let hintElements: Element[] = []
  switch (contentTypeCategory) {
    case "image":
      img = document.createElement("img")
      img.src = targetUrl.toString()
      img.alt = targetUrl.pathname
      popoverInner.appendChild(img)
      break
    case "application":
      if (typeInfo === "pdf") {
        const pdf = document.createElement("iframe")
        pdf.src = targetUrl.toString()
        popoverInner.appendChild(pdf)
      }
      break
    default:
      contents = await response.text()
      html = parser.parseFromString(contents, "text/html")
      normalizeRelativeURLs(html, targetUrl)

      hintElements = Array.from(html.getElementsByClassName("popover-hint"))
      Array.from(hintElements).forEach((elt) => {
        const popoverHeadings = elt.querySelectorAll("h1, h2, h3, h4, h5, h6, li, a")
        popoverHeadings.forEach((element) => {
          if (element.id) {
            element.id = `${element.id}-popover`
          }
        })
        popoverInner.appendChild(elt)
      })
  }

  return popoverElement
}

// POSITIONING the popover
export const POPOVER_PADDING = 5

/**
 * Computes the left position of the popover
 * @param linkRect - The bounding rectangle of the link element
 * @param popoverWidth - The width of the popover element
 * @returns The computed left position
 */
export function computeLeft(linkRect: DOMRect, popoverWidth: number): number {
  const initialLeft = linkRect.left - popoverWidth - POPOVER_PADDING

  // Ensure the popover doesn't go off the left or right edge of the screen
  const maxLeft = window.innerWidth - popoverWidth - POPOVER_PADDING
  const minLeft = POPOVER_PADDING

  return Math.max(minLeft, Math.min(initialLeft, maxLeft))
}

/**
 * Computes the top position of the popover
 * @param linkRect - The bounding rectangle of the link element
 * @param popoverHeight - The height of the popover element
 * @returns The computed top position
 */
export function computeTop(linkRect: DOMRect, popoverHeight: number): number {
  // Calculate top position to be centered vertically with the link
  const initialTop = 0.5 * (linkRect.top + linkRect.bottom) - 0.5 * popoverHeight + window.scrollY

  // Ensure the popover doesn't go off the top or bottom of the screen
  const minTop = window.scrollY + POPOVER_PADDING
  const maxTop = window.scrollY + window.innerHeight - popoverHeight - POPOVER_PADDING

  return Math.max(minTop, Math.min(initialTop, maxTop))
}

/**
 * Sets the position of the popover relative to the link element
 * @param popoverElement - The popover element to position
 * @param linkElement - The link element to position relative to
 */
export function setPopoverPosition(
  popoverElement: HTMLElement,
  linkElement: HTMLLinkElement,
): void {
  const linkRect = linkElement.getBoundingClientRect()
  const popoverWidth = popoverElement.offsetWidth
  const popoverHeight = popoverElement.offsetHeight

  const left = computeLeft(linkRect, popoverWidth)
  const top = computeTop(linkRect, popoverHeight)

  Object.assign(popoverElement.style, {
    position: "absolute",
    left: `${left}px`,
    top: `${top}px`,
  })
}

/**
 * Attaches event listeners to the popover and link elements
 * @param popoverElement - The popover element
 * @param linkElement - The link element
 * @returns A cleanup function to remove the event listeners
 */
export function attachPopoverEventListeners(
  popoverElement: HTMLElement,
  linkElement: HTMLLinkElement,
): () => void {
  let isMouseOverLink = false
  let isMouseOverPopover = false

  const removePopover = () => {
    popoverElement.classList.remove("visible")
    animate(
      300,
      () => {},
      () => {
        if (!isMouseOverLink && !isMouseOverPopover) {
          popoverElement.remove()
        }
      },
    )
  }

  const showPopover = () => {
    popoverElement.classList.add("popover-visible")
  }

  linkElement.addEventListener("mouseenter", () => {
    isMouseOverLink = true
    showPopover()
  })

  linkElement.addEventListener("mouseleave", () => {
    isMouseOverLink = false
    removePopover()
  })

  popoverElement.addEventListener("mouseenter", () => {
    isMouseOverPopover = true
  })

  popoverElement.addEventListener("mouseleave", () => {
    isMouseOverPopover = false
    removePopover()
  })

  popoverElement.addEventListener("click", (e) => {
    const clickedLink = (e.target as HTMLElement).closest("a")
    if (clickedLink && clickedLink instanceof HTMLAnchorElement) {
      window.location.href = clickedLink.href
    } else {
      window.location.href = linkElement.href
    }
  })

  // Cleanup function
  return () => {
    linkElement.removeEventListener("mouseenter", showPopover)
    linkElement.removeEventListener("mouseleave", removePopover)
    popoverElement.removeEventListener("mouseenter", () => {
      isMouseOverPopover = true
    })
    popoverElement.removeEventListener("mouseleave", () => {
      isMouseOverPopover = false
      removePopover()
    })
    popoverElement.removeEventListener("click", () => {
      // empty because the function intentionally does nothing for this event
    })
  }
}

/**
 * Escapes leading ID numbers in a string
 * @param text - The text to escape
 * @returns The escaped text
 */
export function escapeLeadingIdNumber(text: string): string {
  return text.replace(/#(\d+)/, "#_$1")
}
