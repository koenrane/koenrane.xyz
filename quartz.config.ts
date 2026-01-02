import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4.0 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "", // no linkable title, empty string
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "en-US",
    baseUrl: "koenrane.xyz",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "published", // What to display on listings
    navbar: {
      pages: [
        { title: "ABOUT ME", slug: "/about" },
        { title: "ABOUT SITE", slug: "/about-site" },
        { title: "NEW ESSAYS", slug: "/changelog" },
        { title: "LINKS", slug: "/links" },
      ],
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "filesystem"],
      }),
      Plugin.TextFormattingImprovement(),
      Plugin.Twemoji(),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: true, parseArrows: false }),
      Plugin.GitHubFlavoredMarkdown({ enableSmartyPants: false }),
      // HTML formatting would mess up mermaid if it came first
      Plugin.HTMLFormattingImprovement(),
      Plugin.Latex({ renderEngine: "katex" }),
      Plugin.CrawlLinks({ lazyLoad: true, markdownLinkResolution: "shortest" }),
      Plugin.TagAcronyms(),
      Plugin.TroutOrnamentHr(),
      Plugin.AddFavicons(),
      Plugin.AfterArticle(),
      Plugin.ColorVariables(),
      Plugin.rehypeCustomSpoiler(),
      Plugin.rehypeCustomSubtitle(),
      Plugin.TableOfContents({ maxDepth: 3 }), // Include h1, h2, and h3 in TOC
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.TagPage(),
      Plugin.AllTagsPage(),
      Plugin.RecentPostsPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
