import type { Element, Root, Text, Parent } from "hast"
import type { ReadableStream } from "stream/web"

import gitRoot from "find-git-root"
import fs from "fs"
import path from "path"
import { Readable } from "stream"
import { pipeline } from "stream/promises"
import { visit } from "unist-util-visit"
import { fileURLToPath } from "url"

import { createLogger } from "./logger_utils"

const logger = createLogger("linkfavicons")

export const MAIL_PATH = "https://assets.turntrout.com/static/images/mail.svg"
export const TURNTROUT_FAVICON_PATH =
  "/static/images/favicon.ico"
export const LESSWRONG_FAVICON_PATH =
  "https://assets.turntrout.com/static/images/external-favicons/lesswrong_com.avif"
const QUARTZ_FOLDER = "quartz"
const FAVICON_FOLDER = "static/images/external-favicons"
export const DEFAULT_PATH = ""
export const ANCHOR_PATH = "https://assets.turntrout.com/static/images/anchor.svg"

const __filepath = fileURLToPath(import.meta.url)
const __dirname = path.dirname(gitRoot(__filepath))
export const FAVICON_URLS_FILE = path.join(
  __dirname,
  "quartz",
  "plugins",
  "transformers",
  ".faviconUrls.txt",
)
if (!fs.existsSync(FAVICON_URLS_FILE)) {
  try {
    fs.writeFileSync(FAVICON_URLS_FILE, "")
  } catch {
    throw new Error(
      `Favicon URL cache file not found at path ${FAVICON_URLS_FILE}; create it with \`touch\` if that's the right path.`,
    )
  }
}

export class DownloadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DownloadError"
  }
}

/**
 * Downloads an image from a given URL and saves it to the specified local path.
 *
 * Performs several validations:
 * 1. Checks if the HTTP response is successful
 * 2. Verifies the content type is an image
 * 3. Ensures the file is not empty
 * 4. Creates the target directory if needed
 * 5. Validates the downloaded file size
 *
 * @throws DownloadError if any validation fails or download/save errors occur
 * @param url - The URL of the image to download
 * @param imagePath - The local file path where the image should be saved
 * @returns Promise<boolean> - True if download and save successful
 */
export async function downloadImage(url: string, imagePath: string): Promise<boolean> {
  logger.info(`Attempting to download image from ${url} to ${imagePath}`)
  const response = await fetch(url)

  if (!response.ok) {
    throw new DownloadError(`Failed to fetch image: ${url}. Status: ${response.status}`)
  }

  const contentType = response.headers.get("content-type")
  if (!contentType || !contentType.startsWith("image/")) {
    throw new DownloadError(`URL does not point to an image: ${url}. Content-Type: ${contentType}`)
  }

  const contentLength = response.headers.get("content-length")
  if (contentLength && parseInt(contentLength, 10) === 0) {
    throw new DownloadError(`Empty image file: ${url}`)
  }

  if (!response.body) {
    throw new DownloadError(`No response body: ${url}`)
  }

  const body = Readable.fromWeb(response.body as ReadableStream)

  try {
    // Create the directory if it doesn't exist
    await fs.promises.mkdir(path.dirname(imagePath), { recursive: true })
    await pipeline(body, fs.createWriteStream(imagePath))
  } catch (err) {
    throw new DownloadError(`Failed to write image to ${imagePath}: ${err}`)
  }

  const stats = await fs.promises.stat(imagePath)

  if (stats.size === 0) {
    await fs.promises.unlink(imagePath)
    throw new DownloadError(`Downloaded file is empty: ${imagePath}`)
  }

  logger.info(`Successfully downloaded image to ${imagePath}`)
  return true
}

/**
 * Generates a standardized path for storing favicons in the Quartz system.
 *
 * Handles special cases:
 * - Converts localhost to turntrout.com
 * - Removes www. prefix from domains
 * - Uses special path for turntrout.com domain
 * - Converts dots to underscores for filesystem compatibility
 *
 * @param hostname - Domain name to generate path for (e.g. "example.com")
 * @returns Formatted path string (e.g. "/static/images/external-favicons/example_com.png")
 */
export function getQuartzPath(hostname: string): string {
  logger.debug(`Generating Quartz path for hostname: ${hostname}`)
  hostname = hostname === "localhost" ? "turntrout.com" : hostname.replace(/^www\./, "")
  const sanitizedHostname = hostname.replace(/\./g, "_")
  const path = sanitizedHostname.includes("turntrout_com")
    ? TURNTROUT_FAVICON_PATH
    : `/${FAVICON_FOLDER}/${sanitizedHostname}.png`
  logger.debug(`Generated Quartz path: ${path}`)
  return path
}

