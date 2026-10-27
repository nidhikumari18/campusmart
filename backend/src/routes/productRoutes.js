
import { Router } from "express";
import multer from "multer";
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import Product from "../models/Product.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// ========================================
// UPLOAD DIRECTORY
// ========================================

const uploadDir = path.resolve(
  process.cwd(),
  "uploads"
);

fs.mkdirSync(uploadDir, { recursive: true });

const extensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// ========================================
// IMAGE UPLOAD SETTINGS
// ========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = extensions[file.mimetype];

    cb(
      null,
      `${crypto.randomUUID()}${extension || ".img"}`
    );
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },

  fileFilter: (req, file, cb) => {
    if (!extensions[file.mimetype]) {
      return cb(
        new Error(
          "Only JPG, PNG and WebP images are allowed."
        )
      );
    }

    cb(null, true);
  },
});

// ========================================
// FILE HELPERS
// ========================================

const removeFiles = (files = []) => {
  files.forEach((file) => {
    fs.unlink(file.path, () => {});
  });
};

const removeUploadedImages = (imageUrls = []) => {
  for (const imageUrl of imageUrls) {
    if (
      typeof imageUrl !== "string" ||
      !imageUrl.startsWith("/uploads/")
    ) {
      continue;
    }

    const filename = path.basename(imageUrl);
    const filePath = path.join(uploadDir, filename);

    fs.unlink(filePath, (error) => {
      if (error && error.code !== "ENOENT") {
        console.error(
          "Unable to delete image:",
          error.message
        );
      }
    });
  }
};

const uploadImages = (req, res, next) => {
  upload.array("images", 5)(req, res, (error) => {
    if (error) {
      removeFiles(req.files || []);

      return res.status(400).json({
        message: error.message,
      });
    }

    next();
  });
};

// ========================================
// VALIDATION HELPERS
// ========================================

const VALID_STATUSES = [
  "Available",
  "Reserved",
  "Sold",
];

const parsePrice = (value) => {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number > 0
    ? number
    : NaN;
};

const getProductDetails = (body) => {
  const title =
    typeof body.title === "string"
      ? body.title.trim()
      : "";

  const description =
    typeof body.description === "string"
      ? body.description.trim()
      : "";

  const category =
    typeof body.category === "string"
      ? body.category.trim()
      : "";

  const condition =
    typeof body.condition === "string"
      ? body.condition.trim()
      : "Good";

  const college =
    typeof body.college === "string"
      ? body.college.trim()
      : "";

  const price = parsePrice(body.price);
  const original = parsePrice(body.original);

  if (
    !title ||
    title.length > 120 ||
    !description ||
    description.length > 3000 ||
    !category ||
    price === null ||
    !Number.isFinite(price) ||
    (original !== null &&
      (!Number.isFinite(original) ||
        original < price))
  ) {
    return null;
  }

  return {
    title,
    description,
    price,
    original,
    category,
    condition: condition || "Good",
    college,
  };
};

// ========================================
// GET ALL PRODUCTS
// ========================================

router.get("/", async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Older products may not have a status.
    // Treat them as Available.
    const normalizedProducts = products.map(
      (product) => ({
        ...product,
        status: product.status || "Available",
      })
    );

    res.json({
      products: normalizedProducts,
    });
  } catch (error) {
    console.error("Get products error:", error);

    res.status(500).json({
      message: "Unable to load products.",
    });
  }
});

// ========================================
// GET ONE PRODUCT
// ========================================

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findById(
      req.params.id
    ).lean();

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    res.json({
      product: {
        ...product,
        status: product.status || "Available",
      },
    });
  } catch (error) {
    console.error("Get product error:", error);

    res.status(500).json({
      message: "Unable to load product.",
    });
  }
});

// ========================================
// CREATE PRODUCT
// ========================================

