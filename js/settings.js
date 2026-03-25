// SettingsModule - Handles the settings page
const SettingsModule = (function() {
  // Show settings page
  function showSettingsPage() {
    console.log('Showing settings page');
    
    const pageContainer = document.getElementById('page-container');
    if (!pageContainer) {
      console.error('Page container not found');
      return;
    }
    
    pageContainer.innerHTML = '';
    
    // Create settings container
    const settingsContainer = document.createElement('div');
    settingsContainer.className = 'settings-container';
    
    // Create settings title
    const settingsTitle = document.createElement('h1');
    settingsTitle.className = 'settings-title';
    settingsTitle.textContent = 'Settings';
    settingsContainer.appendChild(settingsTitle);
    
    // Create settings section for player settings
    const playerSection = document.createElement('div');
    playerSection.className = 'settings-section';
    
    const playerSectionTitle = document.createElement('h2');
    playerSectionTitle.className = 'settings-section-title';
    playerSectionTitle.textContent = 'Player Settings';
    playerSection.appendChild(playerSectionTitle);
    
    // Create setting for default extension
    const extensionLabel = document.createElement('label');
    extensionLabel.textContent = 'Default Live Extension:';
    extensionLabel.style.display = 'block';
    extensionLabel.style.marginBottom = '10px';
    playerSection.appendChild(extensionLabel);
    
    const extensionSelect = document.createElement('select');
    extensionSelect.className = 'settings-input';
    extensionSelect.innerHTML = `
      <option value="ts">.ts</option>
      <option value="m3u8">.m3u8</option>
      <option value="mp4">.mp4</option>
    `;
    
    // Set saved value
    const savedExtension = localStorage.getItem('defaultLiveExtension');
    if (savedExtension) {
      extensionSelect.value = savedExtension;
    }
    
    extensionSelect.addEventListener('change', () => {
      localStorage.setItem('defaultLiveExtension', extensionSelect.value);
    });
    
    playerSection.appendChild(extensionSelect);
    settingsContainer.appendChild(playerSection);
    
    // Create settings section for account
    const accountSection = document.createElement('div');
    accountSection.className = 'settings-section';
    
    const accountSectionTitle = document.createElement('h2');
    accountSectionTitle.className = 'settings-section-title';
    accountSectionTitle.textContent = 'Account';
    accountSection.appendChild(accountSectionTitle);
    
    // Create logout button
    const logoutButton = document.createElement('button');
    logoutButton.className = 'settings-button danger';
    logoutButton.textContent = 'Logout';
    logoutButton.addEventListener('click', () => {
      if (typeof AuthModule !== 'undefined' && typeof AuthModule.logout === 'function') {
        AuthModule.logout();
      }
    });
    
    accountSection.appendChild(logoutButton);
    settingsContainer.appendChild(accountSection);
    
    // Create back button
    const backButton = document.createElement('button');
    backButton.className = 'settings-button';
    backButton.textContent = 'Back';
    backButton.addEventListener('click', () => {
      if (window.appState && window.appState.currentPage === 'player') {
        if (typeof PlayerModule !== 'undefined' && typeof PlayerModule.showPlayerPage === 'function') {
          PlayerModule.showPlayerPage(
            window.appState.selectedStream,
            window.appState.selectedMediaType
          );
        }
      } else if (window.appState && window.appState.currentPage === 'streams') {
        if (typeof StreamsModule !== 'undefined' && typeof StreamsModule.showStreamsPage === 'function') {
          StreamsModule.showStreamsPage(
            window.appState.selectedMediaType,
            window.appState.selectedCategory
          );
        }
      } else if (window.appState && window.appState.currentPage === 'series') {
        if (typeof SeriesModule !== 'undefined' && typeof SeriesModule.showSeriesPage === 'function') {
          SeriesModule.showSeriesPage(
            window.appState.selectedMediaType,
            window.appState.selectedCategory
          );
        }
      } else if (window.appState && window.appState.currentPage === 'episodes') {
        if (typeof SeriesModule !== 'undefined' && typeof SeriesModule.showEpisodesPage === 'function') {
          SeriesModule.showEpisodesPage(
            window.appState.selectedMediaType,
            window.appState.selectedCategory,
            window.appState.selectedSeries
          );
        }
      } else {
        if (typeof MediaSelectionModule !== 'undefined' && typeof MediaSelectionModule.showMediaSelectionPage === 'function') {
          MediaSelectionModule.showMediaSelectionPage();
        }
      }
    });
    
    settingsContainer.appendChild(backButton);
    pageContainer.appendChild(settingsContainer);
  }
  
  // Public API
  return {
    showSettingsPage
  };
})();