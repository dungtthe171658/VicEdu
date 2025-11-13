import { Request, Response } from "express";
import mongoose from "mongoose";
import slugify from "slugify";
import Book from "../models/book.model";
import OrderItemModel from "../models/order_item.model";
import Order from "../models/order.model";
import { AuthRequest } from "../middlewares/auth";

const toObjectId = (id: any) =>
  mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;

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
    const userId =
      typeof req.user === "object" && "id" in req.user
        ? String(req.user.id)
        : undefined;

    if (!userId) return res.status(401).json({ message: "Unauthenticated" });

    const orders = await Order.find({
      user_id: userId,
      status: "completed",
    }).lean();

    const bookIds: mongoose.Types.ObjectId[] = [];
    orders.forEach((o) => {
      if (o.meta?.books) {
        bookIds.push(
          ...o.meta.books.map((b: string) => new mongoose.Types.ObjectId(b))
        );
      }
    });

    const books = await Book.find({ _id: { $in: bookIds } }).lean();
    return res.json({ data: books, count: books.length });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};