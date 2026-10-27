
import express from "express";
import mongoose from "mongoose";

import { protect } from "../middleware/authMiddleware.js";

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Product from "../models/Product.js";

const router = express.Router();

// ========================================
// HELPERS
// ========================================

function isParticipant(conversation, userId) {
  return (
    String(conversation.buyer) === String(userId) ||
    String(conversation.seller) === String(userId)
  );
}

function getSellerId(product) {
  const seller = product.sellerId || product.seller;

  if (seller && typeof seller === "object") {
    return String(seller._id || seller.id || "");
  }

  return String(seller || "");
}

function notifyParticipants(req, conversation, event, payload) {
  const io = req.app.get("io");

  if (!io) return;

  const buyerId = String(conversation.buyer);
  const sellerId = String(conversation.seller);

  io.to(`user:${buyerId}`)
    .to(`user:${sellerId}`)
    .emit(event, payload);
}

// ========================================
// PROTECT ALL MESSAGING ROUTES
// ========================================

router.use(protect);

 // ========================================
 // GET UNREAD MESSAGE COUNT
 // GET /api/messages/unread-count
 // ========================================

router.get("/unread-count", async (req, res) => {
  try {
    const userId = req.user._id;

    // Find conversations where this user
    // is either the buyer or the seller.
    const conversations = await Conversation.find({
      $or: [
        { buyer: userId },
        { seller: userId },
      ],
    }).select("_id");

    const conversationIds = conversations.map(
      (conversation) => conversation._id
    );

    // Count only unread messages sent
    // by someone else.
    const unreadCount = await Message.countDocuments({
      conversation: {
        $in: conversationIds,
      },
      sender: {
        $ne: userId,
      },
      isRead: false,
    });

    return res.json({
      unreadCount,
    });
  } catch (error) {
    console.error(
      "Get unread message count:",
      error.message
    );

    return res.status(500).json({
      message: "Unable to load unread count.",
    });
  }
});

// ========================================
// START OR OPEN CONVERSATION
// POST /api/messages/conversations
// ========================================

router.post("/conversations", async (req, res) => {
  try {
    const { productId } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    const sellerId = getSellerId(product);
    const buyerId = String(req.user._id);

    if (!mongoose.isValidObjectId(sellerId)) {
      return res.status(400).json({
        message: "This product has no valid seller.",
      });
    }

    if (sellerId === buyerId) {
      return res.status(400).json({
        message: "You cannot message yourself.",
      });
    }

    const filter = {
      product: product._id,
      buyer: buyerId,
      seller: sellerId,
    };

    let conversation;

    try {
      conversation = await Conversation.findOneAndUpdate(
        filter,
        {
          $setOnInsert: filter,
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );
    } catch (error) {
      if (error.code !== 11000) {
        throw error;
      }

      conversation = await Conversation.findOne(filter);

      if (!conversation) {
        throw error;
      }
    }

    return res.json({
      message: "Conversation ready.",
      conversation,
    });
  } catch (error) {
    console.error("Start conversation:", error.message);

    return res.status(500).json({
      message: "Unable to start conversation.",
    });
  }
});

// ========================================
// GET MY CONVERSATIONS
// GET /api/messages/conversations
// ========================================


router.get("/conversations", async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      $or: [
        { buyer: userId },
        { seller: userId },
      ],
    })
      .populate("product")
      .populate("buyer", "name")
      .populate("seller", "name")
      .sort({ lastMessageAt: -1 })
      .lean();

    const conversationIds = conversations.map(
      (conversation) => conversation._id
    );

    // Find the latest message in each conversation.
    const latestMessages = await Message.aggregate([
      {
        $match: {
          conversation: { $in: conversationIds },
        },
      },
      {
        $sort: {
          createdAt: -1,
          _id: -1,
        },
      },
      {
        $group: {
          _id: "$conversation",
          latestMessage: { $first: "$$ROOT" },
        },
      },
    ]);

    // Count unread messages for the current user.
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          conversation: { $in: conversationIds },
          sender: { $ne: userId },
          isRead: false,
        },
      },
      {
        $group: {
          _id: "$conversation",
          count: { $sum: 1 },
        },
      },
    ]);

    const latestMap = new Map(
      latestMessages.map((item) => [
        String(item._id),
        item.latestMessage,
      ])
    );

    const unreadMap = new Map(
      unreadCounts.map((item) => [
        String(item._id),
        item.count,
      ])
    );

    const enrichedConversations = conversations.map(
      (conversation) => {
        const id = String(conversation._id);

        return {
          ...conversation,
          latestMessage: latestMap.get(id) || null,
          unreadCount: unreadMap.get(id) || 0,
        };
      }
    );

    return res.json({
      conversations: enrichedConversations,
    });
  } catch (error) {
    console.error(
      "Get conversations:",
      error.message
    );

    return res.status(500).json({
      message: "Unable to load conversations.",
    });
  }
});


