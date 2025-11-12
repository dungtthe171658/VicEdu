import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import type { Quiz, QuizSubmitResult } from "@/types/quiz";
import quizApi from "@/api/quizApi";

const shuffleArray = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const QuizPage: React.FC = () => {
    const { lessonId } = useParams<{ lessonId: string }>();

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    // answers sẽ theo THỨ TỰ HIỂN THỊ (đã shuffle)
    const [answers, setAnswers] = useState<number[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<QuizSubmitResult | null>(null);
    const [error, setError] = useState("");
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [violations, setViolations] = useState<number>(0);
    const lastViolationRef = useRef<number>(0);

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    useEffect(() => {
        if (!lessonId) return;
        setLoading(true);
        setError("");
        quizApi
            .getByLesson(lessonId)
            .then((data) => {
                // gắn index gốc để khi nộp còn map lại
                const questionsWithIndex = data.questions.map((q, idx) => ({
                    ...q,
                    _originalIndex: idx,
                })) as any[];

                const shuffled = shuffleArray(questionsWithIndex);

                setQuiz({
                    ...data,
                    questions: shuffled as any,
                });

                setAnswers(new Array(shuffled.length).fill(-1));

                const apiDuration =
                    data.duration_seconds && data.duration_seconds > 0
                        ? data.duration_seconds
                        : 300;
                setTimeLeft(apiDuration);
            })
            .catch(() => setError("Không tải được quiz"))
            .finally(() => setLoading(false));
    }, [lessonId]);

    const addViolation = useCallback(() => {
        const now = Date.now();
        if (now - lastViolationRef.current < 2000) return;
        lastViolationRef.current = now;
        setViolations((v) => v + 1);
    }, []);

    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden) addViolation();
        };
        const handleBlur = () => addViolation();
        const handleMouseLeave = (e: MouseEvent) => {
            if (
                e.clientY <= 0 ||
                e.clientX <= 0 ||
                e.clientX >= window.innerWidth ||
                e.clientY >= window.innerHeight
            ) {
                addViolation();
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener("blur", handleBlur);
        document.addEventListener("mouseleave", handleMouseLeave);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener("blur", handleBlur);
            document.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [addViolation]);

    // timer
    useEffect(() => {
        if (!quiz || result || timeLeft === null) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev && prev > 1) return prev - 1;
                clearInterval(timer);
                handleSubmit(true);
                return 0;
            });
        }, 1000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quiz, result, timeLeft]);

    const handleSelect = (optIdx: number) => {
        const next = [...answers];
        next[currentIndex] = optIdx;
        setAnswers(next);
    };

    const handleSubmit = (auto = false) => {
        if (!quiz || submitting) return;
        setSubmitting(true);

        // tạo mảng theo thứ tự gốc
        const originalAnswers = new Array(quiz.questions.length).fill(-1);
        quiz.questions.forEach((q: any, displayIdx) => {
            const originIdx = typeof q._originalIndex === "number" ? q._originalIndex : displayIdx;
            originalAnswers[originIdx] = answers[displayIdx];
        });

        quizApi
            .submit(quiz._id, originalAnswers)
            .then((res) => {
                setResult(res);
                if (auto) console.log("Auto submit vì hết giờ");
            })
            .catch(() => setError("Nộp bài thất bại"))
            .finally(() => setSubmitting(false));
    };

    const goNext = () => {
        if (!quiz) return;
        setCurrentIndex((prev) => Math.min(prev + 1, quiz.questions.length - 1));
    };

    const goPrev = () => {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
    };

    if (loading) return <p className="p-6 text-center text-gray-500">Đang tải quiz...</p>;
    if (error) return <p className="p-6 text-center text-red-500">{error}</p>;
    if (!quiz) return <p className="p-6 text-center">Không có quiz.</p>;

    const currentQuestion = quiz.questions[currentIndex] as any;
    const totalQuestions = quiz.questions.length;
    const answeredCount = answers.filter((a) => a !== -1).length;
    const progressPercent = (answeredCount / totalQuestions) * 100;

    return (
        <div className="min-h-screen bg-[#eef2f8]">
            {/* HEADER */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-30">
                <div className="max-w-6xl mx-auto flex flex-col gap-2 px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg md:text-xl font-bold text-gray-800">{quiz.title}</h1>
                            <p className="text-xs text-gray-400">Bài quiz cho bài học: {quiz.lesson_id}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 font-mono text-sm">
                                ⏱ {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                            </div>
                            <div
                                className={`px-3 py-1.5 rounded-full text-sm ${
                                    violations > 0 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
                                }`}
                            >
                                Ra ngoài: {violations}
                            </div>
                            <button
                                onClick={() => handleSubmit(false)}
                                disabled={submitting || !!result}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium ${
                                    submitting || result
                                        ? "bg-gray-300 text-gray-100 cursor-not-allowed"
                                        : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                            >
                                {submitting ? "Đang nộp..." : "Nộp bài"}
                            </button>
                        </div>
                    </div>

                    <div className="mt-1">
                        <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">
                Câu {currentIndex + 1}/{totalQuestions}
              </span>
                            <span className="text-sm text-gray-500">
                {answeredCount}/{totalQuestions} đã trả lời — {Math.round(progressPercent)}%
              </span>
                        </div>
                        <div className="relative w-full h-5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 transition-all duration-500 ease-out shadow-md"
                                style={{ width: `${progressPercent}%` }}
                            />
                            {progressPercent > 8 && (
                                <div className="absolute inset-0 flex justify-center items-center text-xs font-semibold text-white drop-shadow">
                                    {Math.round(progressPercent)}%
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* BODY */}
            <div className="max-w-6xl mx-auto flex gap-6 py-8 px-4">
                <div className="flex-1 flex flex-col gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-7 py-6">
                        <div className="mb-5">
                            {currentQuestion.question_text && (
                                <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-3">
                                    {currentQuestion.question_text}
                                </h2>
                            )}

                            {currentQuestion.question_image && (
                                <img
                                    src={currentQuestion.question_image}
                                    alt="question"
                                    className="max-h-80 rounded-md border mb-4 object-contain"
                                />
                            )}

                            {currentQuestion.images?.length > 0 && (
                                <div className="flex gap-4 flex-wrap mb-4">
                                    {currentQuestion.images.map((img: string, idx: number) => (
                                        <img
                                            key={idx}
                                            src={img}
                                            alt={`question-${idx}`}
                                            className="w-44 h-44 object-contain rounded-md border bg-white"
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* options */}
                        <div className="space-y-2">
                            {currentQuestion.options.map((opt: string, idx: number) => {
                                const selected = answers[currentIndex] === idx;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelect(idx)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition text-left text-sm md:text-base ${
                                            selected
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                                        }`}
                                    >
                    <span
                        className={`w-8 h-8 flex items-center justify-center rounded-full font-semibold ${
                            selected ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                                        <span className="text-gray-800">{opt}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex justify-between mt-6">
                            <button
                                onClick={goPrev}
                                disabled={currentIndex === 0}
                                className={`px-4 py-2 rounded-md text-sm border ${
                                    currentIndex === 0 ? "text-gray-300 border-gray-200" : "hover:bg-gray-50"
                                }`}
                            >
                                ← Câu trước
                            </button>
                            <button
                                onClick={goNext}
                                disabled={currentIndex === totalQuestions - 1}
                                className={`px-4 py-2 rounded-md text-sm border ${
                                    currentIndex === totalQuestions - 1 ? "text-gray-300 border-gray-200" : "hover:bg-gray-50"
                                }`}
                            >
                                Câu tiếp →
                            </button>
                        </div>
                    </div>

                    {result && (
                        <div className="bg-green-50 border border-green-100 rounded-lg px-6 py-4">
                            <p className="font-semibold text-green-700">
                                Kết quả: {result.correct}/{result.total} câu đúng
                            </p>
                            <p className="text-green-600">Điểm: {result.score}</p>
                            <p className="text-xs text-gray-400 mt-1">Số lần rời khỏi màn hình: {violations}</p>
                        </div>
                    )}
                </div>

                {/* SIDEBAR */}
                <div className="w-[190px]">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
                        <p className="text-sm font-semibold text-gray-700">Danh sách câu</p>
                        <div className="flex flex-wrap gap-2">
                            {quiz.questions.map((q: any, idx) => {
                                const answered = answers[idx] !== -1;
                                const active = idx === currentIndex;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={`w-10 h-10 rounded-md text-sm flex items-center justify-center border transition ${
                                            active
                                                ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                                                : answered
                                                    ? "bg-green-50 border-green-200 text-green-700"
                                                    : "bg-white border-gray-200 hover:bg-gray-50"
                                        }`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-1 space-y-1 text-[11px] text-gray-400">
                            <p>
                                <span className="inline-block w-3 h-3 bg-blue-500 rounded-sm mr-1" /> Đang chọn
                            </p>
                            <p>
                                <span className="inline-block w-3 h-3 bg-green-200 rounded-sm mr-1" /> Đã chọn
                            </p>
                        </div>

                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={submitting || !!result}
                            className={`mt-2 w-full py-2 rounded-md text-sm font-medium ${
                                submitting || result
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                        >
                            Nộp bài
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizPage;
