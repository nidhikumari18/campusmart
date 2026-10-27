
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    // Product title
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    // Product description
    description: {
      type: String,
      required: true,
      maxlength: 3000,
    },

    // Selling price
    price: {
      type: Number,
      required: true,
      min: 1,
    },

    // Original price (optional)
    original: {
      type: Number,
      default: null,
      min: 1,
    },

    // Product category
    category: {
      type: String,
      required: true,
    },

    // Product condition
    condition: {
      type: String,
      default: "Good",
    },

    // Seller's college
    college: {
      type: String,
      default: "",
    },

    // Uploaded product images
    imageUrls: [
      {
        type: String,
      },
    ],

    // Product owner
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // NEW: Product availability status
    status: {
      type: String,
      enum: ["Available", "Reserved", "Sold"],
      default: "Available",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Product ||
  mongoose.model("Product", productSchema);
