
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(req, res, next) {
  try {
    // Read the cookie created during login
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Please log in to continue.",
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
      }
    );

    // Read user ID from token
    const userId = decoded.id;

    if (!userId) {
      return res.status(401).json({
        message: "Invalid login session.",
      });
    }

    // Find user in MongoDB
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        message: "Account not found. Please log in again.",
      });
    }

    // Attach authenticated user to request
    req.user = user;

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      message: "Session expired. Please log in again.",
    });
  }
}
