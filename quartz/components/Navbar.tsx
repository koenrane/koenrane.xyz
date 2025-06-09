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
            Patreon
          </a>
        </li>
      </ul>
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
