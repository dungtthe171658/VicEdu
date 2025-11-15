import { Request, Response } from "express";
import CategoryModel from "../models/category.model";
import slugify from "slugify";

// --- Create category ---
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name)
      return res.status(400).json({ message: "Name is required" });

    const slug = slugify(name, { lower: true, strict: true });
    const newCategory = await CategoryModel.create({ name, slug, description });
    res.status(201).json(newCategory);
  } catch (error: any) {
    if (error.code === 11000)
      return res.status(409).json({ message: "Category name already exists" });
    res.status(500).json({ message: error.message });
  }
};

// --- Get all categories ---
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await CategoryModel.find({}).sort({ name: 1 });
    res.status(200).json(categories);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// --- Get category by ID ---
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const category = await CategoryModel.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Không tìm thấy thể loại" });
    res.json(category);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// --- Update category ---
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const slug = slugify(name, { lower: true, strict: true });
    
    const category = await CategoryModel.findByIdAndUpdate(
      id,
      { name, slug, description },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(category);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Category name already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};

// --- Delete category ---
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const category = await CategoryModel.findByIdAndDelete(id);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};