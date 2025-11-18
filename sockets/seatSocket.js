// sockets/seatSocket.js
import { Server } from "socket.io";

/**
 * ==========================================================
 *  Socket.io – Real-time Seat Locking System
 * ==========================================================
 *
 * Client emits:
 *   socket.emit("seat:lock",   { movieId, seats: ['A1'], userId })
 *   socket.emit("seat:unlock", { movieId, seats: ['A1'], userId })
 *   socket.emit("seat:book",   { movieId, seats: ['A1'], userId })
 *
 * Server broadcasts updates to Room → `movie:${movieId}`
 *   io.to(`movie:${movieId}`).emit("seat:update", {
 *     type: "lock" | "unlock" | "book",
 *     seats: [...],
 *     by: userId
 *   })
 *
 * Each movie has a separate room for real-time seat status.
 * ==========================================================
 */

export const initSeatSocket = (server) => {
  /**
   * Create a new socket.io server linked to HTTPS/HTTP server.
   */
  const io = new Server(server);

  /**
   * Fired every time a client connects.
   */
  io.on("connection", (socket) => {
    console.log(" User connected:", socket.id);

    /**
     * ======================================
     *  JOIN MOVIE ROOM
     *  - Each movie has a dedicated socket room
     *  - Prevents irrelevant updates being sent to all users
     * ======================================
     */
    socket.on("join:movie", ({ movieId }) => {
      socket.join(`movie:${movieId}`);
      console.log(` User ${socket.id} joined room movie:${movieId}`);
    });

    /**
     * ======================================
     *  SEAT LOCK EVENT
     *  - Triggered when user temporarily selects a seat
     *  - Not a booking, just a soft lock
     * ======================================
     */
    socket.on("seat:lock", ({ movieId, seats, userId }) => {
      io.to(`movie:${movieId}`).emit("seat:update", {
        type: "lock",
        seats,
        by: userId,
      });
      console.log(` Seats locked: ${seats} | Movie: ${movieId}`);
    });

    /**
     * ======================================
     *  SEAT UNLOCK EVENT
     *  - User unselects seat OR timer expires
     * ======================================
     */
    socket.on("seat:unlock", ({ movieId, seats, userId }) => {
      io.to(`movie:${movieId}`).emit("seat:update", {
        type: "unlock",
        seats,
        by: userId,
      });
      console.log(`Seats unlocked: ${seats} | Movie: ${movieId}`);
    });

    /**
     * ======================================
     *  SEAT BOOK EVENT
     *  - Final seat booking confirmed from backend
     *  - Pushes update to all viewers to mark seats as sold
     * ======================================
     */
    socket.on("seat:book", ({ movieId, seats, userId }) => {
      io.to(`movie:${movieId}`).emit("seat:update", {
        type: "book",
        seats,
        by: userId,
      });
      console.log(` Seats booked: ${seats} | Movie: ${movieId}`);
    });

    /**
     * ======================================
     *  USER DISCONNECT EVENT
     *  - Triggered when a user leaves website
     *  - Optional: Auto-unlock seats if needed
     * ======================================
     */
    socket.on("disconnect", () => {
      console.log(" User disconnected:", socket.id);
      // Optionally: auto-unlock user's temporary seats
    });
  });

  return io;
};
