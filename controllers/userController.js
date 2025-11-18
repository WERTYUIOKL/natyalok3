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

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    const bookings = await Booking.find({ user: req.user._id })
      .populate("movie", "title")
      .sort({ bookedAt: -1 });

    res.render("pages/profile", { user, bookings });
  } catch (err) {
    console.error(err);
    res.status(500).render("pages/error", {
      message: "Server error",
      status: 500,
      user: req.user || null
    });
  }
};
