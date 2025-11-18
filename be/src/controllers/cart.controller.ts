import { Request, Response } from "express";
import mongoose from "mongoose";
import CartModel from "../models/cart.model";
import CourseModel from "../models/course.model";
import BookModel from "../models/book.model";

type ProductType = "Course" | "Book";

/**
 * Helper: get user id from various auth middlewares
 */
function getUserId(
  req: Request & { user?: any; userId?: any; user_id?: any }
): string | null {
  if (req.user?.id) return String(req.user.id);
  if (req.user?._id) return String(req.user._id);
  if (req.userId) return String(req.userId);
  if (req.user_id) return String(req.user_id);
  return null;
}

/**
 * GET /api/cart
 * Return current active cart of authenticated user
 */
export const getMyCart = async (req: Request, res: Response) => {
  try {
    const uid = getUserId(req);
    if (!uid) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    const userObjectId = new mongoose.Types.ObjectId(uid);

    let cart = await CartModel.findOne({
      user_id: userObjectId,
      status: "active",
    });

    if (!cart) {
      cart = await CartModel.create({
        user_id: userObjectId,
        items: [],
        total_amount: 0,
        status: "active",
      });
    }

    await cart.populate({
      path: "items.product_id",
      select: "title slug price thumbnail_url images",
    });

    return res.status(200).json(cart);
  } catch (error: any) {
    console.error("getMyCart error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
};

type AddOrUpdateItemBody = {
  productId?: string;
  productType?: ProductType;
  quantity?: number;
};

/**
 * POST /api/cart/items
 * Add a product to cart or increase quantity if already exists
 * Body: { productId: string, productType: "Course" | "Book", quantity?: number }
 */
export const addItemToCart = async (req: Request, res: Response) => {
  try {
    const uid = getUserId(req);
    if (!uid) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    const { productId, productType, quantity }: AddOrUpdateItemBody = req.body;

    if (!productId || !productType) {
      return res
        .status(400)
        .json({ message: "Missing productId or productType" });
    }

    if (!["Course", "Book"].includes(productType)) {
      return res.status(400).json({ message: "Invalid productType" });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const qty = Math.max(1, Number(quantity || 1));
    const userObjectId = new mongoose.Types.ObjectId(uid);

    // Fetch product info (price + snapshot fields) from DB to avoid trusting client
    const productModel =
      productType === "Course" ? CourseModel : BookModel;
    const product = await (productModel as any)
      .findById(productId)
      .select("title slug price thumbnail_url images")
      .lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const priceAtAdded = Number((product as any).price || 0);

    const cart = await CartModel.findOrCreateByUserId(userObjectId);

    const existingItem = cart.items.find(
      (it) =>
        String(it.product_id) === productId && it.product_type === productType
    );

    if (existingItem) {
      existingItem.quantity += qty;
      existingItem.added_at = new Date();
      existingItem.product_snapshot = {
        title: (product as any).title,
        slug: (product as any).slug,
        price: (product as any).price,
        thumbnail_url: (product as any).thumbnail_url,
        images: Array.isArray((product as any).images)
          ? (product as any).images
          : undefined,
      };
    } else {
      cart.items.push({
        product_id: new mongoose.Types.ObjectId(productId),
        product_type: productType,
        price_at_added: priceAtAdded,
        quantity: qty,
        added_at: new Date(),
        product_snapshot: {
          title: (product as any).title,
          slug: (product as any).slug,
          price: (product as any).price,
          thumbnail_url: (product as any).thumbnail_url,
          images: Array.isArray((product as any).images)
            ? (product as any).images
            : undefined,
        },
      });
    }

    cart.calculateTotal();
    await cart.save();

    await cart.populate({
      path: "items.product_id",
      select: "title slug price thumbnail_url images",
    });

    return res.status(200).json(cart);
  } catch (error: any) {
    console.error("addItemToCart error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
};

/**
 * PATCH /api/cart/items
 * Update quantity of a product in cart
 * Body: { productId: string, productType: "Course" | "Book", quantity: number }
 */
export const updateCartItemQuantity = async (req: Request, res: Response) => {
  try {
    const uid = getUserId(req);
    if (!uid) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    const { productId, productType, quantity }: AddOrUpdateItemBody = req.body;

    if (!productId || !productType) {
      return res
        .status(400)
        .json({ message: "Missing productId or productType" });
    }

    if (!["Course", "Book"].includes(productType)) {
      return res.status(400).json({ message: "Invalid productType" });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const qty = Math.max(1, Number(quantity || 1));
    const userObjectId = new mongoose.Types.ObjectId(uid);

    const cart = await CartModel.findOrCreateByUserId(userObjectId);

    const item = cart.items.find(
      (it) =>
        String(it.product_id) === productId && it.product_type === productType
    );

    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    item.quantity = qty;
    item.added_at = new Date();

    cart.calculateTotal();
    await cart.save();

    await cart.populate({
      path: "items.product_id",
      select: "title slug price thumbnail_url images",
    });

    return res.status(200).json(cart);
  } catch (error: any) {
    console.error("updateCartItemQuantity error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
};

/**
 * DELETE /api/cart/items
 * Remove a product from cart
 * Body: { productId: string, productType: "Course" | "Book" }
 */
export const removeCartItem = async (req: Request, res: Response) => {
  try {
    const uid = getUserId(req);
    if (!uid) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    const { productId, productType }: AddOrUpdateItemBody = req.body;

    if (!productId || !productType) {
      return res
        .status(400)
        .json({ message: "Missing productId or productType" });
    }

    if (!["Course", "Book"].includes(productType)) {
      return res.status(400).json({ message: "Invalid productType" });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const userObjectId = new mongoose.Types.ObjectId(uid);

    const cart = await CartModel.findOrCreateByUserId(userObjectId);

    const beforeLength = cart.items.length;
    cart.items = cart.items.filter(
      (it) =>
        !(
          String(it.product_id) === productId &&
          it.product_type === productType
        )
    );

    if (beforeLength === cart.items.length) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    cart.calculateTotal();
    await cart.save();

    await cart.populate({
      path: "items.product_id",
      select: "title slug price thumbnail_url images",
    });

    return res.status(200).json(cart);
  } catch (error: any) {
    console.error("removeCartItem error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
};

/**
 * DELETE /api/cart
 * Clear all items in cart
 */
export const clearCart = async (req: Request, res: Response) => {
  try {
    const uid = getUserId(req);
    if (!uid) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    const userObjectId = new mongoose.Types.ObjectId(uid);
    const cart = await CartModel.findOrCreateByUserId(userObjectId);

    cart.items = [];
    cart.total_amount = 0;
    await cart.save();

    return res.status(200).json(cart);
  } catch (error: any) {
    console.error("clearCart error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
};

export default {
  getMyCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};
