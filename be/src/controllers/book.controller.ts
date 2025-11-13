import { Request, Response } from "express";
import mongoose from "mongoose";
import slugify from "slugify";
import Book from "../models/book.model";
import OrderItemModel from "../models/order_item.model";
import Order from "../models/order.model";
import { AuthRequest } from "../middlewares/auth";
import UserModel from "../models/user.model";
import cloudinary from "../utils/cloudinary";

const toObjectId = (id: any) =>
  mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;

// Helper: resolve user id from decoded token (compatible with various shapes)
function getUserIdFromToken(req: Request & { user?: any }): string | null {
  const u = (req as any).user as any;
  const id = u?._id?.toString?.() || u?.id?.toString?.();
  return id || null;
}

async function resolveUserId(req: Request & { user?: any }): Promise<string | null> {
  const isDev = (process.env.NODE_ENV || "development") !== "production";
  let uid = getUserIdFromToken(req);
  if (!uid && isDev) {
    const qEmailRaw = (req.query as any)?.email;
    if (qEmailRaw && typeof qEmailRaw === "string") {
      const qEmail = qEmailRaw.trim().toLowerCase();
      const user = await UserModel.findOne({ email: qEmail }).select({ _id: 1 }).lean();
      if (user?._id) uid = String((user as any)._id);
    }
  }
  return uid || null;
}

// 📘 Lấy danh sách sách (kèm bộ lọc cơ bản)
export const getBooks = async (req: Request, res: Response) => {
  try {
    const { search, categoryId, minPrice, maxPrice, sortBy, order } = req.query;
    const filter: Record<string, any> = { is_published: true };

    if (search) filter.title = { $regex: search, $options: "i" };
    if (categoryId) {
      const catId = toObjectId(categoryId);
      if (catId) filter.category_id = catId;
    }
    if (minPrice || maxPrice) {
      filter.price_cents = {};
      if (minPrice) filter.price_cents.$gte = Number(minPrice);
      if (maxPrice) filter.price_cents.$lte = Number(maxPrice);
    }

    const dir = order === "asc" ? 1 : -1;
    const sort: Record<string, 1 | -1> =
      sortBy === "price"
        ? { price_cents: dir }
        : sortBy === "title"
        ? { title: dir }
        : { created_at: -1 };

    let books = await Book.find(filter)
      .populate("category_id", "name slug")
      .sort(sort)
      .lean();

    const userId = res.locals.userId;
    if (userId) {
      const purchasedItems = await OrderItemModel.find({
        product_type: "Book",
      })
        .populate({
          path: "order_id",
          match: { user_id: userId },
          select: "_id",
        })
        .lean();

      const purchasedBookIds = new Set(
        purchasedItems
          .filter((item) => item.order_id)
          .map((item) => item.product_id.toString())
      );

      books = books.map((b) => {
        if (!purchasedBookIds.has(b._id.toString())) delete b.pdf_url;
        return b;
      });
    } else {
      books = books.map((b) => {
        delete b.pdf_url;
        return b;
      });
    }

    res.json(books);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error fetching books", error: err.message });
  }
};

export const getBookById = async (req: Request, res: Response) => {
  try {
    const bookId = toObjectId(req.params.id);
    if (!bookId) return res.status(400).json({ message: "Invalid book ID" });

    const book = await Book.findById(bookId)
      .populate("category_id", "name slug")
      .lean();
    if (!book) return res.status(404).json({ message: "Book not found" });

    // res.locals.userRole cần được set khi login (admin / user)
    const userId = res.locals.userId;
    const userRole = res.locals.userRole || "user"; // default user

    if (userRole === "user" && userId) {
      // Chỉ xóa pdf_url nếu user bình thường chưa mua
      const purchasedItem = await OrderItemModel.findOne({
        product_type: "Book",
        product_id: book._id,
      })
        .populate({
          path: "order_id",
          match: { user_id: userId },
          select: "_id",
        })
        .lean();

      if (!purchasedItem || !purchasedItem.order_id) delete book.pdf_url;
    }

    // admin thì luôn trả pdf_url
    res.json(book);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error fetching book", error: err.message });
  }
};

