import { test, expect, type Locator, type Page, type TestInfo } from "@playwright/test"

import { minDesktopWidth, maxMobileWidth } from "../../styles/variables"
import {
  takeRegressionScreenshot,
  setTheme,
  waitForTransitionEnd,
  isDesktopViewport,
  yOffset,
  takeScreenshotAfterElement,
} from "./visual_utils"

// TODO test iframe and video fullscreen in light mode (and dark for safety)
test.beforeEach(async ({ page }) => {
  // Mock clipboard API
  await page.addInitScript(() => {
    // Mock clipboard API if not available
    if (!navigator.clipboard) {
      Object.defineProperty(navigator, "clipboard", {
        value: {},
        writable: true,
      })
    }

    Object.defineProperty(navigator.clipboard, "writeText", {
      value: () => Promise.resolve(),
      writable: true,
    })
  })

  // Log any console errors
  page.on("pageerror", (err) => console.error(err))

  await page.goto("http://localhost:8080/test-page", { waitUntil: "domcontentloaded" })

  // Dispatch the 'nav' event to initialize clipboard functionality
  await page.evaluate(() => {
    window.dispatchEvent(new Event("nav"))
  })
})

/**
 * Get screenshots of all h1s in a container
 * @param container - The container to get the h1s from
 * @param testInfo - The test info
 * @param theme - The theme to get the screenshots for
 */
async function getH1Screenshots(
  page: Page,
  testInfo: TestInfo,
  location: Locator | null,
  theme: "dark" | "light",
) {
  let headers: Locator[]
  if (location) {
    headers = await location.locator("h1").all()
  } else {
    headers = await page.locator("h1").all()
  }

  for (let index = 0; index < headers.length - 1; index++) {
    const header = headers[index]
    const nextHeader = headers[index + 1]
    const offset = await yOffset(header, nextHeader)

    await header.scrollIntoViewIfNeeded()

    // Wait for all images to load
    for (const image of await header.locator("img").all()) {
      await image.waitFor({ state: "visible" })
    }

    // Only screenshot up to where the next section begins
    await takeScreenshotAfterElement(page, testInfo, header, offset, `${theme}-${index}`)
  }
}

test.describe("Test page sections", () => {
  for (const theme of ["dark", "light"]) {
    test(`Normal page in ${theme} mode (lostpixel)`, async ({ page }, testInfo) => {
      await setTheme(page, theme as "light" | "dark")

      // Get the height of the page
      const boundingBoxArticle = await page.locator("body").boundingBox()
      if (!boundingBoxArticle) throw new Error("Could not get preview container dimensions")

      // Set viewport to match preview height
      await page.setViewportSize({
        width: page.viewportSize()?.width ?? 1920,
        height: Math.ceil(boundingBoxArticle.height),
      })

      await getH1Screenshots(page, testInfo, null, theme as "light" | "dark")
    })
  }
})

test.describe("Various site pages", () => {
  for (const pageSlug of ["", "404", "all-tags", "recent", "tags/personal"]) {
    test(`${pageSlug} (lostpixel)`, async ({ page }, testInfo) => {
      await page.goto(`http://localhost:8080/${pageSlug}`)
      await takeRegressionScreenshot(page, testInfo, `test-page-${pageSlug}`)
    })
  }

  test("Reward warning (lostpixel)", async ({ page }, testInfo) => {
    await page.goto(
      "http://localhost:8080/a-certain-formalization-of-corrigibility-is-vnm-incoherent",
    )
    const rewardWarning = page.getByText("Reward is not the optimization target").first()
    await expect(rewardWarning).toBeVisible()
    await takeRegressionScreenshot(page, testInfo, "reward-warning", {
      element: rewardWarning,
    })
  })
})
test.describe("Table of contents", () => {
  function getTableOfContentsSelector(page: Page) {
    return isDesktopViewport(page) ? "#toc-content" : "*:has(> #toc-content-mobile)"
  }

  test("TOC is visible (lostpixel)", async ({ page }) => {
    const selector = getTableOfContentsSelector(page)
    await expect(page.locator(selector)).toBeVisible()
  })

  test("TOC visual regression (lostpixel)", async ({ page }, testInfo) => {
    const selector = getTableOfContentsSelector(page)
    if (!isDesktopViewport(page)) {
      await page.locator(selector).locator(".admonition-title-inner").first().click()
    }

    await takeRegressionScreenshot(page, testInfo, selector)
  })
})

