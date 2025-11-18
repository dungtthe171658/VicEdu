import { Response, Request } from "express";
import { AuthRequest } from "../middlewares/auth";
import mongoose from "mongoose";
import Quiz from "../models/quiz.model";
import QuizAttempt from "../models/QuizAttempt.model";
import LessonModel from "../models/lesson.model";
import CourseModel from "../models/course.model";



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

// [Admin] Get quiz attempts by user ID
export const getQuizAttemptsByUserForAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    const attempts = await QuizAttempt.find({ user_id: userObjectId })
      .populate("user_id", "name email")
      .sort({ _id: -1 })
      .lean();

    // Manually populate quiz data since quiz_id is a String, not ObjectId
    const attemptsWithQuiz = await Promise.all(
      attempts.map(async (attempt: any) => {
        const quiz = await Quiz.findById(attempt.quiz_id)
          .populate({
            path: "lesson_id",
            select: "title course_id",
            populate: {
              path: "course_id",
              select: "title slug",
            },
          })
          .lean();

        return {
          ...attempt,
          quiz: quiz || null,
        };
      })
    );

    return res.json(attemptsWithQuiz);
  } catch (e: any) {
    console.error("getQuizAttemptsByUserForAdmin error:", e);
    return res.status(500).json({ message: e.message });
  }
};

// [Teacher] Get quiz attempts by course IDs
export const getQuizAttemptsByCoursesForTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const uid = getUserIdFromToken(req);
    if (!uid) return res.status(401).json({ message: "Unauthenticated" });

    const { courseIds } = req.query;
    if (!courseIds) {
      return res.status(400).json({ message: "courseIds query parameter is required" });
    }

    // Parse courseIds - can be comma-separated string or array
    let courseIdArray: string[] = [];
    if (typeof courseIds === "string") {
      courseIdArray = courseIds.split(",").map((id) => id.trim());
    } else if (Array.isArray(courseIds)) {
      courseIdArray = courseIds.map((id) => String(id));
    }

    // Validate ObjectIds
    const validCourseIds = courseIdArray
      .filter((id) => mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (validCourseIds.length === 0) {
      return res.json([]);
    }

    // Verify that these courses belong to the teacher
    const teacherObjectId = new mongoose.Types.ObjectId(uid);
    const courses = await CourseModel.find({
      _id: { $in: validCourseIds },
      teacher: teacherObjectId,
    }).select("_id").lean();

    const verifiedCourseIds = courses.map((c: any) => c._id);
    
    if (verifiedCourseIds.length === 0) {
      return res.json([]);
    }

    // Get all lessons for these courses
    const lessons = await LessonModel.find({
      course_id: { $in: verifiedCourseIds },
    }).select("_id").lean();

    const lessonIds = lessons.map((l: any) => l._id);
    
    if (lessonIds.length === 0) {
      return res.json([]);
    }

    // Get all quizzes for these lessons
    const quizzes = await Quiz.find({
      lesson_id: { $in: lessonIds },
    }).select("_id").lean();

    const quizIds = quizzes.map((q: any) => String(q._id));
    
    if (quizIds.length === 0) {
      return res.json([]);
    }

    // Get all attempts for these quizzes
    const attempts = await QuizAttempt.find({
      quiz_id: { $in: quizIds },
    })
      .populate("user_id", "name email")
      .sort({ _id: -1 })
      .lean();

    // Manually populate quiz data since quiz_id is a String, not ObjectId
    const attemptsWithQuiz = await Promise.all(
      attempts.map(async (attempt: any) => {
        const quiz = await Quiz.findById(attempt.quiz_id)
          .populate({
            path: "lesson_id",
            select: "title course_id",
            populate: {
              path: "course_id",
              select: "title slug",
            },
          })
          .lean();

        return {
          ...attempt,
          quiz: quiz || null,
        };
      })
    );

    return res.json(attemptsWithQuiz);
  } catch (e: any) {
    console.error("getQuizAttemptsByCoursesForTeacher error:", e);
    return res.status(500).json({ message: e.message });
  }
};

