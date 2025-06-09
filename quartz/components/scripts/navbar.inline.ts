import { sessionStoragePondVideoKey } from "../component_utils"
import { setupDarkMode } from "./darkmode"
import { setupHamburgerMenu } from "./hamburgerMenu"
import { setupScrollHandler } from "./scrollHandler"
import { setupSearch } from "./search"

function setupPondVideo(): void {
  const videoElement = document.getElementById("pond-video") as HTMLVideoElement | null

  if (videoElement) {
    // Restore timestamp
    const savedTime = sessionStorage.getItem(sessionStoragePondVideoKey)
    if (savedTime) {
      videoElement.currentTime = parseFloat(savedTime)
    }

    videoElement.removeEventListener("mouseenter", playVideo) // Remove first to avoid duplicates
    videoElement.removeEventListener("mouseleave", pauseVideo)
    videoElement.addEventListener("mouseenter", playVideo)
    videoElement.addEventListener("mouseleave", pauseVideo)
  }
}

function playVideo(this: HTMLVideoElement): void {
  void this.play()
}

function pauseVideo(this: HTMLVideoElement): void {
  this.pause()
}

// Mobile-only search and dark mode functionality ---------------------------------------------------------/
function setupMobileControls(): void {
  // Mobile search functionality
  const mobileSearchButton = document.getElementById("mobile-search-button")
  const mobileSearchInput = document.getElementById("mobile-search-input") as HTMLInputElement | null
  const mobileDarkModeButton = document.getElementById("darkmode-toggle")
  
  if (mobileSearchButton && mobileSearchInput) {
    const triggerMainSearch = (searchTerm: string = "") => {
      const mainSearchIcon = document.getElementById("search-icon")
      const mainSearchInput = document.getElementById("search-bar") as HTMLInputElement | null
      
      if (mainSearchIcon && mainSearchInput) {
        // Hide hamburger menu first
        const menu = document.querySelector(".menu")
        if (menu) menu.classList.remove("visible")
        
        // Trigger main search
        mainSearchIcon.click()
        
        // Set search term if provided
        if (searchTerm && mainSearchInput) {
          mainSearchInput.value = searchTerm
          mainSearchInput.dispatchEvent(new Event("input"))
        }
      }
    }
    
    mobileSearchButton.addEventListener("click", () => {
      triggerMainSearch(mobileSearchInput.value)
    })
    
    mobileSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        triggerMainSearch(mobileSearchInput.value)
      }
    })
  }
  
  // Mobile dark mode functionality
  if (mobileDarkModeButton) {
    mobileDarkModeButton.addEventListener("click", () => {
      const mainDarkModeButton = document.getElementById("theme-toggle")
      if (mainDarkModeButton) {
        mainDarkModeButton.click()
      }
    })
  }
}
// ----------------------------------------------------------------------------------------------------------/

// Initial setup
setupDarkMode()
setupHamburgerMenu()
setupSearch()
setupScrollHandler() // Mobile: hide navbar on scroll down, show on scroll up
setupPondVideo()
setupMobileControls()// Mobile-only search

// Re-run setup functions after SPA navigation
document.addEventListener("nav", () => {
  setupPondVideo()
  setupMobileControls()// Mobile-only search
})