// ========================================
// GET CONVERSATION MESSAGES
// GET /api/messages/conversations/:id
// ========================================

router.get("/conversations/:id", async (req, res) => {
  try {
    const conversationId = req.params.id;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        message: "Invalid conversation ID.",
      });
    }

    const conversation = await Conversation.findById(
      conversationId
    );

    if (
      !conversation ||
      !isParticipant(conversation, req.user._id)
    ) {
      return res.status(404).json({
        message: "Conversation not found.",
      });
    }

    const messages = await Message.find({
      conversation: conversationId,
    })
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .limit(100)
      .lean();

    return res.json({
      conversation,
      messages: messages.reverse(),
    });
  } catch (error) {
    console.error("Get messages:", error.message);

    return res.status(500).json({
      message: "Unable to load messages.",
    });
  }
});

// ========================================
// SEND MESSAGE
// POST /api/messages/conversations/:id
// ========================================

router.post("/conversations/:id", async (req, res) => {
  try {
    const conversationId = req.params.id;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        message: "Invalid conversation ID.",
      });
    }

    const conversation = await Conversation.findById(
      conversationId
    );

    if (
      !conversation ||
      !isParticipant(conversation, req.user._id)
    ) {
      return res.status(404).json({
        message: "Conversation not found.",
      });
    }

    const text =
      typeof req.body.text === "string"
        ? req.body.text.trim()
        : "";

    if (!text || text.length > 2000) {
      return res.status(400).json({
        message: "Message must contain 1–2000 characters.",
      });
    }

    // Save message to MongoDB
    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text,
    });

    // Update conversation activity
    await Conversation.findByIdAndUpdate(
      conversation._id,
      {
        lastMessageAt: message.createdAt,
      }
    );

    // ====================================
    // REAL-TIME MESSAGE NOTIFICATION
    // ====================================

    notifyParticipants(
      req,
      conversation,
      "message:new",
      {
        conversationId: String(conversation._id),
        message: message.toObject(),
      }
    );

    // Notify inboxes to refresh their order
    notifyParticipants(
      req,
      conversation,
      "conversation:updated",
      {
        conversationId: String(conversation._id),
        lastMessageAt: message.createdAt,
      }
    );

    return res.status(201).json({
      message: "Message sent successfully.",
      data: message,
    });
  } catch (error) {
    console.error("Send message:", error.message);

    return res.status(500).json({
      message: "Unable to send message.",
    });
  }
});

// ========================================
// MARK MESSAGES AS READ
// PATCH /api/messages/conversations/:id/read
// ========================================

router.patch(
  "/conversations/:id/read",
  async (req, res) => {
    try {
      const conversationId = req.params.id;

      if (!mongoose.isValidObjectId(conversationId)) {
        return res.status(400).json({
          message: "Invalid conversation ID.",
        });
      }

      const conversation = await Conversation.findById(
        conversationId
      );

      if (
        !conversation ||
        !isParticipant(conversation, req.user._id)
      ) {
        return res.status(404).json({
          message: "Conversation not found.",
        });
      }

      const result = await Message.updateMany(
        {
          conversation: conversation._id,
          sender: {
            $ne: req.user._id,
          },
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        }
      );

      // ====================================
      // REAL-TIME READ RECEIPTS
      // ====================================

      if (result.modifiedCount > 0) {
        notifyParticipants(
          req,
          conversation,
          "conversation:read",
          {
            conversationId: String(conversation._id),
            readBy: String(req.user._id),
          }
        );
      }

      return res.json({
        message: "Messages marked as read.",
        updated: result.modifiedCount,
      });
    } catch (error) {
      console.error("Mark as read:", error.message);

      return res.status(500).json({
        message: "Unable to mark messages as read.",
      });
    }
  }
);

export default router;
