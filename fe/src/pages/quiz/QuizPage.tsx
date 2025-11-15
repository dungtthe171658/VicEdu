import {useCallback, useEffect, useRef, useState} from "react";
import {useParams} from "react-router-dom";
import quizApi from "@/api/quizApi";
import type {QuizSubmitResult} from "@/types/quiz";

const shuffleArray = <T, >(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const QuizPage: React.FC = () => {
    const {quizId} = useParams<{ quizId: string }>();

    const [meta, setMeta] = useState<any>(null);

    const [quiz, setQuiz] = useState<any>(null);

    const [answers, setAnswers] = useState<number[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<QuizSubmitResult | null>(null);

    const [hasStarted, setHasStarted] = useState(false);
    const hasStartedRef = useRef(false);

    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [violations, setViolations] = useState(0);

    const lastViolationRef = useRef(0);
    const initialDurationRef = useRef(0);
    const spentSecondsRef = useRef(0);

    useEffect(() => {
        hasStartedRef.current = hasStarted;
    }, [hasStarted]);

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };


    useEffect(() => {
        if (!quizId) return;
        setLoading(true);

        quizApi
            .get(quizId)
            .then((data) => {
                setMeta(data);
                initialDurationRef.current = data.duration_seconds || 300;
                setTimeLeft(initialDurationRef.current);

                if (data.completed) {
                    setResult({
                        correct: data.progress?.correct || 0,
                        total: data.progress?.total || 0,
                        score: data.progress?.score || 0,
                    });
                    setViolations(data.progress?.violations || 0);
                    setHasStarted(false);
                    return;
                }

                if (data.in_progress && data.progress) {
                    setHasStarted(false);
                }

            })
            .catch(() => setError("Không tải được thông tin quiz"))
            .finally(() => setLoading(false));
    }, [quizId]);


    const handleStart = async () => {
        if (!quizId) return;
        try {
            const data = await quizApi.start(quizId);

            const questions = shuffleArray(
                data.questions.map((q: any, idx: number) => ({
                    ...q,
                    _originalIndex: idx,
                }))
            );

            setQuiz({...meta, questions});

            setAnswers(
                data.answers?.length === questions.length
                    ? data.answers
                    : new Array(questions.length).fill(-1)
            );

            if (data.spent_seconds) {
                spentSecondsRef.current = data.spent_seconds;
                const remain = initialDurationRef.current - data.spent_seconds;
                setTimeLeft(Math.max(1, remain));
            }

            setHasStarted(true);
        } catch {
            setError("Không thể bắt đầu quiz");
        }
    };

    const addViolation = useCallback(() => {
        if (!hasStartedRef.current) return;
        const now = Date.now();
        if (now - lastViolationRef.current < 2000) return;
        lastViolationRef.current = now;
        setViolations((v) => v + 1);
    }, []);

    useEffect(() => {
        const handleVisibility = () => document.hidden && addViolation();
        const handleBlur = () => addViolation();
        const handleLeave = (e: any) => {
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
        document.addEventListener("mouseleave", handleLeave);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener("blur", handleBlur);
            document.removeEventListener("mouseleave", handleLeave);
        };
    }, [addViolation]);

    useEffect(() => {
        if (!quiz || !hasStarted || result || timeLeft === null) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (!prev) return 0;

                spentSecondsRef.current++;

                if (prev <= 1) {
                    clearInterval(interval);
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [quiz, hasStarted, result, timeLeft]);


    useEffect(() => {
        if (!hasStarted || result || !quiz) return;

        const interval = setInterval(() => {
            quizApi.autoSave(quizId!, {
                answers,
                spent_seconds: spentSecondsRef.current,
                violations,
            }).catch(() => {
            });
        }, 60000);

        return () => clearInterval(interval);
    }, [answers, violations, hasStarted, quiz, result]);

    const handleSelect = (optIdx: number) => {
        if (!hasStarted || result) return;
        const next = [...answers];
        next[currentIndex] = optIdx;
        setAnswers(next);
    };


    const handleSubmit = async (auto = false) => {
        if (!quizId || result || !quiz) return;

        const originalAnswers = new Array(quiz.questions.length).fill(-1);
        quiz.questions.forEach((q: any, idx: number) => {
            originalAnswers[q._originalIndex] = answers[idx];
        });

        try {
            const res = await quizApi.submit(quizId, {
                answers: originalAnswers,
                spent_seconds: spentSecondsRef.current,
                violations,
            });

            setResult(res);
        } catch {
            setError("Nộp bài thất bại");
        }
    };

    if (loading) return <div className="p-6 text-center">Đang tải...</div>;
    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
    if (!meta) return null;

    return (
        <div className="min-h-screen bg-[#eef2f8]">
            <div className="bg-white border-b shadow-sm sticky top-0 z-30">
                <div className="max-w-6xl mx-auto flex flex-col gap-2 px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg md:text-xl font-bold text-gray-800">
                                {meta.title}
                            </h1>
                            <p className="text-xs text-gray-400">
                                Quiz cho bài học: {meta.lesson_id}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 font-mono text-sm">
                                ⏱ {hasStarted ? formatTime(timeLeft || 0) : "--:--"}
                            </div>
                            <div
                                className={`px-3 py-1.5 rounded-full text-sm ${
                                    violations > 0
                                        ? "bg-red-100 text-red-600"
                                        : "bg-gray-100 text-gray-500"
                                }`}
                            >
                                Ra ngoài: {violations}
                            </div>
                            <button
                                onClick={() => handleSubmit(false)}
                                disabled={!hasStarted || !!result}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium ${
                                    !hasStarted || result
                                        ? "bg-gray-300 text-gray-100 cursor-not-allowed"
                                        : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                            >
                                Nộp bài
                            </button>
                        </div>
                    </div>

                    {quiz && hasStarted && (
                        <div className="mt-1">
                            {(() => {
                                const answeredCount = answers.filter((a) => a !== -1).length;
                                const percent =
                                    (answeredCount / quiz.questions.length) * 100;

                                return (
                                    <>
                                        <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        Câu {currentIndex + 1}/{quiz.questions.length}
                      </span>
                                            <span className="text-sm text-gray-500">
                        {answeredCount}/{quiz.questions.length} đã trả lời —{" "}
                                                {Math.round(percent)}%
                      </span>
                                        </div>

                                        <div
                                            className="relative w-full h-5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 transition-all duration-500 ease-out"
                                                style={{width: `${percent}%`}}
                                            />
                                            {percent > 8 && (
                                                <div
                                                    className="absolute inset-0 flex justify-center items-center text-xs font-semibold text-white drop-shadow">
                                                    {Math.round(percent)}%
                                                </div>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-6xl mx-auto flex gap-6 py-8 px-4">
                <div className="flex-1 flex flex-col gap-4">
                    {!hasStarted && !result && (
                        <div
                            className="bg-white rounded-xl shadow-sm border border-gray-100 px-7 py-10 flex flex-col items-center">
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">
                                Bắt đầu làm bài quiz
                            </h2>
                            <p className="text-sm text-gray-600 mb-2">
                                Thời gian: {formatTime(initialDurationRef.current)}
                            </p>
                            <button
                                onClick={handleStart}
                                className="px-6 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                            >
                                Start
                            </button>
                        </div>
                    )}

                    {hasStarted && quiz && !result && (
                        <div className="bg-white rounded-xl shadow-sm border px-7 py-6">
                            <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-3">
                                {quiz.questions[currentIndex].question_text}
                            </h2>

                            {quiz.questions[currentIndex].images?.length > 0 && (
                                <div className="flex gap-4 flex-wrap mb-4">
                                    {quiz.questions[currentIndex].images.map(
                                        (img: string, idx: number) => (
                                            <img
                                                key={idx}
                                                src={img}
                                                className="w-44 h-44 border rounded-md object-contain"
                                            />
                                        )
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                {quiz.questions[currentIndex].options.map(
                                    (opt: string, idx: number) => {
                                        const selected = answers[currentIndex] === idx;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleSelect(idx)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition text-left ${
                                                    selected
                                                        ? "border-blue-500 bg-blue-50"
                                                        : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                                                }`}
                                            >
                        <span
                            className={`w-8 h-8 flex items-center justify-center rounded-full font-semibold ${
                                selected
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-100 text-gray-600"
                            }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                                                <span className="text-gray-800">{opt}</span>
                                            </button>
                                        );
                                    }
                                )}
                            </div>

                            <div className="flex justify-between mt-6">
                                <button
                                    onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                                    disabled={currentIndex === 0}
                                    className="px-4 py-2 rounded-md border"
                                >
                                    ← Câu trước
                                </button>
                                <button
                                    onClick={() =>
                                        setCurrentIndex((p) =>
                                            Math.min(quiz.questions.length - 1, p + 1)
                                        )
                                    }
                                    disabled={currentIndex === quiz.questions.length - 1}
                                    className="px-4 py-2 rounded-md border"
                                >
                                    Câu tiếp →
                                </button>
                            </div>
                        </div>
                    )}

                    {result && (
                        <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                            <h2 className="font-semibold text-green-700 mb-2">Kết quả</h2>
                            <p>
                                Đúng {result.correct}/{result.total}
                            </p>
                            <p>Điểm: {result.score}</p>
                            <p className="text-xs mt-2 text-green-700">
                                Số lần rời khỏi màn hình: {violations}
                            </p>
                        </div>
                    )}
                </div>

                {hasStarted && quiz && (
                    <div className="w-[190px]">
                        <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col gap-3">
                            <p className="text-sm font-semibold text-gray-700">
                                Danh sách câu
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {quiz.questions.map((_: any, idx: number) => {
                                    const answered = answers[idx] !== -1;
                                    const active = idx === currentIndex;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentIndex(idx)}
                                            className={`w-10 h-10 flex items-center justify-center rounded-md border ${
                                                active
                                                    ? "bg-blue-500 text-white border-blue-500"
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

                            <button
                                onClick={() => handleSubmit(false)}
                                className="mt-3 w-full py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Nộp bài
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizPage;
