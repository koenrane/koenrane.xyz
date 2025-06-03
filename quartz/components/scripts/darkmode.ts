import { wrapWithoutTransition } from "./component_script_utils"

export type Theme = "light" | "dark" | "auto"

/**
 * Determines the system's color scheme preference
 * @returns The system's preferred theme ('light' or 'dark')
 */
export function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

/**
 * Updates the theme text in the toggle button
 * @param theme - The current theme
 */
function updateThemeLabel(theme: Theme) {
  const toggle = document.querySelector("#theme-label") as HTMLButtonElement
  if (toggle) {
    toggle.textContent = theme.charAt(0).toUpperCase() + theme.slice(1)
  }
}

/**
 * Updates the DOM to reflect the current theme state
 * @param theme - The theme to apply
 */
function setThemeClassOnRoot(theme: Theme) {
  document.documentElement.setAttribute("data-theme-mode", theme)
  const themeToApply = theme === "auto" ? getSystemTheme() : theme
  document.documentElement.setAttribute("data-theme", themeToApply)
}

/**
 * Updates the theme state and related UI elements
 * @param theme - The theme state to apply
 */
export function handleThemeUpdate(theme: Theme): void {
  localStorage.setItem("saved-theme", theme)
  setThemeClassOnRoot(theme)
  updateThemeLabel(theme)
}

const getNextTheme = (): Theme => {
  const currentTheme = localStorage.getItem("saved-theme") || "auto"
  let nextTheme: Theme

  switch (currentTheme) {
    case "auto":
      nextTheme = "light"
      break
    case "light":
      nextTheme = "dark"
      break
    case "dark":
      nextTheme = "auto"
      break
    default:
      nextTheme = "auto"
  }

  return nextTheme
}

/**
 * Cycles through theme states in the order: auto -> light -> dark -> auto
 */
export const rotateTheme = () => {
  const nextTheme = getNextTheme()
  handleThemeUpdate(nextTheme)
}

/**
 * Initializes the dark mode functionality:
 * - Sets up initial theme based on saved preference or auto mode
 * - Configures theme toggle click handler
 * - Sets up system preference change listener
 * - Manages theme label based on current theme
 */
function setupDarkMode() {
  const savedTheme = localStorage.getItem("saved-theme")
  const theme = savedTheme || "auto"
  handleThemeUpdate(theme as Theme)

  const toggle = document.querySelector("#theme-toggle") as HTMLButtonElement
  if (toggle) {
    toggle.addEventListener("click", wrapWithoutTransition(rotateTheme))
  }

  document.addEventListener("nav", () => {
    /**
     * Handles system color scheme preference changes
     * @param e - MediaQueryList event containing the new preference
     */
    function doSystemPreference(e: MediaQueryListEvent): void {
      const savedTheme = localStorage.getItem("saved-theme")
      if (savedTheme === "auto") {
        const newTheme = e.matches ? "dark" : "light"
        document.documentElement.setAttribute("data-theme", newTheme)
      }
    }
    const wrappedSystemPreference = wrapWithoutTransition(doSystemPreference)

    const colorSchemeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    colorSchemeMediaQuery.addEventListener("change", wrappedSystemPreference)

    // Update theme state after navigation
    const currentTheme = localStorage.getItem("saved-theme") || "auto"
    setThemeClassOnRoot(currentTheme as Theme)
    updateThemeLabel(currentTheme as Theme)
  })
}

export { setupDarkMode }
