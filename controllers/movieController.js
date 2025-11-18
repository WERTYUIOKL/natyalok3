import Movie from "../models/Movie.js";
import axios from "axios";

/* listMoviesPage: fetches movies from both OMDb API and local DB */
export const listMoviesPage = async (req, res, next) => {
  try {
    // Fetch movies from OMDb API dynamically (external source)
    const response = await axios.get(`http://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&s=Avengers`);
    let apiMovies = [];

    if (response.data && response.data.Search) {
      // Normalize API data for UI compatibility
      apiMovies = response.data.Search.map(movie => ({
        imdbID: movie.imdbID,
        title: movie.Title,
        description: movie.Year,
        poster: movie.Poster
      }));
    }

    // Fetch movies stored locally in MongoDB
    const localMovies = await Movie.find().lean();

    // Merge both lists (local first, API next)
    const movies = [
      ...localMovies.map(m => ({
        _id: m._id.toString(),
        title: m.title,
        description: m.description,
        poster: m.poster || null,
        source: "local"
      })),
      ...apiMovies.map(m => ({
        imdbID: m.imdbID,
        title: m.title,
        description: m.description,
        poster: m.poster,
        source: "api"
      }))
    ];

    res.render("pages/movies", { movies, user: req.user || null });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

/* movieSeatsPage: loads seat layout either from DB or external API */
export const movieSeatsPage = async (req, res, next) => {
  try {
    const id = req.params.id;

    // Check if it's a MongoDB ObjectId → identifies local movies
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);

    let movie;

    if (isMongoId) {
      // Case 1: movie exists locally
      movie = await Movie.findById(id).lean();
      if (!movie) return res.status(404).send("Movie not found");
    } else {
      // Case 2: Fetch from OMDb API when not found in DB
      const response = await axios.get(`http://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&i=${id}`);
      const apiMovie = response.data;

      if (!apiMovie || apiMovie.Response === "False") {
        return res.status(404).send("Movie not found in external API");
      }

      // If not in DB → store API movie with generated seats
      movie = await Movie.findOne({ imdbID: id }).lean();
      if (!movie) {
        movie = await Movie.create({
          title: apiMovie.Title,
          description: apiMovie.Plot || "No description available",
          poster: apiMovie.Poster,
          imdbID: id,
          seats: generateSeats()   // default seat creation for API movies
        });
        movie = movie.toObject();
      }
    }

    res.render("pages/seats", { movie, user: req.user || null });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

/* generateSeats: helper to build the seat grid (5 rows x 10 columns) */
const generateSeats = () => {
  const rows = ["A", "B", "C", "D", "E"];
  return rows.map(row =>
    Array.from({ length: 10 }, (_, i) => ({
      label: `${row}${i + 1}`,
      status: "available"
    }))
  );
};
