import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import CourseModel from "../models/course.model";
import slugify from "slugify";

export const createCourse = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, price, category_id } = req.body;
        const teacher_id = req.user?._id;
        const slug = slugify(title, { lower: true, strict: true });
        
        const newCourse = await CourseModel.create({ title, slug, description, price, category_id, teacher_id });
        res.status(201).json(newCourse);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getPublicCourses = async (req: Request, res: Response) => {
    try {
        const courses = await CourseModel.find({ status: 'approved' }).populate('teacher_id', 'fullName avatarUrl').populate('category_id', 'name');
        res.status(200).json(courses);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllCoursesForAdmin = async (req: Request, res: Response) => {
    try {
        const courses = await CourseModel.find().populate('teacher_id', 'fullName').sort({ createdAt: -1 });
        res.status(200).json(courses);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateCourseStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: "Invalid status" });

        const course = await CourseModel.findByIdAndUpdate(id, { status }, { new: true });
        if (!course) return res.status(404).json({ message: "Course not found" });
        res.status(200).json(course);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};