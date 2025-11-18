/**
 * ============================================
 *  Movie Booking System - Main Server File
 *  - Loads environment variables
 *  - Connects to MongoDB
 *  - Sets up HTTPS server (TLS)
 *  - Initializes Socket.io for seat updates
 *  - Registers API routes + view engine
 *  - Handles Redis pub/sub events
 * ============================================
 */

import express from "express";
import http from "http";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import movieRoutes from "./routes/movieRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import userRoutes from "./routes/userRoutes.js";

import { initSeatSocket } from "./sockets/seatSocket.js";
import { errorHandler } from "./middleware/errorMiddleware.js";
import { incrementHomeVisits } from "./services/redisClient.js";
import { subscribe } from "./utils/redisPubSub.js";

// HTTPS Dependencies
import fs from "fs";
import https from "https";

dotenv.config();

/** Resolve __dirname in ES modules */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Connect to MongoDB before server starts */
// Added by Ritish: ensuring DB connection is established before app bootstraps
await connectDB();

const app = express();

/**
 * ============================================
 *  HTTPS Server Configuration
 * ============================================
 */
const httpsOptions = {
  key: fs.readFileSync("localhost-key.pem"),
  cert: fs.readFileSync("localhost.pem"),
};

const server = https.createServer(httpsOptions, app);

/** Initialize socket.io for real-time seat updates */
// Added by Ritish: socket instance shared across routes & controllers
const io = initSeatSocket(server);

/**
 * ============================================
 *  Redis Pub/Sub Events
 * ============================================
 */
subscribe("bookingCreated", (message) => {
  const data = JSON.parse(message);
  console.log("📩 Booking created event received:", data);

  // Added by Ritish: placeholder for server-side notifications or logs
});

subscribe("bookingCancelled", (message) => {
  const data = JSON.parse(message);
  console.log("📩 Booking cancelled event received:", data);

  // Added by Ritish: potential hook for freeing seats or admin alerts
});

/**
 * Attach socket instance to every request
 * Allows controllers to emit socket events via req.io
 */
// Added by Ritish: middleware makes socket accessible uniformly
app.use((req, res, next) => {
  req.io = io;
  next();
});

/**
 * ============================================
 *  Template Engine Setup
 * ============================================
 */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/**
 * ============================================
 *  Global Middleware
 * ============================================
 */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

/**
 * ============================================
 *  Application Routes
 * ============================================
 */
app.use("/auth", authRoutes);
app.use("/movies", movieRoutes);
app.use("/bookings", bookingRoutes);     // Web UI routes
app.use("/api/bookings", bookingRoutes); // API routes
app.use("/", userRoutes);

/** About Page */
app.get("/about", (req, res) => {
  res.render("pages/about", { user: req.user || null });
});

/**
 * Home Page + Redis Visit Counter
 * - Tracks number of visits using Redis INCR
 */
// Added by Ritish: tracking visits helps analyze home page traffic
app.get("/", async (req, res) => {
  const visitCount = await incrementHomeVisits();
  res.render("pages/index", { user: req.user || null, visitCount });
});

/** Global error handler middleware */
app.use(errorHandler);

/**
 * ============================================
 *  Start HTTPS Server
 * ============================================
 */
// Added by Ritish: Secure server start log for debugging
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`HTTPS Server running at https://localhost:${PORT}`);
});
