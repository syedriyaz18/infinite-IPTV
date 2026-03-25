// proxyService.js

// Create a self-executing function to avoid polluting global scope
(function() {
  // Parse M3U playlist
  function parseM3UPlaylist(m3uContent) {
    const lines = m3uContent.split('\n');
    const playlist = {
      live: [],
      vod: [],
      series: []
    };
    
    let currentStream = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Check for EXTINF tag (stream info)
      if (line.startsWith('#EXTINF:')) {
        // Extract stream info
        const info = line.substring(8);
        const durationMatch = info.match(/duration="([^"]*)"/i);
        const titleMatch = info.match(/,(.*)$/);
        
        currentStream = {
          name: titleMatch ? titleMatch[1] : 'Unknown',
          duration: durationMatch ? parseInt(durationMatch[1]) : 0,
          url: '',
          category: 'Uncategorized'
        };
        
        // Extract group-title (category)
        const groupMatch = info.match(/group-title="([^"]*)"/i);
        if (groupMatch) {
          currentStream.category = groupMatch[1];
        }
        
        // Extract tvg-logo (icon)
        const logoMatch = info.match(/tvg-logo="([^"]*)"/i);
        if (logoMatch) {
          currentStream.stream_icon = logoMatch[1];
        }
      }
      // Check for stream URL
      else if (!line.startsWith('#') && currentStream) {
        currentStream.url = line;
        
        // Determine stream type based on name or category
        if (currentStream.category.toLowerCase().includes('live') || 
            currentStream.name.toLowerCase().includes('live')) {
          playlist.live.push(currentStream);
        } else if (currentStream.category.toLowerCase().includes('series') || 
                  currentStream.name.toLowerCase().includes('series') ||
                  currentStream.name.match(/S\d+E\d+/)) {
          playlist.series.push(currentStream);
        } else {
          playlist.vod.push(currentStream);
        }
        
        currentStream = null;
      }
      // Check for category group
      else if (line.startsWith('#EXTGRP:')) {
        const category = line.substring(8).trim();
        if (currentStream) {
          currentStream.category = category;
        }
      }
    }
    
    return playlist;
  }

  // Enhanced fetch function with CORS handling
  async function fetchWithCORSHandling(url, options = {}) {
    try {
      // First attempt: direct fetch
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/x-mpegURL, application/vnd.apple.mpegurl, application/octet-stream, m3u8, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        mode: 'cors',
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      console.warn('Direct fetch failed, trying with proxy:', error);
      
      // Second attempt: use a CORS proxy
      try {
        const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
        const proxyResponse = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/x-mpegURL, application/vnd.apple.mpegurl, application/octet-stream, m3u8, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          mode: 'cors'
        });
        
        if (!proxyResponse.ok) {
          throw new Error(`Proxy HTTP error! status: ${proxyResponse.status}`);
        }
        
        return await proxyResponse.text();
      } catch (proxyError) {
        console.warn('Proxy fetch failed:', proxyError);
        
        // Third attempt: try with different headers
        try {
          const altResponse = await fetch(url, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            mode: 'no-cors'
          });
          
          return await altResponse.text();
        } catch (altError) {
          console.warn('Alternative fetch failed:', altError);
          throw new Error('Unable to fetch M3U playlist. This might be due to CORS restrictions or the server requiring authentication. Please try a different M3U URL or check if the URL is valid.');
        }
      }
    }
  }

  // Proxy Service for handling XStream connections
  const ProxyService = {
    // Login to XStream server
    loginToXStream: function(url, username, password) {
      return new Promise((resolve, reject) => {
        console.log(`Logging in to XStream server: ${url}`);
        
        // XStream API typically uses username and password in the URL
        const loginUrl = `${url}/player_api.php?username=${username}&password=${password}`;
        
        fetch(loginUrl)
          .then(response => {
            console.log('Login response status:', response.status);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            console.log('Login response:', data);
            
            // Check if login was successful
            if (data && data.user_info && data.user_info.auth === 1) {
              resolve({
                success: true,
                userInfo: data.user_info,
                serverInfo: data.server_info,
                message: "Login successful",
                simulated: false
              });
            } else {
              reject({
                success: false,
                error: "Invalid credentials"
              });
            }
          })
          .catch(error => {
            console.error('Login API call failed:', error);
            reject({
              success: false,
              error: error.message || "Login failed"
            });
          });
      });
    },

    // Fetch Live TV categories from XStream server
    fetchLiveTVCategories: function(url, username, password) {
      return new Promise((resolve, reject) => {
        console.log(`Fetching Live TV categories from: ${url}`);
        
        const categoriesUrl = `${url}/player_api.php?username=${username}&password=${password}&action=get_live_categories`;
        
        fetch(categoriesUrl)
          .then(response => {
            console.log('Categories response status:', response.status);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            console.log('Categories API response:', data);
            
            if (data && Array.isArray(data)) {
              resolve({
                success: true,
                categories: data,
                simulated: false
              });
            } else {
              reject({
                success: false,
                error: "Invalid API response"
              });
            }
          })
          .catch(error => {
            console.error('Categories API call failed:', error);
            reject({
              success: false,
              error: error.message || "Failed to fetch categories"
            });
          });
      });
    },

    // Fetch Live TV streams from XStream server
    fetchLiveStreams: function(url, username, password, categoryId) {
      return new Promise((resolve, reject) => {
        console.log(`Fetching Live TV streams for category ${categoryId} from: ${url}`);
        
        const streamsUrl = `${url}/player_api.php?username=${username}&password=${password}&action=get_live_streams&category_id=${categoryId}`;
        
        fetch(streamsUrl)
          .then(response => {
            console.log('Streams response status:', response.status);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            console.log('Streams API response:', data);
            
            if (data && Array.isArray(data)) {
              resolve({
                success: true,
                streams: data,
                simulated: false
              });
            } else {
              reject({
                success: false,
                error: "Invalid API response"
              });
            }
          })
          .catch(error => {
            console.error('Streams API call failed:', error);
            reject({
              success: false,
              error: error.message || "Failed to fetch streams"
            });
          });
      });
    },

    // Fetch VOD (Movies) categories from XStream server
    fetchVODCategories: function(url, username, password) {
      return new Promise((resolve, reject) => {
        console.log(`Fetching VOD categories from: ${url}`);
        
        const categoriesUrl = `${url}/player_api.php?username=${username}&password=${password}&action=get_vod_categories`;
        
        fetch(categoriesUrl)
          .then(response => {
            console.log('Categories response status:', response.status);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            console.log('Categories API response:', data);
            
            if (data && Array.isArray(data)) {
              resolve({
                success: true,
                categories: data,
                simulated: false
              });
            } else {
              reject({
                success: false,
                error: "Invalid API response"
              });
            }
          })
          .catch(error => {
            console.error('Categories API call failed:', error);
            reject({
              success: false,
              error: error.message || "Failed to fetch categories"
            });
          });
      });
    },

    // Fetch VOD (Movies) streams from XStream server
    fetchVODStreams: function(url, username, password, categoryId) {
      return new Promise((resolve, reject) => {
        console.log(`Fetching VOD streams for category ${categoryId} from: ${url}`);
        
        const streamsUrl = `${url}/player_api.php?username=${username}&password=${password}&action=get_vod_streams&category_id=${categoryId}`;
        
        fetch(streamsUrl)
          .then(response => {
            console.log('Streams response status:', response.status);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            console.log('Streams API response:', data);
            
            if (data && Array.isArray(data)) {
              resolve({
                success: true,
                streams: data,
                simulated: false
              });
            } else {
              reject({
                success: false,
                error: "Invalid API response"
              });
            }
          })
          .catch(error => {
            console.error('Streams API call failed:', error);
            reject({
              success: false,
              error: error.message || "Failed to fetch streams"
            });
          });
      });
    },

    // Fetch Series categories from XStream server
    fetchSeriesCategories: function(url, username, password) {
      return new Promise((resolve, reject) => {
        console.log(`Fetching Series categories from: ${url}`);
        
        const categoriesUrl = `${url}/player_api.php?username=${username}&password=${password}&action=get_series_categories`;
        
        fetch(categoriesUrl)
          .then(response => {
            console.log('Categories response status:', response.status);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            console.log('Categories API response:', data);
            
            if (data && Array.isArray(data)) {
              resolve({
                success: true,
                categories: data,
                simulated: false
              });
            } else {
              reject({
                success: false,
                error: "Invalid API response"
              });
            }
          })
          .catch(error => {
            console.error('Categories API call failed:', error);
            reject({
              success: false,
              error: error.message || "Failed to fetch categories"
            });
          });
      });
    },

    // Fetch Series from XStream server
    fetchSeries: function(url, username, password, categoryId) {
      return new Promise((resolve, reject) => {
        console.log(`Fetching Series for category ${categoryId} from: ${url}`);
        
        const seriesUrl = `${url}/player_api.php?username=${username}&password=${password}&action=get_series&category_id=${categoryId}`;
        
        fetch(seriesUrl)
          .then(response => {
            console.log('Series response status:', response.status);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            console.log('Series API response:', data);
            
            if (data && Array.isArray(data)) {
              resolve({
                success: true,
                series: data,
                simulated: false
              });
            } else {
              reject({
                success: false,
                error: "Invalid API response"
              });
            }
          })
          .catch(error => {
            console.error('Series API call failed:', error);
            reject({
              success: false,
              error: error.message || "Failed to fetch series"
            });
          });
      });
    },

    // Get series info (episodes)
   // Get series info (episodes)
getSeriesInfo: function(url, username, password, seriesId) {
  return new Promise((resolve, reject) => {
    console.log(`Getting series info for series ${seriesId} from: ${url}`);
    
    const seriesUrl = `${url}/player_api.php?username=${username}&password=${password}&action=get_series_info&series_id=${seriesId}`;
    
    fetch(seriesUrl)
      .then(response => {
        console.log('Series info response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Series info API response:', data);
        
        if (data) {
          resolve({
            success: true,
            streamData: data,
            simulated: false
          });
        } else {
          reject({
            success: false,
            error: "Invalid API response"
          });
        }
      })
      .catch(error => {
        console.error('Series info API call failed:', error);
        reject({
          success: false,
          error: error.message || "Failed to get series info"
        });
      });
  });
},

    // Get stream URL for playing
    getStreamUrl: function(url, username, password, streamId, streamType) {
      return new Promise((resolve, reject) => {
        console.log(`Getting stream URL for ${streamType} stream ${streamId} from: ${url}`);
        
        let streamUrl;
        if (streamType === 'live') {
          streamUrl = `${url}/player_api.php?username=${username}&password=${password}&action=get_live_streams&stream_id=${streamId}`;
        } else if (streamType === 'vod') {
          streamUrl = `${url}/player_api.php?username=${username}&password=${password}&action=get_vod_info&vod_id=${streamId}`;
        } else if (streamType === 'series') {
          streamUrl = `${url}/player_api.php?username=${username}&password=${password}&action=get_series_info&series_id=${streamId}`;
        } else {
          reject({
            success: false,
            error: "Invalid stream type"
          });
          return;
        }
        
        fetch(streamUrl)
          .then(response => {
            console.log('Stream URL response status:', response.status);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            console.log('Stream URL API response:', data);
            
            if (data) {
              resolve({
                success: true,
                streamData: data,
                simulated: false
              });
            } else {
              reject({
                success: false,
                error: "Invalid API response"
              });
            }
          })
          .catch(error => {
            console.error('Stream URL API call failed:', error);
            reject({
              success: false,
              error: error.message || "Failed to get stream URL"
            });
          });
      });
    },

    // Fetch and parse M3U playlist with enhanced error handling
    fetchM3UPlaylist: function(m3uUrl) {
      return new Promise((resolve, reject) => {
        console.log(`Fetching M3U playlist from: ${m3uUrl}`);
        
        fetchWithCORSHandling(m3uUrl)
          .then(data => {
            console.log('M3U playlist fetched, parsing...');
            
            // Parse M3U playlist
            const parsedData = parseM3UPlaylist(data);
            
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
            
            // Provide more helpful error messages
            let errorMessage = error.message || "Failed to fetch M3U playlist";
            
            if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
              errorMessage = "Unable to fetch M3U playlist. This could be due to:\n" +
                              "1. CORS restrictions - the server doesn't allow cross-origin requests\n" +
                              "2. The URL requires authentication or a valid token\n" +
                              "3. The URL is invalid or expired\n\n" +
                              "Please try a different M3U URL or check if the URL is accessible in a browser.";
            } else if (error.message.includes('HTTP error! status: 403')) {
              errorMessage = "Access forbidden (403 error). The M3U URL might require authentication or a valid token.";
            } else if (error.message.includes('HTTP error! status: 404')) {
              errorMessage = "M3U playlist not found (404 error). The URL might be invalid or expired.";
            }
            
            reject({
              success: false,
              error: errorMessage
            });
          });
      });
    }
  };

  // Export the service
  window.ProxyService = ProxyService;
})();