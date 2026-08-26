import type { Element, Root } from "hast"

import { load as cheerioLoad } from "cheerio"
import gitRoot from "find-git-root"
import fs from "fs"
import path from "path"
import { visit } from "unist-util-visit"
import { fileURLToPath } from "url"

import { createLogger } from "./logger_utils"

const logger = createLogger("linkpreviews")

export const SITE_HOSTNAME = "koenrane.xyz"
export const REQUEST_TIMEOUT_MS = 8_000
export const MAX_CONCURRENT_FETCHES = 8
export const MAX_TITLE_CHARS = 120
export const MAX_DESCRIPTION_CHARS = 280
export const TRUNCATION_SUFFIX = "…"
/** Set to any non-empty value to build from cache alone, performing zero network requests. */
export const SKIP_ENV_VAR = "SKIP_LINK_PREVIEWS"

const __filepath = fileURLToPath(import.meta.url)
const __dirname = path.dirname(gitRoot(__filepath))
export const LINK_PREVIEWS_FILE = path.join(
  __dirname,
  "quartz",
  "plugins",
  "transformers",
  ".linkPreviews.json",
)

/** Everything we learn about an external URL from a single build-time GET. */
export interface LinkPreview {
  /** Page title, empty when it could not be determined. */
  title: string
  /** Page description, empty when it could not be determined. */
  description: string
  /** True only when the response affirmatively proved that framing is permitted. */
  frameable: boolean
  /** ISO timestamp of the probe, so a stale entry can be spotted by a human. */
  fetchedAt: string
}

export type LinkPreviewCache = Record<string, LinkPreview>

/**
 * Builds the preview for a URL we could not successfully probe. Never frameable: absent
 * proof that framing works, the runtime must fall back to a card.
 */
export function createFailedPreview(): LinkPreview {
  return { title: "", description: "", frameable: false, fetchedAt: new Date().toISOString() }
}

/**
 * Reads the on-disk preview cache. A missing or corrupt file is not an error; it just
 * means every URL will be probed again on this build.
 *
 * @returns A Map of normalized URL to its cached preview.
 */
export function readPreviewCache(): Map<string, LinkPreview> {
  try {
    const data = fs.readFileSync(LINK_PREVIEWS_FILE, "utf8")
    const parsed = JSON.parse(data) as LinkPreviewCache
    return new Map(Object.entries(parsed))
  } catch (error) {
    logger.warn(`Error reading link preview cache file: ${error}`)
    return new Map<string, LinkPreview>()
  }
}

export const previewCache = readPreviewCache()

/**
 * Writes the preview cache back to LINK_PREVIEWS_FILE, sorted by URL so the committed
 * file produces stable diffs.
 */
export function writeCacheToFile(): void {
  const sortedEntries = Array.from(previewCache.entries()).sort(([left], [right]) =>
    left.localeCompare(right),
  )
  const data: LinkPreviewCache = Object.fromEntries(sortedEntries)
  try {
    fs.writeFileSync(LINK_PREVIEWS_FILE, `${JSON.stringify(data, null, 2)}\n`, { flag: "w+" })
  } catch (error) {
    logger.error(`Error writing link preview cache file: ${error}`)
  }
}

/**
 * Extracts the `frame-ancestors` directive from a Content-Security-Policy header.
 *
 * @param cspHeader - Raw header value, or null when the header is absent.
 * @returns The directive's source tokens, or null when the directive is not present.
 */
export function parseFrameAncestors(cspHeader: string | null): string[] | null {
  if (!cspHeader) return null
  for (const directive of cspHeader.split(";")) {
    const tokens = directive.trim().split(/\s+/)
    const directiveName = tokens[0]?.toLowerCase()
    if (directiveName === "frame-ancestors") {
      return tokens.slice(1).map((token) => token.toLowerCase())
    }
  }
  return null
}

/**
 * Decides whether an origin affirmatively permits being framed by us.
 *
 * Deliberately conservative: anything we cannot positively prove is treated as not
 * frameable, because a wrong "yes" surfaces a browser refused-to-connect page inside the
 * popover while a wrong "no" merely shows the card.
 *
 * @param headers - Response headers from the build-time GET.
 * @returns True only when framing is provably allowed.
 */
export function isFrameable(headers: Headers): boolean {
  // Any X-Frame-Options value (DENY, SAMEORIGIN, the deprecated ALLOW-FROM, or junk)
  // means the origin has an opinion about framing that we cannot satisfy.
  const frameOptions = headers.get("x-frame-options")
  if (frameOptions !== null && frameOptions.trim() !== "") {
    return false
  }

  const frameAncestors = parseFrameAncestors(headers.get("content-security-policy"))
  if (frameAncestors === null) {
    return true
  }
  // Only a bare wildcard proves that our origin in particular is allowed.
  return frameAncestors.includes("*")
}

/**
 * Collapses whitespace and truncates to a maximum length.
 *
 * @param value - Raw text pulled from a remote page.
 * @param maxChars - Maximum number of characters to keep.
 * @returns Cleaned text, suffixed with an ellipsis when truncated.
 */
export function normalizeText(value: string | undefined, maxChars: number): string {
  const collapsed = (value ?? "").replace(/\s+/g, " ").trim()
  if (collapsed.length <= maxChars) {
    return collapsed
  }
  return `${collapsed.slice(0, maxChars).trimEnd()}${TRUNCATION_SUFFIX}`
}

/**
 * Pulls a title and description out of a remote page's HTML.
 *
 * Prefers Open Graph tags, falling back to <title> and <meta name="description">.
 *
 * @param html - The remote page's HTML body.
 * @returns The extracted title and description; either may be empty.
 */
