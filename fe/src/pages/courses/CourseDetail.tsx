import { useLocation, useParams, Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Star, Lock, HelpCircle, CheckCircle2 } from "lucide-react";
import { useRef, useMemo, useState } from "react";
import { useCart } from "../../contexts/CartContext";
import BilingualSubtitles from "../../components/video/BilingualSubtitles";
import { useAuth } from "../../hooks/useAuth";
import { useSubtitles } from "../../hooks/useSubtitles";
import { useDiscussions } from "../../hooks/useDiscussions";
import { useReviews } from "../../hooks/useReviews";
import { useCourseData } from "../../hooks/useCourseData";

export default function CourseDetail() {
  const { slug } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { addCourse, courses, removeCourse } = useCart();

  // Video ref
  const videoRef = useRef<HTMLVideoElement>(null);

  // ✅ HOOK 1: Course data, lessons, enrollment
  const courseData = useCourseData({
    slug,
    initialCourse: (location.state as any)?.course || null,
    userId: user?._id,
  });

  const {
    course,
    isEnrolled,
    lessons,
    loadingLessons,
    selectedLessonId,
    setSelectedLessonId,
    selectedLesson,
    completedLessons,
    playbackUrl,
    loadingPlayback,
    hasQuiz,
    checkingQuiz,
    lessonsWithQuiz,
    lessonQuizMap,
    toId,
    markLessonComplete,
  } = courseData;

  // ✅ HOOK 2: Subtitles
  const subtitles = useSubtitles({
    lessonId: selectedLessonId,
    videoRef,
    isEnrolled,
  });

  // ✅ HOOK 3: Discussions/Q&A
  const canParticipate = Boolean(
    user && (isEnrolled || user?.role === "teacher" || user?.role === "admin")
  );
  const canModerate = Boolean(user && (user?.role === "teacher" || user?.role === "admin"));

  const discussions = useDiscussions({
    lessonId: selectedLessonId,
    canParticipate,
    canModerate,
  });

  // ✅ HOOK 4: Reviews
  const reviews = useReviews({
    courseId: course?._id ? toId((course as any)._id) : null,
    isEnrolled,
  });

  // Tab state (only UI state left in component)
  const [activeTab, setActiveTab] = useState<"qa" | "reviews">("qa");

  // Computed values
  const isInCart = courses.some((c) => (c as any)._id === (course as any)?._id);

  const formatVND = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

  const categoryName = useMemo(() => {
    const cat = (course as any)?.category;
    if (Array.isArray(cat) && cat.length > 0) return cat[0]?.name || "Chưa có danh mục";
    return "Chưa có danh mục";
  }, [course]);

  const formatTimestamp = (iso?: string) => {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.valueOf())) return "";
    return date.toLocaleString("vi-VN");
  };

  // Loading state
  if (!course) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
      </Link>

      {/* Course Card */}
      <div className="bg-white shadow border border-gray-100 rounded-2xl overflow-hidden">
        <img
          src={course.thumbnail_url || "https://placehold.co/800x400"}
          alt={course.title}
          className="w-full h-64 object-cover"
        />

        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>

          <p className="text-sm md:text-base font-semibold text-blue-500 mb-2">
            Giảng viên:{" "}
            <span className="text-gray-700">
              {course.teacherNames && course.teacherNames.length > 0
                ? course.teacherNames.join(", ")
                : "Admin"}
            </span>
          </p>

          {Array.isArray((course as any).teacher) && (course as any).teacher.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              {(course as any).teacher.map((t: any) => (
                <div key={t.full_name} className="flex items-center gap-1">
                  <img src={t.avatar} alt={t.full_name} className="w-6 h-6 rounded-full" />
                  <span className="text-gray-700">{t.full_name}</span>
                </div>
              ))}
            </div>
          )}

          <p className="text-sm md:text-base font-semibold text-blue-500 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            {categoryName}
          </p>

          <p className="text-gray-700 mb-6 leading-relaxed">
            {course.description || "Không có mô tả chi tiết."}
          </p>

          {!isEnrolled && (
            <p className="text-2xl font-semibold text-green-700 mb-6">
              {formatVND((course as any).price || 0)}
            </p>
          )}

          {!isEnrolled && (
            <div className="flex flex-wrap items-center gap-3 mt-8">
              {isInCart ? (
                <>
                  <Link
                    to="/cart"
                    className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-lg font-semibold border border-gray-300 hover:bg-gray-200 transition"
                  >
                    Đã trong giỏ hàng
                  </Link>
                  <button
                    onClick={() => removeCourse((course as any)._id)}
                    className="bg-red-100 text-red-600 px-4 py-2.5 rounded-lg font-semibold border border-red-300 hover:bg-red-200 transition"
                  >
                    Xóa khỏi giỏ
                  </button>
                </>
              ) : (
                <button
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
                  onClick={() => addCourse(course)}
                >
                  Đăng ký học ngay
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lessons + Video Section */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2 bg-white shadow border border-gray-100 rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-3">Nội dung bài học</h3>

          {/* Subtitle Controls */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <input
              ref={subtitles.englishInputRef}
              type="file"
              accept=".vtt,.srt"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    await subtitles.uploadEnglish(file);
                  } catch (error) {
                    alert("Không thể tải phụ đề. Vui lòng thử lại.");
                  }
                }
                e.currentTarget.value = "";
              }}
            />

            <input
              ref={subtitles.vietnameseInputRef}
              type="file"
              accept=".vtt,.srt"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    await subtitles.uploadVietnamese(file);
                  } catch (error) {
                    alert("Không thể tải phụ đề. Vui lòng thử lại.");
                  }
                }
                e.currentTarget.value = "";
              }}
            />

            <button
              disabled={!isEnrolled || !playbackUrl || subtitles.loading}
              onClick={async () => {
                try {
                  await subtitles.autoGenerate();
                } catch (error) {
                  alert("Không thể tạo phụ đề. Vui lòng thử lại.");
                }
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tạo phụ đề
            </button>

            <button
              disabled={subtitles.cues.length === 0}
              onClick={subtitles.toggleVisible}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {subtitles.visible ? "Ẩn phụ đề" : "Hiện phụ đề"}
            </button>

            {hasQuiz && selectedLessonId && lessonQuizMap[selectedLessonId] && (
              <Link
                to={`/quiz/${lessonQuizMap[selectedLessonId].quizId}`}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded border transition"
              >
                <HelpCircle className="w-4 h-4" />
                Làm quiz
              </Link>
            )}

            {subtitles.loading && <span className="text-sm text-gray-500">Đang xử lý phụ đề...</span>}
          </div>

          {/* Video */}
          {loadingPlayback ? (
            <div className="h-64 flex items-center justify-center">Đang tải video...</div>
          ) : selectedLessonId ? (
            isEnrolled ? (
              playbackUrl ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    controls
                    src={playbackUrl}
                    className="w-full rounded-lg bg-black"
                    onEnded={() => markLessonComplete(selectedLessonId)}
                  />
                  <BilingualSubtitles
                    videoRef={videoRef}
                    cues={subtitles.cues}
                    mode={subtitles.mode}
                    visible={subtitles.visible}
                  />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Không có URL phát cho bài học này.
                </div>
              )
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-500 gap-2">
                <Lock className="w-6 h-6" />
                <div>Bạn cần mua khóa học để xem video.</div>
              </div>
            )
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Chưa chọn bài học.
            </div>
          )}

          {selectedLesson && (
            <div className="mt-4 text-sm text-gray-700 whitespace-pre-wrap">
              {selectedLesson.description || ""}
            </div>
          )}
        </div>

        {/* Lesson List */}
        <aside className="bg-white shadow border border-gray-100 rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-3">Danh sách bài học</h3>
          {loadingLessons ? (
            <div>Đang tải danh sách...</div>
          ) : lessons.length === 0 ? (
            <div>Chưa có bài học nào.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {lessons.map((ls) => {
                const isCompleted = completedLessons.has(ls._id);
                const lessonHasQuiz = lessonsWithQuiz.has(ls._id);
                return (
                  <li key={ls._id}>
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => setSelectedLessonId(ls._id)}
                        className={`flex-1 text-left p-3 hover:bg-gray-50 transition ${
                          selectedLessonId === ls._id ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center gap-2">
                            {isCompleted && (
                              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                            )}
                            {ls.position}. {ls.title}
                          </span>
                          {!isEnrolled && <Lock className="w-4 h-4 text-gray-400" />}
                        </div>
                        {ls.description && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {ls.description}
                          </div>
                        )}
                      </button>
                      {lessonHasQuiz && lessonQuizMap[ls._id] && (
                        <Link
                          to={`/quiz/${lessonQuizMap[ls._id].quizId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                          title={lessonQuizMap[ls._id].title}
                        >
                          <HelpCircle className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>

      {/* Tabs: Q&A / Reviews */}
      <section className="mt-8 bg-white shadow border border-gray-100 rounded-2xl">
        <div className="border-b flex items-center gap-2 px-4">
          {(["qa", "reviews"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`relative px-4 py-3 text-sm font-medium transition border-b-2 -mb-px ${
                activeTab === key
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              {key === "qa" ? "Hỏi đáp khóa học" : "Đánh giá khóa học"}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === "qa" ? (
            <>
              <div>
                <h3 className="text-xl font-semibold">Hỏi đáp bài học</h3>
                <p className="text-sm text-gray-500">
                  {selectedLesson
                    ? `Đang xem: ${selectedLesson.position ? `Bài ${selectedLesson.position} - ` : ""}${selectedLesson.title}`
                    : "Chọn một bài học ở danh sách bên để xem hỏi đáp."}
                </p>
              </div>

              {!selectedLessonId ? (
                <div className="mt-4 text-gray-500">
                  Hãy chọn một bài học để xem hoặc đặt câu hỏi.
                </div>
              ) : (
                <>
                  {discussions.error && (
                    <div className="mt-3 text-sm text-red-600">{discussions.error}</div>
                  )}

                  {discussions.loading ? (
                    <div className="mt-6 text-gray-500">Đang tải câu hỏi...</div>
                  ) : discussions.threads.length === 0 ? (
                    <div className="mt-6 text-gray-500">Chưa có câu hỏi nào cho bài học này.</div>
                  ) : (
                    <ul className="mt-6 space-y-4">
                      {discussions.threads.map((thread) => (
                        <li key={thread._id} className="border rounded-2xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-gray-900">
                                {thread.user?.name || "Người học"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatTimestamp(thread.created_at)}
                              </div>
                            </div>
                          </div>
                          <p className="mt-3 text-sm text-gray-800 whitespace-pre-wrap">
                            {thread.content}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                            <button
                              onClick={() =>
                                discussions.setReplyBoxOpen((prev) => ({
                                  ...prev,
                                  [thread._id]: !prev[thread._id],
                                }))
                              }
                              className="hover:text-blue-600"
                            >
                              Phản hồi
                            </button>
                          </div>

                          {thread.replies && thread.replies.length > 0 && (
                            <ul className="mt-4 space-y-2">
                              {thread.replies.map((reply) => (
                                <li key={reply._id} className="rounded-xl bg-gray-50 p-3">
                                  <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span className="font-medium text-gray-800">
                                      {reply.user?.name || "Người dùng"}
                                    </span>
                                    <span>{formatTimestamp(reply.created_at)}</span>
                                  </div>
                                  <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                                    {reply.content}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          )}

                          {canParticipate && discussions.replyBoxOpen[thread._id] && (
                            <div className="mt-4">
                              <textarea
                                value={discussions.replyDrafts[thread._id] || ""}
                                onChange={(e) =>
                                  discussions.setReplyDrafts((prev) => ({
                                    ...prev,
                                    [thread._id]: e.target.value,
                                  }))
                                }
                                placeholder="Phản hồi của bạn..."
                                className="w-full border rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                              />
                              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                                <button
                                  onClick={() => discussions.handleReplySubmit(thread)}
                                  disabled={
                                    discussions.replying[thread._id] ||
                                    !discussions.replyDrafts[thread._id]?.trim()
                                  }
                                  className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-gray-800 disabled:opacity-60"
                                >
                                  {discussions.replying[thread._id] ? "Đang gửi..." : "Trả lời"}
                                </button>
                                <span>{thread.reply_count || 0} phản hồi</span>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {canParticipate ? (
                    <div className="mt-6 border rounded-2xl p-4 bg-gray-50">
                      <h4 className="font-semibold text-gray-800 mb-2">Viết bình luận</h4>
                      <textarea
                        value={discussions.questionInput}
                        onChange={(e) => discussions.setQuestionInput(e.target.value)}
                        placeholder="Chia sẻ câu hỏi hoặc cảm nghĩ của bạn..."
                        className="w-full border rounded-xl p-3 text-sm min-h-[90px] focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60"
                          onClick={discussions.handleAskQuestion}
                          disabled={
                            discussions.postingQuestion || !discussions.questionInput.trim()
                          }
                        >
                          {discussions.postingQuestion ? "Đang đăng..." : "Đăng"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
                      Đăng nhập và ghi danh khóa học để bình luận và phản hồi.
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold mb-4">Đánh giá khóa học</h3>
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const avg = reviews.summary?.average ?? 0;
                    const count = reviews.summary?.count ?? reviews.reviews.length;
                    return (
                      <>
                        <div className="flex items-center text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${i < Math.round(avg) ? "fill-current" : ""}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {Number(avg).toFixed(1)} / 5 - {count} reviews
                        </span>
                      </>
                    );
                  })()}
                </div>

                {reviews.summary && (
                  <div className="space-y-1">
                    {[5, 4, 3, 2, 1].map((r) => {
                      const total = reviews.summary!.count || 1;
                      const c = reviews.summary!.breakdown[String(r)] || 0;
                      const pct = Math.round((c / total) * 100);
                      return (
                        <div key={r} className="flex items-center gap-2 text-sm">
                          <span className="w-8 text-gray-600">{r}★</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded">
                            <div
                              className="h-2 bg-amber-500 rounded"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-gray-600">{c}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {isEnrolled && (
                <div className="mb-6 border rounded-xl p-4 bg-gray-50">
                  <h4 className="font-semibold mb-2">Viết đánh giá của bạn</h4>
                  <div className="flex items-center gap-3 mb-3">
                    <label className="text-sm text-gray-700">Chấm điểm:</label>
                    <select
                      value={reviews.ratingInput}
                      onChange={(e) => reviews.setRatingInput(Number(e.target.value))}
                      className="border rounded-lg p-2"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    placeholder="Chia sẻ cảm nhận của bạn về khóa học..."
                    value={reviews.commentInput}
                    onChange={(e) => reviews.setCommentInput(e.target.value)}
                    className="w-full border rounded-lg p-3 min-h-[100px]"
                  />
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      disabled={reviews.submitting}
                      onClick={reviews.submitReview}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                    >
                      Gửi đánh giá
                    </button>
                    {reviews.message && (
                      <span className="text-sm text-gray-600">{reviews.message}</span>
                    )}
                  </div>
                </div>
              )}

              {reviews.loading ? (
                <div className="text-gray-500">Đang tải đánh giá...</div>
              ) : reviews.reviews.length === 0 ? (
                <div className="text-gray-500">Chưa có đánh giá nào.</div>
              ) : (
                <ul className="space-y-4">
                  {reviews.reviews.map((rv) => {
                    const userRaw = (rv as any).user_id || (rv as any).user;
                    const nameRaw = typeof userRaw === "object" ? userRaw?.name ?? "" : "";
                    const displayName =
                      typeof nameRaw === "string" && nameRaw.trim().length > 0
                        ? nameRaw.trim()
                        : "Người dùng";
                    return (
                      <li key={rv._id} className="border rounded-xl p-4">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-semibold text-gray-800">{displayName}</div>
                          <div className="flex items-center gap-1 text-amber-500">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Number((rv as any).rating || 0) ? "fill-current" : ""
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {(rv as any).comment && (
                          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                            {(rv as any).comment}
                          </p>
                        )}
                        {(rv as any).created_at && (
                          <div className="text-xs text-gray-400 mt-2">
                            {new Date((rv as any).created_at as any).toLocaleString("vi-VN")}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}