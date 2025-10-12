import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import ReviewModel from "../models/review.model";

export const createReview = async (req: AuthRequest, res: Response) => {
    try {
        const { product_id, product_type, rating, comment } = req.body;
        const user_id = req.user?._id;
        
        const newReview = await ReviewModel.create({ user_id, product_id, product_type, rating, comment });
        res.status(201).json(newReview);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const approveReview = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const review = await ReviewModel.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
        if (!review) return res.status(404).json({ message: "Review not found" });
        res.status(200).json(review);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};