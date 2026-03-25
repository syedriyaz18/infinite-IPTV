// Module Loader - Ensures all modules are loaded before app initialization
const ModuleLoader = (function() {
  const modules = {
    'AuthModule': false,
    'CategoriesModule': false,
    'SeriesModule': false,
    'StreamsModule': false,
    'PlayerModule': false,
    'ProxyService': false,
    'MediaSelectionModule': false,
    'SettingsModule': false,
    'SplashModule': false
  };
  
  function registerModule(name) {
    if (modules.hasOwnProperty(name)) {
      modules[name] = true;
      console.log(`Module ${name} registered`);
      checkAllModulesLoaded();
    } else {
      console.warn(`Unknown module: ${name}`);
    }
  }
  
  function checkAllModulesLoaded() {
    const allLoaded = Object.values(modules).every(loaded => loaded === true);
    if (allLoaded) {
      console.log('All modules loaded, initializing app');
      if (window.initApp) {
        window.initApp();
      }
    }
  }
  
  function isModuleLoaded(name) {
    return modules[name] || false;
  }
  
  return {
    registerModule,
    isModuleLoaded
  };
})();

// Make it globally available
window.ModuleLoader = ModuleLoader;