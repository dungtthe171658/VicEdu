import { Router } from "express";
import { 
  autoSaveAttempt, 
  createQuiz, 
  deleteQuiz, 
  getQuizAttempts, 
  getQuizMeta, 
  getQuizz, 
  getQuizzesByLesson, 
  startQuiz, 
  submitQuiz, 
  updateQuiz,
  getQuizAttemptsByUserForAdmin,
  getQuizAttemptsByCoursesForTeacher,
  getMyQuizAttempts,
  resetQuiz,
  deleteMyQuizAttempt
} from "../controllers/quiz.controller";
import { authenticateToken, checkRole } from "../middlewares/auth";

const router = Router();

router.get("/:quizId", authenticateToken, getQuizMeta);
router.post("/:quizId/start", authenticateToken, startQuiz);
router.post("/:quizId/reset", authenticateToken, resetQuiz);
router.get("/:quizId/attempts/autosave", authenticateToken, autoSaveAttempt);
router.post("/:quizId/submit", authenticateToken, submitQuiz);

// User routes - get my quiz attempts
router.get("/my/attempts", authenticateToken, getMyQuizAttempts);
router.delete("/my/attempts/:attemptId", authenticateToken, deleteMyQuizAttempt);

router.get("/by-lesson/:lessonId", getQuizz);

router.get("/dashboard/:quizId/attempts", authenticateToken, checkRole(["admin"]), getQuizAttempts);

router.post(
    "/dashboard/",
    authenticateToken,
    checkRole(["teacher", "admin"]),
    createQuiz
);

router.get(
    "/dashboard/:lessonId",
    authenticateToken,
    checkRole(["teacher", "admin"]),
    getQuizzesByLesson
);
router.put(
    "/dashboard/:quizId",
    authenticateToken,
    checkRole(["teacher", "admin"]),
    updateQuiz
);

router.delete(
    "/dashboard/:quizId",
    authenticateToken,
    checkRole(["teacher", "admin"]),
    deleteQuiz
);

// Admin routes
router.get("/admin/attempts-by-user/:userId", authenticateToken, checkRole(["admin"]), getQuizAttemptsByUserForAdmin);

// Teacher routes
router.get("/teacher/attempts-by-courses", authenticateToken, checkRole(["teacher"]), getQuizAttemptsByCoursesForTeacher);

export default router;