// 📘 Tạo sách mới
export const createBook = async (req: Request, res: Response) => {
  try {
    const { title, price_cents, category_id, pdf_url } = req.body;

    // DEBUG: in payload nhận được
    console.log("CreateBook payload:", req.body);
    console.log("pdf_url:", pdf_url);

    if (!title || !price_cents || !category_id)
      return res
        .status(400)
        .json({ message: "title, price_cents, category_id are required" });

    const catId = toObjectId(category_id);
    if (!catId) return res.status(400).json({ message: "Invalid category_id" });

    const slug = slugify(title, { lower: true, strict: true });

    const book = await Book.create({
      ...req.body,
      slug,
      category_id: catId,
      pdf_url, // chắc chắn lấy từ frontend
    });

    console.log("Book created in DB:", book.pdf_url); // DEBUG: kiểm tra lưu vào DB

    res.status(201).json({ message: "Book created successfully", data: book });
  } catch (err: any) {
    console.error("Error in createBook:", err);
    res
      .status(500)
      .json({ message: "Failed to create book", error: err.message });
  }
};

// 📘 Cập nhật sách
export const updateBook = async (req: Request, res: Response) => {
  try {
    const bookId = toObjectId(req.params.id);
    if (!bookId) return res.status(400).json({ message: "Invalid book ID" });

    const updateData: any = { ...req.body };
    console.log("UpdateBook payload:", updateData); // DEBUG
    console.log("pdf_url:", updateData.pdf_url);

    if (updateData.title)
      updateData.slug = slugify(updateData.title, {
        lower: true,
        strict: true,
      });
    if (updateData.category_id)
      updateData.category_id = toObjectId(updateData.category_id);

    const updated = await Book.findByIdAndUpdate(bookId, updateData, {
      new: true,
      runValidators: true,
    }).populate("category_id", "name slug");

    if (!updated) return res.status(404).json({ message: "Book not found" });

    console.log("Book updated in DB:", updated.pdf_url); // DEBUG

    res.json({ message: "Book updated successfully", data: updated });
  } catch (err: any) {
    console.error("Error in updateBook:", err);
    res
      .status(500)
      .json({ message: "Failed to update book", error: err.message });
  }
};

// 📘 Xóa sách
export const deleteBook = async (req: Request, res: Response) => {
  try {
    const bookId = toObjectId(req.params.id);
    if (!bookId) return res.status(400).json({ message: "Invalid book ID" });

    const deleted = await Book.findByIdAndDelete(bookId);
    if (!deleted) return res.status(404).json({ message: "Book not found" });

    res.json({ message: "Book deleted successfully" });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Failed to delete book", error: err.message });
  }
};

// 📘 Cập nhật stock sách
export const updateBookStock = async (req: Request, res: Response) => {
  try {
    const bookId = toObjectId(req.params.id);
    if (!bookId) return res.status(400).json({ message: "Invalid book ID" });

    const { stock } = req.body;
    if (typeof stock !== "number" || stock < 0)
      return res.status(400).json({ message: "Stock không hợp lệ" });

    const updated = await Book.findByIdAndUpdate(
      bookId,
      { stock },
      { new: true, runValidators: true }
    ).populate("category_id", "name slug");

    if (!updated) return res.status(404).json({ message: "Book not found" });

    res.json({ message: "Stock updated successfully", data: updated });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Failed to update stock", error: err.message });
  }
};