export function extractMetadata(html: string): { title: string; description: string } {
  const querier = cheerioLoad(html)
  const title =
    normalizeText(querier('meta[property="og:title"]').attr("content"), MAX_TITLE_CHARS) ||
    normalizeText(querier("title").first().text(), MAX_TITLE_CHARS)
  const description =
    normalizeText(
      querier('meta[property="og:description"]').attr("content"),
      MAX_DESCRIPTION_CHARS,
    ) || normalizeText(querier('meta[name="description"]').attr("content"), MAX_DESCRIPTION_CHARS)
  return { title, description }
}

/**
 * Performs the single build-time GET for a URL and derives both frameability and metadata
 * from that one response.
 *
 * Never throws: a failure becomes a negative preview so the caller can cache it.
 *
 * @param url - Absolute http(s) URL to probe.
 * @returns The derived preview.
 */
export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      logger.info(`Non-OK response for ${url}: ${response.status}`)
      return createFailedPreview()
    }

    const frameable = isFrameable(response.headers)
    const contentType = response.headers.get("content-type")
    if (!contentType?.includes("text/html")) {
      logger.info(`Skipping metadata for non-HTML ${url}: ${contentType}`)
      return { title: "", description: "", frameable, fetchedAt: new Date().toISOString() }
    }

    const { title, description } = extractMetadata(await response.text())
    return { title, description, frameable, fetchedAt: new Date().toISOString() }
  } catch (error) {
    logger.error(`Error fetching link preview for ${url}: ${error}`)
    return createFailedPreview()
  }
}

/**
 * Normalizes an href into the cache key we probe against.
 *
 * @param href - The anchor's href.
 * @returns The normalized URL string, or null when this href is not an external page link.
 */
export function normalizePreviewUrl(href: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(href)
  } catch {
    return null
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null
  if (parsed.hostname === SITE_HOSTNAME || parsed.hostname.endsWith(`.${SITE_HOSTNAME}`))
    return null
  parsed.hash = ""
  return parsed.toString()
}

/**
 * Returns the preview for a URL, probing the network only on a cache miss.
 *
 * Negative and failed results are cached too, so a dead host is probed once per cache
 * lifetime rather than once per build.
 *
 * @param url - Normalized URL to look up.
 * @returns The cached or freshly fetched preview.
 */
export async function MaybeFetchPreview(url: string): Promise<LinkPreview> {
  const cached = previewCache.get(url)
  if (cached) {
    return cached
  }
  if (process.env[SKIP_ENV_VAR]) {
    logger.info(`${SKIP_ENV_VAR} is set; skipping network probe for ${url}`)
    return createFailedPreview()
  }
  const preview = await fetchLinkPreview(url)
  previewCache.set(url, preview)
  return preview
}

/**
 * Bakes a preview onto an anchor as data-* attributes.
 *
 * `data-preview-frameable` is emitted ONLY when framing is proven, so its absence always
 * means "show the card".
 *
 * @param node - The anchor element to annotate.
 * @param preview - The preview to bake in.
 */
export function applyPreviewToNode(node: Element, preview: LinkPreview): void {
  if (preview.title) {
    node.properties["data-preview-title"] = preview.title
  }
  if (preview.description) {
    node.properties["data-preview-description"] = preview.description
  }
  if (preview.frameable) {
    node.properties["data-preview-frameable"] = "true"
  }
}

/**
 * Runs `worker` over `items` with at most MAX_CONCURRENT_FETCHES in flight, so a page full
 * of external links does not open hundreds of sockets at once.
 */
async function mapWithConcurrencyLimit<ItemType>(
  items: ItemType[],
  worker: (item: ItemType) => Promise<void>,
): Promise<void> {
  let nextIndex = 0
  const runners = Array.from(
    { length: Math.min(MAX_CONCURRENT_FETCHES, items.length) },
    async () => {
      while (nextIndex < items.length) {
        const item = items[nextIndex]
        nextIndex += 1
        await worker(item)
      }
    },
  )
  await Promise.all(runners)
}

/**
 * Annotates every external anchor in a tree with its preview data.
 *
 * Individual failures are contained: one unreachable host must never fail the build.
 *
 * @param tree - The HTML AST to walk.
 */
export async function processTree(tree: Root): Promise<void> {
  const nodesToProcess: [Element, string][] = []

  visit(tree, "element", (node: Element) => {
    if (node.tagName !== "a") return
    const href = node.properties.href
    if (typeof href !== "string") return
    const normalizedUrl = normalizePreviewUrl(href)
    if (normalizedUrl === null) return
    nodesToProcess.push([node, normalizedUrl])
  })

  logger.info(`Processing ${nodesToProcess.length} external links`)
  await mapWithConcurrencyLimit(nodesToProcess, async ([node, normalizedUrl]) => {
    try {
      applyPreviewToNode(node, await MaybeFetchPreview(normalizedUrl))
    } catch (error) {
      logger.error(`Error processing link preview for ${normalizedUrl}: ${error}`)
    }
  })
}

/**
 * Plugin factory that probes external links at build time and bakes the results onto their
 * anchors, so the client never has to guess whether an origin can be framed.
 *
 * @returns Plugin configuration object for Quartz
 */
export const AddLinkPreviews = () => {
  return {
    name: "AddLinkPreviews",
    htmlPlugins() {
      return [
        () => {
          return async (tree: Root) => {
            logger.info("Starting link preview processing")
            await processTree(tree)
            logger.info("Finished processing link previews")

            writeCacheToFile()
          }
        },
      ]
    },
  }
}
