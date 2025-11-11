export interface QuizQuestion {
    question_text?: string;
    question_image?: string;
    images?: string[];
    options: string[];
}

export interface Quiz {
    _id: string;
    title: string;
    lesson_id: string;
    duration_seconds?: number;
    questions: QuizQuestion[];
}

export interface QuizSubmitResult {
    total: number;
    correct: number;
    score: number;
}