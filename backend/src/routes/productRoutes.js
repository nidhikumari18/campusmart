
import { Router } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import Product from "../models/Product.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

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

const removeFiles = (files = []) => {
  files.forEach((file) => {
    fs.unlink(file.path, () => {});
  });
};

// GET ALL PRODUCTS

router.get("/", async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ products });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load products.",
    });
  }
});

// GET ONE PRODUCT

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    ).lean();

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    res.json({ product });
  } catch (error) {
    res.status(400).json({
      message: "Invalid product ID.",
    });
  }
});

// CREATE PRODUCT

router.post(
  "/",
  protect,
  (req, res, next) => {
    upload.array("images", 5)(
      req,
      res,
      (error) => {
        if (error) {
          removeFiles(req.files);

          return res.status(400).json({
            message: error.message,
          });
        }

        next();
      }
    );
  },

  async (req, res) => {
    const files = req.files || [];

    try {
      const {
        title,
        description,
        price,
        category,
        condition,
        college,
      } = req.body;

      const numericPrice = Number(price);

      if (
        !title?.trim() ||
        !description?.trim() ||
        !category?.trim() ||
        !Number.isFinite(numericPrice) ||
        numericPrice <= 0
      ) {
        removeFiles(files);

        return res.status(400).json({
          message: "Enter valid product details.",
        });
      }

      if (files.length === 0) {
        return res.status(400).json({
          message: "Upload at least one product photo.",
        });
      }

      const seller =
        req.user?._id || req.user?.id;

      if (!seller) {
        removeFiles(files);

        return res.status(401).json({
          message: "Please sign in again.",
        });
      }

      const product = await Product.create({
        title: title.trim(),
        description: description.trim(),
        price: numericPrice,
        category,
        condition: condition || "Good",
        college: college || "",
        seller,
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

      res.status(500).json({
        message: "Unable to publish product.",
      });
    }
  }
);

export default router;
