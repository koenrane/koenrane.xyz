/**
 * This file implements the TableOfContents component for Quartz.
 * It renders a table of contents based on the headings in the current page,
 * supporting small caps and LaTeX rendering.
 */

import type { RootContent, Parent, Text, Element, Root } from "hast"
// skipcq: JS-W1028
import type { JSX } from "preact"

import { fromHtml } from "hast-util-from-html"
import React from "react"

import { createLogger } from "../plugins/transformers/logger_utils"
import { type TocEntry } from "../plugins/transformers/toc"
import { processInlineCode, processKatex, processSmallCaps } from "./component_utils"
import modernStyle from "./styles/toc.scss"
import {
  type QuartzComponent,
  type QuartzComponentConstructor,
  type QuartzComponentProps,
} from "./types"

const logger = createLogger("TableOfContents")
/**
 * TableOfContents component for rendering a table of contents.
 *
 * @param props - The component props.
 * @param props.fileData - Data for the current file.
 * @returns The rendered table of contents or null if disabled.
 */
export const CreateTableOfContents: QuartzComponent = ({
  fileData,
}: QuartzComponentProps): JSX.Element | null => {
  logger.info(`Rendering TableOfContents for file: ${fileData.filePath}`)

  const frontmatterToc = fileData.frontmatter?.toc
  const tocData = fileData.toc

  if (!tocData || frontmatterToc === false || frontmatterToc === "false") {
    logger.info(
      `TableOfContents skipped for ${fileData.filePath}: no TOC data or disabled in frontmatter`,
    )
    return null
  }

  const toc = buildNestedList(tocData, 0, 0)[0]

  return (
    <div id="table-of-contents" className="desktop-only">
      <h6 className="toc-title">
        <a href="#top">Table of Contents</a>
      </h6>
      <div id="toc-content">
        <ul className="overflow">{toc}</ul>
      </div>
    </div>
  )
}

/**
 * Recursively builds a nested list for the table of contents.
 *
 * @param entries - The TOC entries to process.
 * @param currentIndex - The current index in the entries array.
 * @param currentDepth - The current depth in the TOC hierarchy.
 * @returns A tuple containing an array of JSX elements and the next index to process.
 */
export function buildNestedList(
  entries: TocEntry[],
  currentIndex = 0,
  currentDepth = entries[0]?.depth || 0,
): [JSX.Element[], number] {
  const listItems: JSX.Element[] = []
  const totalEntries = entries.length
  let index = currentIndex

  while (index < totalEntries) {
    const entry = entries[index]

    if (entry.depth < currentDepth) {
      break
    } else if (entry.depth > currentDepth) {
      const [nestedListItems, nextIndex] = buildNestedList(entries, index, entry.depth)
      if (listItems.length > 0) {
        const lastItem = listItems[listItems.length - 1]
        listItems[listItems.length - 1] = (
          <li key={`li-${index}`}>
            {lastItem.props.children}
            <ul key={`ul-${index}`}>{nestedListItems}</ul>
          </li>
        )
      } else {
        listItems.push(
          <li key={`li-${index}`}>
            <ul key={`ul-${index}`}>{nestedListItems}</ul>
          </li>,
        )
      }
      index = nextIndex
    } else {
      listItems.push(<li key={`li-${index}`}>{toJSXListItem(entry)}</li>)
      index++
    }
  }

  return [listItems, index]
}

/**
 * Generates the table of contents as a nested list.
 *
 * @param entries - The TOC entriesnodeto process.
 * @returns A JSX element representing the nested TOC.
 */
export function addListItem(entries: TocEntry[]): JSX.Element {
  logger.debug(`addListItem called with ${entries.length} entries`)

  const [listItems] = buildNestedList(entries)
  logger.debug(`Returning ${listItems.length} JSX elements`)
  return <ul>{listItems}</ul>
}

/**
 * Converts a TocEntry to a JSX list item element.
 */
export function toJSXListItem(entry: TocEntry): JSX.Element {
  const entryParent: Parent = processTocEntry(entry)
  return (
    <a href={`#${entry.slug}`} data-for={entry.slug}>
      {entryParent.children.map(elementToJsx)}
    </a>
  )
}

/**
 * Processes small caps and LaTeX in a TOC entry.
 *
 * @param entry - The TOC entry to process.
 * @returns A Parent object representing the processed entry.
 */
