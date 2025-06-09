// (For the spa-preserve attribute)

// skipcq: JS-W1028
import React from "react"

import { i18n } from "../i18n"
import { type FullSlug, pathToRoot, resolveRelative } from "../util/path"
import { videoId } from "./component_utils"
// @ts-expect-error Not a module but a script
// skipcq: JS-W1028
import script from "./scripts/navbar.inline"
import navbarStyle from "./styles/navbar.scss"
import {
  type QuartzComponent,
  type QuartzComponentConstructor,
  type QuartzComponentProps,
} from "./types"





type Page = {
  slug: string
  title: string
}

const NavbarComponent: QuartzComponent = ({ cfg, fileData }: QuartzComponentProps) => {
  const pages: Page[] = "pages" in cfg.navbar ? (cfg.navbar.pages as Page[]) : []
  const currentSlug = fileData.slug || ("" as FullSlug)

  const title = cfg?.pageTitle ?? i18n(cfg.locale).propertyDefaults.title
  const baseDir = pathToRoot(fileData.slug || ("" as FullSlug))

  const links = pages.map((page: Page) => (
    <li key={page.slug}>
      <a href={resolveRelative(currentSlug, page.slug as FullSlug)}>{page.title}</a>
    </li>
  ))

  // static KR logo, linkable
  const headerLogoSpan = (
    <span id="header-logo-container">
      <a href={baseDir}> 
        <img
          id="site-logo"
          className="no-select"
          src="/static/images/KoenRane.png"
          alt="Site logo"
          aria-label="Site logo"
        />
      </a>
    </span>
  )


  /*const headerVideoSpan = (
    <span id="header-video-container" data-persist-video="true">
      <video
        id={videoId}
        className="no-select no-vsc"
        loop
        muted
        playsInline
        data-persist
        preload="auto"
        poster="https://assets.turntrout.com/static/pond_frame.avif"
        aria-label="A goose and a trout play in a pond in front of a castle."
      >
        <source src="https://assets.turntrout.com/static/pond.mov" type="video/mp4; codecs=hvc1" />
        <source src="https://assets.turntrout.com/static/pond.webm" type="video/webm" />
      </video>
    </span>
  )*/

  

  const pageLinks = (
    <nav className="menu">
      <ul>
        {links}
        <li>
          <a
            href="https://patreon.com/koenrane" 
            className="external"
            target="_blank"
            rel="noopener noreferrer"
          >
            PATREON
          </a>
        </li>
      </ul>
      {/* Mobile-only search and dark mode */}
      <div className="mobile-only mobile-controls">
        <div id="mobile-search-layout" className="mobile-search">
          <button id="mobile-search-button" type="button" aria-label="Search">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
          <div id="mobile-search-bar">
            <input
              type="text"
              id="mobile-search-input"
              placeholder="search"
              spellcheck={false}
              autoComplete="off"
              name="searchInput"
              aria-label="Search"
            />
          </div>
        </div>
        <button id="darkmode-toggle" type="button" className="mobile-darkmode" aria-label="Toggle dark mode">
          <svg id="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <svg id="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
      </div>
    </nav>
  )
  return (
    <div id="navbar" className="navbar">
      <div id="navbar-left">
        {headerLogoSpan}
        <h2>
          <a href={baseDir}>{title}</a>
        </h2>
      </div>
      <div id="navbar-right">
        <button
          id="menu-button"
          type="button"
          className="hamburger mobile-only"
          aria-label="Opens menu for key site links."
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
        {pageLinks}
      </div>
    </div>
  )
}

const Navbar = (() => {
  NavbarComponent.css = navbarStyle
  NavbarComponent.afterDOMLoaded = script
  return NavbarComponent
}) satisfies QuartzComponentConstructor

export default Navbar
