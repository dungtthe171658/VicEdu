import mongoose, { Document, Schema } from "mongoose";

export interface IChatMessage extends Document {
  _id: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    courseId?: string;
    bookId?: string;
    categoryId?: string;
  };
}

export interface IChatSession extends Document {
  _id: string;
  userId: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  userId: { type: String, required: true },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: {
    courseId: { type: String },
    bookId: { type: String },
    categoryId: { type: String },
  },
});

const ChatSessionSchema = new Schema<IChatSession>({
  userId: { type: String, required: true },
  messages: [ChatMessageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

ChatSessionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const ChatMessage = mongoose.model<IChatMessage>(
  "ChatMessage",
  ChatMessageSchema
);
export const ChatSession = mongoose.model<IChatSession>(
  "ChatSession",
  ChatSessionSchema
);

