const CategoriesModule = (function() {
  // Show categories page
  async function showCategoriesPage(mediaType) {
    if (!window.appState) {
      console.error('appState not initialized');
      return;
    }
    
    window.appState.currentPage = 'categories';
    window.appState.selectedMediaType = mediaType;
    const pageContainer = document.getElementById('page-container');
    if (!pageContainer) {
      console.error('Page container not found');
      return;
    }
    
    pageContainer.innerHTML = '';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'header';
    
    const backButton = document.createElement('button');
    backButton.innerHTML = '&#8592; Back';
    backButton.className = 'back-button';
    backButton.style.cssText = `
        background-color: transparent;
        color: white;
        border: 2px solid white;
        padding: 12px 25px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 20px;
        transition: background-color 0.3s;
    `;
    backButton.addEventListener('click', () => {
      // Use direct module call instead of App
      if (typeof MediaSelectionModule !== 'undefined' && typeof MediaSelectionModule.showMediaSelectionPage === 'function') {
        MediaSelectionModule.showMediaSelectionPage();
      } else {
        console.error('MediaSelectionModule not available');
      }
    });
    backButton.addEventListener('mouseenter', () => {
      backButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    });
    backButton.addEventListener('mouseleave', () => {
      backButton.style.backgroundColor = 'transparent';
    });
    header.appendChild(backButton);
    
    const headerTitle = document.createElement('h1');
    headerTitle.textContent = `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} Categories`;
    headerTitle.style.cssText = `
        font-size: 40px;
        margin: 0;
    `;
    header.appendChild(headerTitle);
    
    // Add settings icon button with HTML entity
    const settingsButton = document.createElement('button');
    settingsButton.className = 'icon-button';
    settingsButton.title = 'Settings';
    settingsButton.innerHTML = '&#9881;';
    settingsButton.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 50px;
        cursor: pointer;
        padding: 8px;
        margin-left: 15px;
        transition: transform 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 50%;
    `;
    settingsButton.addEventListener('click', () => {
      // Use direct module call instead of App
      if (typeof SettingsModule !== 'undefined' && typeof SettingsModule.showSettingsPage === 'function') {
        SettingsModule.showSettingsPage();
      } else {
        console.error('SettingsModule not available');
      }
    });
    settingsButton.addEventListener('mouseenter', () => {
      settingsButton.style.transform = 'scale(1.2)';
      settingsButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    });
    settingsButton.addEventListener('mouseleave', () => {
      settingsButton.style.transform = 'scale(1)';
      settingsButton.style.backgroundColor = 'transparent';
    });
    header.appendChild(settingsButton);
    
    pageContainer.appendChild(header);
    
    // Create loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner';
    loadingSpinner.innerHTML = '&#8987;';
    loadingDiv.appendChild(loadingSpinner);
    
    const loadingText = document.createElement('div');
    loadingText.className = 'loading-text';
    loadingText.textContent = `Loading ${mediaType} categories...`;
    loadingDiv.appendChild(loadingText);
    
    pageContainer.appendChild(loadingDiv);
    
    // In showCategoriesPage function
try {
  // Fetch categories based on media type
  let response;
  
  if (window.appState.credentials.isDirectM3U) {
    // For direct M3U, we'll create categories based on the playlist
    const playlist = window.appState.m3uPlaylist;
    
    // Create a category for each media type
    response = {
      success: true,
      categories: [
        {
          category_id: 'live',
          category_name: 'Live TV',
          category_type: 'live'
        },
        {
          category_id: 'vod',
          category_name: 'Movies',
          category_type: 'vod'
        },
        {
          category_id: 'series',
          category_name: 'Series',
          category_type: 'series'
        }
      ]
    };
  } else {
    // Xtream Codes API
    if (mediaType === 'live') {
      response = await ProxyService.fetchLiveTVCategories(
        window.appState.serverUrl,
        window.appState.credentials.username,
        window.appState.credentials.password
      );
    } else if (mediaType === 'vod') {
      response = await ProxyService.fetchVODCategories(
        window.appState.serverUrl,
        window.appState.credentials.username,
        window.appState.credentials.password
      );
    } else if (mediaType === 'series') {
      response = await ProxyService.fetchSeriesCategories(
        window.appState.serverUrl,
        window.appState.credentials.username,
        window.appState.credentials.password
      );
    }
  }
  
  // Remove loading indicator
  pageContainer.removeChild(loadingDiv);
  
  if (response && response.success) {
    // Create categories container
    const categoriesContainer = document.createElement('div');
    categoriesContainer.className = 'grid-container';
    
    // Create grid for categories with 7 items per row
    const categoriesGrid = document.createElement('div');
    categoriesGrid.className = 'grid';
    
    response.categories.forEach(category => {
      const categoryCard = document.createElement('div');
      categoryCard.className = 'card';
      
      // Create text label instead of icon
      const categoryLabel = document.createElement('div');
      categoryLabel.textContent = category.category_name;
      categoryLabel.className = 'card-title';
      categoryLabel.style.marginBottom = '20px';
      categoryCard.appendChild(categoryLabel);
      
      // Add click event
      categoryCard.addEventListener('click', () => {
        if (window.appState) {
          window.appState.selectedCategory = category;
        }
        if (mediaType === 'series') {
          // Use direct module call instead of App
          if (typeof SeriesModule !== 'undefined' && typeof SeriesModule.showSeriesPage === 'function') {
            SeriesModule.showSeriesPage(mediaType, category);
          } else {
            console.error('SeriesModule not available');
          }
        } else {
          // Use direct module call instead of App
          if (typeof StreamsModule !== 'undefined' && typeof StreamsModule.showStreamsPage === 'function') {
            StreamsModule.showStreamsPage(mediaType, category);
          } else {
            console.error('StreamsModule not available');
          }
        }
      });
      
      categoriesGrid.appendChild(categoryCard);
    });
    
    categoriesContainer.appendChild(categoriesGrid);
    pageContainer.appendChild(categoriesContainer);
  } else {
    throw new Error('Failed to fetch categories');
  }
} catch (error) {
  console.error('Error fetching categories:', error);
  
  // Remove loading indicator
  if (pageContainer.contains(loadingDiv)) {
    pageContainer.removeChild(loadingDiv);
  }
  
  // Show error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error';
  
  const errorIcon = document.createElement('div');
  errorIcon.className = 'error-icon';
  errorIcon.innerHTML = '&#9888;';
  errorDiv.appendChild(errorIcon);
  
  const errorText = document.createElement('div');
  errorText.className = 'error-text';
  errorText.textContent = `Error loading ${mediaType} categories. Please try again.`;
  errorDiv.appendChild(errorText);
  
  const retryButton = document.createElement('button');
  retryButton.textContent = 'Retry';
  retryButton.className = 'retry-button';
  retryButton.addEventListener('click', () => {
    showCategoriesPage(mediaType);
  });
  errorDiv.appendChild(retryButton);
  
  pageContainer.appendChild(errorDiv);
}
  }
  
  // Public API
  return {
    showCategoriesPage
  };
})();