const defaultCache = new Map<string, string>([[TURNTROUT_FAVICON_PATH, TURNTROUT_FAVICON_PATH]])
export function createUrlCache(): Map<string, string> {
  return new Map(defaultCache)
}
export const urlCache = createUrlCache()
const faviconUrls = await readFaviconUrls()
for (const [basename, url] of faviconUrls) {
  if (!urlCache.has(basename)) {
    urlCache.set(basename, url)
  }
}

/**
 * Writes the favicon cache to the FAVICON_URLS_FILE.
 */
export function writeCacheToFile(): void {
  const data = Array.from(urlCache.entries())
    .map(([key, value]) => `${key},${value}`)
    .join("\n")

  fs.writeFileSync(FAVICON_URLS_FILE, data, { flag: "w+" })
}

/**
 * Reads favicon URLs from the FAVICON_URLS_FILE and returns them as a Map.
 *
 * @returns A Promise that resolves to a Map of basename to URL strings.
 */
export async function readFaviconUrls(): Promise<Map<string, string>> {
  try {
    const data = await fs.promises.readFile(FAVICON_URLS_FILE, "utf8")
    const lines = data.split("\n")
    const urlMap = new Map<string, string>()
    for (const line of lines) {
      const [basename, url] = line.split(",")
      if (basename && url) {
        urlMap.set(basename, url)
      }
    }
    return urlMap
  } catch (error) {
    logger.warn(`Error reading favicon URLs file: ${error}`)
    console.warn(error)
    return new Map<string, string>()
  }
}

/**
 * Attempts to locate or download a favicon for a given hostname.
 *
 * Search order:
 * 1. Check URL cache for previous results
 * 2. Look for AVIF version on CDN
 * 3. Check for local PNG file
 * 4. Try downloading from Google's favicon service
 * 5. Fall back to default if all attempts fail
 *
 * Caches results (including failures) to avoid repeated lookups
 *
 * @param hostname - Domain to find favicon for
 * @returns Path to favicon (local, CDN, or default)
 */
export async function MaybeSaveFavicon(hostname: string): Promise<string> {
  logger.info(`Attempting to find or save favicon for ${hostname}`)

  const faviconPath = getQuartzPath(hostname)

  // Check cache first
  if (urlCache.has(faviconPath)) {
    const cachedValue = urlCache.get(faviconPath)
    if (cachedValue === DEFAULT_PATH) {
      logger.info(`Skipping previously failed favicon for ${hostname}`)
      return DEFAULT_PATH
    }
    logger.info(`Returning cached favicon for ${hostname}`)
    return cachedValue as string
  }

  // Check for AVIF version
  const avifPath = faviconPath.replace(".png", ".avif")
  const avifUrl = avifPath.startsWith("http") ? avifPath : `https://assets.turntrout.com${avifPath}`

  try {
    const avifResponse = await fetch(avifUrl)
    if (avifResponse.ok) {
      logger.info(`AVIF found for ${hostname}: ${avifUrl}`)
      urlCache.set(faviconPath, avifUrl)
      return avifUrl
    }
  } catch (err) {
    logger.error(`Error checking AVIF on ${avifUrl}. ${err}`)
  }

  // Check for local PNG
  const localPngPath = path.join(QUARTZ_FOLDER, faviconPath)
  try {
    await fs.promises.stat(localPngPath)
    logger.info(`Local PNG found for ${hostname}: ${faviconPath}`)
    return faviconPath
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      // Try to download from Google
      const googleFaviconURL = `https://www.google.com/s2/favicons?sz=64&domain=${hostname}`
      logger.info(`Attempting to download favicon from Google: ${googleFaviconURL}`)
      try {
        if (await downloadImage(googleFaviconURL, localPngPath)) {
          logger.info(`Successfully downloaded favicon for ${hostname}`)
          return faviconPath
        }
      } catch (downloadErr) {
        logger.error(`Failed to download favicon for ${hostname}: ${downloadErr}`)
        urlCache.set(faviconPath, DEFAULT_PATH) // Cache the failure
      }
    }
  }

  // If all else fails, use default and cache the failure
  logger.debug(`Failed to find or download favicon for ${hostname}, using default`)
  urlCache.set(faviconPath, DEFAULT_PATH)
  return DEFAULT_PATH
}

export interface FaviconNode extends Element {
  type: "element"
  tagName: "img" | "span"
  children: Element[]
  properties: {
    src: string
    class: string
    alt: string
    style?: string
  }
}

