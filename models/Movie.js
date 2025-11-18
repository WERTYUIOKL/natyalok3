// import mongoose from "mongoose";

// const seatSchema = new mongoose.Schema({
//   label: String,
//   status: { type: String, enum: ["available", "locked", "booked"], default: "available" }
// });

// const movieSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   description: String,
//   duration: String,       // e.g., "2h 15m"
//   genre: String,
//   releaseDate: Date,
//   imdbID: { type: String, unique: true, sparse: true }, // For external API movies
//   posterUrl: String,      // Always store poster here

//   seats: [[seatSchema]],  // 2D array for rows
// }, { timestamps: true });

// export default mongoose.model("Movie", movieSchema);



import mongoose from "mongoose";

// 🎫 Each seat within a row
const seatSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["available", "locked", "booked"],
    default: "available",
  },
});

// 🎥 Movie schema
const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    duration: {
      type: String, // Example: "2h 15m"
      default: "",
    },
    genre: {
      type: String,
      default: "",
    },
    releaseDate: {
      type: Date,
    },
    imdbID: {
      type: String,
      unique: true,
      sparse: true, // only applies uniqueness if imdbID exists
      index: true,
    },
    posterUrl: {
      type: String,
      default: "",
    },
    // 2D array of seats for rows
    seats: {
      type: [[seatSchema]],
      default: [], // prevents undefined seats array
    },
    views: {
      type: Number,
      default: 0, // for tracking movie popularity
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// 📈 Auto-increment view count helper (optional utility)
movieSchema.methods.incrementViews = async function () {
  this.views += 1;
  await this.save();
};

export default mongoose.model("Movie", movieSchema);
