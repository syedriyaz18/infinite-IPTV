// player.js - Enhanced with Better Error Handling and Stream URL Construction
const PlayerModule = (function() {
  let playerVideo = null;
  let isVideoLoaded = false;
  let isPlaying = false;
  let hls = null;
  let stallDetectionInterval = null;
  let lastCurrentTime = 0;
  let stallCount = 0;
  let freezeRecoveryAttempts = 0;
  const MAX_FREEZE_RECOVERY = 10;
  let retryCount = 0;
  const MAX_RETRIES = 5;
  let isSlowNetwork = false;
  let nativeListenersAttached = false;
  let loadingIndicator = null;
  let debugPanel = null;
  let currentStreamUrl = '';
  let currentStreamTitle = '';
  let currentMediaType = '';
  let networkUpdateInterval = null;
  let networkStabilityMonitor = null;
  let mediaErrorCount = 0;
  const MAX_MEDIA_ERRORS = 5;
  
  // Check if we're running on webOS
  const isWebOS = typeof window.webOS !== 'undefined';
  
  // Network detection function with percentage calculation
  function getNetworkStatus() {
    if (navigator.connection) {
      const connection = navigator.connection;
      const downlink = connection.downlink || 0;
      const effectiveType = connection.effectiveType || 'unknown';
      
      // Calculate network percentage based on downlink speed
      let percentage = 0;
      if (downlink >= 10) {
        percentage = 80 + Math.min(20, (downlink - 10) * 2);
      } else if (downlink >= 5) {
        percentage = 50 + (downlink - 5) * 6;
      } else if (downlink >= 1) {
        percentage = 20 + (downlink - 1) * 7.5;
      } else {
        percentage = downlink * 20;
      }
      
      // Cap at 100%
      percentage = Math.min(100, Math.max(0, percentage));
      
      // Determine if network is slow
      const isSlow = effectiveType === 'slow-2g' || 
                     effectiveType === '2g' || 
                     effectiveType === '3g' ||
                     downlink < 1.5;
      
      return {
        percentage: Math.round(percentage),
        isSlow: isSlow,
        downlink: downlink,
        effectiveType: effectiveType
      };
    }
    
    // Fallback if connection API is not available
    return {
      percentage: 75,
      isSlow: false,
      downlink: 5,
      effectiveType: 'unknown'
    };
  }
  
  // Update network indicator with percentage and bandwidth
  function updateNetworkIndicator() {
    const networkIndicator = document.querySelector('.network-indicator');
    if (networkIndicator) {
      const networkStatus = getNetworkStatus();
      const percentage = networkStatus.percentage;
      const isSlow = networkStatus.isSlow;
      const downlink = networkStatus.downlink;
      
      // Use brighter colors for better visibility
      const signalColor = isSlow ? '#FFC107' : '#4CAF50';
      const textColor = '#FFFFFF';
      
      networkIndicator.innerHTML = `
        <span style="color: ${signalColor}; margin-right: 8px; font-size: 20px;">
          📶
        </span>
        <span style="color: ${textColor}; font-weight: bold;">
          ${percentage}%
        </span>
        <span style="color: ${signalColor}; margin-left: 8px; font-size: 16px;">
          (${isSlow ? 'Slow' : 'Good'})
        </span>
        <span style="color: ${textColor}; margin-left: 8px; font-size: 14px;">
          ${downlink} Mbps
        </span>
      `;
      
      // Update background color based on network status
      if (isSlow) {
        networkIndicator.style.background = 'rgba(255, 152, 0, 0.9)';
        networkIndicator.style.borderColor = 'rgba(255, 193, 7, 0.9)';
      } else {
        networkIndicator.style.background = 'rgba(76, 175, 80, 0.9)';
        networkIndicator.style.borderColor = 'rgba(76, 175, 80, 0.9)';
      }
      
      // Force visibility
      networkIndicator.style.display = 'flex';
      networkIndicator.style.visibility = 'visible';
      networkIndicator.style.opacity = '1';
      networkIndicator.style.zIndex = '1000001';
    }
  }
  
  // Function to load HLS.js dynamically
  function loadHlsJs() {
    return new Promise((resolve, reject) => {
      if (typeof Hls !== 'undefined') {
        console.log('HLS.js already loaded');
        resolve();
        return;
      }
      
      console.log('Loading HLS.js dynamically...');
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
      script.onload = () => {
        console.log('HLS.js loaded successfully');
        resolve();
      };
      script.onerror = () => {
        console.error('Failed to load HLS.js');
        reject(new Error('Failed to load HLS.js'));
      };
      document.head.appendChild(script);
    });
  }
  
  // Function to update loading text
  function updateLoadingText(text) {
    if (loadingIndicator) {
      loadingIndicator.textContent = text;
    }
    console.log('Loading state:', text);
    updateDebugPanel();
  }
  
  // Function to hide loading indicator
  function hideLoadingIndicator() {
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
  }
  
  // Function to update debug panel
  function updateDebugPanel() {
    if (!debugPanel) return;
    
    const networkStatus = getNetworkStatus();
    
    const debugInfo = {
      URL: currentStreamUrl || 'Not set',
      Title: currentStreamTitle || 'Not set',
      Type: currentMediaType || 'Not set',
      Status: isPlaying ? 'Playing' : (isVideoLoaded ? 'Loaded' : 'Loading'),
      HLS: hls ? 'Active' : 'Not used',
      HLS_Available: typeof Hls !== 'undefined' ? 'Yes' : 'No',
      Controls: playerVideo ? (playerVideo.controls ? 'Enabled' : 'Disabled') : 'N/A',
      CurrentTime: playerVideo ? playerVideo.currentTime.toFixed(2) : 'N/A',
      Duration: playerVideo ? (playerVideo.duration ? playerVideo.duration.toFixed(2) : 'N/A') : 'N/A',
      Network: `${networkStatus.percentage}% (${networkStatus.isSlow ? 'Slow' : 'Good'})`,
      Downlink: `${networkStatus.downlink} Mbps`,
      EffectiveType: networkStatus.effectiveType,
      Retries: retryCount + '/' + MAX_RETRIES,
      RecoveryAttempts: freezeRecoveryAttempts + '/' + MAX_FREEZE_RECOVERY,
      MediaErrors: mediaErrorCount + '/' + MAX_MEDIA_ERRORS,
      VideoSrc: playerVideo ? playerVideo.src : 'N/A'
    };
    
    let debugHTML = '<div style="margin-bottom: 10px; font-weight: bold;">Debug Info:</div>';
    for (const [key, value] of Object.entries(debugInfo)) {
      debugHTML += `<div style="margin: 2px 0;"><strong>${key}:</strong> ${value}</div>`;
    }
    
    debugPanel.innerHTML = debugHTML;
  }
  
  // Function to show error message (only used for critical errors, not for retries)
  function showError(message) {
    updateLoadingText('Error: ' + message);
    console.error('Player error:', message);
    updateDebugPanel();
    
    // Only show error for critical issues, not for retries
    setTimeout(() => {
      hideLoadingIndicator();
      alert('Error: ' + message);
    }, 1000);
  }
  
  // Enhanced function to construct stream URL
  async function constructStreamUrl(stream, mediaType) {
    try {
      // For direct M3U streams, use the URL directly
      if (window.appState.credentials.isDirectM3U && stream.url) {
        return stream.url;
      }
      
      const baseUrl = window.appState.serverUrl.replace(/\/$/, '');
      const username = window.appState.credentials.username;
      const password = window.appState.credentials.password;
      
      // Get stream ID - try multiple possible field names
      const streamId = stream.stream_id || stream.id || stream.episode_id || stream.num || stream.episode_num;
      if (!streamId) {
        console.error('No stream ID found:', stream);
        return null;
      }
      
      console.log('Using stream ID:', streamId);
      
      // Determine path and extension
      let path, extension;
      
      if (mediaType === 'live') {
        path = 'live';
        extension = stream.container_ext || stream.extension || 
                   localStorage.getItem('defaultLiveExtension') || 'ts';
      } else if (mediaType === 'vod') {
        path = 'movie';
        extension = stream.container_ext || stream.extension || 'mp4';
      } else if (mediaType === 'series') {
        path = 'series';
        extension = stream.container_ext || stream.extension || 'mp4';
      } else {
        console.error('Unknown media type:', mediaType);
        return null;
      }
      
      // Clean extension
      extension = extension.split('?')[0];
      
      // For slow networks, try to get a lower quality version
      if (isSlowNetwork) {
        // Try to find a low quality version by adding _low or _mobile
        const lowQualityUrl = `${baseUrl}/${path}/${username}/${password}/${streamId}_low.${extension}`;
        try {
          const testResponse = await fetch(lowQualityUrl, { method: 'HEAD', timeout: 5000 });
          if (testResponse.ok) {
            console.log('Using low quality version for slow network');
            return lowQualityUrl;
          }
        } catch (e) {
          console.log('Low quality version not available, using standard');
        }
      }
      
      // Construct URL in the format: http://ip:port/live/user/pass/streamid.extension
      const url = `${baseUrl}/${path}/${username}/${password}/${streamId}.${extension}`;
      console.log('Constructed stream URL:', url);
      
      // Test URL accessibility
      try {
        updateLoadingText('Checking stream availability...');
        const testResponse = await fetch(url, { method: 'HEAD', timeout: 5000 });
        console.log('URL accessibility test:', testResponse.status);
        
        if (!testResponse.ok) {
          throw new Error(`Server responded with ${testResponse.status}`);
        }
      } catch (e) {
        console.warn('URL accessibility test failed:', e);
        // Continue anyway as some servers might not support HEAD
      }
      
      return url;
    } catch (error) {
      console.error('Error constructing stream URL:', error);
      return null;
    }
  }
  
  // Enhanced function to try different extensions
  async function tryWithDifferentExtensions(originalUrl) {
    console.log('Trying different extensions for:', originalUrl);
    updateLoadingText('Trying different formats...');
    updateDebugPanel();
    
    const urlParts = originalUrl.split('.');
    if (urlParts.length < 2) {
      console.error('Invalid URL format');
      showError('Invalid stream URL format');
      return;
    }
    
    const baseUrl = urlParts.slice(0, -1).join('.');
    
    // Network-aware extension ordering for webOS
    let extensionsToTry = [];
    
    if (originalUrl.includes('/live/')) {
      if (isSlowNetwork) {
        extensionsToTry = ['ts', 'mp4', 'flv', 'm3u8'];
      } else {
        extensionsToTry = ['ts', 'm3u8', 'mp4', 'flv'];
      }
    } else {
      if (isSlowNetwork) {
        extensionsToTry = ['mp4', 'avi', 'mkv', 'm3u8', 'ts'];
      } else {
        extensionsToTry = ['mp4', 'mkv', 'avi', 'm3u8', 'ts'];
      }
    }
    
    let currentIndex = 0;
    
    function tryNextExtension() {
      if (currentIndex >= extensionsToTry.length) {
        console.error('All extensions failed');
        showError('No supported stream format found');
        return;
      }
      
      const extension = extensionsToTry[currentIndex];
      const testUrl = `${baseUrl}.${extension}`;
      console.log(`Trying .${extension}:`, testUrl);
      updateLoadingText(`Trying .${extension} format...`);
      updateDebugPanel();
      
      // Clean up
      if (hls) {
        hls.destroy();
        hls = null;
      }
      
      // Remove existing event listeners before adding new ones
      removeNativeEventListeners();
      
      // Check if it's HLS
      const isHls = extension === 'm3u8';
      
      if (isHls) {
        // Use HLS.js for m3u8
        playStream(testUrl, currentStreamTitle, currentMediaType);
        return;
      }
      
      // Set new source for native playback
      playerVideo.src = testUrl;
      playerVideo.load();
      
      // Add native event listeners
      addNativeEventListeners();
      
      // Set timeout
      const timeout = setTimeout(() => {
        console.log(`Extension .${extension} timed out`);
        currentIndex++;
        tryNextExtension();
      }, 8000);
      
      // Success handler
      const successHandler = () => {
        clearTimeout(timeout);
        playerVideo.removeEventListener('canplay', successHandler);
        playerVideo.removeEventListener('error', errorHandler);
        
        playerVideo.play()
          .then(() => {
            console.log(`Extension .${extension} succeeded`);
            isPlaying = true;
            isVideoLoaded = true;
            startStallDetection();
            
            // Save successful extension
            if (originalUrl.includes('/live/')) {
              localStorage.setItem('defaultLiveExtension', extension);
            }
          })
          .catch(err => {
            console.error(`Extension .${extension} play failed:`, err);
            currentIndex++;
            tryNextExtension();
          });
      };
      
      // Error handler
      const errorHandler = () => {
        clearTimeout(timeout);
        playerVideo.removeEventListener('canplay', successHandler);
        playerVideo.removeEventListener('error', errorHandler);
        
        console.log(`Extension .${extension} failed`);
        currentIndex++;
        tryNextExtension();
      };
      
      playerVideo.addEventListener('canplay', successHandler);
      playerVideo.addEventListener('error', errorHandler);
    }
    
    tryNextExtension();
  }
  
  // Define all event handler functions first
  function onLoadedMetadata() {
    console.log('Video metadata loaded');
    updateLoadingText('Metadata loaded...');
    updateDebugPanel();
  }
  
  function onCanPlay() {
    console.log('Video can play');
    updateLoadingText('Ready to play...');
    updateDebugPanel();
    
    if (!isPlaying) {
      playerVideo.play()
        .then(() => {
          console.log('Playback started');
          isPlaying = true;
          isVideoLoaded = true;
          startStallDetection();
          hideLoadingIndicator();
          updateDebugPanel();
        })
        .catch(err => {
          console.error('Playback failed:', err);
          updateDebugPanel();
          
          if (err.name === 'NotAllowedError') {
            showError('User interaction required to play video');
          } else if (retryCount < MAX_RETRIES) {
            retryCount++;
            updateLoadingText(`Retrying (${retryCount}/${MAX_RETRIES})...`);
            setTimeout(() => {
              console.log(`Retry ${retryCount}/${MAX_RETRIES}`);
              playerVideo.play();
            }, 2000 * retryCount);
          } else {
            showError('Unable to play stream after multiple attempts');
          }
        });
    }
  }
  
  function onCanPlayThrough() {
    console.log('Video can play through');
    updateLoadingText('Buffering complete...');
    updateDebugPanel();
  }
  
  function onTimeUpdate() {
    // Update debug panel periodically
    if (Math.random() < 0.1) { // Update ~10% of the time to avoid spam
      updateDebugPanel();
    }
  }
  
  function onPlay() {
    console.log('Video playing');
    isPlaying = true;
    retryCount = 0;
    mediaErrorCount = 0;
    freezeRecoveryAttempts = 0;
    stallCount = 0;
    hideLoadingIndicator();
    updateDebugPanel();
    
    // Start network stability monitor
    startNetworkStabilityMonitor();
    
    // Start keep-alive
    startKeepAlive();
  }
  
  function onPause() {
    console.log('Video paused');
    isPlaying = false;
    updateDebugPanel();
  }
  
  function onEnded() {
    console.log('Video ended');
    isPlaying = false;
    hideLoadingIndicator();
    updateDebugPanel();
  }
  
  function onWaiting() {
    console.log('Video waiting (buffering)');
    updateLoadingText('Buffering...');
    updateDebugPanel();
  }
  
  function onError(e) {
    console.error('Video error:', e);
    console.log('Error details:', playerVideo.error);
    updateDebugPanel();
    
    let errorMessage = 'Unknown error';
    if (playerVideo.error) {
      switch (playerVideo.error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Playback aborted';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Media decode error';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Format not supported';
          break;
        default:
          errorMessage = playerVideo.error.message || 'Unknown error';
      }
    }
    
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      updateLoadingText(`Error: ${errorMessage}. Retrying (${retryCount}/${MAX_RETRIES})...`);
      setTimeout(() => {
        console.log(`Retry ${retryCount}/${MAX_RETRIES}`);
        playerVideo.currentTime = 0;
        playerVideo.play();
      }, 2000 * retryCount);
    } else {
      // Try different extensions if all retries failed
      tryWithDifferentExtensions(currentStreamUrl);
    }
  }
  
  // Function to safely add native event listeners
  function addNativeEventListeners() {
    if (!playerVideo || nativeListenersAttached) return;
    
    try {
      playerVideo.addEventListener('loadedmetadata', onLoadedMetadata);
      playerVideo.addEventListener('canplay', onCanPlay);
      playerVideo.addEventListener('canplaythrough', onCanPlayThrough);
      playerVideo.addEventListener('timeupdate', onTimeUpdate);
      playerVideo.addEventListener('play', onPlay);
      playerVideo.addEventListener('pause', onPause);
      playerVideo.addEventListener('ended', onEnded);
      playerVideo.addEventListener('waiting', onWaiting);
      playerVideo.addEventListener('error', onError);
      nativeListenersAttached = true;
      console.log('Native event listeners attached');
      updateDebugPanel();
    } catch (error) {
      console.error('Error adding native event listeners:', error);
    }
  }
  
  // Function to safely remove native event listeners
  function removeNativeEventListeners() {
    if (!playerVideo || !nativeListenersAttached) return;
    
    try {
      playerVideo.removeEventListener('loadedmetadata', onLoadedMetadata);
      playerVideo.removeEventListener('canplay', onCanPlay);
      playerVideo.removeEventListener('canplaythrough', onCanPlayThrough);
      playerVideo.removeEventListener('timeupdate', onTimeUpdate);
      playerVideo.removeEventListener('play', onPlay);
      playerVideo.removeEventListener('pause', onPause);
      playerVideo.removeEventListener('ended', onEnded);
      playerVideo.removeEventListener('waiting', onWaiting);
      playerVideo.removeEventListener('error', onError);
      nativeListenersAttached = false;
      console.log('Native event listeners removed');
      updateDebugPanel();
    } catch (error) {
      console.error('Error removing native event listeners:', error);
    }
  }
  
  // Show player page
  async function showPlayerPage(stream, mediaType) {
    try {
      console.log('=== PLAYER DEBUG ===');
      console.log('Stream:', stream);
      console.log('Media type:', mediaType);
      
      // Validate inputs
      if (!stream) throw new Error('No stream data provided');
      if (!mediaType) throw new Error('No media type provided');
      
      // Check required fields
      const id = stream.stream_id || stream.id || stream.episode_id || stream.num;
      if (!id) throw new Error('Stream missing ID');
      if (!stream.name && !stream.title) throw new Error('Stream missing name');
      
      // Detect network speed
      const networkStatus = getNetworkStatus();
      isSlowNetwork = networkStatus.isSlow;
      console.log('Network speed detected:', networkStatus);
      
      // Save state - track navigation history
      if (window.appState) {
        window.appState.previousPage = window.appState.currentPage;
        window.appState.lastMediaType = mediaType;
        window.appState.currentPage = 'player';
      }
      
      // Get container
      const pageContainer = document.getElementById('page-container');
      if (!pageContainer) throw new Error('Page container not found');
      
      // Clear container
      pageContainer.innerHTML = '';
      pageContainer.style.overflow = 'hidden';
      
      // Create player container
      const playerContainer = document.createElement('div');
      playerContainer.className = 'player-container';
      playerContainer.style.cssText = `
        position: relative;
        width: 100%;
        height: 100vh;
        background: #000;
        display: flex;
        flex-direction: column;
      `;
      
      // Create header
      const header = document.createElement('div');
      header.className = 'player-header';
      header.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000000;
        display: flex;
        align-items: center;
        padding: 15px 20px;
        background: rgba(0,0,0,0.8);
        color: white;
        visibility: visible;
      `;
      
      // Back button with HTML entity
      const backButton = document.createElement('button');
      backButton.innerHTML = '&#8592; Back';
      backButton.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 8px 15px;
        border-radius: 6px;
        transition: background-color 0.3s;
        display: flex;
        align-items: center;
      `;
      backButton.addEventListener('click', () => {
        handleBackClick(mediaType);
      });
      backButton.addEventListener('mouseenter', () => {
        backButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      });
      backButton.addEventListener('mouseleave', () => {
        backButton.style.backgroundColor = 'transparent';
      });
      header.appendChild(backButton);
      
      // Title
      const headerTitle = document.createElement('h1');
      headerTitle.textContent = stream.name || stream.title || 'Now Playing';
      headerTitle.style.cssText = `
        margin: 0;
        font-size: 22px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `;
      header.appendChild(headerTitle);
      
      // Network indicator with percentage and bandwidth
      const networkIndicator = document.createElement('div');
      networkIndicator.className = 'network-indicator';
      networkIndicator.style.cssText = `
        margin-left: 15px;
        font-size: 16px;
        font-weight: bold;
        padding: 6px 12px;
        border-radius: 20px;
        background: rgba(0, 0, 0, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.3);
        display: flex;
        align-items: center;
        visibility: visible;
        opacity: 1;
        z-index: 1000001;
      `;
      updateNetworkIndicator();
      header.appendChild(networkIndicator);
      
      // Start updating network indicator periodically
      if (networkUpdateInterval) {
        clearInterval(networkUpdateInterval);
      }
      networkUpdateInterval = setInterval(updateNetworkIndicator, 3000);
      
      playerContainer.appendChild(header);
      
      // Create video element
      playerVideo = document.createElement('video');
      playerVideo.id = 'video-player';
      playerVideo.style.cssText = `
        position: absolute;
        top: 60px;
        left: 0;
        width: 100%;
        height: calc(100% - 60px);
        background: #000;
        object-fit: contain;
      `;
      
      // Set video attributes for webOS
      playerVideo.setAttribute('playsinline', '');
      playerVideo.setAttribute('webkit-playsinline', '');
      playerVideo.setAttribute('crossorigin', 'anonymous');
      playerVideo.setAttribute('preload', 'metadata');
      playerVideo.setAttribute('x-webkit-airplay', 'allow');
      playerVideo.setAttribute('controls', 'false');
      
      // Add debug event listeners
      playerVideo.addEventListener('loadstart', () => {
        console.log('Video load started');
        updateLoadingText('Initializing stream...');
        updateDebugPanel();
      });
      
      playerVideo.addEventListener('loadeddata', () => {
        console.log('Video data loaded');
        updateLoadingText('Loading stream data...');
        updateDebugPanel();
      });
      
      playerVideo.addEventListener('error', (e) => {
        console.error('Video error:', e);
        console.log('Video error details:', playerVideo.error);
        updateDebugPanel();
      });
      
      playerContainer.appendChild(playerVideo);
      pageContainer.appendChild(playerContainer);
      
      // Add loading indicator
      loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'loading-indicator';
      loadingIndicator.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 20px;
        font-weight: bold;
        z-index: 200;
        text-shadow: 0 0 10px rgba(0,0,0,0.8);
        background: rgba(0,0,0,0.6);
        padding: 15px 25px;
        border-radius: 8px;
        text-align: center;
      `;
      loadingIndicator.textContent = 'Loading stream...';
      playerContainer.appendChild(loadingIndicator);
      
      // Add debug panel
      debugPanel = document.createElement('div');
      debugPanel.className = 'debug-panel';
      debugPanel.style.cssText = `
        position: absolute;
        bottom: 10px;
        left: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-size: 12px;
        font-family: monospace;
        max-width: 300px;
        z-index: 200;
        border: 1px solid #4CAF50;
      `;
      playerContainer.appendChild(debugPanel);
      
      // Add webOS back button listeners
      if (isWebOS) {
        document.addEventListener('back', handleWebOSBackButton);
        document.addEventListener('backbutton', handleWebOSBackButton);
        document.addEventListener('keydown', function(event) {
          if (event.key === 'Back' || event.keyCode === 461 || event.keyCode === 8) {
            handleWebOSBackButton(event);
          }
        });
      }
      
      // Construct stream URL for webOS media viewer
      const streamUrl = await constructStreamUrl(stream, mediaType);
      console.log('Final stream URL:', streamUrl);
      
      if (!streamUrl) throw new Error('Failed to construct stream URL');
      
      // Play the stream
      playStream(streamUrl, stream.name || stream.title, mediaType);
      
      // Debugging code
      console.log('Player page setup complete');
      console.log('Network indicator:', document.querySelector('.network-indicator'));
      console.log('Header:', document.querySelector('.player-header'));
      console.log('Video element:', document.getElementById('video-player'));
      
      // Force update after a short delay
      setTimeout(() => {
        updateNetworkIndicator();
        console.log('Network indicator updated after timeout');
      }, 1000);
      
    } catch (error) {
      console.error('Error in showPlayerPage:', error);
      showError(error.message);
      handleBackClick(mediaType);
    }
  }
  
  // Enhanced HLS configuration with better network resilience
  function createHlsInstance(isSlowNetwork) {
    return new Hls({
      debug: true,
      enableWorker: true,
      lowLatencyMode: false,
      backBufferLength: 90,
      maxBufferLength: isSlowNetwork ? 180 : 300, // Increased buffer
      maxMaxBufferLength: isSlowNetwork ? 300 : 600, // Increased max buffer
      liveSyncDuration: isSlowNetwork ? 15 : 30, // Increased sync duration
      liveMaxLatencyDuration: isSlowNetwork ? 30 : 60, // Increased max latency
      liveDurationInfinity: true,
      xhrSetup: function(xhr, url) {
        xhr.setRequestHeader('Cache-Control', 'no-cache');
        xhr.setRequestHeader('Pragma', 'no-cache');
        xhr.timeout = 60000; // 60 seconds timeout
      },
      abrBandwidthFactor: isSlowNetwork ? 0.3 : 0.8,
      abrEwmaFastLive: isSlowNetwork ? 3.0 : 6.0,
      abrEwmaSlowLive: isSlowNetwork ? 9.0 : 18.0,
      abrBandwidthUpFactor: isSlowNetwork ? 1.1 : 1.2,
      maxStarvationDelay: isSlowNetwork ? 15 : 30,
      maxLoadingDelay: isSlowNetwork ? 15 : 30,
      minAutoBitrate: 0,
      startLevel: isSlowNetwork ? 0 : -1,
      fragLoadingTimeOut: 60000, // Increased timeout
      fragLoadingMaxRetry: 15, // Increased retries
      fragLoadingRetryDelay: 5000, // Increased delay
      manifestLoadingTimeOut: 60000, // Increased timeout
      manifestLoadingMaxRetry: 15, // Increased retries
      manifestLoadingRetryDelay: 5000, // Increased delay
      levelLoadingTimeOut: 60000, // Increased timeout
      levelLoadingMaxRetry: 15, // Increased retries
      levelLoadingRetryDelay: 5000, // Increased delay
      autoStartLoad: true,
      capLevelToPlayerSize: false,
      startFragPrefetch: false,
      // Add custom loader with retry logic
      loader: function(config) {
        const loader = new Hls.DefaultConfig.loader(config);
        const originalLoad = loader.load;
        
        loader.load = function(context, config, callbacks) {
          const originalOnSuccess = callbacks.onSuccess;
          const originalOnError = callbacks.onError;
          
          callbacks.onSuccess = function(response, stats, context) {
            // Reset retry count on success
            context.retryCount = 0;
            originalOnSuccess(response, stats, context);
          };
          
          callbacks.onError = function(error, context) {
            context.retryCount = context.retryCount || 0;
            
            if (context.retryCount < 10) { // Allow up to 10 retries
              context.retryCount++;
              console.log(`Retry ${context.retryCount} for ${context.url}`);
              
              // Exponential backoff with jitter
              const delay = Math.min(30000, 2000 * Math.pow(2, context.retryCount - 1) * (0.8 + Math.random() * 0.4));
              
              setTimeout(() => {
                originalLoad.call(loader, context, config, callbacks);
              }, delay);
              
              return; // Don't call original error handler yet
            }
            
            // If all retries failed, call original error handler
            originalOnError(error, context);
          };
          
          originalLoad.call(loader, context, config, callbacks);
        };
        
        return loader;
      }
    });
  }
  
  // Enhanced error recovery for HLS
  function setupHlsErrorHandling(hls, streamUrl) {
    let recoveryAttempts = 0;
    const maxRecoveryAttempts = 5;
    
    hls.on(Hls.Events.ERROR, function(event, data) {
      console.error('HLS error:', data);
      updateDebugPanel();
      
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.log('HLS network error, attempting recovery...');
            updateLoadingText('Network error. Recovering...');
            
            if (recoveryAttempts < maxRecoveryAttempts) {
              recoveryAttempts++;
              
              // Try different recovery strategies based on attempt number
              if (recoveryAttempts === 1) {
                // First attempt: Restart the stream
                console.log('Recovery attempt 1: Restarting stream');
                hls.startLoad(-1);
              } else if (recoveryAttempts === 2) {
                // Second attempt: Switch to lowest quality
                console.log('Recovery attempt 2: Switching to lowest quality');
                hls.currentLevel = 0;
              } else if (recoveryAttempts === 3) {
                // Third attempt: Reinitialize HLS
                console.log('Recovery attempt 3: Reinitializing HLS');
                reinitializeHls(streamUrl);
              } else if (recoveryAttempts === 4) {
                // Fourth attempt: Try with different extensions
                console.log('Recovery attempt 4: Trying different extensions');
                tryWithDifferentExtensions(streamUrl);
              } else {
                // Fifth attempt: Show error
                console.log('Recovery attempt 5: Showing error');
                showError('Unable to recover from network error');
              }
            }
            break;
            
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.log('HLS media error, attempting recovery...');
            updateLoadingText('Media error. Recovering...');
            
            if (recoveryAttempts < maxRecoveryAttempts) {
              recoveryAttempts++;
              
              if (recoveryAttempts === 1) {
                // First attempt: Recover media error
                console.log('Recovery attempt 1: Recovering media error');
                hls.recoverMediaError();
              } else if (recoveryAttempts === 2) {
                // Second attempt: Swap audio codec
                console.log('Recovery attempt 2: Swapping audio codec');
                hls.swapAudioCodec();
              } else if (recoveryAttempts === 3) {
                // Third attempt: Reinitialize HLS
                console.log('Recovery attempt 3: Reinitializing HLS');
                reinitializeHls(streamUrl);
              } else if (recoveryAttempts === 4) {
                // Fourth attempt: Try with different extensions
                console.log('Recovery attempt 4: Trying different extensions');
                tryWithDifferentExtensions(streamUrl);
              } else {
                // Fifth attempt: Show error
                console.log('Recovery attempt 5: Showing error');
                showError('Unable to recover from media error');
              }
            }
            break;
            
          default:
            console.log('HLS fatal error, trying fallback');
            updateLoadingText('Stream error. Trying fallback...');
            tryWithDifferentExtensions(streamUrl);
            break;
        }
      }
    });
    
    // Reset recovery attempts on successful playback
    hls.on(Hls.Events.FRAG_LOADED, function() {
      recoveryAttempts = 0;
    });
  }
  
  // Function to reinitialize HLS
  function reinitializeHls(streamUrl) {
    console.log('Reinitializing HLS');
    const currentTime = playerVideo.currentTime;
    const wasPlaying = !playerVideo.paused;
    
    // Destroy current instance
    if (hls) {
      hls.destroy();
      hls = null;
    }
    
    // Create new instance
    setTimeout(() => {
      playStream(streamUrl, currentStreamTitle, currentMediaType);
      
      // Seek to previous position after a delay
      setTimeout(() => {
        if (playerVideo && wasPlaying) {
          playerVideo.currentTime = currentTime;
          playerVideo.play().catch(e => console.error('Failed to resume after reinit:', e));
        }
      }, 2000);
    }, 1000);
  }
  
  // Play stream - Enhanced with better HLS handling
  async function playStream(streamUrl, title, mediaType) {
    console.log('=== PLAY STREAM DEBUG ===');
    console.log('Stream URL:', streamUrl);
    console.log('Title:', title);
    console.log('Media type:', mediaType);
    console.log('Network speed:', getNetworkStatus());
    
    // Store current stream info
    currentStreamUrl = streamUrl;
    currentStreamTitle = title;
    currentMediaType = mediaType;
    
    // Update debug panel
    updateDebugPanel();
    
    // Clean up existing player
    cleanupPlayer();
    
    // Reset recovery attempts
    freezeRecoveryAttempts = 0;
    stallCount = 0;
    retryCount = 0;
    mediaErrorCount = 0;
    
    // Check if HLS is needed
    const isHls = streamUrl.includes('.m3u8');
    
    if (isHls) {
      console.log('HLS stream detected');
      updateLoadingText('Loading HLS player...');
      updateDebugPanel();
      
      try {
        // Load HLS.js if not available
        if (typeof Hls === 'undefined') {
          console.log('HLS.js not loaded, loading dynamically...');
          await loadHlsJs();
        }
        
        if (typeof Hls === 'undefined') {
          throw new Error('HLS.js could not be loaded');
        }
        
        console.log('Using HLS.js');
        updateLoadingText('Initializing HLS player...');
        updateDebugPanel();
        
        // Create HLS instance with enhanced configuration
        hls = createHlsInstance(isSlowNetwork);
        
        // Setup enhanced error handling
        setupHlsErrorHandling(hls, streamUrl);
        
        hls.loadSource(streamUrl);
        hls.attachMedia(playerVideo);
        
        hls.on(Hls.Events.MEDIA_ATTACHED, function() {
          console.log('HLS media attached');
          updateLoadingText('Loading stream...');
          updateDebugPanel();
        });
        
        hls.on(Hls.Events.MANIFEST_PARSED, function(event, data) {
          console.log('HLS manifest parsed, levels:', data.levels.length);
          updateLoadingText('Starting playback...');
          updateDebugPanel();
          
          playerVideo.play()
            .then(() => {
              console.log('HLS playback started');
              isPlaying = true;
              isVideoLoaded = true;
              startStallDetection();
              updateDebugPanel();
            })
            .catch(err => {
              console.error('HLS playback failed:', err);
              updateDebugPanel();
              
              if (err.name === 'NotAllowedError') {
                showError('User interaction required to play video');
              } else if (retryCount < MAX_RETRIES) {
                retryCount++;
                updateLoadingText(`Retrying (${retryCount}/${MAX_RETRIES})...`);
                setTimeout(() => {
                  console.log(`Retry ${retryCount}/${MAX_RETRIES}`);
                  playerVideo.play();
                }, 2000 * retryCount);
              } else {
                showError('Unable to play stream after multiple attempts');
              }
            });
        });
        
        hls.on(Hls.Events.LEVEL_SWITCHED, function(event, data) {
          console.log(`HLS quality switched to level ${data.level} (${data.height}p)`);
          updateDebugPanel();
        });
        
        hls.on(Hls.Events.FRAG_LOADED, function(event, data) {
          console.log('HLS fragment loaded:', data.frag.url);
        });
        
        return;
      } catch (error) {
        console.error('HLS.js error:', error);
        updateLoadingText('HLS error. Falling back to native player...');
        updateDebugPanel();
        
        // Fall back to native player
        useNativePlayer(streamUrl, title);
        return;
      }
    }
    
    // Use native player for non-HLS streams
    console.log('Using native player');
    useNativePlayer(streamUrl, title);
  }
  
  // Native player function
  function useNativePlayer(streamUrl, title) {
    console.log('Using native player');
    updateLoadingText('Loading stream...');
    updateDebugPanel();
    
    // Add native event listeners
    addNativeEventListeners();
    
    // Set source and load
    console.log('Setting video src to:', streamUrl);
    playerVideo.src = streamUrl;
    playerVideo.load();
    console.log('Video src set to:', playerVideo.src);
    updateDebugPanel();
    
    // Try to play after a short delay
    setTimeout(() => {
      if (!isPlaying) {
        console.log('Attempting to play stream');
        updateLoadingText('Starting playback...');
        updateDebugPanel();
        
        playerVideo.play()
          .then(() => {
            console.log('Native playback started');
            isPlaying = true;
            isVideoLoaded = true;
            startStallDetection();
            updateDebugPanel();
          })
          .catch(err => {
            console.error('Native playback failed:', err);
            updateDebugPanel();
            
            if (err.name === 'NotAllowedError') {
              showError('User interaction required to play video');
            } else if (retryCount < MAX_RETRIES) {
              retryCount++;
              updateLoadingText(`Retrying (${retryCount}/${MAX_RETRIES})...`);
              setTimeout(() => {
                console.log(`Retry ${retryCount}/${MAX_RETRIES}`);
                playerVideo.play();
              }, 2000 * retryCount);
            } else {
              // Try different extensions if all retries failed
              tryWithDifferentExtensions(streamUrl);
            }
          });
      }
    }, 1000);
  }
  
  // Enhanced stall detection function
  function startStallDetection() {
    if (stallDetectionInterval) {
      clearInterval(stallDetectionInterval);
    }
    
    stallDetectionInterval = setInterval(() => {
      if (!playerVideo || !isPlaying) return;
      
      const currentTime = playerVideo.currentTime;
      
      // Check if video is stalled (current time not changing)
      if (Math.abs(currentTime - lastCurrentTime) < 0.1) {
        stallCount++;
        console.log(`Stall detected (${stallCount})`);
        updateDebugPanel();
        
        // If stalled for more than 3 seconds, try to recover
        if (stallCount > 3) {
          console.log('Video stalled, attempting recovery');
          attemptStallRecovery();
        }
      } else {
        stallCount = 0;
        freezeRecoveryAttempts = 0;
      }
      
      lastCurrentTime = currentTime;
    }, 1000);
  }
  
  // Enhanced stall recovery with automatic retry
  function attemptStallRecovery() {
    console.log(`Attempting stall recovery (attempt ${freezeRecoveryAttempts + 1}/${MAX_FREEZE_RECOVERY})`);
    updateLoadingText(`Recovering from stall (${freezeRecoveryAttempts + 1}/${MAX_FREEZE_RECOVERY})...`);
    updateDebugPanel();
    
    freezeRecoveryAttempts++;
    
    // Strategy 1: For HLS streams, try multiple recovery approaches
    if (hls) {
      console.log('Attempting HLS recovery');
      
      // First try: Restart the stream
      if (freezeRecoveryAttempts === 1) {
        console.log('Restarting HLS stream');
        hls.startLoad(-1);
        return;
      }
      
      // Second try: Swap to a lower quality level
      if (freezeRecoveryAttempts === 2) {
        console.log('Switching to lower quality');
        const currentLevel = hls.currentLevel;
        if (currentLevel > 0) {
          hls.currentLevel = currentLevel - 1;
        } else {
          hls.currentLevel = 0; // Lowest quality
        }
        return;
      }
      
      // Third try: Reinitialize HLS
      if (freezeRecoveryAttempts === 3) {
        console.log('Reinitializing HLS');
        const currentTime = playerVideo.currentTime;
        const wasPlaying = !playerVideo.paused;
        
        // Destroy current instance
        hls.destroy();
        hls = null;
        
        // Create new instance
        setTimeout(() => {
          playStream(currentStreamUrl, currentStreamTitle, currentMediaType);
          
          // Seek to previous position after a delay
          setTimeout(() => {
            if (playerVideo && wasPlaying) {
              playerVideo.currentTime = currentTime;
              playerVideo.play().catch(e => console.error('Failed to resume after reinit:', e));
            }
          }, 2000);
        }, 1000);
        return;
      }
      
      // If all else fails, try different extensions
      if (freezeRecoveryAttempts >= MAX_FREEZE_RECOVERY) {
        console.log('Max recovery attempts reached, trying different extensions');
        tryWithDifferentExtensions(currentStreamUrl);
        return;
      }
    }
    
    // Strategy 2: For non-HLS streams, seek slightly ahead
    const seekTime = playerVideo.currentTime + 2;
    console.log(`Seeking to ${seekTime} to overcome stall`);
    playerVideo.currentTime = seekTime;
    updateDebugPanel();
    
    // Strategy 3: If seeking doesn't work, try to pause and resume
    setTimeout(() => {
      if (playerVideo.paused) {
        console.log('Attempting to resume playback');
        playerVideo.play().catch(e => {
          console.error('Resume failed:', e);
          // If resume fails, reload the stream
          reloadCurrentStream();
        });
      }
    }, 1000);
  }
  
  // Reload current stream
  function reloadCurrentStream() {
    console.log('Reloading current stream');
    updateLoadingText('Reloading stream...');
    updateDebugPanel();
    
    const currentTime = playerVideo.currentTime;
    const wasPlaying = !playerVideo.paused;
    const currentSrc = playerVideo.src;
    
    // Pause and reset
    playerVideo.pause();
    playerVideo.src = '';
    playerVideo.load();
    
    // Reload after a short delay
    setTimeout(() => {
      playerVideo.src = currentSrc;
      playerVideo.load();
      
      playerVideo.addEventListener('canplay', function onCanPlayReload() {
        playerVideo.removeEventListener('canplay', onCanPlayReload);
        
        // Seek to previous position
        playerVideo.currentTime = currentTime;
        
        // Resume if was playing
        if (wasPlaying) {
          playerVideo.play().catch(e => {
            console.error('Failed to resume after reload:', e);
          });
        }
      });
    }, 1000);
  }
  
  // Network stability monitor
  function startNetworkStabilityMonitor() {
    if (networkStabilityMonitor) {
      clearInterval(networkStabilityMonitor);
    }
    
    networkStabilityMonitor = setInterval(() => {
      const networkStatus = getNetworkStatus();
      
      // If network becomes slow during playback, adjust HLS settings
      if (networkStatus.isSlow && hls && !isSlowNetwork) {
        console.log('Network degraded, adjusting HLS settings');
        isSlowNetwork = true;
        
        // Adjust buffer settings
        hls.config.maxBufferLength = 180;
        hls.config.maxMaxBufferLength = 300;
        hls.config.liveSyncDuration = 15;
        hls.config.liveMaxLatencyDuration = 30;
        
        // Switch to lower quality if available
        if (hls.currentLevel > 0) {
          hls.currentLevel = 0;
        }
      }
      
      // If network improves, adjust settings back
      if (!networkStatus.isSlow && isSlowNetwork) {
        console.log('Network improved, adjusting HLS settings');
        isSlowNetwork = false;
        
        // Adjust buffer settings
        hls.config.maxBufferLength = 300;
        hls.config.maxMaxBufferLength = 600;
        hls.config.liveSyncDuration = 30;
        hls.config.liveMaxLatencyDuration = 60;
      }
    }, 5000); // Check every 5 seconds
  }
  
  function stopNetworkStabilityMonitor() {
    if (networkStabilityMonitor) {
      clearInterval(networkStabilityMonitor);
      networkStabilityMonitor = null;
    }
  }
  
  // Keep-alive function
  function startKeepAlive() {
    if (window.appState && window.appState.credentials) {
      const { serverUrl, username, password } = window.appState.credentials;
      const keepAliveUrl = `${serverUrl}/player_api.php?username=${username}&password=${password}`;
      
      // Send keep-alive every 60 seconds
      const keepAliveInterval = setInterval(() => {
        if (!isPlaying) {
          clearInterval(keepAliveInterval);
          return;
        }
        
        fetch(keepAliveUrl)
          .then(response => {
            if (!response.ok) {
              console.warn('Keep-alive failed:', response.status);
            }
          })
          .catch(error => {
            console.warn('Keep-alive error:', error);
          });
      }, 60000);
    }
  }
  
  // Clean up player
  function cleanupPlayer() {
    console.log('Cleaning up player');
    
    // Clear stall detection interval
    if (stallDetectionInterval) {
      clearInterval(stallDetectionInterval);
      stallDetectionInterval = null;
    }
    
    // Clear network update interval
    if (networkUpdateInterval) {
      clearInterval(networkUpdateInterval);
      networkUpdateInterval = null;
    }
    
    // Stop network stability monitor
    stopNetworkStabilityMonitor();
    
    // Remove network indicator
    const networkIndicator = document.querySelector('.network-indicator');
    if (networkIndicator) {
      if (networkIndicator.updateInterval) {
        clearInterval(networkIndicator.updateInterval);
      }
      networkIndicator.remove();
    }
    
    // Destroy HLS instance
    if (hls) {
      hls.destroy();
      hls = null;
    }
    
    // Safely remove event listeners
    removeNativeEventListeners();
    
    // Reset video element
    if (playerVideo) {
      playerVideo.pause();
      playerVideo.src = '';
      playerVideo.load();
    }
    
    // Reset all state variables
    isVideoLoaded = false;
    isPlaying = false;
    retryCount = 0;
    stallCount = 0;
    lastCurrentTime = 0;
    freezeRecoveryAttempts = 0;
    mediaErrorCount = 0;
    
    console.log('Player cleanup completed');
    updateDebugPanel();
  }
  
  // Handle back button - Fixed to not reload the stream
  function handleBackClick(mediaType) {
    console.log('Handling back click');
    
    if (isWebOS) {
      document.removeEventListener('back', handleWebOSBackButton);
      document.removeEventListener('backbutton', handleWebOSBackButton);
      document.removeEventListener('keydown', handleKeyDown);
    }
    
    cleanupPlayer();
    
    const pageContainer = document.getElementById('page-container');
    if (pageContainer) {
      pageContainer.style.overflow = '';
    }
    
    // Check if we have a previous page stored
    if (window.appState && window.appState.previousPage) {
      const previousPage = window.appState.previousPage;
      
      // Navigate back to the previous page
      if (previousPage === 'streams') {
        // Go back to streams page
        if (window.appState.selectedMediaType && window.appState.selectedCategory) {
          if (typeof StreamsModule !== 'undefined' && 
              typeof StreamsModule.showStreamsPage === 'function') {
            StreamsModule.showStreamsPage(
              window.appState.selectedMediaType, 
              window.appState.selectedCategory
            );
            return;
          }
        }
      } else if (previousPage === 'episodes') {
        // Go back to episodes page
        if (window.appState.selectedMediaType && 
            window.appState.selectedCategory && 
            window.appState.selectedSeries) {
          if (typeof SeriesModule !== 'undefined' && 
              typeof SeriesModule.showEpisodesPage === 'function') {
            SeriesModule.showEpisodesPage(
              window.appState.selectedMediaType, 
              window.appState.selectedCategory, 
              window.appState.selectedSeries
            );
            return;
          }
        }
      }
    }
    
    // Fallback to media selection page
    if (typeof MediaSelectionModule !== 'undefined' && 
        typeof MediaSelectionModule.showMediaSelectionPage === 'function') {
      MediaSelectionModule.showMediaSelectionPage();
    }
  }
  
  // Handle webOS back button
  function handleWebOSBackButton(event) {
    console.log('WebOS back button pressed');
    
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (window.appState && window.appState.currentPage === 'player') {
      handleBackClick(window.appState.lastMediaType || 'live');
    }
  }
  
  // Handle keydown
  function handleKeyDown(event) {
    if (event.key === 'Back' || event.keyCode === 461 || event.keyCode === 8) {
      handleWebOSBackButton(event);
    }
  }
  
  // Public API
  return {
    showPlayerPage
  };
})();

// Initialize the module when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('PlayerModule initialized');
  
  // Check if HLS.js is loaded
  if (typeof Hls === 'undefined') {
    console.warn('HLS.js not loaded. Will load dynamically when needed.');
  }
});

// Attach to window object
window.PlayerModule = PlayerModule;

// ---- Enhancements Added ----
// Adaptive streaming + error recovery using hls.js
if (typeof Hls !== 'undefined') {
  window.playStream = function(url) {
    const video = document.getElementById("video-player");
    if (Hls.isSupported()) {
      const hls = new Hls({
        autoStartLoad: true,
        startLevel: -1,
        capLevelToPlayerSize: true,
        maxBufferLength: 30,
        liveSyncDuration: 5,
        enableWorker: true
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.warn("HLS.js error", data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              window.playStream(url);
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
    }
  };
}

// Play episode with fallback formats
window.playEpisode = function(episode) {
  const baseUrl = episode.stream_url.replace(/\.(m3u8|mp4|ts)$/i, '');
  const formats = ['.m3u8', '.mp4', '.ts'];
  (async function tryFormat(i) {
    if (i >= formats.length) return;
    const testUrl = baseUrl + formats[i];
    try {
      const res = await fetch(testUrl, { method: "HEAD" });
      if (res.ok) window.playStream(testUrl);
      else tryFormat(i + 1);
    } catch (e) {
      tryFormat(i + 1);
    }
  })(0);
};

// Keep-alive every 60 seconds
setInterval(() => {
  if (window.xtreamCreds) {
    fetch(`${window.xtreamCreds.baseUrl}/player_api.php?username=${window.xtreamCreds.username}&password=${window.xtreamCreds.password}`)
      .catch(() => console.warn("Keep-alive failed"));
  }
}, 60000);