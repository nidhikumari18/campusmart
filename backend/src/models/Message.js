
import mongoose from "mongoose";

// ========================================
// MESSAGE SCHEMA
// ========================================

const messageSchema = new mongoose.Schema(
  {
    // Conversation this message belongs to
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    // User who sent the message
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Message content
    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },

    // Whether the recipient has read it
    isRead: {
      type: Boolean,
      default: false,
    },

    // When the recipient read it
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ========================================
// INDEXES
// ========================================

// Fetch messages in chronological order
messageSchema.index({
  conversation: 1,
  createdAt: 1,
});

// Efficiently find unread messages
messageSchema.index({
  conversation: 1,
  isRead: 1,
});

// ========================================
// MODEL
// ========================================

const Message = mongoose.model(
  "Message",
  messageSchema
);

export default Message;
