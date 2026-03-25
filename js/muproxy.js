// proxyService.js - Using standard fetch for both XStream and M3U

// Create a self-executing function to avoid polluting global scope
(function() {
  // IMPROVED: Use the more robust M3U parser
  function parseM3UPlaylist(m3uContent) {
    const lines = m3uContent.split('\n');
    const playlist = { live: [], vod: [], series: [] };
    let currentStream = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine === '#EXTM3U') continue;
      
      if (trimmedLine.startsWith('#EXTINF:')) {
        const durationMatch = trimmedLine.match(/^#EXTINF:(-?\d+)/);
        const duration = durationMatch ? parseInt(durationMatch[1]) : 0;
        const infoPart = trimmedLine.substring(trimmedLine.indexOf(',') + 1);
        const attributes = {};
        const title = infoPart.match(/,([^,]+)$/);
        const titleText = title ? title[1].trim() : 'Unknown';
        const attributeMatches = infoPart.matchAll(/(\w+(?:-\w+)*)="([^"]*)"/g);
        for (const match of attributeMatches) {
          attributes[match[1]] = match[2];
        }
        currentStream = {
          name: titleText, duration: duration, url: '',
          category: attributes['group-title'] || 'Uncategorized',
          stream_icon: attributes['tvg-logo'] || '',
          tvg_id: attributes['tvg-id'] || ''
        };
      } else if (!trimmedLine.startsWith('#') && currentStream) {
        currentStream.url = trimmedLine;
        const isSeries = currentStream.name.match(/S\d+E\d+/i) || currentStream.category.toLowerCase().includes('series');
        const isLive = currentStream.url.endsWith('.m3u8') || currentStream.category.toLowerCase().includes('live');
        if (isSeries) {
          playlist.series.push(currentStream);
        } else if (isLive) {
          playlist.live.push(currentStream);
        } else {
          playlist.vod.push(currentStream);
        }
        currentStream = null;
      }
    }
    return playlist;
  }

  // REMOVED: The fetchWithCORSHandling function is no longer needed.

  // Proxy Service for handling XStream and M3U connections
  const ProxyService = {
    // --- XSTREAM METHODS (UNCHANGED) ---
    loginToXStream: function(url, username, password) {
      return new Promise((resolve, reject) => {
        console.log(`Logging in to XStream server: ${url}`);
        const loginUrl = `${url}/player_api.php?username=${username}&password=${password}`;
        fetch(loginUrl)
          .then(response => {
            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
            return response.json();
          })
          .then(data => {
            if (data && data.user_info && data.user_info.auth === 1) {
              resolve({ success: true, userInfo: data.user_info, serverInfo: data.server_info });
            } else {
              reject({ success: false, error: "Invalid credentials" });
            }
          })
          .catch(error => {
            reject({ success: false, error: error.message || "Login failed" });
          });
      });
    },

    // ... (Keep all your other XStream methods like fetchLiveTVCategories, fetchLiveStreams, etc., exactly as they were)
    // For brevity, I am not including them all here, but you should copy them from your original file.

    // --- M3U METHOD (UPDATED TO USE STANDARD FETCH) ---
    // Fetch and parse M3U playlist using the standard fetch API
    fetchM3UPlaylist: function(m3uUrl) {
      return new Promise((resolve, reject) => {
        console.log(`Fetching M3U playlist from: ${m3uUrl}`);
        
        // This now uses the same pattern as your XStream functions
        fetch(m3uUrl)
          .then(response => {
            console.log('M3U response status:', response.status);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            // M3U files are plain text, so we use .text() instead of .json()
            return response.text();
          })
          .then(m3uContent => {
            console.log('M3U playlist fetched, parsing...');
            
            // Parse the M3U content using the improved parser
            const parsedData = parseM3UPlaylist(m3uContent);
            
            if (parsedData && (parsedData.live.length > 0 || parsedData.vod.length > 0 || parsedData.series.length > 0)) {
              resolve({
                success: true,
                playlist: parsedData,
                simulated: false
              });
            } else {
              reject({
                success: false,
                error: "M3U playlist is empty or invalid"
              });
            }
          })
          .catch(error => {
            console.error('M3U fetch failed:', error);
            reject({
              success: false,
              error: error.message || "Failed to fetch M3U playlist"
            });
          });
      });
    }
  };

  // Export the service
  window.ProxyService = ProxyService;
})();