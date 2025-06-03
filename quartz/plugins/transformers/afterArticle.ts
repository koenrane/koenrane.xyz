import { type Element, type Root } from "hast"
import { h } from "hastscript"
import { visit } from "unist-util-visit"
import { VFile } from "vfile"

import { type QuartzTransformerPlugin } from "../types"
import { type QuartzPluginData } from "../vfile"
import { createFaviconElement, MAIL_PATH } from "./linkfavicons"
import { createSequenceLinksComponent } from "./sequenceLinks"

const SUBSTACK_URL =
  "https://assets.turntrout.com/static/images/external-favicons/substack_com.avif"

const newsletterElement = h("a", { href: "https://koenrane.substack.com/subscribe" }, [
  "newsle",
  h("span", { className: "favicon-span" }, ["tter", createFaviconElement(SUBSTACK_URL)]),
])

const rssSpan = h("span", { className: "favicon-span" }, [
  h("abbr", { class: "small-caps" }, "rss"),
  h("img", {
    src: "https://assets.turntrout.com/static/images/rss.svg",
    id: "rss-svg",
    alt: "RSS icon",
    className: "favicon",
  }),
])
export const rssElement = h("a", { href: "/rss.xml", id: "rss-link" }, [rssSpan])
const subscriptionElement = h("center", [
  h("div", h("p", ["New Links & Articles: ", newsletterElement, " & ", rssElement])),
])

const mailLink = h("a", { href: "mailto:koenrane@protonmail.com" }, [
  "koenrane@protonmail",
  h("span", { className: "favicon-span" }, [".com", createFaviconElement(MAIL_PATH)]),
])

const contactMe = h("div", [h("center", ["email:", h("code", {}, [mailLink])])])

export function insertAfterTroutOrnament(tree: Root, components: Element[]) {
  visit(tree, "element", (node: Element, index, parent: Element | null) => {
    if (
      index !== undefined &&
      node.tagName === "div" &&
      node.properties &&
      node.properties.id === "trout-ornament" &&
      parent
    ) {
      const wrapperDiv = h("div", { class: "after-article-components" }, components)
      parent.children.splice(index + 1, 0, wrapperDiv)
      return false // Stop traversing
    }
    return true
  })
}

export const AfterArticle: QuartzTransformerPlugin = () => {
  return {
    name: "AfterArticleTransformer",
    htmlPlugins: () => [
      () => (tree: Root, file: VFile) => {
        const sequenceLinksComponent = createSequenceLinksComponent(file.data as QuartzPluginData)

        const components = [sequenceLinksComponent ?? null].filter(Boolean) as Element[]

        // If frontmatter doesn't say to avoid it
        if (!file.data.frontmatter?.hideSubscriptionLinks) {
          components.push(
            h("div", { id: "subscription-and-contact" }, [subscriptionElement, contactMe]),
          )
        }

        if (components.length > 0) {
          insertAfterTroutOrnament(tree, components)
        }
      },
    ],
  }
}
