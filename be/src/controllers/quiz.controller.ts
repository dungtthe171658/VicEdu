import { Response, Request } from "express";
import { AuthRequest } from "../middlewares/auth";
import Quiz from "../models/quiz.model";

import QuizAttempt from "../models/QuizAttempt.model";



export const getQuizAttempts = async (req: AuthRequest, res: Response) => {
  try {
    const { quizId } = req.params;

    const attempts = await QuizAttempt.find({ quiz_id: quizId })
      .populate("user_id", "name email")
      .sort({ _id: -1 });

    return res.json(attempts);
  } catch (e: any) {
    console.error("getQuizAttempts error:", e);
    return res.status(500).json({ message: e.message });
  }
};


function getUserIdFromToken(req: AuthRequest & { user?: any }): string | null {
  const u = (req as any).user as any;
  const id = u?._id?.toString?.() || u?.id?.toString?.();
  return id || null;
}

export const updateQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const { quizId } = req.params;
    const { title, duration_seconds, questions } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (title !== undefined) quiz.title = title;
    if (duration_seconds !== undefined)
      quiz.duration_seconds = duration_seconds;

    if (Array.isArray(questions)) {
      quiz.questions = questions.map((q) => ({
        question_text: q.question_text || "",
        question_image: q.question_image || null,
        images: Array.isArray(q.images) ? q.images : [],
        options: Array.isArray(q.options) ? q.options : [],
        correct_option_index: q.correct_option_index,
      }));
    }

    await quiz.save();

    return res.json(quiz);
  } catch (err) {
    console.error("updateQuiz error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findByIdAndDelete(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    return res.json({ message: "Quiz deleted" });
  } catch (err) {
    console.error("deleteQuiz error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const getQuizzesByLesson = async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId } = req.params;

    if (!lessonId) {
      return res.status(400).json({ message: "Missing lessonId" });
    }

    const quizzes = await Quiz.find({ lesson_id: lessonId }).sort({
      createdAt: -1,
    });

    // Có thể trả mảng rỗng, FE handle
    return res.json(quizzes);
  } catch (err) {
    console.error("getQuizzesByLesson error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const createQuiz = async (req: Request, res: Response) => {
  try {
    const { title, lesson_id, questions, duration_seconds } = req.body;

    // const existed = await Quiz.findOne({ lesson_id });
    // if (existed) {
    //   return res.status(400).json({ message: "Quiz for this lesson already exists" });
    // }

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
export const autoSaveAttempt = async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const userId = getUserIdFromToken(req);
    const { answers, spent_seconds, violations } = req.body;

    await QuizAttempt.updateOne(
      { quiz_id: quizId, user_id: userId, completed: false },
      { answers, spent_seconds, violations }
    );

    res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ message: e.message });
  }
};

export const getQuizMeta = async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const userId = getUserIdFromToken(req);

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const attempt = await QuizAttempt.findOne({ quiz_id: quizId, user_id: userId });

    return res.json({
      _id: quiz._id,
      title: quiz.title,
      lesson_id: quiz.lesson_id,
      duration_seconds: quiz.duration_seconds,

      status: attempt
        ? attempt.completed
          ? "completed"
          : "in_progress"
        : "not_started",
      completed: attempt ? attempt.completed : false,
      in_progress: attempt ? !attempt.completed : false,

      progress: !attempt
        ? null // chưa làm bao giờ
        : attempt.completed
          ? {
            correct: attempt.correct,
            total: attempt.total,
            score: attempt.score,
            violations: attempt.violations,

          }
          : {
            answers: attempt.answers,
            spent_seconds: attempt.spent_seconds,
            violations: attempt.violations
          }
    });


  } catch (e: any) {
    return res.status(500).json({ message: e.message });
  }
};

export const startQuiz = async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const userId = getUserIdFromToken(req);
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    let attempt = await QuizAttempt.findOne({
      quiz_id: quizId,
      user_id: userId
    });

    if (!attempt) {
      attempt = await QuizAttempt.create({
        quiz_id: quizId,
        user_id: userId,
        answers: new Array(quiz.questions.length).fill(-1),
      });
    }
    if (attempt && attempt.completed) {
      return res.status(400).json({ message: "Quiz already completed" });
    }

    return res.json({
      questions: quiz.questions.map((q, i) => ({
        ...(q.toObject ? q.toObject() : q),  // nếu là Subdocument: toObject()
        _originalIndex: i
      })),
      answers: attempt.answers,
      spent_seconds: attempt.spent_seconds,
      violations: attempt.violations,
      completed: attempt.completed
    });
  } catch (e: any) {
    return res.status(500).json({ message: e.message });
  }
};

export const getQuizz = async (req: Request, res: Response) => {
  try {
    // Check if this is called from /by-lesson/:lessonId route
    const lessonId = (req.params as any).lessonId;
    if (lessonId) {
      // Get first quiz for this lesson (or all quizzes)
      const quizzes = await Quiz.find({ lesson_id: lessonId }).sort({ createdAt: -1 });
      if (quizzes.length === 0) {
        return res.status(404).json({ message: "No quiz found for this lesson" });
      }
      // Return first quiz (most recent)
      const quiz = quizzes[0];
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
    }

    // Otherwise, treat as quizId
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId);

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
    const { quizId } = req.params;
    const userId = getUserIdFromToken(req);
    const { answers, spent_seconds, violations } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correct_option_index) correct++;
    });

    const score = Math.round((correct / quiz.questions.length) * 100);

    await QuizAttempt.updateOne(
      { quiz_id: quizId, user_id: userId },
      {
        answers,
        spent_seconds,
        violations,
        correct,
        total: quiz.questions.length,
        score: score,
        completed: true
      }
    );

    res.json({ correct, total: quiz.questions.length, score });
  } catch (e: any) {
    return res.status(500).json({ message: e.message });
  }
};

