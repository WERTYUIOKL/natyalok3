import Movie from "../models/Movie.js";
import axios from "axios";

/* Render movie list page */
export const listMoviesPage = async (req, res, next) => {
  try {
    // Fetch movies from OMDb API dynamically
    const response = await axios.get(`http://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&s=Avengers`);
    let apiMovies = [];

    if (response.data && response.data.Search) {
      apiMovies = response.data.Search.map(movie => ({
        imdbID: movie.imdbID,
        title: movie.Title,
        description: movie.Year,
        poster: movie.Poster
      }));
    }

    // Also fetch local movies from MongoDB
    const localMovies = await Movie.find().lean();

    // Combine both lists
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

/* Render a single movie seats page */
export const movieSeatsPage = async (req, res, next) => {
  try {
    const id = req.params.id;

    // Check if the ID is a valid Mongo ObjectId (local movie)
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);

    let movie;

    if (isMongoId) {
      // Fetch from MongoDB
      movie = await Movie.findById(id).lean();
      if (!movie) return res.status(404).send("Movie not found");
    } else {
      // Fetch from OMDb API
      const response = await axios.get(`http://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&i=${id}`);
      const apiMovie = response.data;

      if (!apiMovie || apiMovie.Response === "False") {
        return res.status(404).send("Movie not found in external API");
      }

      // Check if this movie already exists in DB
      movie = await Movie.findOne({ imdbID: id }).lean();
      if (!movie) {
        // Create seats layout and save the movie into DB
        movie = await Movie.create({
          title: apiMovie.Title,
          description: apiMovie.Plot || "No description available",
          poster: apiMovie.Poster,
          imdbID: id,
          seats: generateSeats()
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

/* Helper function to generate seat layout */
const generateSeats = () => {
  const rows = ["A", "B", "C", "D", "E"];
  return rows.map(row =>
    Array.from({ length: 10 }, (_, i) => ({
      label: `${row}${i + 1}`,
      status: "available"
    }))
  );
};

