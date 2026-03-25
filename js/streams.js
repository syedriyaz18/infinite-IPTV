const StreamsModule = (function() {
  // Show streams page
  async function showStreamsPage(mediaType, category) {
    console.log('Showing streams page for:', category.category_name, 'Type:', mediaType);
    
    if (!window.appState) {
      console.error('appState not initialized');
      return;
    }
    
    // Update app state
    window.appState.currentPage = 'streams';
    window.appState.selectedMediaType = mediaType;
    window.appState.selectedCategory = category;
    
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
      console.log('Back button clicked in streams page');
      // Use direct module call instead of App
      if (typeof CategoriesModule !== 'undefined' && typeof CategoriesModule.showCategoriesPage === 'function') {
        CategoriesModule.showCategoriesPage(mediaType);
      } else {
        console.error('CategoriesModule not available');
      }
    });
    backButton.addEventListener('mouseenter', () => {
      backButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    });
    backButton.addEventListener('mouseleave', () => {
      backButton.style.backgroundColor = 'transparent';
    });
    header.appendChild(backButton);
    
    const headerTitle = document.createElement('h2');
    headerTitle.textContent = category.category_name;
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
        align-items: bottom;
        justify-content: center;
        width: 44px;
        height: 74px;
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
    loadingText.textContent = `Loading ${category.category_name} streams...`;
    loadingDiv.appendChild(loadingText);
    
    pageContainer.appendChild(loadingDiv);
    
    // In showStreamsPage function
try {
  // Fetch streams based on media type
  let response;
  
  if (window.appState.credentials.isDirectM3U) {
    // For direct M3U, get streams from the playlist
    const playlist = window.appState.m3uPlaylist;
    
    if (mediaType === 'live') {
      response = {
        success: true,
        streams: playlist.live
      };
    } else if (mediaType === 'vod') {
      response = {
        success: true,
        streams: playlist.vod
      };
    } else if (mediaType === 'series') {
      response = {
        success: true,
        streams: playlist.series
      };
    }
  } else {
    // Xtream Codes API
    if (mediaType === 'live') {
      response = await ProxyService.fetchLiveStreams(
        window.appState.serverUrl,
        window.appState.credentials.username,
        window.appState.credentials.password,
        category.category_id
      );
    } else if (mediaType === 'vod') {
      response = await ProxyService.fetchVODStreams(
        window.appState.serverUrl,
        window.appState.credentials.username,
        window.appState.credentials.password,
        category.category_id
      );
    }
  }
  
  // Remove loading indicator
  pageContainer.removeChild(loadingDiv);
  
  if (response && response.success) {
    // Create streams container
    const streamsContainer = document.createElement('div');
    streamsContainer.className = 'grid-container';
    
    // Create grid for streams with 7 items per row
    const streamsGrid = document.createElement('div');
    streamsGrid.className = 'grid';
    
    const streams = response.streams;
    console.log('Fetched streams:', streams);
    
    if (streams.length === 0) {
      // Show no streams message
      const noStreamsDiv = document.createElement('div');
      noStreamsDiv.className = 'error';
      
      const noStreamsIcon = document.createElement('div');
      noStreamsIcon.className = 'error-icon';
      noStreamsIcon.innerHTML = '&#127909;';
      noStreamsDiv.appendChild(noStreamsIcon);
      
      const noStreamsText = document.createElement('div');
      noStreamsText.className = 'error-text';
      noStreamsText.textContent = `No streams found in ${category.category_name}`;
      noStreamsDiv.appendChild(noStreamsText);
      
      streamsContainer.appendChild(noStreamsDiv);
    } else {
      streams.forEach((stream, index) => {
        console.log(`Creating stream card ${index}:`, stream);
        
        const streamCard = document.createElement('div');
        streamCard.className = 'card';
        
        // Create stream image if available
        if (stream.stream_icon) {
          const streamImage = document.createElement('img');
          streamImage.src = stream.stream_icon;
          streamImage.alt = stream.name;
          streamImage.onerror = function() {
            // If image fails to load, replace with placeholder
            this.style.display = 'none';
            const placeholder = document.createElement('div');
            placeholder.style.width = '100%';
            placeholder.style.height = '150px';
            placeholder.style.backgroundColor = '#ddd';
            placeholder.style.display = 'flex';
            placeholder.style.alignItems = 'center';
            placeholder.style.justifyContent = 'center';
            placeholder.style.borderRadius = '12px';
            placeholder.style.marginBottom = '20px';
            placeholder.innerHTML = mediaType === 'live' ? '&#127909;' : '&#127908;';
            this.parentNode.insertBefore(placeholder, this.nextSibling);
          };
          streamCard.appendChild(streamImage);
        } else {
          // Create text label instead of icon
          const streamLabel = document.createElement('div');
          streamLabel.textContent = mediaType === 'live' ? 'Live TV' : 'Movie';
          streamLabel.className = 'card-title';
          streamLabel.style.marginBottom = '20px';
          streamCard.appendChild(streamLabel);
        }
        
        // Create stream name
        const streamName = document.createElement('div');
        streamName.textContent = stream.name;
        streamName.className = 'card-title';
        streamCard.appendChild(streamName);
        
        // Add click event with better error handling
        streamCard.addEventListener('click', () => {
          console.log('Stream clicked:', stream);
          try {
            if (window.appState) {
              window.appState.selectedStream = stream;
              window.appState.previousPage = 'streams';
    window.appState.currentPage = 'streams';
    window.appState.selectedMediaType = mediaType;
    window.appState.selectedCategory = category;
            }
            
            // Use direct module call instead of App
            if (typeof PlayerModule !== 'undefined' && typeof PlayerModule.showPlayerPage === 'function') {
              PlayerModule.showPlayerPage(stream, mediaType);
            } else {
              console.error('PlayerModule not available');
            }
          } catch (error) {
            console.error('Error opening player:', error);
            alert('Error opening player. Please try again.');
          }
        });
        
        // Add cursor pointer to indicate clickable
        streamCard.style.cursor = 'pointer';
        
        streamsGrid.appendChild(streamCard);
      });
    }
    
    streamsContainer.appendChild(streamsGrid);
    pageContainer.appendChild(streamsContainer);
  } else {
    throw new Error('Failed to fetch streams');
  }
} catch (error) {
  console.error('Error fetching streams:', error);
  
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
  errorText.textContent = `Error loading ${category.category_name} streams. Please try again.`;
  errorDiv.appendChild(errorText);
  
  const retryButton = document.createElement('button');
  retryButton.textContent = 'Retry';
  retryButton.className = 'retry-button';
  retryButton.addEventListener('click', () => {
    showStreamsPage(mediaType, category);
  });
  errorDiv.appendChild(retryButton);
  
  pageContainer.appendChild(errorDiv);
}
  }
  
  // Public API
  return {
    showStreamsPage
  };
})();