import { Router } from "express";
import { translateSubtitles, getLessonSubtitles, saveLessonSubtitles, autoGenerateFromAudio } from "../controllers/subtitle.controller";
import { authenticateToken } from "../middlewares/auth";

const router = Router();

// require auth to prevent abuse; adjust as needed
router.use(authenticateToken);

router.post('/translate', translateSubtitles);
router.get('/:lessonId', getLessonSubtitles);
router.post('/:lessonId/auto-generate', autoGenerateFromAudio);
router.post('/:lessonId/save', saveLessonSubtitles);

export default router;