/**
 * Creates a favicon element (img tag) with the given URL and description.
 *
 * @param urlString - The URL of the favicon image.
 * @param description - The alt text for the favicon (default: "", so that favicons are treated as decoration by screen readers).
 * @returns An object representing the favicon element.
 */
export function createFaviconElement(urlString: string, description = ""): FaviconNode {
  logger.debug(`Creating favicon element with URL: ${urlString}`)
  return {
    type: "element",
    tagName: "img",
    children: [],
    properties: {
      src: urlString,
      class: "favicon",
      alt: description,
    },
  }
}

/**
 * Inserts a favicon image into a node's children.
 *
 * @param imgPath - The path to the favicon image.
 * @param node - The node to insert the favicon into.
 */
export function insertFavicon(imgPath: string | null, node: Element): void {
  logger.debug(`Inserting favicon: ${imgPath}`)
  if (imgPath === null) {
    logger.debug("No favicon to insert")
    return
  }

  const toAppend: FaviconNode = createFaviconElement(imgPath)

  const maybeSpliceTextResult = maybeSpliceText(node, toAppend)
  if (maybeSpliceTextResult) {
    node.children.push(maybeSpliceTextResult)
  }
}

// Glyphs where top-right corner occupied
export const charsToSpace = ["!", "?", "|", "]", '"', "”", "’", "'"]
export const tagsToZoomInto = ["code", "em", "strong", "i", "b", "del", "s", "ins", "abbr"]
export const maxCharsToRead = 4

/**
 * Attempts to splice text content with a favicon element.
 *
 * This function handles text nodes by:
 * 1. Taking the last few characters (up to maxCharsToRead)
 * 2. Creating a span containing those characters and the favicon
 * 3. Adjusting spacing if the last character needs extra margin
 *
 * @param node - The Element node to process
 * @param imgNodeToAppend - The favicon node to append
 * @returns A modified Element containing the spliced text and favicon, or just the favicon if no text was spliced. Returns null if the node is not a text node or has no text value.
 */
export function maybeSpliceText(node: Element, imgNodeToAppend: FaviconNode): Element | null {
  // Find the last non-empty child
  const isEmpty = (child: Element | Text) => child.type === "text" && child.value?.trim() === ""
  const lastChild = [...node.children]
    .reverse()
    .find((child) => child.type === "element" || !isEmpty(child as Element | Text))

  // If no valid last child found, just append the favicon
  if (!lastChild) {
    logger.debug("No valid last child found, appending favicon directly")
    return imgNodeToAppend
  }

  // If the last child is a tag that should be zoomed into, recurse
  if (lastChild.type === "element" && tagsToZoomInto.includes(lastChild.tagName)) {
    logger.debug(`Zooming into nested element ${lastChild.tagName}`)
    const maybeSpliceTextResult = maybeSpliceText(lastChild as Element, imgNodeToAppend)
    if (maybeSpliceTextResult) {
      lastChild.children.push(maybeSpliceTextResult)
    }
    return null
  }

  // If last child is not a text node or has no value, there's nothing to splice
  if (lastChild.type !== "text" || !lastChild.value) {
    logger.debug("Appending favicon directly to node")
    return imgNodeToAppend
  }

  const lastChildText = lastChild as Text
  const textContent = lastChildText.value
  // Some characters render particularly close to the favicon, so we add a small margin
  const lastChar = textContent.at(-1)
  if (lastChar && charsToSpace.includes(lastChar)) {
    // Adjust the style of the appended element
    logger.debug("Adding margin-left to appended element")
    imgNodeToAppend.properties = imgNodeToAppend.properties || {}
    imgNodeToAppend.properties.class = "favicon close-text"
  }

  // Take the last few characters (up to maxCharsToRead)
  const charsToRead = Math.min(maxCharsToRead, textContent.length)
  const lastChars = textContent.slice(-charsToRead)
  lastChildText.value = textContent.slice(0, -charsToRead)

  const span: Element = {
    type: "element",
    tagName: "span",
    properties: {
      className: "favicon-span",
    },
    children: [{ type: "text", value: lastChars } as Text, imgNodeToAppend],
  }
  const spanWithFavicon = span as FaviconNode

  // Replace entire text with span if all text was moved
  if (lastChars === textContent) {
    node.children.pop()
    logger.debug(`Replacing all ${charsToRead} chars with span`)
  }

  return spanWithFavicon
}

/**
 * Handles mailto links by inserting a mail icon.
 */
function handleMailtoLink(node: Element): void {
  logger.info("Inserting mail icon for mailto link")
  insertFavicon(MAIL_PATH, node)
}

/**
 * Handles same-page links (e.g. #section-1) by adding appropriate classes and icons.
 */
