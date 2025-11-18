import mongoose from "mongoose";
import dotenv from "dotenv";
import Movie from "../models/Movie.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const movies = [
  {
    title: "Avengers: Endgame",
    description: "Superheroes save the world",
    duration: "3h 1m",
    genre: "Action",
    releaseDate: new Date("2019-04-26"),
    posterUrl: "/images/avengers.jpg",
    seats: Array(5).fill(null).map((_, r) => Array(8).fill(null).map((_, c) => ({ label: `R${r+1}C${c+1}` })))
  },
  {
    title: "Inception",
    description: "Dreams inside dreams",
    duration: "2h 28m",
    genre: "Sci-Fi",
    releaseDate: new Date("2010-07-16"),
    posterUrl: "/images/inception.jpg",
    seats: Array(5).fill(null).map((_, r) => Array(8).fill(null).map((_, c) => ({ label: `R${r+1}C${c+1}` })))
  }
];

await Movie.insertMany(movies);
console.log("Movies seeded!");
mongoose.disconnect();
