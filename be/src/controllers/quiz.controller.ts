import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
// ... (import các model cần thiết khác)

export const createOrUpdateQuiz = async (req: AuthRequest, res: Response) => {
    res.status(501).json({ message: "Not implemented yet" });
};