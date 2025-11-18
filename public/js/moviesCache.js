// public/js/moviesCache.js

async function loadMovies() {
    const container = document.getElementById("moviesContainer");
    if (!container) return; // only run on movies page
  
    // 1️⃣ Check if cached data exists
    const cached = localStorage.getItem("movies");
    if (cached) {
      console.log("Loaded movies from Local Storage");
      renderMovies(JSON.parse(cached));
      return;
    }
  
    // 2️⃣ Fetch from server
    console.log("Fetching movies from server...");
    const res = await fetch("/api/movies");
    const movies = await res.json();
  
    // 3️⃣ Store in Local Storage
    localStorage.setItem("movies", JSON.stringify(movies));
  
    // 4️⃣ Render movies
    renderMovies(movies);
  }
  
  function renderMovies(movies) {
    const container = document.getElementById("moviesContainer");
    container.innerHTML = "";
    movies.forEach(movie => {
      const div = document.createElement("div");
      div.classList.add("movie-item");
      div.textContent = movie.title;
      container.appendChild(div);
    });
  }
  
  // Call it when page loads
  document.addEventListener("DOMContentLoaded", loadMovies);
  