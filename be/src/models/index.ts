// src/models/index.ts

// Export tất cả các named exports (như interfaces, enums) từ mỗi file
export * from "./user.model";
export * from "./otp.model";
export * from "./book.model";
export * from "./category.model";
export * from "./course.model";
export * from "./lesson.model";
export * from "./quiz.model";
export * from "./order.model";
export * from "./order_item.model";
export * from "./review.model";
export * from "./enrollment.model";
export * from "./chat.model";
export * from "./cart.model";

// Export riêng các 'default' export và đặt tên cho chúng
export { default as UserModel } from "./user.model";
export { default as OtpModel } from "./otp.model";
export { default as BookModel } from "./book.model";
export { default as CategoryModel } from "./category.model";
export { default as CourseModel } from "./course.model";
export { default as LessonModel } from "./lesson.model";
export { default as QuizModel } from "./quiz.model";
export { default as OrderModel } from "./order.model";
export { default as OrderItemModel } from "./order_item.model";
export { default as ReviewModel } from "./review.model";
export { default as EnrollmentModel } from "./enrollment.model";
export { default as ChatModel } from "./chat.model";
export { default as CartModel } from "./cart.model";
