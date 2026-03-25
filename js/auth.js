const AuthModule = (function() {
  // Auto-login with saved credentials
  async function autoLogin() {
    try {
      if (!window.appState || !window.appState.credentials || !window.appState.credentials.username || !window.appState.credentials.password) {
        return false;
      }
      
      const loginResponse = await ProxyService.loginToXStream(
        window.appState.serverUrl,
        window.appState.credentials.username,
        window.appState.credentials.password
      );
      
      if (loginResponse.success) {
        window.appState.isLoggedIn = true;
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Auto-login failed:', error);
      return false;
    }
  }
  
  // Show login page with M3U URL option
  function showLoginPage() {
    if (!window.appState) {
      console.error('appState not initialized');
      return;
    }
    
    window.appState.currentPage = 'login';
    const pageContainer = document.getElementById('page-container');
    if (!pageContainer) {
      console.error('Page container not found');
      return;
    }
    
    pageContainer.innerHTML = '';
    
    // Create login container
    const loginContainer = document.createElement('div');
    loginContainer.className = 'login-container';
    
    // Create login form
    const loginForm = document.createElement('div');
    loginForm.className = 'login-form';
    
    // Create title
    const title = document.createElement('h1');
    title.textContent = 'XStream Login';
    loginForm.appendChild(title);
    
    // Add login mode toggle
    const modeToggle = document.createElement('div');
    modeToggle.className = 'mode-toggle';
    modeToggle.style.cssText = 'display: flex; margin-bottom: 20px; border-radius: 8px; overflow: hidden; border: 1px solid #ddd;';
    
    const xstreamMode = document.createElement('div');
    xstreamMode.className = 'mode-option active';
    xstreamMode.textContent = 'XStream Credentials';
    xstreamMode.style.cssText = 'flex: 1; padding: 12px; text-align: center; background-color: #4CAF50; color: white; cursor: pointer;';
    xstreamMode.dataset.mode = 'xstream';
    
    const m3uMode = document.createElement('div');
    m3uMode.className = 'mode-option';
    m3uMode.textContent = 'M3U URL';
    m3uMode.style.cssText = 'flex: 1; padding: 12px; text-align: center; background-color: #f1f1f1; color: #333; cursor: pointer;';
    m3uMode.dataset.mode = 'm3u';
    
    modeToggle.appendChild(xstreamMode);
    modeToggle.appendChild(m3uMode);
    loginForm.appendChild(modeToggle);
    
    // Create XStream credentials container
    const xstreamContainer = document.createElement('div');
    xstreamContainer.id = 'xstream-container';
    
    // Create M3U URL container (hidden by default)
    const m3uContainer = document.createElement('div');
    m3uContainer.id = 'm3u-container';
    m3uContainer.style.display = 'none';
    
    // Create input groups
    const createInputGroup = (placeholder, type = 'text', container) => {
      const group = document.createElement('div');
      group.className = 'input-group';
      
      const input = document.createElement('input');
      input.type = type;
      input.placeholder = placeholder;
      
      group.appendChild(input);
      container.appendChild(group);
      return { group, input };
    };
    
    // XStream inputs
    const urlGroup = createInputGroup('Enter XStream URL', 'text', xstreamContainer);
    const usernameGroup = createInputGroup('Enter username', 'text', xstreamContainer);
    const passwordGroup = createInputGroup('Enter password', 'password', xstreamContainer);
    
    // M3U URL input
    const m3uUrlGroup = createInputGroup('Enter M3U URL', 'text', m3uContainer);
    
    // Set saved values if available
    if (window.appState.credentials) {
      if (window.appState.credentials.m3uUrl) {
        m3uUrlGroup.input.value = window.appState.credentials.m3uUrl || '';
      } else {
        urlGroup.input.value = window.appState.credentials.url || '';
        usernameGroup.input.value = window.appState.credentials.username || '';
        passwordGroup.input.value = window.appState.credentials.password || '';
      }
    }
    
    // Add mode toggle event listeners
    xstreamMode.addEventListener('click', () => {
      xstreamMode.style.backgroundColor = '#4CAF50';
      xstreamMode.style.color = 'white';
      m3uMode.style.backgroundColor = '#f1f1f1';
      m3uMode.style.color = '#333';
      xstreamContainer.style.display = 'block';
      m3uContainer.style.display = 'none';
    });
    
    m3uMode.addEventListener('click', () => {
      m3uMode.style.backgroundColor = '#4CAF50';
      m3uMode.style.color = 'white';
      xstreamMode.style.backgroundColor = '#f1f1f1';
      xstreamMode.style.color = '#333';
      xstreamContainer.style.display = 'none';
      m3uContainer.style.display = 'block';
    });
    
    // Create login button
    const loginButton = document.createElement('button');
    loginButton.textContent = 'Login';
    loginButton.className = 'login-button';
    
    // Add click event
    // Add click event
loginButton.addEventListener('click', async () => {
  const isM3uMode = m3uMode.style.backgroundColor === 'rgb(76, 175, 80)';
  
  if (isM3uMode) {
    // M3U URL mode
    const m3uUrl = m3uUrlGroup.input.value.trim();
    
    if (!m3uUrl) {
      alert('Please enter M3U URL');
      return;
    }
    
    try {
      // Disable button during processing
      loginButton.disabled = true;
      loginButton.textContent = 'Logging in...';
      
      // Parse M3U URL
      const parsedCredentials = parseM3UUrl(m3uUrl);
      
      if (!parsedCredentials) {
        throw new Error('Invalid M3U URL format');
      }
      
      if (parsedCredentials.isXtream) {
        // Save credentials
        window.appState.credentials = { 
          m3uUrl: m3uUrl,
          ...parsedCredentials 
        };
        localStorage.setItem('xstreamCredentials', JSON.stringify(window.appState.credentials));
        window.appState.serverUrl = parsedCredentials.baseUrl;
        
        // Login to XStream
        const loginResponse = await ProxyService.loginToXStream(
          parsedCredentials.baseUrl,
          parsedCredentials.username,
          parsedCredentials.password
        );
        
        if (loginResponse.success) {
          window.appState.isLoggedIn = true;
          if (typeof MediaSelectionModule !== 'undefined' && typeof MediaSelectionModule.showMediaSelectionPage === 'function') {
            MediaSelectionModule.showMediaSelectionPage();
          }
        } else {
          alert(`Login failed: ${loginResponse.error}`);
        }
      } else {
        // Direct M3U playlist
        window.appState.credentials = { 
          m3uUrl: m3uUrl,
          isDirectM3U: true
        };
        localStorage.setItem('xstreamCredentials', JSON.stringify(window.appState.credentials));
        
        // Fetch and parse M3U playlist
        const playlistResponse = await ProxyService.fetchM3UPlaylist(m3uUrl);
        
        if (playlistResponse.success) {
          window.appState.isLoggedIn = true;
          window.appState.m3uPlaylist = playlistResponse.playlist;
          
          // Show media selection page
          if (typeof MediaSelectionModule !== 'undefined' && typeof MediaSelectionModule.showMediaSelectionPage === 'function') {
            MediaSelectionModule.showMediaSelectionPage();
          }
        } else {
          alert(`Failed to load M3U playlist: ${playlistResponse.error}`);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message || 'Unknown error'}`);
    } finally {
      // Re-enable button
      loginButton.disabled = false;
      loginButton.textContent = 'Login';
    }
  } else {
    // XStream credentials mode
    const url = urlGroup.input.value.trim();
    const username = usernameGroup.input.value.trim();
    const password = passwordGroup.input.value.trim();
    
    if (!url || !username || !password) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      // Disable button during processing
      loginButton.disabled = true;
      loginButton.textContent = 'Logging in...';
      
      // Save credentials
      window.appState.credentials = { url, username, password };
      localStorage.setItem('xstreamCredentials', JSON.stringify(window.appState.credentials));
      window.appState.serverUrl = url;
      
      // Login to XStream
      const loginResponse = await ProxyService.loginToXStream(url, username, password);
      
      if (loginResponse.success) {
        window.appState.isLoggedIn = true;
        if (typeof MediaSelectionModule !== 'undefined' && typeof MediaSelectionModule.showMediaSelectionPage === 'function') {
          MediaSelectionModule.showMediaSelectionPage();
        }
      } else {
        alert(`Login failed: ${loginResponse.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message || 'Unknown error'}`);
    } finally {
      // Re-enable button
      loginButton.disabled = false;
      loginButton.textContent = 'Login';
    }
  }
});
    
    loginForm.appendChild(xstreamContainer);
    loginForm.appendChild(m3uContainer);
    loginForm.appendChild(loginButton);
    loginContainer.appendChild(loginForm);
    pageContainer.appendChild(loginContainer);
  }
  
  // Parse M3U URL to extract XStream credentials
// Parse M3U URL to extract XStream credentials or handle as M3U playlist
function parseM3UUrl(m3uUrl) {
  try {
    const url = new URL(m3uUrl);
    
    // Check if it's a typical Xtream Codes M3U URL
    if (url.pathname.includes('get.php') || url.pathname.includes('player_api.php')) {
      const params = url.searchParams;
      const username = params.get('username');
      const password = params.get('password');
      
      if (username && password) {
        // Extract base URL (without the get.php or player_api.php part)
        const baseUrl = `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}`;
        return { baseUrl, username, password, isXtream: true };
      }
    }
    else  if (url.pathname.includes('m3u') || url.pathname.includes('playlist.php')) {
      const params = url.searchParams;
      const username = params.get('user');
      const password = params.get('pass');
      
      if (username && password) {
        // Extract base URL (without the get.php or playlist.php part)
        //const baseUrl = `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}`;
        const baseUrl = 'https://fixflare.site/m3u/';
        return { baseUrl, username, password, isXtream: true };
      }
    }
    
    // If not Xtream Codes, we'll treat it as a direct M3U playlist
    return { m3uUrl, isXtream: false };
  } catch (error) {
    console.error('Error parsing M3U URL:', error);
    return null;
  }
}
  
  // Logout function
  function logout() {
    // Clear saved credentials
    localStorage.removeItem('xstreamCredentials');
    if (window.appState) {
      window.appState.isLoggedIn = false;
      window.appState.credentials = null;
    }
    showLoginPage();
  }
  
  // Public API
  return {
    autoLogin,
    showLoginPage,
    logout
  };
})();