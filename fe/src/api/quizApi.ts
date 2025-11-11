import axios from "./axios.ts";
import type {Quiz, QuizSubmitResult} from "@/types/quiz";

const quizApi = {
    getByLesson: (lessonId: string): Promise<Quiz> =>
        axios.get(`/quizzes/by-lesson/${lessonId}`),

    submit: (quizId: string, answers: number[]): Promise<QuizSubmitResult> =>
        axios.post(`/quizzes/${quizId}/submit`, { answers }),

    create: (payload: {
        title: string;
        lesson_id: string;
        duration_seconds?: number;
        questions: Array<{
            question_text?: string;
            question_image?: string;
            images?: string[];
            options: string[];
            correct_option_index: number;
        }>;
    }): Promise<Quiz> => axios.post("/quizzes", payload),
};

export default quizApi;
