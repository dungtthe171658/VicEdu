import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Interface định nghĩa cấu trúc dữ liệu của User
 */
export interface IUser extends Document {
  email: string;
  name?: string | null;
  password_hash: string;
  phone?: string | null;
  address?: string | null;
  avatar_url?: string | null;
  user_role: "customer" | "teacher" | "admin";
  last_login?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Schema Mongoose cho User
 */
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },

    name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    password_hash: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: null,
    },

    address: {
      type: String,
      maxlength: 255,
      default: null,
    },

    avatar_url: {
      type: String,
      maxlength: 300,
      default: null,
    },

    user_role: {
      type: String,
      enum: ["customer", "teacher", "admin"],
      default: "customer",
    },

    last_login: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "users",
  }
);

/**
 * Virtual Populate
 */
userSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "user_id",
});

userSchema.virtual("enrollments", {
  ref: "Enrollment",
  localField: "_id",
  foreignField: "user_id",
});

userSchema.virtual("orders", {
  ref: "Order",
  localField: "_id",
  foreignField: "user_id",
});

userSchema.virtual("emailNotifications", {
  ref: "EmailNotification",
  localField: "_id",
  foreignField: "user_id",
});

userSchema.virtual("aiLogs", {
  ref: "AiLog",
  localField: "_id",
  foreignField: "user_id",
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

/**
 * Model Mongoose cho User
 */
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
