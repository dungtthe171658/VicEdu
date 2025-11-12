import { Router } from "express";
import { createQuiz, getQuizByLesson, submitQuiz } from "../controllers/quiz.controller";

const router = Router();

router.post("/", createQuiz);
router.get("/by-lesson/:lessonId", getQuizByLesson);
router.post("/:id/submit", submitQuiz);

export default router;
