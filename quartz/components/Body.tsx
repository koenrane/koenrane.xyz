// skipcq: JS-W1028
import React from "react"

// @ts-expect-error Not a module but a script
import clipboardScript from "./scripts/clipboard.inline"
import clipboardStyle from "./styles/clipboard.scss"
import {
  type QuartzComponent,
  type QuartzComponentConstructor,
  type QuartzComponentProps,
} from "./types"

const searchInterface = (
  <div className="search" aria-label="Displays search results.">
    <div id="search-container">
      <div id="search-space">
        <input
          autoComplete="off"
          id="search-bar"
          name="search"
          type="text"
          aria-label="Search"
          placeholder="Search"
        />
        <div id="search-layout" data-preview></div>
      </div>
    </div>
  </div>
)

const Body: QuartzComponent = ({ children }: QuartzComponentProps) => {
  // The quartz-body children are the three main sections of the page: left, center, and right bars
  return (
    <>
      {searchInterface}
      <div id="quartz-body">{children}</div>
    </>
  )
}

Body.afterDOMLoaded = clipboardScript
Body.css = clipboardStyle

export default (() => Body) satisfies QuartzComponentConstructor