test.describe("Layout Breakpoints", () => {
  for (const width of [minDesktopWidth, maxMobileWidth]) {
    test(`Layout at breakpoint width ${width}px (lostpixel)`, async ({ page }, testInfo) => {
      // Set viewport to the exact breakpoint width
      await page.setViewportSize({ width, height: 480 }) // Don't show much

      // Take a full page screenshot at this specific width
      await takeRegressionScreenshot(page, testInfo, `layout-breakpoint-${width}px`)
    })
  }
})

test.describe("Admonitions", () => {
  for (const theme of ["light", "dark"]) {
    test(`Admonition click behaviors in ${theme} mode`, async ({ page }) => {
      await setTheme(page, theme as "light" | "dark")

      const admonition = page.locator("#test-collapse").first()
      await admonition.scrollIntoViewIfNeeded()

      // Initial state should be collapsed
      await expect(admonition).toHaveClass(/.*is-collapsed.*/)
      const initialScreenshot = await admonition.screenshot()

      // Click anywhere on admonition should open it
      await admonition.click()
      await expect(admonition).not.toHaveClass(/.*is-collapsed.*/)
      await waitForTransitionEnd(admonition)
      const openedScreenshot = await admonition.screenshot()
      expect(openedScreenshot).not.toEqual(initialScreenshot)

      // Click on content should NOT close it
      const content = admonition.locator(".admonition-content").first()
      await content.click()
      await expect(admonition).not.toHaveClass(/.*is-collapsed.*/)
      const afterContentClickScreenshot = await admonition.screenshot()
      expect(afterContentClickScreenshot).toEqual(openedScreenshot)

      // Click on title should close it
      const title = admonition.locator(".admonition-title").first()
      await title.click()
      await expect(admonition).toHaveClass(/.*is-collapsed.*/)

      await waitForTransitionEnd(admonition)
      await expect(admonition).toBeVisible()
    })
  }

  for (const status of ["open", "closed"]) {
    test(`Regression testing on fold button appearance in ${status} state (lostpixel)`, async ({
      page,
    }, testInfo) => {
      let element: Locator
      if (status === "open") {
        element = page.locator("#test-open .fold-admonition-icon").first()
      } else {
        element = page.locator("#test-collapse .fold-admonition-icon").first()
      }

      await element.scrollIntoViewIfNeeded()
      await element.waitFor({ state: "visible" })

      await takeRegressionScreenshot(page, testInfo, `fold-button-appearance-${status}`, {
        element,
      })
    })
  }

  test("color demo text isn't wrapping", async ({ page }) => {
    for (const identifier of ["#light-demo", "#dark-demo"]) {
      // Get all paragraph elements within the demo
      const textElements = page.locator(`${identifier} > div > p`)
      const count = await textElements.count()

      // Iterate through each paragraph element
      for (let i = 0; i < count; i++) {
        const element = textElements.nth(i)

        // Get computed styles for this element
        const computedStyle = await element.evaluate((el) => {
          const styles = window.getComputedStyle(el)
          return {
            lineHeight: parseFloat(styles.lineHeight),
            height: el.getBoundingClientRect().height,
          }
        })

        // Assert the height is not significantly greater than line height
        expect(computedStyle.height).toBeLessThanOrEqual(computedStyle.lineHeight * 1.01)
      }
    }
  })
})

