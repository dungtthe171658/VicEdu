import { Router } from "express";
import { autoSaveAttempt, createQuiz, deleteQuiz, getQuizAttempts, getQuizMeta, getQuizz, getQuizzesByLesson, startQuiz, submitQuiz, updateQuiz } from "../controllers/quiz.controller";
import { authenticateToken, checkRole } from "../middlewares/auth";

const router = Router();

router.get("/:quizId", authenticateToken, getQuizMeta);
router.post("/:quizId/start", authenticateToken, startQuiz);
router.get("/:quizId/attempts/autosave", authenticateToken, autoSaveAttempt);
router.post("/:quizId/submit", authenticateToken, submitQuiz);

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
export default router;
