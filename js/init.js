// init.txt - Simplified initialization system
(function() {
  console.log('Initializing app...');
  
  // Check if we're running on webOS
  const isWebOS = typeof window.webOS !== 'undefined';
  console.log('Running on webOS:', isWebOS);
  
  // Create a full-page app container
  const appContainer = document.createElement('div');
  appContainer.id = 'app-container';
  document.body.appendChild(appContainer);
  
  // Create page container
  const pageContainer = document.createElement('div');
  pageContainer.id = 'page-container';
  appContainer.appendChild(pageContainer);
  
  // Global variables to store app state
  window.appState = {
    isLoggedIn: false,
    credentials: null,
    serverUrl: null,
    currentPage: 'login',
    selectedStream: null,
    selectedCategory: null,
    selectedSeries: null,
    selectedEpisode: null,
    selectedMediaType: null,
    isWebOS: isWebOS,
    navigationHistory: [] // Track navigation history
  };
  
  // Define addToHistory function
  function addToHistory(page, data = {}) {
    // Don't add the same page consecutively
    const lastPage = window.appState.navigationHistory[window.appState.navigationHistory.length - 1];
    if (!lastPage || lastPage.page !== page) {
      window.appState.navigationHistory.push({
        page: page,
        ...data
      });
      
      // Limit history size to prevent memory issues
      if (window.appState.navigationHistory.length > 10) {
        window.appState.navigationHistory.shift();
      }
    }
  }
  
  // Define navigateBack function
  function navigateBack() {
    console.log('Navigating back');
    // Get the previous page from navigation history
    if (window.appState.navigationHistory.length > 0) {
      const previousPage = window.appState.navigationHistory.pop();
      
      // Navigate to the previous page
      switch (previousPage.page) {
        case 'login':
          if (typeof AuthModule !== 'undefined' && typeof AuthModule.showLoginPage === 'function') {
            AuthModule.showLoginPage();
          }
          break;
        case 'media-selection':
          if (typeof MediaSelectionModule !== 'undefined' && typeof MediaSelectionModule.showMediaSelectionPage === 'function') {
            MediaSelectionModule.showMediaSelectionPage();
          }
          break;
        case 'categories':
          if (typeof CategoriesModule !== 'undefined' && typeof CategoriesModule.showCategoriesPage === 'function') {
            CategoriesModule.showCategoriesPage(previousPage.mediaType);
          }
          break;
        case 'streams':
          if (typeof StreamsModule !== 'undefined' && typeof StreamsModule.showStreamsPage === 'function') {
            StreamsModule.showStreamsPage(previousPage.mediaType, previousPage.category);
          }
          break;
        case 'series':
          if (typeof SeriesModule !== 'undefined' && typeof SeriesModule.showSeriesPage === 'function') {
            SeriesModule.showSeriesPage(previousPage.mediaType, previousPage.category);
          }
          break;
        case 'episodes':
          if (typeof SeriesModule !== 'undefined' && typeof SeriesModule.showEpisodesPage === 'function') {
            SeriesModule.showEpisodesPage(
              previousPage.mediaType, 
              previousPage.category, 
              previousPage.series
            );
          }
          break;
        case 'player':
          // If going back to player, we need the stream info
          if (previousPage.stream && previousPage.mediaType && 
              typeof PlayerModule !== 'undefined' && typeof PlayerModule.showPlayerPage === 'function') {
            PlayerModule.showPlayerPage(previousPage.stream, previousPage.mediaType);
          } else {
            // Fallback to media selection
            if (typeof MediaSelectionModule !== 'undefined' && typeof MediaSelectionModule.showMediaSelectionPage === 'function') {
              MediaSelectionModule.showMediaSelectionPage();
            }
          }
          break;
        default:
          if (typeof MediaSelectionModule !== 'undefined' && typeof MediaSelectionModule.showMediaSelectionPage === 'function') {
            MediaSelectionModule.showMediaSelectionPage();
          }
      }
    } else {
      // No navigation history, go to media selection
      if (typeof MediaSelectionModule !== 'undefined' && typeof MediaSelectionModule.showMediaSelectionPage === 'function') {
        MediaSelectionModule.showMediaSelectionPage();
      }
    }
  }
  
  // Now properly define the App object with actual functions
  window.App = {
    showLoginPage: () => {
      addToHistory('login');
      if (typeof AuthModule !== 'undefined' && typeof AuthModule.showLoginPage === 'function') {
        AuthModule.showLoginPage();
      } else {
        console.error('AuthModule not available');
        showFallbackLoginPage();
      }
    },
    showMediaSelectionPage: () => {
      addToHistory('media-selection');
      if (typeof MediaSelectionModule !== 'undefined' && typeof MediaSelectionModule.showMediaSelectionPage === 'function') {
        MediaSelectionModule.showMediaSelectionPage();
      } else {
        console.error('MediaSelectionModule not available');
      }
    },
    showCategoriesPage: (mediaType) => {
      addToHistory('categories', { mediaType });
      if (typeof CategoriesModule !== 'undefined' && typeof CategoriesModule.showCategoriesPage === 'function') {
        CategoriesModule.showCategoriesPage(mediaType);
      } else {
        console.error('CategoriesModule not available');
      }
    },
    showStreamsPage: (mediaType, category) => {
      addToHistory('streams', { mediaType, category });
      if (typeof StreamsModule !== 'undefined' && typeof StreamsModule.showStreamsPage === 'function') {
        StreamsModule.showStreamsPage(mediaType, category);
      } else {
        console.error('StreamsModule not available');
      }
    },
    showSeriesPage: (mediaType, category) => {
      addToHistory('series', { mediaType, category });
      if (typeof SeriesModule !== 'undefined' && typeof SeriesModule.showSeriesPage === 'function') {
        SeriesModule.showSeriesPage(mediaType, category);
      } else {
        console.error('SeriesModule not available');
      }
    },
    showEpisodesPage: (mediaType, category, series) => {
      addToHistory('episodes', { mediaType, category, series });
      if (typeof SeriesModule !== 'undefined' && typeof SeriesModule.showEpisodesPage === 'function') {
        SeriesModule.showEpisodesPage(mediaType, category, series);
      } else {
        console.error('SeriesModule not available');
      }
    },
    showPlayerPage: (stream, mediaType) => {
      addToHistory('player', { stream, mediaType });
      if (typeof PlayerModule !== 'undefined' && typeof PlayerModule.showPlayerPage === 'function') {
        PlayerModule.showPlayerPage(stream, mediaType);
      } else {
        console.error('PlayerModule not available');
      }
    },
    showSettingsPage: () => {
      // Don't add settings to navigation history
      if (typeof SettingsModule !== 'undefined' && typeof SettingsModule.showSettingsPage === 'function') {
        SettingsModule.showSettingsPage();
      } else {
        console.error('SettingsModule not available');
      }
    },
    debug: {},
    addToHistory: addToHistory,
    navigateBack: navigateBack
  };
  
  // Handle back button press (Magic Remote)
  function handleBackButton() {
    console.log('Back button pressed');
    
    // If we're on the login page, show exit confirmation
    if (window.appState.currentPage === 'login') {
      showExitConfirmation();
    } else {
      // Otherwise, go back to the previous page
      navigateBack();
    }
  }
  
  // Show exit confirmation dialog
  function showExitConfirmation() {
    console.log('Showing exit confirmation');
    // Create a custom confirmation dialog
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';
    
    const dialog = document.createElement('div');
    dialog.style.backgroundColor = 'white';
    dialog.style.borderRadius = '12px';
    dialog.style.padding = '30px';
    dialog.style.maxWidth = '400px';
    dialog.style.textAlign = 'center';
    dialog.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    
    const title = document.createElement('h2');
    title.textContent = 'Exit App?';
    title.style.marginTop = '0';
    title.style.marginBottom = '20px';
    title.style.color = '#333';
    dialog.appendChild(title);
    
    const message = document.createElement('p');
    message.textContent = 'Are you sure you want to exit the app?';
    message.style.marginBottom = '30px';
    message.style.color = '#666';
    dialog.appendChild(message);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.gap = '15px';
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.padding = '10px 20px';
    cancelButton.style.border = 'none';
    cancelButton.style.borderRadius = '6px';
    cancelButton.style.backgroundColor = '#f0f0f0';
    cancelButton.style.color = '#333';
    cancelButton.style.cursor = 'pointer';
    cancelButton.style.fontSize = '16px';
    cancelButton.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    buttonContainer.appendChild(cancelButton);
    
    const exitButton = document.createElement('button');
    exitButton.textContent = 'Exit';
    exitButton.style.padding = '10px 20px';
    exitButton.style.border = 'none';
    exitButton.style.borderRadius = '6px';
    exitButton.style.backgroundColor = '#f44336';
    exitButton.style.color = 'white';
    exitButton.style.cursor = 'pointer';
    exitButton.style.fontSize = '16px';
    exitButton.addEventListener('click', () => {
      // Exit the app
      if (isWebOS && window.webOS && window.webOS.platformBack) {
        window.webOS.platformBack();
      } else if (isWebOS && window.webOS && window.webOS.application) {
        window.webOS.application.hide();
      } else {
        // For non-webOS or fallback
        window.close();
      }
    });
    buttonContainer.appendChild(exitButton);
    
    dialog.appendChild(buttonContainer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  }
  
  // Fallback login page if AuthModule is not available
  function showFallbackLoginPage() {
    console.log('Showing fallback login page');
    const pageContainer = document.getElementById('page-container');
    if (!pageContainer) {
      console.error('Page container not found');
      return;
    }
    
    pageContainer.innerHTML = '';
    
    // Create login container
    const loginContainer = document.createElement('div');
    loginContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 40px;
    `;
    
    // Create login form
    const loginForm = document.createElement('div');
    loginForm.style.cssText = `
      background-color: white;
      border-radius: 16px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
      padding: 60px;
      width: 100%;
      max-width: 700px;
    `;
    
    // Create title
    const title = document.createElement('h1');
    title.textContent = 'XStream Login';
    title.style.cssText = `
      font-size: 48px;
      margin-bottom: 50px;
      text-align: center;
      color: #333;
    `;
    loginForm.appendChild(title);
    
    // Create error message
    const errorMessage = document.createElement('div');
    errorMessage.textContent = 'App initialization error. Please refresh the page.';
    errorMessage.style.cssText = `
      color: #f44336;
      margin-bottom: 20px;
      text-align: center;
      font-size: 18px;
    `;
    loginForm.appendChild(errorMessage);
    
    // Create refresh button
    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Refresh Page';
    refreshButton.style.cssText = `
      width: 100%;
      padding: 25px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-size: 28px;
      font-weight: 600;
      transition: background-color 0.3s;
      height: 80px;
    `;
    refreshButton.addEventListener('click', () => {
      window.location.reload();
    });
    loginForm.appendChild(refreshButton);
    
    loginContainer.appendChild(loginForm);
    pageContainer.appendChild(loginContainer);
  }
  
  // Initialize the app
  async function initializeApp() {
    try {
      // Set up back button handler for webOS
      if (isWebOS) {
        console.log('Setting up webOS back button handlers');
        // Handle back button press
        document.addEventListener('backbutton', handleBackButton);
        
        // Also handle webOS specific back event
        if (window.webOS && window.webOS.event) {
          window.webOS.event.addListener('back', handleBackButton);
        }
        
        // Handle keydown event for back key
        document.addEventListener('keydown', (e) => {
          // Back key code is 461 for webOS
          if (e.keyCode === 461) {
            e.preventDefault();
            handleBackButton();
          }
        });
      }
      
      // Check if we have saved credentials
      const savedCredentials = localStorage.getItem('xstreamCredentials');
      if (savedCredentials) {
        try {
          window.appState.credentials = JSON.parse(savedCredentials);
          window.appState.serverUrl = window.appState.credentials.url;
          console.log('Found saved credentials, attempting auto-login...');
          
          // Try to auto-login but always show login page first
          if (typeof AuthModule !== 'undefined' && typeof AuthModule.autoLogin === 'function') {
            const loginSuccess = await AuthModule.autoLogin();
            if (loginSuccess) {
              window.appState.isLoggedIn = true;
              console.log('Auto-login successful');
            } else {
              console.log('Auto-login failed');
            }
          } else {
            console.error('AuthModule not available for auto-login');
          }
        } catch (e) {
          console.error('Error loading saved credentials:', e);
        }
      }
      
      // Always show login page first with any saved credentials pre-filled
      console.log('Showing login page...');
      if (typeof AuthModule !== 'undefined' && typeof AuthModule.showLoginPage === 'function') {
        AuthModule.showLoginPage();
      } else {
        console.error('AuthModule not available, showing fallback login page');
        showFallbackLoginPage();
      }
    } catch (error) {
      console.error('Error during app initialization:', error);
      showFallbackLoginPage();
    }
  }
  
  // Start the app
  initializeApp();
})();