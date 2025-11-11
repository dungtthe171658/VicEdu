import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuestion {
  question_text?: string;
  question_image?: string;
  images?: string[];
  options: string[];
  correct_option_index: number;
}
export interface IQuiz extends Document {
  title: string;
  lesson_id: mongoose.Types.ObjectId;
  questions: IQuestion[];
  duration_seconds: number;
}

const questionSchema = new Schema<IQuestion>(
  {
    question_text: { type: String },
    question_image: { type: String },
    images: [{ type: String }],
    options: [{ type: String, required: true }],
    correct_option_index: { type: Number, required: true },
  },
  { _id: false }
);

const quizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true },
    lesson_id: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      unique: true,
    },
    questions: [questionSchema],
    duration_seconds: { type: Number, default: 300 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "quizzes",
  }
);

export default mongoose.model<IQuiz>("Quiz", quizSchema);