export interface QuizQuestion {
    correct_option_index?: number;
    question_text?: string;
    question_image?: string;
    images?: string[];
    options: string[];
}

export interface Quiz1 {
    _id: string;
    title: string;
    lesson_id: string;
    duration_seconds?: number;
    questions: QuizQuestion[];
    in_progress ?: boolean
}
export interface Quiz {
    _id: string;
    title: string;
    lesson_id: string;
    duration_seconds: number;
    questions: QuizQuestion[];
    in_progress: boolean;
    completed?: boolean;

    progress?: {
        answers?: number[];
        spent_seconds?: number;
        violations?: number;
        correct?: number;
        total?: number;
        score?: number;
    };
}
export interface QuizStartResponse {
    questions: QuizQuestion[];
    answers: number[];
    spent_seconds: number;
    violations: number;
    completed?: boolean;
}

export interface QuizSubmitResult {
    total: number;
    correct: number;
    score: number;
}