import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICartItem {
  product_id: mongoose.Types.ObjectId;
  product_type: "Course" | "Book";
  price_at_added: number;
  quantity: number;
  added_at: Date;
  product_snapshot?: {
    title?: string;
    slug?: string;
    price?: number;
    thumbnail_url?: string;
    images?: string[];
  };
}

export interface ICart extends Document {
  user_id: mongoose.Types.ObjectId;
  items: ICartItem[];
  total_amount: number;
  status: "active" | "abandoned" | "converted" | "expired";
  expires_at?: Date;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
  calculateTotal(): number;
}

export interface ICartModel extends Model<ICart> {
  findOrCreateByUserId(userId: mongoose.Types.ObjectId): Promise<ICart>;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    product_id: { 
      type: Schema.Types.ObjectId, 
      required: true, 
      refPath: "product_type" 
    },
    product_type: { 
      type: String, 
      required: true, 
      enum: ["Course", "Book"] 
    },
    price_at_added: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    quantity: { 
      type: Number, 
      required: true, 
      min: 1, 
      default: 1 
    },
    added_at: { 
      type: Date, 
      default: Date.now 
    },
    product_snapshot: {
      title: { type: String },
      slug: { type: String },
      price: { type: Number, min: 0 },
      thumbnail_url: { type: String },
      images: [{ type: String }],
    },
  },
  { _id: false }
);

const cartSchema = new Schema<ICart>(
  {
    user_id: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true
    },
    items: [cartItemSchema],
    total_amount: { 
      type: Number, 
      required: true, 
      min: 0, 
      default: 0 
    },
    status: { 
      type: String, 
      enum: ["active", "abandoned", "converted", "expired"], 
      default: "active", 
      index: true 
    },
    expires_at: { 
      type: Date, 
      index: true,
      // Mặc định 30 ngày từ khi tạo
      default: function() {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date;
      }
    },
    notes: { type: String },
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, 
    collection: "carts" 
  }
);

// Index phục vụ truy vấn nhanh
cartSchema.index({ user_id: 1, status: 1 });
// Unique index: mỗi user chỉ có 1 cart active tại một thời điểm
cartSchema.index({ user_id: 1 }, { unique: true, partialFilterExpression: { status: "active" } });
cartSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index để tự động xóa cart hết hạn
cartSchema.index({ "items.product_type": 1, "items.product_id": 1 });

// Method để tính lại total_amount
cartSchema.methods.calculateTotal = function() {
  this.total_amount = this.items.reduce((total: number, item: ICartItem) => {
    return total + (item.price_at_added * item.quantity);
  }, 0);
  return this.total_amount;
};

// Pre-save hook để tự động tính total_amount trước khi save
cartSchema.pre("save", function(next) {
  if (this.isModified("items")) {
    this.calculateTotal();
  }
  next();
});

// Static method để tìm hoặc tạo cart cho user
cartSchema.statics.findOrCreateByUserId = async function(userId: mongoose.Types.ObjectId) {
  let cart = await this.findOne({ user_id: userId, status: "active" });
  
  if (!cart) {
    cart = await this.create({ 
      user_id: userId, 
      items: [], 
      total_amount: 0,
      status: "active"
    });
  }
  
  return cart;
};

export default mongoose.model<ICart, ICartModel>("Cart", cartSchema);

