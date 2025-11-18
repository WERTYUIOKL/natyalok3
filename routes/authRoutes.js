import express from "express";
import { register, login, logout } from "../controllers/authController.js";
const router = express.Router();

router.get("/login", (req, res) => res.render("pages/login"));
router.get("/register", (req, res) => res.render("pages/register"));

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);

export default router;
