import { Request, Response } from "express";
import OrderModel from "../models/order.model";
import EnrollmentModel from "../models/enrollment.model";
import OrderItemModel from "../models/order_item.model";

export const handlePaymentCallback = async (req: Request, res: Response) => {
    try {
        const { vnp_TxnRef, vnp_ResponseCode } = req.query; // Ví dụ với VNPay
        const orderId = vnp_TxnRef as string;

        if (vnp_ResponseCode === '00') {
            await OrderModel.findByIdAndUpdate(orderId, { status: 'completed', payment_method: 'VNPay' });
            
            // Logic quan trọng: Tạo Enrollment cho các khóa học trong đơn hàng
            const orderItems = await OrderItemModel.find({ order_id: orderId, product_type: 'Course' });
            const order = await OrderModel.findById(orderId);
            if (order) {
                for (const item of orderItems) {
                    await EnrollmentModel.create({ user_id: order.user_id, course_id: item.product_id });
                }
            }
        } else {
            await OrderModel.findByIdAndUpdate(orderId, { status: 'failed' });
        }
        // Redirect người dùng về trang kết quả thanh toán trên frontend
        res.redirect(`http://localhost:5173/payment-result?orderId=${orderId}`);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};