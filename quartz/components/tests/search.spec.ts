import { test, expect } from "@playwright/test"

import { tabletBreakpoint } from "../../styles/variables"
import {
  searchPlaceholderDesktop,
  searchPlaceholderMobile,
  debounceSearchDelay,
} from "../scripts/search"
import { takeRegressionScreenshot, setTheme, search, showingPreview } from "./visual_utils"

test.beforeEach(async ({ page }) => {
  // Log any console errors
  page.on("pageerror", (err) => console.error(err))

  // Navigate and wait for full initialization
  await page.goto("http://localhost:8080/welcome", { waitUntil: "load" })

  // Wait for search to be fully initialized
  await expect(page.locator("#search-container")).toBeAttached()
  await expect(page.locator("#search-icon")).toBeVisible()

  // Ensure search is closed at start
  const searchContainer = page.locator("#search-container")
  await expect(searchContainer).not.toHaveClass(/active/)

  await page.keyboard.press("/")
  await expect(searchContainer).toHaveClass(/active/)
  await expect(page.locator("#search-bar")).toBeVisible()
})

test.afterEach(async ({ page }) => {
  // Ensure search is closed after each test
  const searchContainer = page.locator("#search-container")
  if (await searchContainer.evaluate((el) => el.classList.contains("active"))) {
    await page.keyboard.press("Escape")
    await expect(searchContainer).not.toHaveClass(/active/)
  }
})

for (const keyName of ["/", "Escape"]) {
  test(`Search closes with ${keyName}`, async ({ page }) => {
    const searchContainer = page.locator("#search-container")
    const searchBar = page.locator("#search-bar")

    // Initial state (already open)
    await expect(searchContainer).toHaveClass(/active/)
    await expect(searchBar).toBeFocused()

    // Close with keyName
    await page.keyboard.press(keyName)
    await expect(searchContainer).not.toHaveClass(/active/)
  })
}

test("Clicking on nav-searchbar opens search", async ({ page }) => {
  // Close search
  await page.keyboard.press("Escape")

  const searchContainer = page.locator("#search-container")
  await expect(searchContainer).not.toHaveClass(/active/)

  const searchBar = page.locator("#nav-searchbar")
  await searchBar.click()
  await expect(searchContainer).toHaveClass(/active/)
})

test("Search results appear and can be navigated (lostpixel)", async ({ page }, testInfo) => {
  if (!showingPreview(page)) {
    test.skip()
  }

  await search(page, "Steering")
  // Add wait to ensure search results are fully processed
  await page.waitForTimeout(debounceSearchDelay + 100)

  // Check results appear
  const resultsContainer = page.locator("#results-container")
  await expect(resultsContainer).toBeVisible()

  const resultCards = page.locator(".result-card")
  await expect(resultCards.first()).toBeVisible()
  await expect(resultCards.first()).toContainText("Steering", { timeout: 10000 })

  // Navigate with arrow keys
  await page.keyboard.press("ArrowDown")
  // Add wait after keyboard navigation
  await page.waitForTimeout(500)

  const secondResult = resultCards.nth(1)
  await expect(secondResult).toHaveClass(/focus/)

  // Check that the preview appears if the width is greater than tabletBreakpoint
  const previewContainer = page.locator("#preview-container")
  await page.waitForTimeout(1000)

  await expect(previewContainer).toBeVisible({ visible: showingPreview(page), timeout: 10000 })

  // Should have children -- means there's content
  await expect(previewContainer.first()).toBeVisible({
    visible: showingPreview(page),
    timeout: 10000,
  })

  // Add wait before screenshot
  await page.waitForTimeout(1000)
  // Take screenshot of search results
  await takeRegressionScreenshot(page, testInfo, "", {
    element: "#search-layout",
  })
})

test("Preview panel shows on desktop and hides on mobile", async ({ page }) => {
  await search(page, "test")

  const previewContainer = page.locator("#preview-container")
  await expect(previewContainer).toBeVisible({ visible: showingPreview(page) })
})

test("Search placeholder changes based on viewport", async ({ page }) => {
  const searchBar = page.locator("#search-bar")
  const pageWidth = page.viewportSize()?.width
  const showShortcutPlaceholder = pageWidth && pageWidth >= tabletBreakpoint

  await page.keyboard.press("/")
  await expect(searchBar).toHaveAttribute(
    "placeholder",
    showShortcutPlaceholder ? searchPlaceholderDesktop : searchPlaceholderMobile,
  )
})

