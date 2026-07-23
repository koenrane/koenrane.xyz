import type { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

import { slugTag } from "../util/path"
import { getTags } from "./TagList"

// Component to display tags between article title and publication date
const TagsBeforeBody: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const tags = getTags(fileData)

  // Don't render if no tags or metadata is hidden
  if (!tags || tags.length === 0 || fileData.frontmatter?.hide_metadata) {
    return null
  }

  return (
    <div
      className="tags-before-body"
      style={{
        textAlign: "center",
        marginTop: "1rem",
        marginBottom: "0.5rem",
      }}
    >
      {tags.map((tag: string, index: number) => {
        const tagSlug = slugTag(tag)
        const linkDest = `/tags/${tagSlug}`
        return (
          <span key={tag}>
            <a
              href={linkDest}
              className="internal tag-link"
              style={{
                textDecoration: "underline",
                fontFamily: "var(--font-monospace)",
                fontSize: "var(--font-size-minus-2)",
                fontStyle: "italic",
              }}
            >
              {tag}
            </a>
            {index < tags.length - 1 && <span style={{ margin: "0 0.25rem" }}>,</span>}
          </span>
        )
      })}
    </div>
  )
}

export default (() => TagsBeforeBody) satisfies QuartzComponentConstructor
