// MediaSelectionModule - Handles the media type selection page
const MediaSelectionModule = (function() {
  // Show media selection page
  function showMediaSelectionPage() {
    console.log('Showing media selection page');
    
    // Update app state
    if (window.appState) {
      window.appState.currentPage = 'media-selection';
    }
    
    const pageContainer = document.getElementById('page-container');
    if (!pageContainer) {
      console.error('Page container not found');
      return;
    }
    
    pageContainer.innerHTML = '';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'header';
    
    const headerTitle = document.createElement('h1');
    headerTitle.textContent = 'Select Media Type';
    header.appendChild(headerTitle);
    
    // Add settings icon button
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
    
    // Create main content
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';
    
    // Create media container
    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'media-container';
    
    // Create Live TV card
    const liveCard = document.createElement('div');
    liveCard.className = 'media-card';
    
    const liveImage = document.createElement('img');
    liveImage.src = 'images/live.png';
    liveImage.alt = 'Live TV';
    liveImage.onerror = function() {
      this.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.style.width = '100%';
      placeholder.style.height = '250px';
      placeholder.style.backgroundColor = '#ddd';
      placeholder.style.display = 'flex';
      placeholder.style.alignItems = 'center';
      placeholder.style.justifyContent = 'center';
      placeholder.style.borderRadius = '16px 16px 0 0';
      placeholder.innerHTML = '&#127909;';
      this.parentNode.insertBefore(placeholder, this.nextSibling);
    };
    liveCard.appendChild(liveImage);
    
    const liveLabel = document.createElement('div');
    liveLabel.className = 'media-label';
    liveLabel.textContent = 'Live TV';
    liveCard.appendChild(liveLabel);
    
    liveCard.addEventListener('click', () => {
      // Use direct module call instead of App
      if (typeof CategoriesModule !== 'undefined' && typeof CategoriesModule.showCategoriesPage === 'function') {
        CategoriesModule.showCategoriesPage('live');
      } else {
        console.error('CategoriesModule not available');
      }
    });
    
    mediaContainer.appendChild(liveCard);
    
    // Create Movies card
    const moviesCard = document.createElement('div');
    moviesCard.className = 'media-card';
    
    const moviesImage = document.createElement('img');
    moviesImage.src = 'images/movies.png';
    moviesImage.alt = 'Movies';
    moviesImage.onerror = function() {
      this.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.style.width = '100%';
      placeholder.style.height = '250px';
      placeholder.style.backgroundColor = '#ddd';
      placeholder.style.display = 'flex';
      placeholder.style.alignItems = 'center';
      placeholder.style.justifyContent = 'center';
      placeholder.style.borderRadius = '16px 16px 0 0';
      placeholder.innerHTML = '&#127908;';
      this.parentNode.insertBefore(placeholder, this.nextSibling);
    };
    moviesCard.appendChild(moviesImage);
    
    const moviesLabel = document.createElement('div');
    moviesLabel.className = 'media-label';
    moviesLabel.textContent = 'Movies';
    moviesCard.appendChild(moviesLabel);
    
    moviesCard.addEventListener('click', () => {
      // Use direct module call instead of App
      if (typeof CategoriesModule !== 'undefined' && typeof CategoriesModule.showCategoriesPage === 'function') {
        CategoriesModule.showCategoriesPage('vod');
      } else {
        console.error('CategoriesModule not available');
      }
    });
    
    mediaContainer.appendChild(moviesCard);
    
    // Create Series card
    const seriesCard = document.createElement('div');
    seriesCard.className = 'media-card';
    
    const seriesImage = document.createElement('img');
    seriesImage.src = 'images/series.png';
    seriesImage.alt = 'Series';
    seriesImage.onerror = function() {
      this.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.style.width = '100%';
      placeholder.style.height = '250px';
      placeholder.style.backgroundColor = '#ddd';
      placeholder.style.display = 'flex';
      placeholder.style.alignItems = 'center';
      placeholder.style.justifyContent = 'center';
      placeholder.style.borderRadius = '16px 16px 0 0';
      placeholder.innerHTML = '&#127909;';
      this.parentNode.insertBefore(placeholder, this.nextSibling);
    };
    seriesCard.appendChild(seriesImage);
    
    const seriesLabel = document.createElement('div');
    seriesLabel.className = 'media-label';
    seriesLabel.textContent = 'Series';
    seriesCard.appendChild(seriesLabel);
    
    seriesCard.addEventListener('click', () => {
      // Use direct module call instead of App
      if (typeof CategoriesModule !== 'undefined' && typeof CategoriesModule.showCategoriesPage === 'function') {
        CategoriesModule.showCategoriesPage('series');
      } else {
        console.error('CategoriesModule not available');
      }
    });
    
    mediaContainer.appendChild(seriesCard);
    
    mainContent.appendChild(mediaContainer);
    pageContainer.appendChild(mainContent);
  }
  
  // Public API
  return {
    showMediaSelectionPage
  };
})();