test.describe("Clipboard button", () => {
  for (const theme of ["light", "dark"]) {
    test(`Clipboard button is visible when hovering over code block in ${theme} mode`, async ({
      page,
    }) => {
      await setTheme(page, theme as "light" | "dark")
      const clipboardButton = page.locator(".clipboard-button").first()
      await clipboardButton.scrollIntoViewIfNeeded()
      await expect(clipboardButton).toHaveCSS("opacity", "0")

      const codeBlock = page.locator("figure[data-rehype-pretty-code-figure]").first()
      await codeBlock.hover()
      await expect(clipboardButton).toHaveCSS("opacity", "1")
    })

    test(`Clicking the button changes it in ${theme} mode`, async ({ page }) => {
      await setTheme(page, theme as "light" | "dark")
      const clipboardButton = page.locator(".clipboard-button").first()
      const screenshotBeforeClicking = await clipboardButton.screenshot()

      await clipboardButton.click()
      const screenshotAfterClicking = await clipboardButton.screenshot()
      expect(screenshotAfterClicking).not.toEqual(screenshotBeforeClicking)
    })

    test(`Clipboard button in ${theme} mode (lostpixel)`, async ({ page }, testInfo) => {
      await setTheme(page, theme as "light" | "dark")
      const clipboardButton = page.locator(".clipboard-button").first()
      await clipboardButton.click()

      await takeRegressionScreenshot(page, testInfo, `clipboard-button-clicked-${theme}`, {
        element: clipboardButton,
        disableHover: false,
      })
    })
  }
})

test.describe("Right sidebar", () => {
  test("TOC visual test (lostpixel)", async ({ page }, testInfo) => {
    if (!isDesktopViewport(page)) {
      // Open the TOC
      const tocContent = page.locator(".admonition").first()
      await tocContent.click()
      await takeRegressionScreenshot(page, testInfo, "toc-visual-test-open", {
        element: tocContent,
      })
    } else {
      const rightSidebar = page.locator("#right-sidebar")
      await takeRegressionScreenshot(page, testInfo, "toc-visual-test", {
        element: rightSidebar,
      })
    }
  })

  test("Right sidebar scrolls independently", async ({ page }) => {
    test.skip(!isDesktopViewport(page), "Desktop-only test")

    const rightSidebar = page.locator("#right-sidebar")
    await expect(rightSidebar).toBeVisible()

    // Check if the content is actually taller than the sidebar viewport
    const isOverflowing = await rightSidebar.evaluate((el) => {
      return el.scrollHeight > el.clientHeight
    })

    expect(isOverflowing).toBeTruthy()

    const initialWindowScrollY = await page.evaluate(() => window.scrollY)
    const initialSidebarScrollTop = await rightSidebar.evaluate((el) => el.scrollTop)

    // Scroll the sidebar down
    await rightSidebar.evaluate((el) => {
      el.scrollBy(0, 100)
    })

    // Wait a moment for scroll to apply
    await page.waitForTimeout(100)

    const finalWindowScrollY = await page.evaluate(() => window.scrollY)
    const finalSidebarScrollTop = await rightSidebar.evaluate((el) => el.scrollTop)

    // Verify window did not scroll
    expect(finalWindowScrollY).toEqual(initialWindowScrollY)

    // Verify sidebar did scroll
    expect(finalSidebarScrollTop).toBeGreaterThan(initialSidebarScrollTop)
    expect(finalSidebarScrollTop).toBeCloseTo(initialSidebarScrollTop + 100, 0) // Allow for slight rounding
  })

  test("Scrolling down changes TOC highlight (lostpixel)", async ({ page }, testInfo) => {
    test.skip(!isDesktopViewport(page))

    const spoilerHeading = page.locator("#spoilers").first()
    await spoilerHeading.scrollIntoViewIfNeeded()

    const activeElement = page.locator("#table-of-contents .active").first()
    await takeRegressionScreenshot(page, testInfo, "toc-highlight-scrolled", {
      element: activeElement,
    })
  })

  test("ContentMeta is visible (lostpixel)", async ({ page }, testInfo) => {
    await takeRegressionScreenshot(page, testInfo, "content-meta-visible", {
      element: "#content-meta",
    })
  })

  test("Backlinks are visible (lostpixel)", async ({ page }, testInfo) => {
    const backlinks = page.locator("#backlinks").first()
    await backlinks.scrollIntoViewIfNeeded()
    await expect(backlinks).toBeVisible()

    const backlinksTitle = backlinks.locator(".admonition-title").first()
    await backlinksTitle.scrollIntoViewIfNeeded()
    await expect(backlinksTitle).toBeVisible()
    await expect(backlinksTitle).toHaveText("Links to this page")

    // Open the backlinks
    await backlinksTitle.click()
    await takeRegressionScreenshot(page, testInfo, "backlinks-visible", {
      element: backlinks,
    })
  })
})