test("Highlighted search terms appear in results", async ({ page }) => {
  await search(page, "test")

  const highlights = page.locator(".highlight")
  await expect(highlights.first()).toContainText("test", { ignoreCase: true })
})

test("Search results are case-insensitive", async ({ page }) => {
  await search(page, "TEST")
  const uppercaseResults = await page.locator(".result-card").all()

  await search(page, "test")
  const lowerCaseResults = await page.locator(".result-card").all()

  expect(uppercaseResults).toEqual(lowerCaseResults)
})

test("Search bar is focused after typing", async ({ page }) => {
  await search(page, "Steering")
  const searchBar = page.locator("#search-bar")
  await expect(searchBar).toBeFocused()
})

test("Search results work for a single character", async ({ page }) => {
  await search(page, "t")

  const results = await page.locator(".result-card").all()

  // If there's only one result, it's probably just "nothing found"
  expect(results).not.toHaveLength(1)
})

test.describe("Search accuracy", () => {
  const searchTerms = [
    { term: "Josh Turner" },
    { term: "The Pond" },
    { term: "United States government" },
    { term: "gwern" },
  ]
  searchTerms.forEach(({ term }) => {
    test(`Search results prioritize full term matches for ${term}`, async ({ page }) => {
      await search(page, term)

      const previewContainer = page.locator("#preview-container")
      const firstResult = previewContainer.first()
      await expect(firstResult).toContainText(term)
    })
  })

  const titleTerms = ["AI presidents", "AI President", "Alignment"]
  titleTerms.forEach((term) => {
    test(`Title search results are ordered before content search results for ${term}`, async ({
      page,
    }) => {
      await search(page, term)

      const firstResult = page.locator(".result-card").first()
      const firstText = await firstResult.textContent()
      expect(firstText?.toLowerCase()).toContain(term.toLowerCase())
      expect(firstText?.startsWith("...")).toBe(false)
    })
  })

  const previewTerms = ["Shrek", "AI presidents", "virus", "Emoji"]
  previewTerms.forEach((term) => {
    test(`Term ${term} is previewed in the viewport`, async ({ page }) => {
      test.skip(!showingPreview(page))
      await search(page, term)

      const previewContent = page.locator("#preview-container > article")
      await expect(previewContent).toBeVisible()

      // Get first highlighted match
      const highlightedMatches = previewContent.locator(`span.highlight:text("${term}")`).first()
      await expect(highlightedMatches).toBeInViewport()
    })
  })

  test("Slug search results are ordered before content search results for date-me", async ({
    page,
  }) => {
    await search(page, "date-me")

    const firstResult = page.locator("#preview-container").first()
    await expect(firstResult).toContainText("wife")
  })

  test("Nothing shows up for nonsense search terms", async ({ page }) => {
    await search(page, "feiwopqclvxk")

    const resultCards = page.locator(".result-card")
    await expect(resultCards).toHaveCount(1)
    await expect(resultCards.first()).toContainText("No results")
  })

  test("AI presidents doesn't use dropcap", async ({ page }) => {
    test.skip(!showingPreview(page))
    await search(page, "AI presidents")

    const previewElement = page.locator("#preview-container > article")
    await expect(previewElement).toHaveAttribute("data-use-dropcap", "false")
  })

  test("Test page does use dropcap", async ({ page }) => {
    await search(page, "test")

    const previewElement = page.locator("#preview-container > article")
    await expect(previewElement).toHaveAttribute("data-use-dropcap", "true")
  })
})

test("Search preview footnote backref has no underline", async ({ page }) => {
  await search(page, "test")

  const footnoteLink = page.locator("#preview-container a[data-footnote-backref]").first()
  await expect(footnoteLink).toHaveCSS("text-decoration", /^none/)
})

test("Enter key navigates to first result", async ({ page }) => {
  const initialUrl = page.url()
  await search(page, "test")

  const firstResult = page.locator(".result-card").first()
  await firstResult.press("Enter")

  expect(page.url()).not.toBe(initialUrl)
})

