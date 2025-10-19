// src/controllers/book.controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import slugify from "slugify";
import Book from "../models/book.model";

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

    const books = await Book.find(filter)
      .populate("category_id", "name slug")
      .sort(sort)
      .lean();

    res.json(books);
  } catch (err: any) {
    res.status(500).json({ message: "Error fetching books", error: err.message });
  }
};

// 📘 Lấy chi tiết 1 sách
export const getBookById = async (req: Request, res: Response) => {
  try {
    const bookId = toObjectId(req.params.id);
    if (!bookId) return res.status(400).json({ message: "Invalid book ID" });

    const book = await Book.findById(bookId).populate("category_id", "name slug");
    if (!book) return res.status(404).json({ message: "Book not found" });

    res.json(book);
  } catch (err: any) {
    res.status(500).json({ message: "Error fetching book", error: err.message });
  }
};

// 📘 Tạo sách mới
export const createBook = async (req: Request, res: Response) => {
  try {
    const { title, price_cents, category_id } = req.body;
    if (!title || !price_cents || !category_id)
      return res.status(400).json({ message: "title, price_cents, category_id are required" });

    const catId = toObjectId(category_id);
    if (!catId) return res.status(400).json({ message: "Invalid category_id" });

    const slug = slugify(title, { lower: true, strict: true });
    const book = await Book.create({ ...req.body, slug, category_id: catId });

    res.status(201).json(book);
  } catch (err: any) {
    res.status(500).json({ message: "Error creating book", error: err.message });
  }
};

// 📘 Cập nhật sách
export const updateBook = async (req: Request, res: Response) => {
  try {
    const bookId = toObjectId(req.params.id);
    if (!bookId) return res.status(400).json({ message: "Invalid book ID" });

    const updateData = { ...req.body };
    if (updateData.title)
      updateData.slug = slugify(updateData.title, { lower: true, strict: true });
    if (updateData.category_id)
      updateData.category_id = toObjectId(updateData.category_id);

    const updated = await Book.findByIdAndUpdate(bookId, updateData, {
      new: true,
      runValidators: true,
    }).populate("category_id", "name slug");

    if (!updated) return res.status(404).json({ message: "Book not found" });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: "Error updating book", error: err.message });
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
    res.status(500).json({ message: "Error deleting book", error: err.message });
  }
};