test.describe("Spoilers", () => {
  for (const theme of ["light", "dark"]) {
    test(`Spoiler before revealing in ${theme} mode (lostpixel)`, async ({ page }, testInfo) => {
      await setTheme(page, theme as "light" | "dark")
      const spoiler = page.locator(".spoiler-container").first()
      await takeRegressionScreenshot(page, testInfo, `spoiler-before-revealing-${theme}`, {
        element: spoiler,
      })
    })

    test(`Spoiler after revealing in ${theme} mode (lostpixel)`, async ({ page }, testInfo) => {
      await setTheme(page, theme as "light" | "dark")
      const spoiler = page.locator(".spoiler-container").first()
      await spoiler.scrollIntoViewIfNeeded()
      await expect(spoiler).toBeVisible()

      await spoiler.click()

      await expect(spoiler).toHaveClass(/revealed/)
      await waitForTransitionEnd(spoiler)

      await takeRegressionScreenshot(page, testInfo, "spoiler-after-revealing", {
        element: spoiler,
      })

      // Click again to close
      await spoiler.click()
      await page.mouse.click(0, 0) // Click away to remove focus

      await expect(spoiler).not.toHaveClass(/revealed/)
      await waitForTransitionEnd(spoiler)
    })
  }

  // Test that hovering over the spoiler reveals it
  test("Hovering over spoiler reveals it (lostpixel)", async ({ page }, testInfo) => {
    const spoiler = page.locator(".spoiler-container").first()
    await spoiler.scrollIntoViewIfNeeded()
    await expect(spoiler).toBeVisible()

    const initialScreenshot = await spoiler.screenshot()

    await spoiler.hover()
    const revealedScreenshot = await spoiler.screenshot()
    expect(revealedScreenshot).not.toEqual(initialScreenshot)

    await takeRegressionScreenshot(page, testInfo, "spoiler-hover-reveal", {
      element: spoiler,
      disableHover: false,
    })
  })
})

test("Single letter dropcaps visual regression (lostpixel)", async ({ page }, testInfo) => {
  const singleLetterDropcaps = page.locator("#single-letter-dropcap")
  await singleLetterDropcaps.scrollIntoViewIfNeeded()
  await takeRegressionScreenshot(page, testInfo, "", {
    element: "#single-letter-dropcap",
  })
})

for (const theme of ["light", "dark"]) {
  test(`Hover over elvish text in ${theme} mode (lostpixel)`, async ({ page }, testInfo) => {
    await setTheme(page, theme as "light" | "dark")
    const elvishText = page.locator(".elvish").first()
    await elvishText.scrollIntoViewIfNeeded()

    // Hover and wait for width to stabilize
    await elvishText.hover()

    // Get initial width
    const box = await elvishText.boundingBox()
    if (!box) throw new Error("Could not get elvish text dimensions")

    await takeScreenshotAfterElement(page, testInfo, elvishText, 50, `elvish-text-hover-${theme}`)
  })
}

test.describe("Video Speed Controller visibility", () => {
  test("hides VSC controller for no-vsc videos after img", async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <div class="vsc-controller">Test</div>
        <img />
        <video class="no-vsc"></video>
      `
    })

    const vscController = page.locator(".vsc-controller")
    await expect(vscController).toBeHidden()
  })
  test("hides VSC controller for no-vsc videos", async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <div class="vsc-controller">Test</div>
        <video class="no-vsc"></video>
      `
    })

    const vscController = page.locator(".vsc-controller")
    await expect(vscController).toBeHidden()
  })

  test("hides VSC controller for autoplay videos", async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <div class="vsc-controller">Test</div>
        <video autoplay></video>
      `
    })

    const vscController = page.locator(".vsc-controller")
    await expect(vscController).toBeHidden()
  })

  test("shows VSC controller for regular videos", async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <div class="vsc-controller">Test</div>
        <video></video>
      `
    })

    const vscController = page.locator(".vsc-controller")
    await expect(vscController).toBeVisible()
  })
})