test("Search URL updates as we select different results", async ({ page }) => {
  test.skip(!showingPreview(page))

  await search(page, "Shrek")
  const previewContainer = page.locator("#preview-container")

  // Hover over the first result and click the preview
  const firstResult = page.locator(".result-card").first()
  await firstResult.hover()
  await previewContainer.click()

  // Wait for navigation to complete and get the URL
  await page.waitForLoadState("networkidle")
  const firstResultUrl = page.url()

  await page.keyboard.press("/")
  await search(page, "Shrek")

  // Hover over the second result and click the preview
  const secondResult = page.locator(".result-card").nth(1)
  await secondResult.hover()
  await previewContainer.click()

  // Wait for navigation and get the new URL
  await page.waitForLoadState("networkidle")
  const secondResultUrl = page.url()

  // Verify that the URLs are different
  expect(secondResultUrl).not.toBe(firstResultUrl)
})

test("Emoji search works and is converted to twemoji (lostpixel)", async ({ page }, testInfo) => {
  await search(page, "Emoji examples")
  // Add wait to ensure search results are fully processed
  await page.waitForTimeout(1500)

  const firstResult = page.locator(".result-card").first()
  // Assertion on the title's contents for the first result
  await expect(firstResult).toContainText("Testing Site Features")
  if (showingPreview(page)) {
    await takeRegressionScreenshot(page, testInfo, "", {
      element: "#preview-container",
    })
  }

  // Add wait before clicking
  await page.waitForTimeout(500)
  await firstResult.click()
  expect(page.url()).toBe("http://localhost:8080/test-page")
})

test("Footnote back arrow is properly replaced (lostpixel)", async ({ page }, testInfo) => {
  test.skip(!showingPreview(page))
  await search(page, "Testing site")
  // Add wait to ensure search results are fully processed
  await page.waitForTimeout(debounceSearchDelay + 100)

  const footnoteLink = page.locator("#preview-container a[data-footnote-backref]").first()
  await footnoteLink.scrollIntoViewIfNeeded()
  // Add wait after scrolling
  await page.waitForTimeout(500)

  await expect(footnoteLink).toContainText("⤴")
  await expect(footnoteLink).toBeVisible()

  // Add wait before screenshot
  await page.waitForTimeout(1000)
  await takeRegressionScreenshot(page, testInfo, "", {
    element: footnoteLink,
  })
})

test.describe("Image's mix-blend-mode attribute", () => {
  test.beforeEach(async ({ page }) => {
    await search(page, "Testing site")
  })

  test("is multiply in light mode", async ({ page }) => {
    const image = page.locator("#preview-container img").first()
    await expect(image).toHaveCSS("mix-blend-mode", "multiply")
  })

  test("is normal in dark mode", async ({ page }) => {
    await setTheme(page, "dark")
    const image = page.locator("#preview-container img").first()
    await expect(image).toHaveCSS("mix-blend-mode", "normal")
  })
})

// Visual regression testing
test("Opens the 'testing site features' page (lostpixel)", async ({ page }, testInfo) => {
  await search(page, "Testing site")
  // Add wait to ensure search results are fully processed
  await page.waitForTimeout(debounceSearchDelay + 100)

  // Make sure it looks good
  if (showingPreview(page)) {
    const previewContainer = page.locator("#preview-container")

    // Add a small delay to ensure the preview has time to load
    await page.waitForTimeout(1000)

    await expect(previewContainer).toBeVisible({ timeout: 10000 })
    await takeRegressionScreenshot(page, testInfo, "", {
      element: "#preview-container",
    })
  }

  // Add wait before clicking
  await page.waitForTimeout(500)
  const firstResult = page.locator(".result-card").first()
  await firstResult.click()

  const url = page.url()
  expect(url).toBe("http://localhost:8080/test-page")
})

test("Search preview shows after bad entry", async ({ page }) => {
  test.skip(!showingPreview(page))
  await search(page, "zzzzzz")
  await search(page, "Testing site")
  await search(page, "zzzzzz")
  await search(page, "Testing site")

  const previewContainer = page.locator("#preview-container")
  await expect(previewContainer).toBeVisible()

  // If preview fails, it'll have no children
  const previewContent = previewContainer.locator(":scope > *")
  await expect(previewContent).toHaveCount(1)
})

