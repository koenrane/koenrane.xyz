import React from "react"

import type { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

import { type GlobalConfiguration } from "../cfg"
import { RenderPublicationInfo, RenderStatusInfo } from "./ContentMeta"

const PublicationDate: QuartzComponent = ({ fileData, cfg }: QuartzComponentProps) => {
  if (fileData.frontmatter?.hide_metadata) {
    return null
  }

  // Get both publication info and status
  const publicationInfo = RenderPublicationInfo(cfg as GlobalConfiguration, fileData)
  const statusInfo = RenderStatusInfo(fileData)

  // Don't render if neither publication info nor status exists
  if (!publicationInfo && !statusInfo) {
    return null
  }

  return (
    <div className="publication-date">
      <p style={{ 
        textIndent: "-.2rem", 
        paddingLeft: ".2rem", 
        lineHeight: "1.25rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap"
      }}>
        {publicationInfo}
        {statusInfo}
      </p>
    </div>
  )
}

export default (() => PublicationDate) satisfies QuartzComponentConstructor 