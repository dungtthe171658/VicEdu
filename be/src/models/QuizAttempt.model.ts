import mongoose from "mongoose";

const QuizAttemptSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  quiz_id: String,
  answers: { type: [Number], default: [] },
  spent_seconds: { type: Number, default: 0 },
  violations: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  correct: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  submitted_at: { type: Date, default: null }, // Thời gian nộp bài
}, {
  timestamps: true // Tự động thêm createdAt và updatedAt
});

export default mongoose.model("QuizAttempt", QuizAttemptSchema);
