// import { Server } from "socket.io";

// /*
// Simple seat lock broadcast management.
// Clients emit:
//   socket.emit('seat:lock', { movieId, seats: ['A1','A2'], userId })
//   socket.emit('seat:unlock', { movieId, seats: ['A1','A2'], userId })
// Server broadcasts to room `movie:${movieId}`:
//   io.to(`movie:${movieId}`).emit('seat:update', { seatsLocked: [...], by: userId })
// */

// export const initSeatSocket = (server) => {
//   const io = new Server(server);

//   io.on("connection", (socket) => {
//     // join movie room
//     socket.on("join:movie", ({ movieId }) => {
//       socket.join(`movie:${movieId}`);
//     });

//     socket.on("seat:lock", ({ movieId, seats, userId }) => {
//       io.to(`movie:${movieId}`).emit("seat:update", {
//         type: "lock",
//         seats,
//         by: userId
//       });
//     });

//     socket.on("seat:unlock", ({ movieId, seats, userId }) => {
//       io.to(`movie:${movieId}`).emit("seat:update", {
//         type: "unlock",
//         seats,
//         by: userId
//       });
//     });

//     socket.on("disconnect", () => {
//       // optional: emit unlocks if needed
//     });
//   });

//   return io;
// };





















// sockets/seatSocket.js
import { Server } from "socket.io";

/*
Simple seat lock/unlock broadcast management.
Clients emit:
  socket.emit('seat:lock', { movieId, seats: ['A1'], userId })
  socket.emit('seat:unlock', { movieId, seats: ['A1'], userId })
Server broadcasts to room `movie:${movieId}`:
  io.to(`movie:${movieId}`).emit('seat:update', { seats, type, by: userId })
*/

export const initSeatSocket = (server) => {
  const io = new Server(server);

  io.on("connection", (socket) => {
    // Join movie room for this session
    socket.on("join:movie", ({ movieId }) => {
      socket.join(`movie:${movieId}`);
    });

    socket.on("seat:lock", ({ movieId, seats, userId }) => {
      io.to(`movie:${movieId}`).emit("seat:update", {
        type: "lock",
        seats,
        by: userId
      });
    });

    socket.on("seat:unlock", ({ movieId, seats, userId }) => {
      io.to(`movie:${movieId}`).emit("seat:update", {
        type: "unlock",
        seats,
        by: userId
      });
    });
    socket.on("seat:book", ({ movieId, seats, userId }) => {
        io.to(`movie:${movieId}`).emit("seat:update", {
          type: "book",
          seats,
          by: userId
        });
      });
      

    socket.on("disconnect", () => {
      // Optionally handle cleanup
    });
  });

  return io;
};
