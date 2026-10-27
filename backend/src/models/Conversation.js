
import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    // Product being discussed
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // Student interested in buying
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Student selling the product
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Latest message timestamp
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// One conversation per buyer, seller and product
conversationSchema.index(
  {
    product: 1,
    buyer: 1,
    seller: 1,
  },
  {
    unique: true,
  }
);

// Show recently active conversations first
conversationSchema.index({
  lastMessageAt: -1,
});

const Conversation = mongoose.model(
  "Conversation",
  conversationSchema
);

export default Conversation;
