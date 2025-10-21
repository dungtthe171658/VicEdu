import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import ReviewModel from "../models/review.model";

// User tạo review
export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const { product_id, product_type, rating, comment } = req.body;
    const user_id = (req.user as { _id: string })._id;
    const newReview = await ReviewModel.create({ user_id, product_id, product_type, rating, comment });
    res.status(201).json(newReview);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Admin approve review
export const approveReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const review = await ReviewModel.findByIdAndUpdate(id, { status: "approved" }, { new: true });
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.status(200).json(review);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get tất cả reviews
export const getAllReviews = async (req: AuthRequest, res: Response) => {
  try {
    const reviews = await ReviewModel.find()
      .populate("user_id", "name email")
      .populate({ path: "product_id", select: "title name" })
      .sort({ created_at: -1 });
    res.status(200).json(reviews);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Admin xóa review
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await ReviewModel.findByIdAndDelete(id);
    res.status(200).json({ message: "Xóa đánh giá thành công" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
