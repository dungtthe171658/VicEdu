import { Request, Response } from "express";
import CategoryModel from "../models/category.model";
import slugify from "slugify";

export const createCategory = async (req: Request, res: Response) => {
    try {
        const { name, type } = req.body;
        if (!name || !type) return res.status(400).json({ message: "Name and type are required" });
        
        const slug = slugify(name, { lower: true, strict: true });
        const newCategory = await CategoryModel.create({ name, slug, type });
        res.status(201).json(newCategory);
    } catch (error: any) {
        if (error.code === 11000) return res.status(409).json({ message: "Category name already exists" });
        res.status(500).json({ message: error.message });
    }
};

export const getCategories = async (req: Request, res: Response) => {
    try {
        const { type } = req.query;
        const filter = type ? { type } : {};
        const categories = await CategoryModel.find(filter);
        res.status(200).json(categories);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};