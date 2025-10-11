import { Request, Response } from "express";
import mongoose from "mongoose";
import slugify from "slugify";
import Book from "../models/book.model"; 
// --- Helper kiểm tra ObjectId ---
const isValidObjectId = (id: any) => mongoose.Types.ObjectId.isValid(id);

// ✅ Lấy danh sách sách (với filter, sort, populate)
export const getBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, categoryId, minPrice, maxPrice, sortBy, order } = req.query;

    const filter: Record<string, any> = { is_published: true };

    // --- Tìm kiếm theo tiêu đề ---
    if (search) filter.title = { $regex: search, $options: "i" };

    // --- Lọc theo danh mục ---
    if (categoryId && isValidObjectId(categoryId)) {
      filter.category_id = categoryId; // ✅ đổi category -> category_id
    }

    // --- Lọc theo giá ---
    if (minPrice || maxPrice) {
      filter.price_cents = {};
      if (minPrice) filter.price_cents.$gte = Number(minPrice);
      if (maxPrice) filter.price_cents.$lte = Number(maxPrice);
    }

    // --- Sắp xếp ---
    let sort: Record<string, 1 | -1> = { created_at: -1 }; // mặc định: mới nhất trước
    const dir = order === "asc" ? 1 : -1;
    if (sortBy === "price") sort = { price_cents: dir };
    else if (sortBy === "title") sort = { title: dir };

    // --- Lấy dữ liệu ---
    const books = await Book.find(filter)
      .populate("category_id", "name slug") // ✅ populate đúng tên field và chọn field cần lấy
      .sort(sort)
      .lean()
      .exec();

    res.status(200).json(books);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error fetching books", error: err.message });
  }
};

// ✅ Lấy chi tiết 1 sách theo ID
export const getBookById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ message: "Invalid book ID" });
      return;
    }

    const book = await Book.findById(id).populate("category_id", "name slug"); // ✅ đổi đúng field

    if (!book) {
      res.status(404).json({ message: "Book not found" });
      return;
    }

    res.status(200).json(book);
  } catch (err: any) {
    res.status(500).json({ message: "Error fetching book", error: err.message });
  }
};

// ✅ Thêm sách mới
export const createBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, price_cents, category_id, author, description, stock, is_published } = req.body;

    if (!title || !price_cents || !category_id) {
      res.status(400).json({ message: "Invalid input: title, price_cents, and category_id are required" });
      return;
    }

    const newBook = await Book.create({
      title,
      price_cents,
      category_id,
      author,
      description,
      stock,
      is_published,
    });

    res.status(201).json(newBook);
  } catch (err: any) {
    res.status(500).json({ message: "Error creating book", error: err.message });
  }
};

// ✅ Cập nhật thông tin sách theo id 
export const updateBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ message: "Invalid book ID" });
      return;
    }

    const updatedBook = await Book.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate("category_id", "name slug");

    if (!updatedBook) {
      res.status(404).json({ message: "Book not found" });
      return;
    }

    res.status(200).json({
      message: "Book updated successfully",
      book: updatedBook,
    });
  } catch (err: any) {
    res.status(500).json({ message: "Error updating book", error: err.message });
  }
};

// ✅ Ẩn sách (Soft delete)
export const hideBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ message: "Invalid book ID" });
      return;
    }

    const book = await Book.findByIdAndUpdate(
      id,
      { is_published: false },
      { new: true }
    ).populate("category_id", "name slug");

    if (!book) {
      res.status(404).json({ message: "Book not found" });
      return;
    }

    res.status(200).json({
      message: "Book hidden successfully",
      book,
    });
  } catch (err: any) {
    res.status(500).json({ message: "Error hiding book", error: err.message });
  }
};

// ✅ Xóa vĩnh viễn (Hard delete)
export const deleteBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ message: "Invalid book ID" });
      return;
    }

    const deletedBook = await Book.findByIdAndDelete(id).populate(
      "category_id",
      "name slug"
    );

    if (!deletedBook) {
      res.status(404).json({ message: "Book not found" });
      return;
    }

    res.status(200).json({
      message: "Book deleted permanently",
      book: deletedBook,
    });
  } catch (err: any) {
    res.status(500).json({ message: "Error deleting book", error: err.message });
  }
};