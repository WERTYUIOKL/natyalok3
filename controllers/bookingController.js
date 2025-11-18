import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";
import { sendEmail } from "../utils/emailService.js";
import { publish } from "../utils/redisPubSub.js";

// Confirm booking
export const confirmBooking = async (req, res, internalCall = false) => {
  try {
    const movieId = req.body.movieId;
    const seats = req.body.seats;
    const userId = req.user._id;

    if (!movieId || !seats || seats.length === 0) {
      if (internalCall) return { error: "Invalid booking data" };
      return res.status(400).json({ message: "Invalid booking data" });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      if (internalCall) return { error: "Movie not found" };
      return res.status(404).json({ message: "Movie not found" });
    }

    const unavailable = seats.filter(label => {
      const seat = movie.seats.flat().find(s => s.label === label);
      return !seat || seat.status === "booked";
    });

    if (unavailable.length > 0) {
      if (internalCall) return { error: `Seats unavailable: ${unavailable.join(", ")}` };
      return res.status(400).json({ message: `Seats unavailable: ${unavailable.join(", ")}` });
    }

    // Book seats
    movie.seats.forEach(row => {
      row.forEach(seat => {
        if (seats.includes(seat.label)) seat.status = "booked";
      });
    });
    await movie.save();

    // Save booking including movieTitle
    const pricePerSeat = 200;
    const totalPrice = seats.length * pricePerSeat;
    const booking = await Booking.create({
      user: userId,
      movie: movieId,
      movieTitle: movie.title,  // <-- store title directly
      seats,
      totalPrice,
      bookedAt: new Date()
    });

    // Publish booking created event
publish("bookingCreated", JSON.stringify({
  bookingId: booking._id,
  user: booking.user,
  movie: booking.movieTitle,
  seats: booking.seats,
  totalPrice: booking.totalPrice
}));

    // Send confirmation email
    await sendEmail(req.user.email, "Your Natyalok Booking Confirmation",
      `<h1>Booking Confirmed</h1>
       <p>Movie: ${movie.title}</p>
       <p>Seats: ${seats.join(", ")}</p>
       <p>Total: ₹${totalPrice}</p>`
    );

    // Notify via socket
    if (!internalCall && req.io) {
      req.io.to(`movie:${movieId}`).emit("seat:update", {
        type: "book",
        seats,
        by: userId
      });
    }

    if (internalCall) return { booking };
    return res.status(200).json({ message: "Booking confirmed", booking });

  } catch (err) {
    console.error(err);
    if (internalCall) return { error: "Server error" };
    res.status(500).json({ message: "Server error" });
  }
};

// Cancel booking + send cancellation email
export const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }

    // Unlock seats in movie
    const movie = await Movie.findById(booking.movie);
    if (movie) {
      movie.seats.forEach(row => {
        row.forEach(seat => {
          if (booking.seats.includes(seat.label)) seat.status = "available";
        });
      });
      await movie.save();

      // Notify clients via socket
      if (req.io) {
        req.io.to(`movie:${movie._id}`).emit("seat:update", {
          type: "unlock",
          seats: booking.seats,
          by: userId
        });
      }
    }

    // Delete booking
    await booking.deleteOne();

    publish("bookingCancelled", JSON.stringify({
  bookingId: booking._id,
  user: booking.user,
  movie: booking.movieTitle,
  seats: booking.seats
}));

    // Send cancellation email using stored movieTitle
    await sendEmail(req.user.email, "Your Natyalok Booking Cancelled",
      `<h1>Booking Cancelled</h1>
       <p>Movie: ${booking.movieTitle}</p>
       <p>Seats: ${booking.seats.join(", ")}</p>
       <p>We're sorry to see you cancel your booking.</p>`
    );

    res.json({ message: "Booking cancelled successfully. Email sent." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
