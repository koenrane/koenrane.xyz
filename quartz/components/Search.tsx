import React from "react"
import searchStyle from "./styles/sidebar-search.scss"
import { type QuartzComponent, type QuartzComponentConstructor } from "./types"

const searchHTML = (
  <div className="search" id="search-sidebar">
    <div className="no-select" id="search-icon">
      <svg
        tabIndex={0}
        aria-labelledby="title desc"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 19.9 19.7"
      >
        <title id="title">Search</title>
        <desc id="desc">Search</desc>
        <g className="search-path" fill="none">
          <path strokeLinecap="square" d="M18.5 18.3l-5.4-5.4" />
          <circle cx="8" cy="8" r="7" />
        </g>
      </svg>
      <p>Search</p>
    </div>
  </div>
)

const Search: QuartzComponent = () => {
  return searchHTML
}

const SearchComponent = (() => {
  Search.css = searchStyle
  return Search
}) satisfies QuartzComponentConstructor

export default SearchComponent 