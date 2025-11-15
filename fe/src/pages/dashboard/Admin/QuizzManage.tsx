import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import quizApi from "../../../api/quizApi";
import type { Quiz } from "@/types/quiz";

type QuizQuestionForm = {
    question_text: string;
    imagesText: string;
    options: string[];
    correct_option_index: number;
};

export function QuizzManage() {
    const { lessonId } = useParams<{ lessonId: string }>();

    const [loadingList, setLoadingList] = useState(true);
    const [savingQuiz, setSavingQuiz] = useState(false);

    const [existingQuizzes, setExistingQuizzes] = useState<Quiz[]>([]);
    const [editingQuizId, setEditingQuizId] = useState<string | null>(null);

    const [title, setTitle] = useState("");
    const [durationSeconds, setDurationSeconds] = useState(300);
    const [questions, setQuestions] = useState<QuizQuestionForm[]>([
        {
            question_text: "",
            imagesText: "",
            options: ["", "", "", ""],
            correct_option_index: 0,
        },
    ]);

    const [attempts, setAttempts] = useState<any[]>([]);
    const [loadingAttempts, setLoadingAttempts] = useState(false);

    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const resetForm = () => {
        setEditingQuizId(null);
        setTitle("");
        setDurationSeconds(300);
        setQuestions([
            {
                question_text: "",
                imagesText: "",
                options: ["", "", "", ""],
                correct_option_index: 0,
            },
        ]);
        setAttempts([]);
    };

    const loadQuizzes = async () => {
        if (!lessonId) return;
        setLoadingList(true);
        setError(null);
        try {
            const list = await quizApi.getByLessonDashboad(lessonId);
            setExistingQuizzes(list || []);
        } catch (e: any) {
            console.error(e);
            if (e?.response?.status === 404) {
                setExistingQuizzes([]);
            } else {
                setError(e?.message || "Không tải được danh sách quiz");
            }
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        if (lessonId) {
            loadQuizzes();
            resetForm();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lessonId]);

    const handleAddQuestion = () => {
        setQuestions((prev) => [
            ...prev,
            {
                question_text: "",
                imagesText: "",
                options: ["", "", "", ""],
                correct_option_index: 0,
            },
        ]);
    };

    const handleRemoveQuestion = (index: number) => {
        setQuestions((prev) => {
            const next = [...prev];
            next.splice(index, 1);
            if (next.length === 0) {
                return [
                    {
                        question_text: "",
                        imagesText: "",
                        options: ["", "", "", ""],
                        correct_option_index: 0,
                    },
                ];
            }
            return next;
        });
    };

    const handleChangeQuestionText = (index: number, value: string) => {
        setQuestions((prev) => {
            const next = [...prev];
            next[index].question_text = value;
            return next;
        });
    };

    const handleChangeImagesText = (index: number, value: string) => {
        setQuestions((prev) => {
            const next = [...prev];
            next[index].imagesText = value;
            return next;
        });
    };

    const handleChangeOption = (qIndex: number, optIndex: number, value: string) => {
        setQuestions((prev) => {
            const next = [...prev];
            if (!next[qIndex].options || next[qIndex].options.length === 0) {
                next[qIndex].options = ["", "", "", ""];
            }
            next[qIndex].options[optIndex] = value;
            return next;
        });
    };

    const handleChangeCorrectOption = (qIndex: number, optIndex: number) => {
        setQuestions((prev) => {
            const next = [...prev];
            next[qIndex].correct_option_index = optIndex;
            return next;
        });
    };

    // ===========================
    // 🎯 LOAD QUIZ + LOAD ATTEMPTS
    // ===========================
    const handleEditQuiz = async (quiz: Quiz) => {
        setEditingQuizId(quiz._id);
        setTitle(quiz.title ?? "");
        setDurationSeconds(quiz.duration_seconds ?? 300);

        const mappedQuestions: QuizQuestionForm[] = (quiz.questions || []).map((q) => ({
            question_text: q.question_text ?? "",
            imagesText: (q.images || []).join("\n"),
            options: q.options?.length > 0 ? [...q.options] : ["", "", "", ""],
            correct_option_index: q.correct_option_index ?? 0,
        }));

        setQuestions(
            mappedQuestions.length > 0
                ? mappedQuestions
                : [
                    {
                        question_text: "",
                        imagesText: "",
                        options: ["", "", "", ""],
                        correct_option_index: 0,
                    },
                ]
        );

        // Load Attempts
        setLoadingAttempts(true);
        try {
            const data = await quizApi.getAttempts(quiz._id);
            setAttempts(data);
        } catch (err) {
            console.error(err);
        }
        setLoadingAttempts(false);

        setMessage(null);
        setError(null);
    };

    const handleDeleteQuiz = async (quizId: string) => {
        if (!confirm("Bạn chắc chắn muốn xoá quiz này?")) return;
        try {
            await quizApi.delete(quizId);
            if (editingQuizId === quizId) {
                resetForm();
            }
            await loadQuizzes();
        } catch (e: any) {
            console.error(e);
            setError(e?.message || "Xoá quiz thất bại");
        }
    };

    const handleSaveQuiz = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!lessonId) {
            setError("Thiếu lessonId");
            return;
        }

        setSavingQuiz(true);
        setError(null);
        setMessage(null);

        const payloadQuestions = questions.map((q) => {
            const images = q.imagesText
                ? q.imagesText
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [];

            const options = q.options.map((o) => o.trim()).filter((o) => o.length > 0);

            return {
                question_text: q.question_text.trim() || undefined,
                images,
                options,
                correct_option_index: q.correct_option_index,
            };
        });

        try {
            if (editingQuizId) {
                await quizApi.update(editingQuizId, {
                    title: title.trim(),
                    duration_seconds: Number(durationSeconds),
                    questions: payloadQuestions,
                });
                setMessage("Cập nhật quiz thành công!");
            } else {
                await quizApi.create({
                    title: title.trim(),
                    lesson_id: lessonId,
                    duration_seconds: Number(durationSeconds),
                    questions: payloadQuestions,
                });
                setMessage("Tạo quiz mới thành công!");
                resetForm();
            }

            await loadQuizzes();
        } catch (e: any) {
            console.error(e);
            setError(e?.message || "Lưu quiz thất bại");
        } finally {
            setSavingQuiz(false);
        }
    };

    const handleCopyLink = (quizId: string) => {
        const url = `${window.location.origin}/quiz/${quizId}`;
        navigator.clipboard.writeText(url).then(() => {
            alert("Đã copy link: " + url);
        });
    };

    return (
        <div className="p-4">
            <h2 style={{ marginTop: 0 }}>Quản lý Quiz của bài học {lessonId}</h2>

            {!lessonId && (
                <div style={{ color: "red" }}>Không tìm thấy lessonId trong URL</div>
            )}

            <div
                style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 16,
                    marginTop: 16,
                    marginBottom: 24,
                }}
            >
                <h3 style={{ marginTop: 0 }}>
                    {editingQuizId ? "Chỉnh sửa quiz" : "Tạo quiz mới"}
                </h3>

                <form onSubmit={handleSaveQuiz}>
                    <div style={{ display: "grid", gap: 10 }}>
                        <label>
                            <div>Tiêu đề Quiz</div>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Quiz HTML layout"
                                style={{ width: "100%", padding: 8 }}
                            />
                        </label>

                        <label>
                            <div>Thời gian làm bài (giây)</div>
                            <input
                                type="number"
                                value={durationSeconds}
                                onChange={(e) => setDurationSeconds(Number(e.target.value))}
                                style={{ width: "100%", padding: 8 }}
                            />
                        </label>
                    </div>

                    <hr style={{ margin: "16px 0" }} />

                    {questions.map((q, qIndex) => (
                        <div
                            key={qIndex}
                            style={{
                                marginBottom: 20,
                                padding: 12,
                                border: "1px solid #eee",
                                borderRadius: 6,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: 8,
                                }}
                            >
                                <h4 style={{ marginTop: 0, marginBottom: 0 }}>
                                    Câu hỏi {qIndex + 1}
                                </h4>

                                <button
                                    type="button"
                                    onClick={() => handleRemoveQuestion(qIndex)}
                                    style={{
                                        fontSize: 12,
                                        padding: "4px 8px",
                                        background: "#fee2e2",
                                        borderRadius: 4,
                                        border: "1px solid #fecaca",
                                        color: "#b91c1c",
                                    }}
                                >
                                    Xoá câu hỏi
                                </button>
                            </div>

                            <div style={{ marginBottom: 8 }}>
                                <div>Nội dung câu hỏi</div>
                                <textarea
                                    value={q.question_text}
                                    onChange={(e) =>
                                        handleChangeQuestionText(qIndex, e.target.value)
                                    }
                                    style={{ width: "100%", padding: 8 }}
                                    rows={2}
                                />
                            </div>

                            <div style={{ marginBottom: 8 }}>
                                <div>Ảnh minh hoạ (mỗi URL một dòng, tuỳ chọn)</div>
                                <textarea
                                    value={q.imagesText}
                                    onChange={(e) =>
                                        handleChangeImagesText(qIndex, e.target.value)
                                    }
                                    style={{ width: "100%", padding: 8, fontSize: 12 }}
                                    rows={3}
                                />
                            </div>

                            <div style={{ marginBottom: 8 }}>
                                <div>Đáp án</div>
                                {q.options.map((opt, optIndex) => (
                                    <div
                                        key={optIndex}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            marginBottom: 4,
                                            gap: 8,
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name={`correct-${qIndex}`}
                                            checked={q.correct_option_index === optIndex}
                                            onChange={() =>
                                                handleChangeCorrectOption(qIndex, optIndex)
                                            }
                                        />
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) =>
                                                handleChangeOption(
                                                    qIndex,
                                                    optIndex,
                                                    e.target.value
                                                )
                                            }
                                            style={{ flex: 1, padding: 6 }}
                                            placeholder={`Đáp án ${optIndex + 1}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={handleAddQuestion}
                        style={{ marginRight: 8, padding: "8px 12px" }}
                    >
                        + Thêm câu hỏi
                    </button>

                    <button type="submit" disabled={savingQuiz} style={{ padding: "8px 16px" }}>
                        {savingQuiz
                            ? "Đang lưu Quiz..."
                            : editingQuizId
                                ? "Cập nhật Quiz"
                                : "Tạo Quiz"}
                    </button>

                    {editingQuizId && (
                        <button
                            type="button"
                            onClick={resetForm}
                            style={{ marginLeft: 8, padding: "8px 12px" }}
                        >
                            Huỷ chỉnh sửa
                        </button>
                    )}

                    {message && (
                        <div style={{ marginTop: 8, color: "green" }}>{message}</div>
                    )}
                    {error && <div style={{ marginTop: 8, color: "red" }}>{error}</div>}
                </form>
            </div>

            {editingQuizId && (
                <div
                    style={{
                        background: "#fff",
                        borderRadius: 12,
                        padding: 16,
                        marginTop: 24,
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>Lịch sử làm bài (Attempts)</h3>

                    {loadingAttempts ? (
                        <div>Đang tải lịch sử...</div>
                    ) : attempts.length === 0 ? (
                        <div style={{ color: "#777" }}>Chưa có ai làm bài này.</div>
                    ) : (
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                fontSize: 14,
                            }}
                        >
                            <thead>
                            <tr style={{ background: "#f5f5f5" }}>
                                <th style={{ textAlign: "left", padding: 8 }}>User</th>
                                <th style={{ textAlign: "left", padding: 8 }}>Kết quả</th>
                                <th style={{ textAlign: "left", padding: 8 }}>Thời gian</th>
                                <th style={{ textAlign: "left", padding: 8 }}>Vi phạm</th>
                                <th style={{ textAlign: "left", padding: 8 }}>Trạng thái</th>
                            </tr>
                            </thead>

                            <tbody>
                            {attempts.map((a) => (
                                <tr key={a._id}>
                                    <td style={{ padding: 8 }}>{a.user_id.name}</td>
                                    <td style={{ padding: 8 }}>
                                        {a.correct}/{a.total} — {a.score} điểm
                                    </td>
                                    <td style={{ padding: 8 }}>{a.spent_seconds}s</td>
                                    <td style={{ padding: 8 }}>{a.violations}</td>
                                    <td style={{ padding: 8 }}>
                                        {a.completed ? "Hoàn thành" : "Đang làm"}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            <div
                style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 16,
                }}
            >
                <h3 style={{ marginTop: 0 }}>Danh sách quiz của bài học</h3>

                {loadingList ? (
                    <div>Đang tải danh sách quiz...</div>
                ) : existingQuizzes.length === 0 ? (
                    <div style={{ color: "#777" }}>Chưa có quiz nào cho bài học này.</div>
                ) : (
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: 14,
                        }}
                    >
                        <thead>
                        <tr style={{ background: "#f5f5f5" }}>
                            <th style={{ padding: 8 }}>Tiêu đề</th>
                            <th style={{ padding: 8 }}>Thời gian (giây)</th>
                            <th style={{ padding: 8 }}>Số câu hỏi</th>
                            <th style={{ padding: 8 }}>Link</th>
                            <th style={{ padding: 8 }}>Hành động</th>
                        </tr>
                        </thead>

                        <tbody>
                        {existingQuizzes.map((qz) => (
                            <tr key={qz._id}>
                                <td style={{ padding: 8 }}>{qz.title}</td>
                                <td style={{ padding: 8 }}>{qz.duration_seconds ?? 0}</td>
                                <td style={{ padding: 8 }}>{qz.questions.length}</td>
                                <td style={{ padding: 8 }}>
                                    <Link to={`/quiz/${qz._id}`}>/quiz/{qz._id}</Link>
                                </td>
                                <td style={{ padding: 8 }}>
                                    <button
                                        type="button"
                                        onClick={() => handleCopyLink(qz._id)}
                                        style={{
                                            padding: "4px 6px",
                                            fontSize: 12,
                                            background: "#e0f2fe",
                                            border: "1px solid #bae6fd",
                                            borderRadius: 4,
                                            cursor: "pointer",
                                            marginRight: 6,
                                        }}
                                    >
                                        Copy
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleEditQuiz(qz)}
                                        style={{
                                            padding: "4px 8px",
                                            marginRight: 8,
                                        }}
                                    >
                                        Sửa
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDeleteQuiz(qz._id)}
                                        style={{ padding: "4px 8px", color: "#b91c1c" }}
                                    >
                                        Xoá
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
