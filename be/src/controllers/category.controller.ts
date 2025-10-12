import { Request, Response } from "express";
import Category from "../models/category.model";

// Lấy toàn bộ thể loại
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách thể loại" });
  }
};

// Lấy chi tiết 1 thể loại
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Không tìm thấy thể loại" });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy chi tiết thể loại" });
  }
};