router.post(
  "/",
  protect,
  uploadImages,

  async (req, res) => {
    const files = req.files || [];

    try {
      const details = getProductDetails(req.body);

      if (!details) {
        removeFiles(files);

        return res.status(400).json({
          message:
            "Enter valid product details and prices.",
        });
      }

      if (files.length === 0) {
        return res.status(400).json({
          message:
            "Upload at least one product photo.",
        });
      }

      const seller = req.user?._id || req.user?.id;

      if (!seller) {
        removeFiles(files);

        return res.status(401).json({
          message: "Please sign in again.",
        });
      }

      const product = await Product.create({
        ...details,
        seller,

        // Every new listing starts as Available
        status: "Available",

        imageUrls: files.map(
          (file) => `/uploads/${file.filename}`
        ),
      });

      res.status(201).json({
        message: "Product listed successfully.",
        product,
      });
    } catch (error) {
      removeFiles(files);

      console.error("Create product error:", error);

      res.status(500).json({
        message: "Unable to publish product.",
      });
    }
  }
);

// ========================================
// EDIT PRODUCT
// Only the owner can edit their listing.
// ========================================

router.put(
  "/:id",
  protect,
  uploadImages,

  async (req, res) => {
    const files = req.files || [];

    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        removeFiles(files);

        return res.status(400).json({
          message: "Invalid product ID.",
        });
      }

      const product = await Product.findById(
        req.params.id
      );

      if (!product) {
        removeFiles(files);

        return res.status(404).json({
          message: "Product not found.",
        });
      }

      const loggedInUserId = String(
        req.user?._id || req.user?.id
      );

      const productSellerId = String(
        product.seller
      );

      if (loggedInUserId !== productSellerId) {
        removeFiles(files);

        return res.status(403).json({
          message:
            "You can only edit your own listings.",
        });
      }

      const details = getProductDetails(req.body);

      if (!details) {
        removeFiles(files);

        return res.status(400).json({
          message:
            "Enter valid product details and prices.",
        });
      }

      const oldImageUrls = [...product.imageUrls];

      Object.assign(product, details);

      // Keep existing status when editing product details.
      // Status changes use the dedicated PATCH endpoint.

      if (files.length > 0) {
        product.imageUrls = files.map(
          (file) => `/uploads/${file.filename}`
        );
      }

      await product.save();

      if (files.length > 0) {
        removeUploadedImages(oldImageUrls);
      }

      res.json({
        message: "Product updated successfully.",
        product,
      });
    } catch (error) {
      removeFiles(files);

      console.error("Edit product error:", error);

      res.status(500).json({
        message: "Unable to update product.",
      });
    }
  }
);

// ========================================
// NEW: UPDATE PRODUCT STATUS
// PATCH /api/products/:id/status
// Only the seller can change status.
// ========================================

router.patch(
  "/:id/status",
  protect,

  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate product ID
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid product ID.",
        });
      }

      // Validate requested status
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          message:
            "Status must be Available, Reserved, or Sold.",
        });
      }

      // Find the product
      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          message: "Product not found.",
        });
      }

      // Verify ownership
      const loggedInUserId = String(
        req.user?._id || req.user?.id || ""
      );

      const sellerId = String(product.seller);

      if (
        !loggedInUserId ||
        loggedInUserId !== sellerId
      ) {
        return res.status(403).json({
          message:
            "You can only change the status of your own listings.",
        });
      }

      // Save the new status
      product.status = status;

      await product.save();

      return res.status(200).json({
        message: `Product marked as ${status}.`,
        product,
      });
    } catch (error) {
      console.error(
        "Update product status error:",
        error
      );

      return res.status(500).json({
        message: "Unable to update product status.",
      });
    }
  }
);

// ========================================
// DELETE PRODUCT
// Only the owner can delete their listing.
// ========================================

router.delete(
  "/:id",
  protect,

  async (req, res) => {
    try {
      const productId = req.params.id;

      if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({
          message: "Invalid product ID.",
        });
      }

      const product = await Product.findById(
        productId
      );

      if (!product) {
        return res.status(404).json({
          message: "Product not found.",
        });
      }

      const loggedInUserId = String(
        req.user?._id || req.user?.id || ""
      );

      const productSellerId = String(
        product.seller
      );

      if (
        !loggedInUserId ||
        loggedInUserId !== productSellerId
      ) {
        return res.status(403).json({
          message:
            "You can only delete your own listings.",
        });
      }

      const imageUrls = [...product.imageUrls];

      await product.deleteOne();

      removeUploadedImages(imageUrls);

      return res.status(200).json({
        message: "Product deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete product error:",
        error
      );

      return res.status(500).json({
        message: "Unable to delete product.",
      });
    }
  }
);

export default router;
