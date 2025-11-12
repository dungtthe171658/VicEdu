import { Response , Request} from "express";
import { AuthRequest } from "../middlewares/auth";
import Quiz from "../models/quiz.model";

export const createOrUpdateQuiz = async (req: AuthRequest, res: Response) => {
    res.status(501).json({ message: "Not implemented yet" });
};
export const createQuiz = async (req: Request, res: Response) => {
  try {
    const { title, lesson_id, questions, duration_seconds } = req.body;

    const existed = await Quiz.findOne({ lesson_id });
    if (existed) {
      return res.status(400).json({ message: "Quiz for this lesson already exists" });
    }

    const quiz = await Quiz.create({
      title,
      lesson_id,
      questions,
      duration_seconds, // 👈 lưu luôn, nếu FE không gửi thì schema dùng default
    });

    return res.status(201).json(quiz);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getQuizByLesson = async (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;
    const quiz = await Quiz.findOne({ lesson_id: lessonId });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const quizForClient = {
      _id: quiz._id,
      title: quiz.title,
      lesson_id: quiz.lesson_id,
      duration_seconds: quiz.duration_seconds ?? 300,
      questions: quiz.questions.map((q) => ({
        question_text: q.question_text,
        question_image: (q as any).question_image,
        images: (q as any).images,
        options: q.options,
      })),
    };

    return res.json(quizForClient);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
export const submitQuiz = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { answers } = req.body; 

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const total = quiz.questions.length;
    let correct = 0;

    quiz.questions.forEach((q, idx) => {
      if (answers && answers[idx] === q.correct_option_index) {
        correct++;
      }
    });

    return res.json({
      total,
      correct,
      score: Math.round((correct / total) * 100),
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};