export function processTocEntry(entry: TocEntry): Parent {
  logger.debug(`Processing TOC entry: ${entry.text}`)
  const parent = { type: "element", tagName: "span", properties: {}, children: [] } as Parent

  // Split the text by LaTeX delimiters
  const parts = entry.text.split(/(\$[^$]+\$|`[^`]+`)/g)

  parts.forEach((part) => {
    if (part.startsWith("$") && part.endsWith("$")) {
      // LaTeX expression
      const latex = part.slice(1, -1)
      processKatex(latex, parent)
    } else if (part.startsWith("`") && part.endsWith("`")) {
      // Inline code
      const code = part.slice(1, -1)
      processInlineCode(code, parent)
    } else {
      // Parse as HTML and process
      const htmlAst = fromHtml(part, { fragment: true })
      processHtmlAst(htmlAst, parent)
    }
  })

  return parent
}

/**
 * Processes the HTML AST, handling text nodes and elements recursively.
 *
 * @param htmlAst - The HTML AST to process.
 * @param parent - The parent node to add processed nodes to.
 */
export function processHtmlAst(htmlAst: Root | Element, parent: Parent): void {
  htmlAst.children.forEach((node: RootContent) => {
    if (node.type === "text") {
      const textValue = node.value
      let textToProcess = textValue

      const leadingNumberRegex = /^(\d+:?\s*)(.*)$/
      const match = textValue.match(leadingNumberRegex)
      if (match) {
        // Leading numbers and colon found
        const numberPart = match[1]
        const restText = match[2]

        // Create span for numberPart
        const numberSpan = {
          type: "element",
          tagName: "span",
          properties: { className: ["number-prefix"] },
          children: [{ type: "text", value: numberPart }],
        } as Element
        parent.children.push(numberSpan)

        textToProcess = restText
      }

      processSmallCaps(textToProcess, parent)
    } else if (node.type === "element") {
      const newElement = {
        type: "element",
        tagName: node.tagName,
        properties: { ...node.properties },
        children: [],
      } as Element
      parent.children.push(newElement)
      processHtmlAst(node as Element, newElement)
    }
  })
}

const handleAbbr = (elt: Element): JSX.Element => {
  const abbrText = (elt.children[0] as Text).value
  const className = (elt.properties?.className as string[])?.join(" ") || ""
  return <abbr className={className}>{abbrText}</abbr>
}

const handleSpan = (elt: Element): JSX.Element => {
  const classNames = (elt.properties?.className as string[]) || []

  if (classNames.includes("katex-toc")) {
    return (
      <span
        className="katex-toc"
        dangerouslySetInnerHTML={{
          __html: (elt.children[0] as { value: string }).value,
        }}
      />
    )
  }

  if (classNames.includes("number-prefix")) {
    return <span className="number-prefix">{elt.children.map(elementToJsx)}</span>
  }

  if (classNames.includes("inline-code")) {
    return <code className="inline-code">{elt.children.map(elementToJsx)}</code>
  }

  return <span>{elt.children.map(elementToJsx)}</span>
}

// Convert HAST element to JSX element
export function elementToJsx(elt: RootContent): JSX.Element | null {
  switch (elt.type) {
    case "text":
      return elt.value as unknown as JSX.Element
    case "element":
      return elt.tagName === "abbr" ? handleAbbr(elt) : handleSpan(elt)
    default:
      return null
  }
}

CreateTableOfContents.css = modernStyle
CreateTableOfContents.afterDOMLoaded = `
document.addEventListener('nav', function() {
  const sections = document.querySelectorAll("#center-content h1, #center-content h2");
  const navLinks = document.querySelectorAll("#toc-content a");

  function updateActiveLink() {
    let currentSection = "";
    const scrollPosition = window.scrollY + window.innerHeight / 4;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      if (scrollPosition >= sectionTop) {
        currentSection = section.id;
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      const slug = link.getAttribute('href').split("#")[1];
      if (currentSection && slug === currentSection) {
        link.classList.add("active");
      }
    });
  }

  window.addEventListener("scroll", updateActiveLink);

  // Initial call to set active link on page load
  updateActiveLink();
});
`

export default ((): QuartzComponent => {
  logger.info("TableOfContents component initialized")
  return CreateTableOfContents
}) satisfies QuartzComponentConstructor
