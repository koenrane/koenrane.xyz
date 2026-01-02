import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [Component.Navbar()],
  left: [],
  footer: Component.Footer({
    links: {},
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [Component.ArticleTitle(), Component.TagsBeforeBody(), Component.PublicationDate()],
  left: [],
  right: [Component.DesktopOnly(Component.TableOfContents()), Component.SettingsMenu(), Component.ContentMeta()],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.ArticleTitle()],
  left: [],
  right: [Component.SettingsMenu()],
}

export default {
  components: {
    head: [
      Component.Head(),
    ],
  },
}
