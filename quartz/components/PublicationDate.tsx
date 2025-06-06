import React from "react"

import type { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

import { type GlobalConfiguration } from "../cfg"
import { RenderPublicationInfo } from "./ContentMeta"

const PublicationDate: QuartzComponent = ({ fileData, cfg }: QuartzComponentProps) => {
  if (fileData.frontmatter?.hide_metadata) {
    return null
  }

  // Only show the publication info (our date range functionality)
  const publicationInfo = RenderPublicationInfo(cfg as GlobalConfiguration, fileData)

  if (!publicationInfo) {
    return null
  }

  return (
    <div className="publication-date">
      <p style={{ textIndent: "-.2rem", paddingLeft: ".2rem", lineHeight: "1.25rem" }}>
        {publicationInfo}
      </p>
    </div>
  )
}

export default (() => PublicationDate) satisfies QuartzComponentConstructor 