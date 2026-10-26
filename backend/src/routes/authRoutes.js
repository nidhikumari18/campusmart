
import express from "express";

import {
  register,
  login,
  logout,
  getMe,
} from "../controllers/authController.js";

import {
  forgotPassword,
  resetPassword,
} from "../controllers/passwordController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// REGISTER AND LOGIN
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// CURRENT LOGGED-IN USER
router.get("/me", protect, getMe);

// FORGOT PASSWORD
router.post("/forgot-password", forgotPassword);

// RESET PASSWORD
router.post("/reset-password/:token", resetPassword);

export default router;