test("Search preview shows after searching, closing, and reopening", async ({ page }) => {
  test.skip(!showingPreview(page))

  const previewContainer = page.locator("#preview-container")

  await search(page, "Testing site")
  await expect(previewContainer).toBeVisible()

  await page.keyboard.press("Escape")
  await expect(previewContainer).not.toBeVisible()

  // Even though search pane reopens, preview container should be hidden
  await page.keyboard.press("/")
  await expect(previewContainer).not.toBeVisible()

  await search(page, "Shrek")
  await expect(previewContainer).toBeVisible()
})

test("Show search preview, search invalid, then show again", async ({ page }) => {
  test.skip(!showingPreview(page))
  await search(page, "Testing site")
  await search(page, "zzzzzz")
  await search(page, "Testing site")

  const previewContainer = page.locator("#preview-container")
  await expect(previewContainer).toBeVisible()

  // If preview fails, it'll have no children
  const previewContent = previewContainer.locator(":scope > *")
  await expect(previewContent).toHaveCount(1)
})

test("The pond dropcaps, search preview visual regression test (lostpixel)", async ({
  page,
}, testInfo) => {
  test.skip(!showingPreview(page))

  await search(page, "Testing site")
  // Add wait to ensure search results are fully processed
  await page.waitForTimeout(1500)

  const searchPondDropcaps = page.locator("#the-pond-dropcaps")
  await searchPondDropcaps.scrollIntoViewIfNeeded()

  // Add wait before screenshot
  await page.waitForTimeout(1000)
  await takeRegressionScreenshot(page, testInfo, "", {
    element: "#the-pond-dropcaps",
  })
})

test("Preview container click navigates to the correct page", async ({ page }) => {
  test.skip(!showingPreview(page))

  // Set viewport to desktop size to ensure preview is visible
  await page.setViewportSize({ width: tabletBreakpoint + 100, height: 800 })

  await search(page, "Testing site")

  // Get the URL of the first result for comparison
  const firstResult = page.locator(".result-card").first()
  const expectedUrl = await firstResult.getAttribute("href")

  // Click the preview container
  const previewContainer = page.locator("#preview-container")
  await previewContainer.click()

  // Verify navigation occurred to the correct URL
  expect(page.url()).toBe(expectedUrl)
})

test("Result card highlighting stays synchronized with preview", async ({ page }) => {
  test.skip(!showingPreview(page))

  await search(page, "test")

  // Check initial state
  const firstResult = page.locator(".result-card").first()
  await expect(firstResult).toHaveClass(/focus/)

  // Check keyboard navigation
  await page.keyboard.press("ArrowDown")
  const secondResult = page.locator(".result-card").nth(1)
  await expect(secondResult).toHaveClass(/focus/)
  await expect(firstResult).not.toHaveClass(/focus/)

  // Check mouse interaction
  const thirdResult = page.locator(".result-card").nth(2)
  await expect(thirdResult).not.toHaveClass(/focus/)
  await thirdResult.hover()
  await expect(thirdResult).toHaveClass(/focus/)
  await expect(secondResult).not.toHaveClass(/focus/)
})

const navigationMethods = [
  { down: "ArrowDown", up: "ArrowUp", description: "arrow keys" },
  { down: "Tab", up: "Shift+Tab", description: "tab keys" },
] as const

navigationMethods.forEach(({ down, up, description }) => {
  test(`maintains focus when navigating with ${description}`, async ({ page }) => {
    await search(page, "Testing Site Features")

    const totalResults = await page.locator(".result-card").count()

    // Navigate down through results
    for (let i = 0; i < totalResults; i++) {
      await page.keyboard.press(down)
      const focusedResults = await page.locator(".result-card.focus").count()
      expect(focusedResults).toBe(1)
    }

    // Navigate up through results
    for (let i = 0; i < totalResults; i++) {
      await page.keyboard.press(up)
      const focusedResults = await page.locator(".result-card.focus").count()
      expect(focusedResults).toBe(1)
    }
  })
})

navigationMethods.forEach(({ down, description }) => {
  test(`${description} navigation changes which page you enter`, async ({ page }) => {
    await search(page, "Testing")

    await page.keyboard.press(down)
    await page.keyboard.press("Enter")
    expect(page.url()).not.toBe("http://localhost:8080/test-page")
  })
})
