//movieroutes.js
import express from "express";
import { listMoviesPage, movieSeatsPage } from "../controllers/movieController.js";
import { searchMovies } from "../services/omdbApi.js"; // <-- OMDb service
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Route: GET /movies
 * Description: Shows dynamically fetched movies using OMDb API.
 */
router.get("/", async (req, res) => {
  try {
    const query = req.query.search || "Avengers"; // default search term
    const movies = await searchMovies(query);

    res.render("pages/movies", {
      movies,
      query,
      user: req.user || null
    });
  } catch (err) {
    console.error("Error fetching movies:", err);
    res.status(500).render("pages/error", {
      message: "Failed to load movies",
      status: 500
    });
  }
});

/**
 * Route: GET /movies/:id/seats
 * Description: View seats for a specific movie (requires login)
 */
router.get("/:id/seats", protect, movieSeatsPage);

export default router;
