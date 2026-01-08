import React from "react"
import type { JSX } from "preact"

import type { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

import { classNames } from "../util/lang"
import { formatTitle } from "./component_utils"
import { formatTag } from "./TagList"

/**
 * Wraps year dates (1800-2099) in a span with class "year-date" for styling.
 * Years are shifted down visually like subscript but same font size.
 */
function wrapYearDates(text: string): JSX.Element[] {
  // Match 4-digit years (1800-2099) that appear to be dates
  const yearRegex = /(^|[^0-9])(\b(1[89]\d{2}|20\d{2})\b)([^0-9]|$)/g
  const parts: JSX.Element[] = []
  let lastIndex = 0
  let match

  while ((match = yearRegex.exec(text)) !== null) {
    const beforeYear = match[1] // Character before year (or empty)
    const year = match[3] // The year itself
    const afterYear = match[4] // Character after year (or empty)
    const matchStart = match.index

    // Add text before this match (including the character before the year)
    if (matchStart + beforeYear.length > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex, matchStart + beforeYear.length)}</span>)
    }

    // Add the year wrapped in a span
    parts.push(
      <span key={`year-${matchStart}`} className="year-date">
        {year}
      </span>
    )

    // Update lastIndex to after the year but before afterYear
    lastIndex = matchStart + beforeYear.length + year.length

    // Handle the afterYear character - it will be included in next iteration or final slice
  }

  // Add any remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>)
  }

  return parts.length > 0 ? parts : [<span key="full">{text}</span>]
}

const ArticleTitle: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  if (fileData.frontmatter?.hide_title) {
    return null
  }
  if (fileData.frontmatter?.title) {
    fileData.frontmatter.title = formatTitle(fileData.frontmatter.title)
  }

  const title = fileData.frontmatter?.title
  let tagContent = <>{title}</>

  // Tags are styled like inline code
  if (title?.match("Tag: ")) {
    const tagText = title.split("Tag: ")[1]
    tagContent = (
      <>
        Tag: <span className="tag-text">{formatTag(tagText)}</span>
      </>
    )
  } else if (title) {
    // Wrap year dates in special spans for styling
    tagContent = <>{wrapYearDates(title)}</>
  }

  return (
    <h1 id="article-title" className={classNames(displayClass)}>
      {tagContent}
    </h1>
  )
}

export default (() => ArticleTitle) satisfies QuartzComponentConstructor
