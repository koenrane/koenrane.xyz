import React from "react"

import notFoundStyle from "../styles/404.scss"
import { QuartzComponent, QuartzComponentConstructor } from "../types"

const NotFound: QuartzComponent = () => {
  return (
    <article className="popover-hint">
      <div id="not-found-div">  
        <img
          src="https://assets.koenrane.xyz/404-kr.png"
          id="404-kr"
          className="no-select"
        ></img>
      </div>
    </article>
  )
}
NotFound.css = notFoundStyle

export default (() => NotFound) satisfies QuartzComponentConstructor
