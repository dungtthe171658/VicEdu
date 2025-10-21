import mongoose, { Schema, Document, Model } from "mongoose";

interface IQuestion {
  question_text: string;
  options: string[];
  correct_option_index: number;
}

export interface IQuiz extends Document {
  title: string;
  lesson_id: mongoose.Types.ObjectId;
  questions: IQuestion[];
}

const questionSchema = new Schema<IQuestion>({
  question_text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correct_option_index: { type: Number, required: true },
}, { _id: false });

const quizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true },
    lesson_id: { type: Schema.Types.ObjectId, ref: "Lesson", required: true, unique: true },
    questions: [questionSchema],
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "quizzes" }
);


export default mongoose.model<IQuiz>("Quiz", quizSchema);