// 📘 Lấy danh sách sách đã mua của user
export const getPurchasedBooks = async (req: AuthRequest, res: Response) => {
  try {
    const isDev = (process.env.NODE_ENV || "development") !== "production";
    const uid = getUserIdFromToken(req as any);
    if (!uid) return res.status(401).json({ message: "Unauthenticated" });

    const userObjectId = new mongoose.Types.ObjectId(uid);

    // Join orders -> order_items (Book) -> books, group unique books
    const viaOrders = await Order.aggregate([
      { $match: { user_id: userObjectId, status: { $in: ["completed"] } } },
      {
        $lookup: {
          from: "order_items",
          localField: "_id",
          foreignField: "order_id",
          as: "items",
        },
      },
      { $unwind: "$items" },
      { $match: { "items.product_type": "Book" } },
      {
        $lookup: {
          from: "books",
          localField: "items.product_id",
          foreignField: "_id",
          as: "book",
        },
      },
      { $unwind: "$book" },
      {
        $group: {
          _id: "$book._id",
          book: { $first: "$book" },
          lastPurchasedAt: { $max: "$created_at" },
        },
      },
      { $sort: { lastPurchasedAt: -1 } },
    ]);

    let books = (viaOrders as any[]).map((row) => row.book);
    if (!books.length && isDev && String((req.query as any)?.forceAll || "0") === "1") {
      books = await Book.find({}).sort({ created_at: -1 }).limit(24).lean();
    }

    return res.json({ data: books, count: books.length });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// Alternate controller following the requested naming and logic
export const getBookOrderAndOrderitem = async (req: Request, res: Response) => {
  try {
    const isDev = (process.env.NODE_ENV || "development") !== "production";
    const uid = await resolveUserId(req);
    if (!uid) return res.status(401).json({ message: "Unauthenticated" });

    const userObjectId = new mongoose.Types.ObjectId(uid);

    const includePending = String((req.query as any)?.includePending || "0") === "1";
    const statuses = includePending && isDev ? ["completed", "pending"] : ["completed"];

    const results = await Order.aggregate([
      { $match: { user_id: userObjectId, status: { $in: statuses } } },
      {
        $lookup: {
          from: "order_items",
          localField: "_id",
          foreignField: "order_id",
          as: "items",
        },
      },
      { $unwind: "$items" },
      { $match: { "items.product_type": "Book" } },
      {
        $lookup: {
          from: "books",
          localField: "items.product_id",
          foreignField: "_id",
          as: "book",
        },
      },
      { $unwind: "$book" },
      {
        $group: {
          _id: "$book._id",
          book: { $first: "$book" },
          lastPurchasedAt: { $max: "$created_at" },
        },
      },
      { $sort: { lastPurchasedAt: -1 } },
    ]);

    let books = (results as any[]).map((r) => r.book);

    // Fallback for environments where order_items are not populated yet
    if (!books.length) {
      const orders = await Order.find({ user_id: userObjectId, status: { $in: statuses } })
        .select({ meta: 1 })
        .lean();
      const idSet = new Set<string>();
      for (const o of orders as any[]) {
        const list = Array.isArray(o?.meta?.books) ? (o.meta.books as any[]) : [];
        for (const bid of list) {
          try {
            idSet.add(String(bid));
          } catch {}
        }
      }
      if (idSet.size) {
        const ids = Array.from(idSet).map((s) => new mongoose.Types.ObjectId(s));
        books = await Book.find({ _id: { $in: ids } }).lean();
      }
    }

    return res.json({ data: books, count: books.length });
  } catch (error: any) {
    console.error("getBookOrderAndOrderitem error:", error?.message || error);
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

// Generate a downloadable/signed URL for a book PDF stored on Cloudinary
export const getBookPdfUrl = async (req: Request, res: Response) => {
  try {
    const bookId = toObjectId(req.params.id);
    if (!bookId) return res.status(400).json({ message: "Invalid book ID" });

    const book = await Book.findById(bookId).select({ pdf_url: 1, _id: 1 }).lean();
    if (!book) return res.status(404).json({ message: "Book not found" });
    if (!book.pdf_url) return res.status(404).json({ message: "No PDF available" });

    // Parse public_id and extension from a Cloudinary URL, e.g.:
    // https://res.cloudinary.com/<cloud>/raw/upload/v12345/folder/name/file.pdf
    const original = String(book.pdf_url);
    const uploadIdx = original.indexOf("/upload/");
    if (uploadIdx === -1) return res.json({ url: original }); // fallback
    let path = original.substring(uploadIdx + "/upload/".length);
    // Strip version v123... if present
    path = path.replace(/^v\d+\//, "");

    const lastDot = path.lastIndexOf(".");
    const hasExt = lastDot > -1;
    const ext = hasExt ? path.substring(lastDot + 1) : "pdf";
    const publicIdNoExt = hasExt ? path.substring(0, lastDot) : path;

    // Two modes: inline preview vs forced download
    const inlineUrl = cloudinary.url(publicIdNoExt, {
      resource_type: "raw",
      type: "upload",
      format: ext,
      flags: "inline", // fl_inline => Content-Disposition: inline
      secure: true,
      sign_url: true,
    });

    const downloadUrl = (cloudinary.utils as any).private_download_url(
      publicIdNoExt,
      ext,
      { resource_type: "raw", type: "upload", attachment: true }
    );

    const disposition = String((req.query as any)?.disposition || "inline");
    const selected = disposition === "attachment" ? downloadUrl : inlineUrl;
    return res.json({ url: selected, inline: inlineUrl, download: downloadUrl, raw: original });
  } catch (error: any) {
    console.error("getBookPdfUrl error:", error?.message || error);
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};
