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
// ...existing code...
import { subscribe } from "./utils/redisPubSub.js";


// ...existing code...
//import fs from "fs";
//import https from "https";

dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await connectDB();

const app = express();
// const server = http.createServer(app);
// const io = initSeatSocket(server);
// For HTTPS server setup (TLS)
import fs from "fs";
import https from "https";

// const httpsOptions = {
//   key: fs.readFileSync("server.key"),
//   cert: fs.readFileSync("server.cert"),
// };

const httpsOptions = {
  key: fs.readFileSync("localhost-key.pem"),
  cert: fs.readFileSync("localhost.pem"),
};



const server = https.createServer(httpsOptions, app);
const io = initSeatSocket(server);

subscribe("bookingCreated", (message) => {
  const data = JSON.parse(message);
  console.log("Booking created event received:", data);
  // Trigger other actions here
});

subscribe("bookingCancelled", (message) => {
  const data = JSON.parse(message);
  console.log("Booking cancelled event received:", data);
  // You can trigger other actions here
});

// Attach io to req for controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/auth", authRoutes);
app.use("/movies", movieRoutes);
app.use("/bookings", bookingRoutes);      // web routes
app.use("/api/bookings", bookingRoutes);  // API
app.use("/", userRoutes);                 // profile route
app.get("/about", (req, res) => {
    res.render("pages/about", { user: req.user || null });
  });
  
// Root route -> render index page
// app.get("/", (req, res) => {
//     res.render("pages/index", { user: req.user || null });
//   });
app.get("/", async (req, res) => {
  const visitCount = await incrementHomeVisits();
  res.render("pages/index", { user: req.user || null, visitCount });
});

// Error handler
app.use(errorHandler);
/* 
  --- HTTPS Secure Server Setup Example ---
  This shows how you'd start the app with HTTPS (TLS).
  You can generate a self-signed cert using OpenSSL:
    openssl req -nodes -new -x509 -keyout server.key -out server.cert
  Then run:
    const httpsServer = https.createServer(
      { key: fs.readFileSync('server.key'), cert: fs.readFileSync('server.cert') },
      app
    );
  httpsServer.listen(443, () => console.log("HTTPS Server running on port 443"));
*/
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ HTTPS Server running at https://localhost:${PORT}`);
});
