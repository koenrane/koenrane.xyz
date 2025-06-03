import React from "react"

import notFoundStyle from "../styles/404.scss"
import { QuartzComponent, QuartzComponentConstructor } from "../types"

const NotFound: QuartzComponent = () => {
  return (
    <article className="popover-hint">
      <div id="not-found-div">
        <div>
          <h1>404</h1>
          <p>
            That page doesn’t exist. <br />
            But don’t leave! There <br />
            are other fish in the pond.
          </p>
        </div>

        <img
          src="https://assets.turntrout.com/static/images/turntrout-art-transparent.avif"
          id="trout-reading"
          className="no-select"
        ></img>
      </div>
    </article>
  )
}
NotFound.css = notFoundStyle

export default (() => NotFound) satisfies QuartzComponentConstructor
