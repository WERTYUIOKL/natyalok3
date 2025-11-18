// import bcrypt from "bcryptjs";
// import User from "../models/User.js";
// import { generateToken } from "../utils/generateToken.js";
// import dotenv from "dotenv";
// dotenv.config();

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
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const attemptsKey = `login_attempts:${email}`;
    const lockKey = `login_lock:${email}`;

    // 1. Check lock
    const isLocked = await redisClient.get(lockKey);
    if (isLocked) {
      return res.status(429).render("pages/login", {
        error: `Too many login attempts. Try again in ${LOCK_TIME} seconds.`,
      });
    }

    const user = await User.findOne({ email });

    // If user not found → treat like wrong password
    if (!user) {
      const attempts = await redisClient.incr(attemptsKey);

      if (attempts === 1) {
        await redisClient.expire(attemptsKey, 60); // auto-reset after 60 sec
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

    // Check password
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

    // Successful login → reset attempts + lock
    await redisClient.del(attemptsKey);
    await redisClient.del(lockKey);

    const token = generateToken({ id: user._id, role: user.role });

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
export const logout = (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.redirect("/auth/login");
};
