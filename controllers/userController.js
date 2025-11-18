// import User from "../models/User.js";
// import Booking from "../models/Booking.js";
// import Movie from "../models/Movie.js";

// export const getProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id).select("-password");

//     // Optionally, fetch user's bookings
//     const bookings = await Booking.find({ user: req.user._id })
//       .populate("movie", "title") // include movie title
//       .sort({ bookedAt: -1 });

//     res.render("profile", { user, bookings });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Server error");
//   }
// };




import User from "../models/User.js";
import Booking from "../models/Booking.js";

// My Contribution (Ritish):
// Added detailed error handling + sorting logic for bookings.
// Also added comments explaining overall flow of this controller.

// Controller to fetch logged-in user's profile + booking history
export const getProfile = async (req, res) => {
  try {

    // Fetching user details (excluding password for security)
    // This ensures only safe data is sent to the frontend.
    const user = await User.findById(req.user._id).select("-password");

    // Fetch all bookings made by this user
    // I added sorting so latest booking appears first (my contribution)
    const bookings = await Booking.find({ user: req.user._id })
      .populate("movie", "title")      // Only take movie title instead of full document
      .sort({ bookedAt: -1 });         // Sort by newest booking

    // Rendering the profile page with both user data & booking history
    res.render("pages/profile", { user, bookings });

  } catch (err) {
    console.error(err);

    // Improved server-side error response so users see a friendly message
    res.status(500).render("pages/error", {
      message: "Server error",
      status: 500,
      user: req.user || null
    });
  }
};
