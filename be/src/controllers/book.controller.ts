import { Request, Response } from "express";
import mongoose from "mongoose";
import slugify from "slugify";
import Book from "../models/book.model";

const isValidObjectId = (id: any) => mongoose.Types.ObjectId.isValid(id);

// Helper convert ID về ObjectId nếu có thể
const toObjectId = (id: any): mongoose.Types.ObjectId | null => {
  if (isValidObjectId(id)) return new mongoose.Types.ObjectId(id);
  return null;
};

// Lấy danh sách sách
export const getBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, categoryId, minPrice, maxPrice, sortBy, order } = req.query;

    const filter: Record<string, any> = { is_published: true };

    if (search) filter.title = { $regex: search, $options: "i" };

    // Chỉ thêm category_id nếu là ObjectId hợp lệ
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

    res.status(200).json(books);
  } catch (err: any) {
    res.status(500).json({ message: "Error fetching books", error: err.message });
  }
};

// Thêm sách mới
export const createBook = async (req: Request, res: Response): Promise<void> => {
  try {
    let { title, price_cents, category_id, author, description, stock, is_published, images } = req.body;

    if (!title || !price_cents || !category_id) {
      res.status(400).json({ message: "title, price_cents, category_id are required" });
      return;
    }

    const catId = toObjectId(category_id);
    if (!catId) {
      res.status(400).json({ message: "Invalid category_id" });
      return;
    }

    const slug = slugify(title, { lower: true, strict: true });

    const newBook = await Book.create({
      title,
      slug,
      author,
      description,
      price_cents,
      stock,
      category_id: catId,
      is_published,
      images,
    });

    res.status(201).json({ message: "Book created successfully", book: newBook });
  } catch (err: any) {
    res.status(500).json({ message: "Error creating book", error: err.message });
  }
};

// Lấy 1 sách theo ID
export const getBookById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const bookId = toObjectId(id);
    if (!bookId) {
      res.status(400).json({ message: "Invalid book ID" });
      return;
    }

    const book = await Book.findById(bookId).populate("category_id", "name slug");

    if (!book) {
      res.status(404).json({ message: "Book not found" });
      return;
    }

    res.status(200).json(book);
  } catch (err: any) {
    res.status(500).json({ message: "Error fetching book", error: err.message });
  }
};

// Cập nhật sách
export const updateBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const bookId = toObjectId(id);
    if (!bookId) {
      res.status(400).json({ message: "Invalid book ID" });
      return;
    }

    if (req.body.category_id) {
      const catId = toObjectId(req.body.category_id);
      if (!catId) {
        res.status(400).json({ message: "Invalid category_id" });
        return;
      }
      req.body.category_id = catId;
    }

    if (req.body.title) {
      req.body.slug = slugify(req.body.title, { lower: true, strict: true });
    }

    const updatedBook = await Book.findByIdAndUpdate(bookId, req.body, { new: true, runValidators: true }).populate("category_id", "name slug");

    if (!updatedBook) {
      res.status(404).json({ message: "Book not found" });
      return;
    }

    res.status(200).json({ message: "Book updated successfully", book: updatedBook });
  } catch (err: any) {
    res.status(500).json({ message: "Error updating book", error: err.message });
  }
};

// Ẩn sách
export const hideBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const bookId = toObjectId(id);
    if (!bookId) {
      res.status(400).json({ message: "Invalid book ID" });
      return;
    }

    const book = await Book.findByIdAndUpdate(bookId, { is_published: false }, { new: true }).populate("category_id", "name slug");

    if (!book) {
      res.status(404).json({ message: "Book not found" });
      return;
    }

    res.status(200).json({ message: "Book hidden successfully", book });
  } catch (err: any) {
    res.status(500).json({ message: "Error hiding book", error: err.message });
  }
};

// Xóa sách
export const deleteBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const bookId = toObjectId(id);
    if (!bookId) {
      res.status(400).json({ message: "Invalid book ID" });
      return;
    }

    const deletedBook = await Book.findByIdAndDelete(bookId).populate("category_id", "name slug");

    if (!deletedBook) {
      res.status(404).json({ message: "Book not found" });
      return;
    }

    res.status(200).json({ message: "Book deleted permanently", book: deletedBook });
  } catch (err: any) {
    res.status(500).json({ message: "Error deleting book", error: err.message });
  }
};
