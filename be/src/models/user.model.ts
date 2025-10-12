import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt";
import mongooseDelete, { SoftDeleteModel } from "mongoose-delete";

// Interface để hỗ trợ type cho plugin mongoose-delete
interface IUserDocument extends Document {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  avatarUrl?: string;
  role: 'admin' | 'teacher' | 'customer';
  isActive: boolean;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

// Kết hợp interface của bạn với interface của plugin
export interface IUser extends IUserDocument {}

// Tạo User Schema
const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true, alias: 'full_name' },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true, select: false },
    phone: { type: String, trim: true, default: null },
    avatarUrl: { type: String, trim: true, default: null, alias: 'avatar_url' },
    role: {
      type: String,
      enum: ['admin', 'teacher', 'customer'],
      default: 'customer',
    },
    isActive: { type: Boolean, default: true, alias: 'is_active' },
    lockedUntil: { type: Date, default: null, alias: 'locked_until' },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, // Mongoose tự quản lý
    collection: "users",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Áp dụng plugin soft-delete
userSchema.plugin(mongooseDelete, { 
    deletedAt: true, // Thêm trường deletedAt
    overrideMethods: 'all' // Ghi đè các hàm find, count... để tự động loại trừ các document đã xóa
});

// Middleware (pre-save hook) để tự động hash password
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method so sánh password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  const user = await UserModel.findById(this._id).select('+password').exec();
  if (!user || !user.password) return false;
  return bcrypt.compare(candidatePassword, user.password);
};

// Ép kiểu Model để TypeScript nhận diện được các method của plugin (delete, restore)
const UserModel = mongoose.model<IUser, SoftDeleteModel<IUser>>("User", userSchema);

export default UserModel;