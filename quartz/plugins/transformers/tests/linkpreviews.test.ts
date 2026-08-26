/**
 * @jest-environment node
 */
import type { Element, Root } from "hast"

import { jest, expect, it, describe, beforeEach, afterEach } from "@jest/globals"
import { h } from "hastscript"

// skipcq: JS-C1003
import * as linkpreviews from "../linkpreviews"

const originalFetch = globalThis.fetch
/** Nudge used to push a timestamp just past (or keep it just inside) the cache TTL. */
const ONE_MINUTE_MS = 60_000

beforeEach(() => {
  linkpreviews.previewCache.clear()
  delete process.env[linkpreviews.SKIP_ENV_VAR]
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

/**
 * Builds a fake Response good enough for fetchLinkPreview.
 */
const createResponse = (
  headers: Record<string, string>,
  body = "",
  ok = true,
  status = 200,
): Response =>
  ({
    ok,
    status,
    headers: new Headers(headers),
    text: () => Promise.resolve(body),
  }) as unknown as Response

const mockFetchOnce = (response: Response | Error): void => {
  globalThis.fetch = jest.fn(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  ) as unknown as typeof fetch
}

describe("parseFrameAncestors", () => {
  it.each([
    ["", null],
    ["default-src 'self'", null],
    ["frame-ancestors 'none'", ["'none'"]],
    [
      "default-src 'self'; frame-ancestors 'self' https://example.com",
      ["'self'", "https://example.com"],
    ],
    ["FRAME-ANCESTORS *", ["*"]],
    // A CSP value can carry several comma-separated policies, and Headers.get() joins
    // duplicate CSP headers the same way.
    ["default-src 'self', frame-ancestors 'none'", ["'none'"]],
    ["default-src 'self'; img-src *, frame-ancestors 'self'; base-uri 'self'", ["'self'"]],
    ["frame-ancestors *, default-src 'self'; frame-ancestors 'none'", ["'none'"]],
  ])("parses %p", (header: string, expected: string[] | null) => {
    expect(linkpreviews.parseFrameAncestors(header)).toEqual(expected)
  })

  it("returns null for an absent header", () => {
    expect(linkpreviews.parseFrameAncestors(null)).toBeNull()
  })
})

describe("isFrameable", () => {
  it.each([
    ["no framing headers at all", {}, true],
    ["X-Frame-Options: DENY", { "x-frame-options": "DENY" }, false],
    ["X-Frame-Options: SAMEORIGIN", { "x-frame-options": "SAMEORIGIN" }, false],
    ["X-Frame-Options: sameorigin (lowercase)", { "x-frame-options": "sameorigin" }, false],
    ["an unrecognized X-Frame-Options value", { "x-frame-options": "banana" }, false],
    ["frame-ancestors 'none'", { "content-security-policy": "frame-ancestors 'none'" }, false],
    ["frame-ancestors 'self'", { "content-security-policy": "frame-ancestors 'self'" }, false],
    [
      "frame-ancestors naming another site",
      { "content-security-policy": "frame-ancestors https://elsewhere.com" },
      false,
    ],
    ["frame-ancestors *", { "content-security-policy": "frame-ancestors *" }, true],
    [
      "a CSP without a frame-ancestors directive",
      { "content-security-policy": "default-src 'self'" },
      true,
    ],
    ["an empty X-Frame-Options value", { "x-frame-options": "" }, false],
    [
      "frame-ancestors 'none' in the second of two comma-separated policies",
      { "content-security-policy": "default-src 'self', frame-ancestors 'none'" },
      false,
    ],
    [
      "frame-ancestors 'self' in a later policy of a realistic multi-policy header",
      {
        "content-security-policy":
          "require-trusted-types-for 'script';report-uri https://csp.example/report, " +
          "base-uri 'self';object-src 'none';frame-ancestors 'self'",
      },
      false,
    ],
    [
      "both headers present and disagreeing",
      { "x-frame-options": "DENY", "content-security-policy": "frame-ancestors *" },
      false,
    ],
  ])("returns %s -> %p", (_name: string, headers: Record<string, string>, expected: boolean) => {
    expect(linkpreviews.isFrameable(new Headers(headers))).toBe(expected)
  })
})

describe("normalizeText", () => {
  it("collapses whitespace", () => {
    expect(linkpreviews.normalizeText("  a \n  b  ", 100)).toBe("a b")
  })

  it("returns an empty string for undefined", () => {
    expect(linkpreviews.normalizeText(undefined, 100)).toBe("")
  })

  it("truncates and appends an ellipsis", () => {
    const truncated = linkpreviews.normalizeText(
      "x".repeat(400),
      linkpreviews.MAX_DESCRIPTION_CHARS,
    )
    expect(truncated).toHaveLength(linkpreviews.MAX_DESCRIPTION_CHARS + 1)
    expect(truncated.endsWith(linkpreviews.TRUNCATION_SUFFIX)).toBe(true)
  })
})

describe("extractMetadata", () => {
  it("prefers Open Graph tags", () => {
    const html = `<html><head><title>Title tag</title>
      <meta property="og:title" content="OG title">
      <meta name="description" content="Meta description">
      <meta property="og:description" content="OG description">
      </head><body></body></html>`
    expect(linkpreviews.extractMetadata(html)).toEqual({
      title: "OG title",
      description: "OG description",
    })
  })

  it("falls back to <title> and meta[name=description]", () => {
    const html = `<html><head><title>Title tag</title>
      <meta name="description" content="Meta description"></head><body></body></html>`
    expect(linkpreviews.extractMetadata(html)).toEqual({
      title: "Title tag",
      description: "Meta description",
    })
  })

  it("returns empty strings when the tags are missing", () => {
    expect(linkpreviews.extractMetadata("<html><body>nothing here</body></html>")).toEqual({
      title: "",
      description: "",
    })
  })

  it("truncates an over-long description", () => {
    const html = `<html><head><meta name="description" content="${"y".repeat(500)}"></head></html>`
    const { description } = linkpreviews.extractMetadata(html)
    expect(description).toHaveLength(linkpreviews.MAX_DESCRIPTION_CHARS + 1)
  })
})

describe("fetchLinkPreview", () => {
  it("derives frameability and metadata from one response", async () => {
    mockFetchOnce(
      createResponse(
        {
          "content-type": "text/html; charset=utf-8",
          "content-security-policy": "frame-ancestors *",
        },
        "<html><head><title>Friendly site</title></head></html>",
      ),
    )
    const preview = await linkpreviews.fetchLinkPreview("https://friendly.example")
    expect(preview.frameable).toBe(true)
    expect(preview.title).toBe("Friendly site")
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it("marks a frame-denying response as not frameable", async () => {
    mockFetchOnce(
      createResponse(
        { "content-type": "text/html", "x-frame-options": "DENY" },
        "<html><head><title>GitHub</title></head></html>",
      ),
    )
    const preview = await linkpreviews.fetchLinkPreview("https://github.com/")
    expect(preview.frameable).toBe(false)
    expect(preview.title).toBe("GitHub")
  })

  it("returns a failed preview for a non-OK response", async () => {
    mockFetchOnce(
      createResponse({ "content-type": "text/html" }, "<title>Gone</title>", false, 404),
    )
    const preview = await linkpreviews.fetchLinkPreview("https://gone.example")
    expect(preview).toMatchObject({ title: "", description: "", frameable: false })
  })

  it("skips metadata extraction for non-HTML responses", async () => {
    mockFetchOnce(createResponse({ "content-type": "application/pdf" }))
    const preview = await linkpreviews.fetchLinkPreview("https://example.com/paper.pdf")
    expect(preview).toMatchObject({ title: "", description: "", frameable: true })
  })

  it("does not throw when the fetch rejects", async () => {
    mockFetchOnce(new Error("network unreachable"))
    await expect(linkpreviews.fetchLinkPreview("https://dead.example")).resolves.toMatchObject({
      frameable: false,
    })
  })
})

describe("normalizePreviewUrl", () => {
  it.each([
    ["https://example.com/a#frag", "https://example.com/a"],
    ["http://example.com/", "http://example.com/"],
    ["mailto:someone@example.com", null],
    ["#section", null],
    ["./relative", null],
    ["https://koenrane.xyz/posts", null],
    ["https://assets.koenrane.xyz/img", null],
  ])("normalizes %p to %p", (href: string, expected: string | null) => {
    expect(linkpreviews.normalizePreviewUrl(href)).toBe(expected)
  })
})

describe("isPreviewExpired", () => {
  const buildPreview = (fetchedAt: string): linkpreviews.LinkPreview => ({
    title: "T",
    description: "D",
    frameable: true,
    fetchedAt,
  })

  it.each([
    ["just inside the TTL", linkpreviews.CACHE_TTL_MS - ONE_MINUTE_MS, false],
    ["just past the TTL", linkpreviews.CACHE_TTL_MS + ONE_MINUTE_MS, true],
    ["fetched moments ago", 0, false],
  ])("treats an entry %s as expired=%p", (_name: string, ageMs: number, expected: boolean) => {
    const preview = buildPreview(new Date(Date.now() - ageMs).toISOString())
    expect(linkpreviews.isPreviewExpired(preview)).toBe(expected)
  })

  it("treats an unparseable timestamp as expired", () => {
    expect(linkpreviews.isPreviewExpired(buildPreview("not a date"))).toBe(true)
  })
})

describe("MaybeFetchPreview", () => {
  it("caches negative results so a dead link is fetched only once", async () => {
    mockFetchOnce(new Error("network unreachable"))
    const first = await linkpreviews.MaybeFetchPreview("https://dead.example/")
    const second = await linkpreviews.MaybeFetchPreview("https://dead.example/")
    expect(first.frameable).toBe(false)
    expect(second).toBe(first)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it("performs no network request when the cache already holds a fresh entry", async () => {
    mockFetchOnce(new Error("should not be called"))
    linkpreviews.previewCache.set("https://cached.example/", {
      title: "Cached",
      description: "From disk",
      frameable: true,
      fetchedAt: new Date().toISOString(),
    })
    const preview = await linkpreviews.MaybeFetchPreview("https://cached.example/")
    expect(preview.title).toBe("Cached")
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it("re-probes an entry older than the TTL instead of trusting it", async () => {
    mockFetchOnce(createResponse({ "x-frame-options": "DENY", "content-type": "text/html" }, ""))
    linkpreviews.previewCache.set("https://stale.example/", {
      title: "Stale",
      description: "Probed long ago",
      frameable: true,
      fetchedAt: new Date(Date.now() - linkpreviews.CACHE_TTL_MS - ONE_MINUTE_MS).toISOString(),
    })
    const preview = await linkpreviews.MaybeFetchPreview("https://stale.example/")
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(preview.frameable).toBe(false)
    expect(linkpreviews.previewCache.get("https://stale.example/")).toBe(preview)
  })

  it("serves a stale entry rather than fetching when the skip env var is set", async () => {
    mockFetchOnce(new Error("should not be called"))
    process.env[linkpreviews.SKIP_ENV_VAR] = "1"
    linkpreviews.previewCache.set("https://stale.example/", {
      title: "Stale",
      description: "Probed long ago",
      frameable: true,
      fetchedAt: new Date(Date.now() - linkpreviews.CACHE_TTL_MS - ONE_MINUTE_MS).toISOString(),
    })
    const preview = await linkpreviews.MaybeFetchPreview("https://stale.example/")
    expect(preview.title).toBe("Stale")
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it("performs no network request when the skip env var is set", async () => {
    mockFetchOnce(new Error("should not be called"))
    process.env[linkpreviews.SKIP_ENV_VAR] = "1"
    const preview = await linkpreviews.MaybeFetchPreview("https://uncached.example/")
    expect(preview.frameable).toBe(false)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
})

describe("applyPreviewToNode", () => {
  it("emits data-preview-frameable only when framing is proven", () => {
    const frameableNode = h("a", { href: "https://a.example" }) as Element
    linkpreviews.applyPreviewToNode(frameableNode, {
      title: "T",
      description: "D",
      frameable: true,
      fetchedAt: "2026-01-01T00:00:00.000Z",
    })
    expect(frameableNode.properties).toMatchObject({
      "data-preview-title": "T",
      "data-preview-description": "D",
      "data-preview-frameable": "true",
    })

    const blockedNode = h("a", { href: "https://b.example" }) as Element
    linkpreviews.applyPreviewToNode(blockedNode, {
      title: "T",
      description: "",
      frameable: false,
      fetchedAt: "2026-01-01T00:00:00.000Z",
    })
    expect(blockedNode.properties["data-preview-frameable"]).toBeUndefined()
    expect(blockedNode.properties["data-preview-description"]).toBeUndefined()
  })
})

describe("processTree", () => {
  it("annotates external anchors and leaves internal ones alone", async () => {
    mockFetchOnce(
      createResponse(
        { "content-type": "text/html", "x-frame-options": "DENY" },
        "<html><head><title>Blocked site</title></head></html>",
      ),
    )
    const externalNode = h("a", { href: "https://blocked.example/page" })
    const internalNode = h("a", { href: "https://koenrane.xyz/posts" })
    const tree = h(null, [externalNode, internalNode]) as unknown as Root

    await linkpreviews.processTree(tree)

    expect((externalNode as Element).properties).toMatchObject({
      "data-preview-title": "Blocked site",
    })
    expect((externalNode as Element).properties["data-preview-frameable"]).toBeUndefined()
    expect((internalNode as Element).properties["data-preview-title"]).toBeUndefined()
  })

  it("does not throw when every fetch fails", async () => {
    mockFetchOnce(new Error("network unreachable"))
    const tree = h(null, [h("a", { href: "https://dead-one.example" })]) as unknown as Root
    await expect(linkpreviews.processTree(tree)).resolves.toBeUndefined()
  })
})
