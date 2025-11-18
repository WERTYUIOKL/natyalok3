// import bcrypt from "bcryptjs";
// import User from "../models/User.js";
// import { generateToken } from "../utils/generateToken.js";
// import dotenv from "dotenv";
// dotenv.config();
//authcontroller
// const COOKIE_NAME = process.env.COOKIE_NAME || "natyalok_token";

// export const register = async (req, res, next) => {
//   try {
//     const { name, email, password } = req.body;
//     if (!email || !password || !name) return res.status(400).json({ message: "Missing fields" });

//     let user = await User.findOne({ email });
//     if (user) return res.status(400).json({ message: "User already exists" });

//     const salt = await bcrypt.genSalt(10);
//     const hashed = await bcrypt.hash(password, salt);

//     user = await User.create({ name, email, password: hashed });
//     const token = generateToken({ id: user._id, role: user.role });

//     res.cookie(COOKIE_NAME, token, {
//       httpOnly: true,
//       maxAge: 1000 * 60 * 60 * 24 * 7 // 7d
//     });

//     res.status(201).redirect("/movies");
//   } catch (err) {
//     next(err);
//   }
// };

// export const login = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).render("pages/login", { error: "Invalid credentials" });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).render("pages/login", { error: "Invalid credentials" });

//     const token = generateToken({ id: user._id, role: user.role });

//     res.cookie(COOKIE_NAME, token, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7 });
//     res.redirect("/movies");
//   } catch (err) {
//     next(err);
//   }
// };

// export const logout = (req, res) => {
//   res.clearCookie(COOKIE_NAME);
//   res.redirect("/auth/login");
// };
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import dotenv from "dotenv";
import redisClient from "../services/redisClient.js";

dotenv.config();

const COOKIE_NAME = process.env.COOKIE_NAME || "natyalok_token";
const MAX_LOGIN_ATTEMPTS = 3;
const LOCK_TIME = 30; // seconds

// REGISTER
// Handles user registration: validates input, hashes password and sets JWT cookie
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password || !name)
      return res.status(400).json({ message: "Missing fields" });

    let user = await User.findOne({ email });
    if (user)
      return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    user = await User.create({ name, email, password: hashed });

    const token = generateToken({ id: user._id, role: user.role });

    // Store JWT in browser cookie (7 days)
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
    });

    res.status(201).redirect("/movies");
  } catch (err) {
    next(err);
  }
};


// LOGIN
// Implements login rate-limiting using Redis + password verification
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const attemptsKey = `login_attempts:${email}`;
    const lockKey = `login_lock:${email}`;

    // 1. Check lock: blocks login if too many failed attempts
    const isLocked = await redisClient.get(lockKey);
    if (isLocked) {
      return res.status(429).render("pages/login", {
        error: `Too many login attempts. Try again in ${LOCK_TIME} seconds.`,
      });
    }

    const user = await User.findOne({ email });

    // If user not found → count as failed attempt
    if (!user) {
      const attempts = await redisClient.incr(attemptsKey);

      if (attempts === 1) {
        await redisClient.expire(attemptsKey, 60); // reset after 60 sec
      }

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        await redisClient.setEx(lockKey, LOCK_TIME, "LOCKED");
        await redisClient.del(attemptsKey);
        return res.status(429).render("pages/login", {
          error: `Too many login attempts. Try again in ${LOCK_TIME} seconds.`,
        });
      }

      return res.status(400).render("pages/login", {
        error: "Invalid credentials",
      });
    }

    // Check password correctness
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const attempts = await redisClient.incr(attemptsKey);

      if (attempts === 1) {
        await redisClient.expire(attemptsKey, 60);
      }

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        await redisClient.setEx(lockKey, LOCK_TIME, "LOCKED");
        await redisClient.del(attemptsKey);
        return res.status(429).render("pages/login", {
          error: `Too many login attempts. Try again in ${LOCK_TIME} seconds.`,
        });
      }

      return res.status(400).render("pages/login", {
        error: "Invalid credentials",
      });
    }

    // Successful login → reset locks & attempts
    await redisClient.del(attemptsKey);
    await redisClient.del(lockKey);

    const token = generateToken({ id: user._id, role: user.role });

    // Set fresh JWT cookie
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect("/movies");
  } catch (err) {
    next(err);
  }
};


// LOGOUT
// Clears JWT cookie and redirects user to login page
export const logout = (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.redirect("/auth/login");
};
