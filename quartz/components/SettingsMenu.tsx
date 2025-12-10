import { QuartzComponentConstructor, QuartzComponent } from "./types"

const SettingsMenu: QuartzComponent = () => {
  return (
    <div className="settings-menu">
      <button className="settings-button" id="settings-toggle" title="Settings">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.65.07.97l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65z"/>
        </svg>
      </button>
      <div className="settings-dropdown" id="settings-dropdown">
        <div className="settings-item" id="settings-search">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19.9 19.7">
            <g className="search-path" fill="none">
              <path strokeLinecap="square" d="M18.5 18.3l-5.4-5.4" />
              <circle cx="8" cy="8" r="7" />
            </g>
          </svg>
          <span>Search</span>
        </div>
        <div className="settings-item" id="settings-darkmode">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="day-icon">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="night-icon">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
          <span id="theme-label">Auto</span>
        </div>
      </div>
    </div>
  )
}

SettingsMenu.css = `
  .settings-menu {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 1000;
  }

  .settings-button {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1001;
    border-radius: 4px;
    box-shadow: none;
  }
  
  .settings-button svg {
    width: 20px;
    height: 20px;
    fill: var(--midground);
    pointer-events: none;
  }

  .settings-button:hover {
    background: var(--midground-faintest);
    border-color: transparent;
  }

  .settings-button:hover svg {
    fill: var(--midground-strong);
  }

  .settings-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    background: var(--background);
    border: 1px solid var(--midground-faint);
    border-radius: 4px;
    padding: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: none;
    flex-direction: column;
    gap: 4px;
    min-width: 180px;
    z-index: 1002;
  }

  .settings-dropdown.active {
    display: flex !important;
  }

  .settings-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    gap: 8px;
    transition: background-color 0.2s ease;
  }
  
  .settings-item:hover {
    background: var(--midground-faintest);
  }

  .settings-item svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    pointer-events: none;
  }

  .settings-item span {
    font-size: 0.9rem;
    color: var(--foreground);
    pointer-events: none;
  }

  #settings-search svg .search-path {
    stroke: var(--midground);
    stroke-width: 2px;
    fill: none;
  }

  #settings-darkmode svg {
    fill: var(--midground);
  }

  #settings-darkmode #day-icon {
    display: none;
  }

  #settings-darkmode #night-icon {
    display: block;
  }

  :root[data-theme="light"] #settings-darkmode #day-icon {
    display: block;
  }

  :root[data-theme="light"] #settings-darkmode #night-icon {
    display: none;
  }

  :root[data-theme="dark"] #settings-darkmode #day-icon {
    display: none;
  }

  :root[data-theme="dark"] #settings-darkmode #night-icon {
    display: block;
  }

  /* Ensure dropdown is visible above other elements */
  .settings-dropdown.active {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
`

SettingsMenu.afterDOMLoaded = `
  console.log('Settings menu script loading...');
  
  function setupSettingsMenu() {
    console.log('Setting up settings menu...');
    
    const toggle = document.getElementById('settings-toggle');
    const dropdown = document.getElementById('settings-dropdown');
    const searchItem = document.getElementById('settings-search');
    const darkmodeItem = document.getElementById('settings-darkmode');
    
    console.log('Elements found:', {
      toggle: !!toggle,
      dropdown: !!dropdown,
      searchItem: !!searchItem,
      darkmodeItem: !!darkmodeItem
    });
    
    if (!toggle || !dropdown) {
      console.warn('Required settings menu elements not found');
      return;
    }

    // Remove any existing event listeners first
    const newToggle = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(newToggle, toggle);
    
    // Toggle dropdown with debugging
    newToggle.addEventListener('click', function(e) {
      console.log('Settings toggle clicked');
      e.preventDefault();
      e.stopPropagation();
      
      const isActive = dropdown.classList.contains('active');
      console.log('Dropdown currently active:', isActive);
      
      dropdown.classList.toggle('active');
      
      console.log('Dropdown now active:', dropdown.classList.contains('active'));
      
      // Add visual debugging
      if (dropdown.classList.contains('active')) {
        console.log('Dropdown should be visible now');
        console.log('Dropdown computed style:', window.getComputedStyle(dropdown).display);
        console.log('Dropdown z-index:', window.getComputedStyle(dropdown).zIndex);
        console.log('Dropdown position:', window.getComputedStyle(dropdown).position);
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.settings-menu')) {
        dropdown.classList.remove('active');
      }
    });

    // Handle search click
    if (searchItem) {
      searchItem.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Search clicked');
        
        // Try to find and click the main search icon
        const searchIcon = document.getElementById('search-icon');
        if (searchIcon) {
          console.log('Found search-icon, clicking');
          searchIcon.click();
          dropdown.classList.remove('active');
          return;
        }
        
        // Alternative: try to find the search sidebar
        const searchSidebar = document.getElementById('search-sidebar');
        if (searchSidebar) {
          console.log('Found search-sidebar, clicking');
          searchSidebar.click();
          dropdown.classList.remove('active');
          return;
        }
        
        console.log('No search elements found');
        dropdown.classList.remove('active');
      });
    }

    // Handle dark mode click
    if (darkmodeItem) {
      darkmodeItem.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Dark mode clicked');
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
          console.log('Found theme-toggle, clicking');
          themeToggle.click();
          dropdown.classList.remove('active');
          return;
        }
        
        // Manual theme toggle as fallback
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        console.log('Manually toggling theme from', currentTheme, 'to', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('saved-theme', newTheme);
        dropdown.classList.remove('active');
      });
    }
    
    console.log('Settings menu setup complete');
  }

  // Setup immediately
  setupSettingsMenu();

  // Also setup after SPA navigation
  document.addEventListener('nav', function() {
    console.log('Nav event detected, re-setting up settings menu');
    setTimeout(setupSettingsMenu, 100);
  });
`

export default (() => SettingsMenu) satisfies QuartzComponentConstructor 