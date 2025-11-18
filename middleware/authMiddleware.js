import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import User from "../models/User.js";
// importing User model for verifying decoded token's user

export const protect = async (req, res, next) => {
    try {
      //extract token from cookies or Authorization header
      const token = req.cookies?.[process.env.COOKIE_NAME] || req.headers.authorization?.split(" ")[1];
      console.log('JWT token received:', token);  // Debug
  
      if (!token) {
        console.log('No JWT token found in cookie or header');
        return res.status(401).redirect("/auth/login");
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
  
      //check if user exists after decoding token
      console.log('Authenticated user:', user);  // Debug
  
      if (!user) {
        return res.status(401).json({ message: "Invalid token" });
      }
  
      req.user = user;
      next();
    } catch (err) {
      console.error('Error in auth middleware:', err);
      // send control to error handler for clean error flow
      next(err);
    }
  };
  

export const authorize = (...roles) => {
  return (req, res, next) => {
    // ensure user role matches allowed roles
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};
