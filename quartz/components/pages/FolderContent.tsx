import type { Root } from "hast"

import path from "path"
import React from "react"

import type { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

import { i18n } from "../../i18n"
import { htmlToJsx } from "../../util/jsx"
import { type FilePath, type FullSlug, stripSlashes, simplifySlug } from "../../util/path"
import { PageList } from "../PageList"
import style from "../styles/listPage.scss"

interface FolderContentOptions {
  /**
   * Whether to display number of folders
   */
  showFolderCount: boolean
}

const defaultOptions: FolderContentOptions = {
  showFolderCount: true,
}

export default ((opts?: Partial<FolderContentOptions>) => {
  const options: FolderContentOptions = { ...defaultOptions, ...opts }

  const FolderContent: QuartzComponent = (props: QuartzComponentProps) => {
    const { tree, fileData, allFiles, cfg } = props
    const folderSlug = stripSlashes(simplifySlug(fileData.slug || ("" as FullSlug)))
    const allPagesInFolder = allFiles.filter((file) => {
      const fileSlug = stripSlashes(simplifySlug(file.slug || ("" as FullSlug)))
      const prefixed = fileSlug.startsWith(folderSlug) && fileSlug !== folderSlug
      const folderParts = folderSlug.split(path.posix.sep)
      const fileParts = fileSlug.split(path.posix.sep)
      const isDirectChild = fileParts.length === folderParts.length + 1
      return prefixed && isDirectChild
    })
    const cssClasses: string[] = fileData.frontmatter?.cssclasses ?? []
    const classes = ["popover-hint", ...cssClasses].join(" ")
    const listProps = {
      ...props,
      allFiles: allPagesInFolder,
    }

    const content =
      (tree as Root).children.length === 0
        ? fileData.description
        : htmlToJsx(fileData.filePath || ("" as FilePath), tree)

    return (
      <div className={classes}>
        <article>
          <p>{content as React.ReactNode}</p>
        </article>
        <div className="page-listing">
          {options.showFolderCount && (
            <p>
              {i18n(cfg.locale).pages.folderContent.itemsUnderFolder({
                count: allPagesInFolder.length,
              })}
            </p>
          )}
          <div>
            <PageList {...listProps} />
          </div>
        </div>
      </div>
    )
  }

  FolderContent.css = style + PageList.css
  return FolderContent
}) satisfies QuartzComponentConstructor