function handleSamePageLink(node: Element, href: string, parent: Parent): boolean {
  if (
    href.startsWith("#user-content-fn") || // Footnote links
    isHeading(parent as Element) // Links inside headings
  ) {
    return false
  }

  if (typeof node.properties.className === "string") {
    node.properties.className += " same-page-link"
  } else if (Array.isArray(node.properties.className)) {
    node.properties.className.push("same-page-link")
  } else {
    node.properties.className = ["same-page-link"]
  }

  insertFavicon(ANCHOR_PATH, node)
  return true
}

/**
 * Checks if a link should be skipped for favicon processing.
 */
function shouldSkipFavicon(node: Element, href: string): boolean {
  const samePage =
    (typeof node.properties.className === "string" &&
      node.properties.className.includes("same-page-link")) ||
    (Array.isArray(node.properties.className) &&
      node.properties.className.includes("same-page-link"))
  const isAsset = /\.(png|jpg|jpeg)$/.test(href)

  return samePage || isAsset
}

/**
 * Normalizes relative URLs to absolute URLs.
 */
function normalizeUrl(href: string): string {
  if (!href.startsWith("http")) {
    if (href.startsWith("./")) {
      href = href.slice(2)
    } else if (href.startsWith("../")) {
      href = href.slice(3)
    }
    href = `https://www.turntrout.com/${href}`
  }
  return href
}

/**
 * Processes links by downloading and inserting favicons.
 */
async function handleLink(href: string, node: Element): Promise<void> {
  try {
    const finalURL = new URL(href)
    logger.info(`Final URL: ${finalURL.href}`)

    const imgPath = await MaybeSaveFavicon(finalURL.hostname)

    if (imgPath === DEFAULT_PATH) {
      logger.info(`No favicon found for ${finalURL.hostname}; skipping`)
      return
    }

    logger.info(`Inserting favicon for ${finalURL.hostname}: ${imgPath}`)
    insertFavicon(imgPath, node)
  } catch (error) {
    logger.error(`Error processing URL ${href}: ${error}`)
  }
}

/**
 * Main node processing function for adding favicons to links.
 *
 * Link processing logic:
 * 1. Handles mailto: links with mail icon
 * 2. Processes same-page (#) links with anchor icon
 * 3. Skips image/asset links and already processed links
 * 4. Normalizes relative URLs to absolute
 * 5. Downloads and inserts appropriate favicon
 *
 * @param node - Link element to process
 * @param parent - Parent element of the link
 */
export async function ModifyNode(node: Element, parent: Parent): Promise<void> {
  logger.info(`Modifying node: ${node.tagName}`)
  if (node.tagName !== "a" || !node.properties.href) {
    logger.debug("Node is not an anchor or has no href, skipping")
    return
  }

  let href = node.properties.href
  logger.debug(`Processing href: ${href}`)
  if (typeof href !== "string") {
    logger.debug("Href is not a string, skipping")
    return
  }

  if (href.includes("mailto:")) {
    handleMailtoLink(node)
    return
  }

  const isSamePageLink = href.startsWith("#")
  if (isSamePageLink) {
    handleSamePageLink(node, href, parent)
    return
  }

  // Skip certain types of links
  if (shouldSkipFavicon(node, href)) {
    logger.debug(`Skipping favicon insertion for same-page link or asset: ${href}`)
    return
  }

  // Process external links
  href = normalizeUrl(href)
  await handleLink(href, node)
}

/**
 * Plugin factory that processes HTML tree to add favicons to links.
 *
 * Processing steps:
 * 1. Collects all link nodes from the document
 * 2. Processes each link in parallel
 * 3. Updates favicon cache file after completion
 *
 * @returns Plugin configuration object for Quartz
 */
export const AddFavicons = () => {
  return {
    name: "AddFavicons",
    htmlPlugins() {
      return [
        () => {
          return async (tree: Root) => {
            logger.info("Starting favicon processing")
            const nodesToProcess: [Element, Parent][] = []

            visit(
              tree,
              "element",
              (node: Element, _index: number | undefined, parent: Parent | undefined) => {
                if (!parent) return
                if (node.tagName === "a" && node.properties.href) {
                  logger.debug(`Found anchor node: ${node.properties.href}`)
                  nodesToProcess.push([node, parent])
                }
              },
            )

            logger.info(`Processing ${nodesToProcess.length} nodes`)
            await Promise.all(nodesToProcess.map(([node, parent]) => ModifyNode(node, parent)))
            logger.info("Finished processing favicons")

            writeCacheToFile()
          }
        },
      ]
    },
  }
}

export function isHeading(node: Element): boolean {
  return Boolean(node.tagName?.match(/^h[1-6]$/))
}
