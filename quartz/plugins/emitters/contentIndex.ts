import type { Root } from "hast"

import { execSync } from "child_process"
import { toHtml } from "hast-util-to-html"

import { type GlobalConfiguration } from "../../cfg"
import { getDate } from "../../components/Date"
import DepGraph from "../../depgraph"
import { i18n } from "../../i18n"
import { escapeHTML } from "../../util/escape"
import {
  type FilePath,
  type FullSlug,
  type SimpleSlug,
  joinSegments,
  simplifySlug,
} from "../../util/path"
import { applyTextTransforms } from "../transformers/formatting_improvement_html"
import { type QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"

export type ContentIndex = Map<FullSlug, ContentDetails>
export type ContentDetails = {
  title: string
  links: SimpleSlug[]
  tags: string[]
  content: string
  richContent?: string
  date?: Date
  authors?: string
  description?: string
}

interface Options {
  enableSiteMap: boolean
  enableRSS: boolean
  rssLimit?: number
  rssFullHtml: boolean
  includeEmptyFiles: boolean
}

const defaultOptions: Options = {
  enableSiteMap: true,
  enableRSS: true,
  rssLimit: 10,
  rssFullHtml: false,
  includeEmptyFiles: false,
}

function generateSiteMap(cfg: GlobalConfiguration, idx: ContentIndex): string {
  const base = cfg.baseUrl ?? ""
  const createURLEntry = (slug: SimpleSlug, content: ContentDetails): string => `<url>
    <loc>https://${joinSegments(base, encodeURI(slug))}</loc>
    ${content.date && `<lastmod>${content.date.toISOString()}</lastmod>`}
  </url>`
  const urls = Array.from(idx)
    .map(([slug, content]) => createURLEntry(simplifySlug(slug), content))
    .join("")
  return `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`
}

function generateRSSFeed(cfg: GlobalConfiguration, idx: ContentIndex, limit?: number): string {
  const base = cfg.baseUrl ?? ""

  const processDescription = (description: string): string => {
    const escapedDescription = description.replaceAll(/&/g, "&amp;")
    const massTransformed = applyTextTransforms(escapedDescription)
    return massTransformed
  }
  const createURLEntry = (slug: SimpleSlug, content: ContentDetails): string => `<item>
    <title>${escapeHTML(content.title)}</title>
    <link>https://${joinSegments(base, encodeURI(slug))}</link>
    <description>${content.richContent ?? processDescription(content.description ?? "")}</description>
    <guid isPermaLink="true">https://${joinSegments(base, encodeURI(slug))}</guid>
    <pubDate>${content.date?.toUTCString()}</pubDate>
  </item>`

  const items = Array.from(idx)
    .sort(([, f1], [, f2]) => {
      if (f1.date && f2.date) {
        return f2.date.getTime() - f1.date.getTime()
      } else if (f1.date && !f2.date) {
        return -1
      } else if (!f1.date && f2.date) {
        return 1
      }

      return f1.title.localeCompare(f2.title)
    })
    .map(([slug, content]) => createURLEntry(simplifySlug(slug), content))
    .slice(0, limit ?? idx.size)
    .join("")

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
    <channel>
      <title>${escapeHTML(cfg.pageTitle)}</title>
      <link>https://${base}</link>
      <description>${limit ? i18n(cfg.locale).pages.rss.lastFewNotes({ count: limit }) : i18n(cfg.locale).pages.rss.recentNotes} on ${escapeHTML(
        cfg.pageTitle,
      )}</description>
      ${items}
    </channel>
  </rss>`
}

// Helper function to get current branch
function getCurrentGitBranch(): string {
  try {
    // Get current branch name, trim whitespace
    return execSync("git rev-parse --abbrev-ref HEAD").toString().trim()
  } catch {
    // Fallback to development if git command fails
    return "dev"
  }
}

export const ContentIndex: QuartzEmitterPlugin<Partial<Options>> = (opts) => {
  opts = { ...defaultOptions, ...opts }
  return {
    name: "ContentIndex",
    // skipcq: JS-0116 Have to return async for type signature
    async getDependencyGraph(ctx, content) {
      const graph = new DepGraph<FilePath>()
      const currentBranch = getCurrentGitBranch()
      const isMainBranch = currentBranch === "main"

      for (const [, file] of content) {
        const sourcePath = file.data.filePath as FilePath

        graph.addEdge(
          sourcePath,
          joinSegments(ctx.argv.output, "static/contentIndex.json") as FilePath,
        )
        if (opts?.enableSiteMap) {
          graph.addEdge(sourcePath, joinSegments(ctx.argv.output, "sitemap.xml") as FilePath)
        }
        // Only add RSS dependency if we're on main branch
        if (opts?.enableRSS && isMainBranch) {
          graph.addEdge(sourcePath, joinSegments(ctx.argv.output, "rss.xml") as FilePath)
        }
      }

      return graph
    },
    async emit(ctx, content) {
      const cfg = ctx.cfg.configuration
      const emitted: FilePath[] = []
      const linkIndex: ContentIndex = new Map()
      const currentBranch = getCurrentGitBranch()
      const isMainBranch = currentBranch === "main"

      for (const [tree, file] of content) {
        const slug = file.data.slug as FullSlug
        const date = getDate(ctx.cfg.configuration, file.data) ?? new Date()

        if (opts?.includeEmptyFiles || (file.data.text && file.data.text !== "")) {
          linkIndex.set(slug, {
            title: file.data.frontmatter?.title ?? "",
            links: file.data.links ?? [],
            tags: file.data.frontmatter?.tags ?? [],
            content: (file.data.text as string) ?? "",
            richContent: opts?.rssFullHtml
              ? escapeHTML(toHtml(tree as Root, { allowDangerousHtml: true }))
              : undefined,
            date,
            description: (file.data.description as string) ?? undefined,
            authors: file.data.frontmatter?.authors as string | undefined,
          })
        }
      }

      if (opts?.enableSiteMap) {
        emitted.push(
          await write({
            ctx,
            content: generateSiteMap(cfg, linkIndex),
            slug: "sitemap" as FullSlug,
            ext: ".xml",
          }),
        )
      }

      // Only generate RSS feed if we're on main branch
      if (opts?.enableRSS && isMainBranch) {
        emitted.push(
          await write({
            ctx,
            content: generateRSSFeed(cfg, linkIndex, opts.rssLimit),
            slug: "rss" as FullSlug,
            ext: ".xml",
          }),
        )
      }

      const fp = joinSegments("static", "contentIndex") as FullSlug
      const simplifiedIndex = Object.fromEntries(
        Array.from(linkIndex).map(([slug, content]) => {
          // remove description and date from content index as nothing downstream
          // actually uses them. we only keep description for the RSS feed
          delete content.description
          delete content.date
          return [slug, content]
        }),
      )

      emitted.push(
        await write({
          ctx,
          content: JSON.stringify(simplifiedIndex),
          slug: fp,
          ext: ".json",
        }),
      )

      return emitted
    },
    getQuartzComponents: () => [],
  }
}
