// series.js - Series Module for handling series and episodes
const SeriesModule = (function() {
  // Show series page
  async function showSeriesPage(mediaType, category) {
    console.log('Showing series page for:', category.category_name);
    
    if (!window.appState) {
      console.error('appState not initialized');
      return;
    }
    
    // Update app state
    window.appState.currentPage = 'series';
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
    
    const headerTitle = document.createElement('h1');
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
    loadingText.textContent = `Loading ${category.category_name} series...`;
    loadingDiv.appendChild(loadingText);
    
    pageContainer.appendChild(loadingDiv);
    
    try {
      // Fetch series based on category
      const response = await ProxyService.fetchSeries(
        window.appState.serverUrl,
        window.appState.credentials.username,
        window.appState.credentials.password,
        category.category_id
      );
      
      // Remove loading indicator
      pageContainer.removeChild(loadingDiv);
      
      if (response && response.success) {
        // Create series container
        const seriesContainer = document.createElement('div');
        seriesContainer.className = 'grid-container';
        
        // Create grid for series with 7 items per row
        const seriesGrid = document.createElement('div');
        seriesGrid.className = 'grid';
        
        const series = response.series;
        console.log('Fetched series:', series);
        
        if (series.length === 0) {
          // Show no series message
          const noSeriesDiv = document.createElement('div');
          noSeriesDiv.className = 'error';
          
          const noSeriesIcon = document.createElement('div');
          noSeriesIcon.className = 'error-icon';
          noSeriesIcon.innerHTML = '&#127909;';
          noSeriesDiv.appendChild(noSeriesIcon);
          
          const noSeriesText = document.createElement('div');
          noSeriesText.className = 'error-text';
          noSeriesText.textContent = `No series found in ${category.category_name}`;
          noSeriesDiv.appendChild(noSeriesText);
          
          seriesContainer.appendChild(noSeriesDiv);
        } else {
          series.forEach((seriesItem, index) => {
            console.log(`Creating series card ${index}:`, seriesItem);
            
            const seriesCard = document.createElement('div');
            seriesCard.className = 'card';
            
            // Create series image if available
            if (seriesItem.cover) {
              const seriesImage = document.createElement('img');
              seriesImage.src = seriesItem.cover;
              seriesImage.alt = seriesItem.name;
              seriesImage.onerror = function() {
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
                placeholder.innerHTML = '&#127909;';
                this.parentNode.insertBefore(placeholder, this.nextSibling);
              };
              seriesCard.appendChild(seriesImage);
            } else {
              // Create text label instead of icon
              const seriesLabel = document.createElement('div');
              seriesLabel.textContent = 'Series';
              seriesLabel.className = 'card-title';
              seriesLabel.style.marginBottom = '20px';
              seriesCard.appendChild(seriesLabel);
            }
            
            // Create series name
            const seriesName = document.createElement('div');
            seriesName.textContent = seriesItem.name;
            seriesName.className = 'card-title';
            seriesCard.appendChild(seriesName);
            
            // Add click event with better error handling
            seriesCard.addEventListener('click', () => {
              console.log('Series clicked:', seriesItem);
              try {
                if (window.appState) {
                  window.appState.selectedSeries = seriesItem;
                }
                
                // Use direct module call instead of App
                if (typeof SeriesModule !== 'undefined' && typeof SeriesModule.showEpisodesPage === 'function') {
                  SeriesModule.showEpisodesPage(mediaType, category, seriesItem);
                } else {
                  console.error('SeriesModule not available');
                }
              } catch (error) {
                console.error('Error opening episodes:', error);
                alert('Error opening episodes. Please try again.');
              }
            });
            
            // Add cursor pointer to indicate clickable
            seriesCard.style.cursor = 'pointer';
            
            seriesGrid.appendChild(seriesCard);
          });
        }
        
        seriesContainer.appendChild(seriesGrid);
        pageContainer.appendChild(seriesContainer);
      } else {
        throw new Error('Failed to fetch series');
      }
    } catch (error) {
      console.error('Error fetching series:', error);
      
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
      errorText.textContent = `Error loading ${category.category_name} series. Please try again.`;
      errorDiv.appendChild(errorText);
      
      const retryButton = document.createElement('button');
      retryButton.textContent = 'Retry';
      retryButton.className = 'retry-button';
      retryButton.addEventListener('click', () => {
        showSeriesPage(mediaType, category);
      });
      errorDiv.appendChild(retryButton);
      
      pageContainer.appendChild(errorDiv);
    }
  }
  
  // Show episodes page - Updated to handle different data structures
  async function showEpisodesPage(mediaType, category, series) {
    console.log('Showing episodes page for series:', series);
    console.log('Series object:', series); // Log the series object to see its structure
    
    if (!window.appState) {
      console.error('appState not initialized');
      return;
    }
    
    // Update app state
    window.appState.currentPage = 'episodes';
    window.appState.selectedMediaType = mediaType;
    window.appState.selectedCategory = category;
    window.appState.selectedSeries = series;
    
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
      if (typeof SeriesModule !== 'undefined' && typeof SeriesModule.showSeriesPage === 'function') {
        SeriesModule.showSeriesPage(mediaType, category);
      } else {
        console.error('SeriesModule not available');
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
    headerTitle.textContent = series.name;
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
    loadingText.textContent = `Loading episodes for ${series.name}...`;
    loadingDiv.appendChild(loadingText);
    
    pageContainer.appendChild(loadingDiv);
    
    try {
      // Fetch series info (episodes)
      const seriesId = series.series_id || series.id || series.num; // Try multiple possible ID fields
      if (!seriesId) {
        throw new Error('Series ID not found in series object');
      }
      
      console.log('Using series ID:', seriesId);
      
      const response = await ProxyService.getSeriesInfo(
        window.appState.serverUrl,
        window.appState.credentials.username,
        window.appState.credentials.password,
        seriesId
      );
      
      // Remove loading indicator
      pageContainer.removeChild(loadingDiv);
      
      if (response && response.success) {
        const seriesInfo = response.streamData;
        console.log('Series info response:', seriesInfo);
        
        // Check if seriesInfo has episodes
        if (!seriesInfo) {
          throw new Error('No series info received');
        }
        
        let episodes = [];
        
        // Handle different possible episode data structures
        if (seriesInfo.episodes) {
          if (Array.isArray(seriesInfo.episodes)) {
            // Episodes are in an array
            episodes = seriesInfo.episodes;
            console.log('Episodes found as array:', episodes.length);
          } else if (typeof seriesInfo.episodes === 'object') {
            // Episodes are grouped by season (object with season keys)
            console.log('Episodes found as season object');
            
            // Flatten the episodes from all seasons
            Object.keys(seriesInfo.episodes).forEach(seasonKey => {
              const seasonEpisodes = seriesInfo.episodes[seasonKey];
              if (Array.isArray(seasonEpisodes)) {
                // Add season number to each episode if not already present
                const seasonNumber = parseInt(seasonKey) || 1;
                seasonEpisodes.forEach(episode => {
                  if (!episode.season) {
                    episode.season = seasonNumber;
                  }
                  episodes.push(episode);
                });
                console.log(`Added ${seasonEpisodes.length} episodes from season ${seasonKey}`);
              }
            });
          }
        }
        
        // If we still don't have episodes, check for other possible fields
        if (episodes.length === 0) {
          if (seriesInfo.seasons && Array.isArray(seriesInfo.seasons)) {
            // Some APIs return seasons array with episodes inside
            console.log('Checking seasons array for episodes');
            seriesInfo.seasons.forEach(season => {
              if (season.episodes && Array.isArray(season.episodes)) {
                const seasonNumber = season.season_num || season.season || 1;
                season.episodes.forEach(episode => {
                  if (!episode.season) {
                    episode.season = seasonNumber;
                  }
                  episodes.push(episode);
                });
              }
            });
          }
        }
        
        console.log('Total episodes found:', episodes.length);
        
        if (episodes.length === 0) {
          throw new Error('No episodes found in series info');
        }
        
        // Create episodes container
        const episodesContainer = document.createElement('div');
        episodesContainer.className = 'episodes-container';
        
        // Create episodes list
        const episodesList = document.createElement('div');
        episodesList.className = 'episodes-list';
        
        // Group episodes by season for display
        const seasons = {};
        
        episodes.forEach(episode => {
          const seasonNum = episode.season || episode.season_num || 1;
          if (!seasons[seasonNum]) {
            seasons[seasonNum] = [];
          }
          seasons[seasonNum].push(episode);
        });
        
        // Create season sections
        Object.keys(seasons).sort((a, b) => a - b).forEach(seasonNum => {
          const season = seasons[seasonNum];
          
          // Create season header
          const seasonHeader = document.createElement('div');
          seasonHeader.className = 'episodes-list-header';
          seasonHeader.textContent = `Season ${seasonNum}`;
          episodesList.appendChild(seasonHeader);
          
          // Create episodes for this season
          season.forEach(episode => {
            const episodeItem = document.createElement('div');
            episodeItem.className = 'episode-item';
            
            // Episode number
            const episodeNumber = document.createElement('div');
            episodeNumber.className = 'episode-number';
            episodeNumber.textContent = episode.episode_num || episode.episode || episode.num || 'E';
            episodeItem.appendChild(episodeNumber);
            
            // Episode info
            const episodeInfo = document.createElement('div');
            episodeInfo.className = 'episode-info';
            
            const episodeTitle = document.createElement('div');
            episodeTitle.className = 'episode-title';
            episodeTitle.textContent = episode.title || episode.name || `Episode ${episode.episode_num || episode.episode || episode.num}`;
            episodeInfo.appendChild(episodeTitle);
            
            if (episode.plot || episode.description) {
              const episodePlot = document.createElement('div');
              episodePlot.className = 'episode-subtitle';
              const plotText = episode.plot || episode.description || '';
              episodePlot.textContent = plotText.substring(0, 100) + (plotText.length > 100 ? '...' : '');
              episodeInfo.appendChild(episodePlot);
            }
            
            episodeItem.appendChild(episodeInfo);
            
            // Play button
            const playButton = document.createElement('div');
            playButton.className = 'play-button';
            playButton.innerHTML = '&#9658;';
            episodeItem.appendChild(playButton);
            
            // Add click event
            episodeItem.addEventListener('click', () => {
              console.log('Episode clicked:', episode);
              try {
                // Use direct module call instead of App
                if (typeof PlayerModule !== 'undefined' && typeof PlayerModule.showPlayerPage === 'function') {
                  PlayerModule.showPlayerPage(episode, mediaType);
                } else {
                  console.error('PlayerModule not available');
                }
              } catch (error) {
                console.error('Error opening player:', error);
                alert('Error opening player. Please try again.');
              }
            });
            
            episodesList.appendChild(episodeItem);
          });
        });
        
        episodesContainer.appendChild(episodesList);
        pageContainer.appendChild(episodesContainer);
      } else {
        throw new Error('Failed to fetch series info');
      }
    } catch (error) {
      console.error('Error fetching series info:', error);
      
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
      errorText.textContent = `Error loading episodes for ${series.name}. Please try again.`;
      errorDiv.appendChild(errorText);
      
      const retryButton = document.createElement('button');
      retryButton.textContent = 'Retry';
      retryButton.className = 'retry-button';
      retryButton.addEventListener('click', () => {
        showEpisodesPage(mediaType, category, series);
      });
      errorDiv.appendChild(retryButton);
      
      pageContainer.appendChild(errorDiv);
    }
  }
  
  // Public API
  return {
    showSeriesPage,
    showEpisodesPage
  };
})();