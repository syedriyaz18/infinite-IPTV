const SplashModule = (function() {
  let splashContainer = null;
  
  function showSplash() {
    console.log('SplashModule.showSplash called');
    const pageContainer = document.getElementById('page-container');
    if (!pageContainer) {
      console.error('Page container not found');
      return;
    }
    
    // Clear any existing content
    pageContainer.innerHTML = '';
    
    // Create splash container
    splashContainer = document.createElement('div');
    splashContainer.className = 'splash-container';
    
    // Create logo with "Infinite" text
    const logo = document.createElement('div');
    logo.className = 'splash-logo';
    logo.textContent = 'Infinite';
    
    // Create loading indicator
    const loading = document.createElement('div');
    loading.className = 'splash-loading';
    
    // Create loading dots
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.className = 'splash-dot';
      loading.appendChild(dot);
    }
    
    // Append elements
    splashContainer.appendChild(logo);
    splashContainer.appendChild(loading);
    pageContainer.appendChild(splashContainer);
    
    // Add animation to dots
    const dots = loading.querySelectorAll('.splash-dot');
    dots.forEach((dot, index) => {
      dot.style.animationDelay = `${index * 0.3}s`;
    });
    
    console.log('Splash screen shown successfully');
  }
  
  function hideSplash() {
    console.log('SplashModule.hideSplash called');
    if (splashContainer) {
      splashContainer.style.opacity = '0';
      setTimeout(() => {
        if (splashContainer && splashContainer.parentNode) {
          splashContainer.parentNode.removeChild(splashContainer);
          splashContainer = null;
          console.log('Splash screen hidden successfully');
        }
      }, 500);
    } else {
      console.log('Splash container not found or already hidden');
    }
  }
  
  return {
    showSplash,
    hideSplash
  };
})();