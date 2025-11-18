import axios from "axios";

const OMDB_API_KEY = process.env.OMDB_API_KEY;
const OMDB_BASE_URL = "https://www.omdbapi.com/";

// Search movies dynamically
export const searchMovies = async (query = "Avengers") => {
  try {
    const response = await axios.get(OMDB_BASE_URL, {
      params: {
        s: query, // search term
        apikey: OMDB_API_KEY
      },
    });

    return response.data.Search || []; // Returns array of movies
  } catch (error) {
    console.error("Error fetching movies:", error.message);
    return [];
  }
};
