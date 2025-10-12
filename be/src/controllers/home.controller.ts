import { Request, Response } from "express";
import { Setting } from "../models/setting.model";

export class HomeController {
    async getSettings(req: Request, res: Response) {
        try {
            const settings = await Setting.find();
            return res.status(200).json({
                success: true,
                data: settings,
            });
        } catch (err) {
            console.error("Error fetching settings:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch settings",
            });
        }
    }
}

export const homeController = new HomeController();
