import axios from "./axios.ts";
import type {Quiz, QuizStartResponse, QuizSubmitResult} from "@/types/quiz";

const quizApi = {

    getByLessonDashboad: (lessonId: string): Promise<Quiz[]> =>
        axios.get(`/quizzes/dashboard/${lessonId}`),
    getDetail: (quizId: string): Promise<Quiz> =>
        axios.get(`/quizzes/dashboard/${quizId}`),
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
    }): Promise<Quiz> => axios.post("/quizzes/dashboard", payload),
    update: (
        quizId: string,
        payload: {
            title?: string;
            duration_seconds?: number;
            questions?: Array<{
                question_text?: string;
                question_image?: string;
                images?: string[];
                options: string[];
                correct_option_index: number;
            }>;
        }
    ): Promise<Quiz> => axios.put(`/quizzes/dashboard/${quizId}`, payload),

    delete: (quizId: string): Promise<void> =>
        axios.delete(`/quizzes/dashboard/${quizId}`),
    getAttempts(quizId: string) {
        return axios.get(`/quizzes/dashboard/${quizId}/attempts`).then(res => res);
    },
    get: (id: string, attemptId?: string): Promise<Quiz> =>
        axios.get(`/quizzes/${id}`, attemptId ? { params: { attemptId } } : undefined),
    getByLesson: (lessonId: string): Promise<Quiz> =>
        axios.get(`/quizzes/by-lesson/${lessonId}`),
    start(quizId: string, attemptId?: string): Promise<QuizStartResponse> {
        return axios.post(`/quizzes/${quizId}/start`, {}, attemptId ? { params: { attemptId } } : undefined);
    },
    reset(quizId: string): Promise<{ message: string }> {
        return axios.post(`/quizzes/${quizId}/reset`);
    },
    autoSave(quizId: string, payload: any) {
        return axios.post(`/quizzes/${quizId}/autosave`, payload);
    },
    submit: (quizId: string, payload: any) =>
        axios.post(`/quizzes/${quizId}/submit`, payload),
    startAttempt: (quizId: string) =>
        axios.post(`/quizzes/${quizId}/attempts/start`),

    // ➕ log kết quả bài làm
    logAttempt: (
        quizId: string,
        payload: {
            answers: number[];
            violations: number;
            spent_seconds: number;
            score?: number;
            total?: number;
            correct?: number;
        }
    ) => axios.post(`/quizzes/${quizId}/attempts/log`, payload),

    // [Admin] Get quiz attempts by user ID
    getAttemptsByUserForAdmin: (userId: string): Promise<any[]> =>
        axios.get(`/quizzes/admin/attempts-by-user/${userId}`),

    // [Teacher] Get quiz attempts by course IDs
    getAttemptsByCoursesForTeacher: (courseIds: string[]): Promise<any[]> =>
        axios.get(`/quizzes/teacher/attempts-by-courses`, {
            params: { courseIds: courseIds.join(",") },
        }),

    // [User] Get my quiz attempts
    getMyAttempts: (): Promise<any[]> =>
        axios.get(`/quizzes/my/attempts`),
    
    // [User] Delete my quiz attempt
    deleteMyAttempt: (attemptId: string): Promise<{ message: string }> =>
        axios.delete(`/quizzes/my/attempts/${attemptId}`),
};

export default quizApi;
