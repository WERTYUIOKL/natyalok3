// Cache selected movies list
function cacheMovies(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }
  
  // Get cached data
  function getCachedMovies(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
  