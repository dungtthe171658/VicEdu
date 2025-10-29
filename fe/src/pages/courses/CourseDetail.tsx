import { useLocation, useParams, Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Star, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import courseApi from "../../api/courseApi";
import enrollmentApi from "../../api/enrollmentApi";
import type { Course } from "../../types/course";
import { useCart } from "../../contexts/CartContext";
import lessonApi from "../../api/lessonApi";
import type { Lesson } from "../../types/lesson";
import reviewClient, { type ReviewDto } from "../../api/reviewClient";

export default function CourseDetail() {
  const { slug } = useParams();
  const location = useLocation();

  const [course, setCourse] = useState<Course | null>((location.state as any)?.course || null);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);

  // Lessons + playback
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string>("");
  const [loadingPlayback, setLoadingPlayback] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<{ count: number; average: number; breakdown: Record<string, number> } | null>(null);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [commentInput, setCommentInput] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string>("");

  const { addCourse, courses, removeCourse } = useCart();

  // Load course by slug when direct access
  useEffect(() => {
    (async () => {
      try {
        if (!course && slug) {
          const data = await courseApi.getBySlug(slug);
          setCourse(data);
        }
      } catch (err) {
        console.error("Failed to load course:", err);
      }
    })();
  }, [slug]);

  // Resolve enrolled status
  useEffect(() => {
    (async () => {
      try {
        if (!course) return;
        const ids = await enrollmentApi.getMyEnrolledCourseIds();
        setIsEnrolled(ids.has(String((course as any)._id)));
      } catch {
        setIsEnrolled(false);
      }
    })();
  }, [course]);

  // Load lessons when course is ready
  useEffect(() => {
    (async () => {
      if (!course?._id) return;
      try {
        setLoadingLessons(true);
        const list = await lessonApi.listByCourse(String((course as any)._id));
        const arr = Array.isArray(list) ? list : [];
        setLessons(arr);
        if (arr.length > 0) setSelectedLessonId(arr[0]._id);
      } catch (e) {
        console.warn("Không thể tải danh sách bài học", e);
      } finally {
        setLoadingLessons(false);
      }
    })();
  }, [course?._id]);

  // Fetch playback URL only if user enrolled and selected lesson changes
  useEffect(() => {
    (async () => {
      setPlaybackUrl("");
      if (!selectedLessonId) return;
      if (!isEnrolled) return;
      try {
        setLoadingPlayback(true);
        const data = await lessonApi.playback(selectedLessonId);
        const url = (data as any)?.playbackUrl || (data as any)?.url;
        if (typeof url === "string") setPlaybackUrl(url);
      } catch {
        setPlaybackUrl("");
      } finally {
        setLoadingPlayback(false);
      }
    })();
  }, [selectedLessonId, isEnrolled]);

  // Load reviews + summary for course
  useEffect(() => {
    (async () => {
      if (!course?._id) return;
      try {
        setLoadingReviews(true);
        const [list, summary] = await Promise.all([
          reviewClient.listForCourse(String((course as any)._id)),
          reviewClient.getCourseSummary(String((course as any)._id)),
        ]);
        setReviews(Array.isArray(list) ? list : []);
        setReviewSummary(summary);
      } catch (e) {
        setReviews([]);
        setReviewSummary(null);
      } finally {
        setLoadingReviews(false);
      }
    })();
  }, [course?._id]);

  const isInCart = courses.some((c) => (c as any)._id === (course as any)?._id);
  const formatVND = (n: number) => n.toLocaleString("vi-VN");

  const categoryName = useMemo(() => {
    const cat = (course as any)?.category;
    if (Array.isArray(cat) && cat.length > 0) return cat[0]?.name || "Chưa có danh mục";
    return "Chưa có danh mục";
  }, [course]);

  if (!course) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
      </Link>

      {/* Course card */}
      <div className="bg-white shadow border border-gray-100 rounded-2xl overflow-hidden">
        <img
          src={course.thumbnail_url || "https://placehold.co/800x400"}
          alt={course.title}
          className="w-full h-64 object-cover"
        />

        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>

          <p className="text-sm md:text-base font-semibold text-blue-500 mb-2">
            Giảng viên: <span className="text-gray-700">
              {course.teacherNames && course.teacherNames.length > 0
                ? course.teacherNames.join(", ")
                : "Admin"}
            </span>
          </p>

          {Array.isArray((course as any).teacher) && (course as any).teacher.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              {(course as any).teacher.map((t: any) => (
                <div key={t.full_name} className="flex items-center gap-1">
                  <img src={t.avatar_url} alt={t.full_name} className="w-6 h-6 rounded-full" />
                  <span className="text-gray-700">{t.full_name}</span>
                </div>
              ))}
            </div>
          )}

          <p className="text-sm md:text-base font-semibold text-blue-500 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            {categoryName}
          </p>

          <div className="flex items-center gap-1 text-amber-500 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-5 h-5 ${i < 4 ? "fill-current" : ""}`} />
            ))}
          </div>

          <p className="text-gray-700 mb-6 leading-relaxed">
            {course.description || "Không có mô tả chi tiết."}
          </p>

          {/* Price hidden if enrolled */}
          {!isEnrolled && (
            <p className="text-2xl font-semibold text-green-700 mb-6">
              {formatVND((course as any).price_cents || 0)} ₫
            </p>
          )}

          {/* Cart actions hidden if enrolled */}
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

      {/* Lessons + Video section */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video / Preview */}
        <div className="lg:col-span-2 bg-white shadow border border-gray-100 rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-3">Nội dung bài học</h3>
          {loadingPlayback ? (
            <div className="h-64 flex items-center justify-center">Đang tải video...</div>
          ) : selectedLessonId ? (
            isEnrolled ? (
              playbackUrl ? (
                <video controls src={playbackUrl} className="w-full rounded-lg bg-black" />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">Không có URL phát cho bài học này.</div>
              )
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-500 gap-2">
                <Lock className="w-6 h-6" />
                <div>Bạn cần mua khóa học để xem video.</div>
              </div>
            )
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">Chưa chọn bài học.</div>
          )}

          {/* Selected lesson description */}
          {selectedLessonId && (
            <div className="mt-4 text-sm text-gray-700 whitespace-pre-wrap">
              {lessons.find((l) => l._id === selectedLessonId)?.description || ""}
            </div>
          )}
        </div>

        {/* Lesson list */}
        <aside className="bg-white shadow border border-gray-100 rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-3">Danh sách bài học</h3>
          {loadingLessons ? (
            <div>Đang tải danh sách...</div>
          ) : lessons.length === 0 ? (
            <div>Chưa có bài học nào.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {lessons.map((ls) => (
                <li key={ls._id}>
                  <button
                    onClick={() => setSelectedLessonId(ls._id)}
                    className={`w-full text-left p-3 hover:bg-gray-50 transition ${selectedLessonId === ls._id ? "bg-blue-50" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{ls.position}. {ls.title}</span>
                      {!isEnrolled && <Lock className="w-4 h-4 text-gray-400" />}
                    </div>
                    {ls.description && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">{ls.description}</div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {/* Reviews */}
      <section className="mt-8 bg-white shadow border border-gray-100 rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-4">Đánh giá khóa học</h3>

        {/* Summary + Histogram */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-3">
            {(() => {
              const avg = reviewSummary?.average ?? 0;
              const count = reviewSummary?.count ?? reviews.length;
              return (
                <>
                  <div className="flex items-center text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-5 h-5 ${i < Math.round(avg) ? "fill-current" : ""}`} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">{avg} / 5 • {count} đánh giá</span>
                </>
              );
            })()}
          </div>
          {reviewSummary && (
            <div className="space-y-1">
              {[5,4,3,2,1].map((r) => {
                const total = reviewSummary.count || 1;
                const c = reviewSummary.breakdown[String(r)] || 0;
                const pct = Math.round((c / total) * 100);
                return (
                  <div key={r} className="flex items-center gap-2 text-sm">
                    <span className="w-8 text-gray-600">{r}★</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded">
                      <div className="h-2 bg-amber-500 rounded" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 text-right text-gray-600">{c}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Write review (only when enrolled) */}
        {isEnrolled && (
          <div className="mb-6 border rounded-xl p-4 bg-gray-50">
            <h4 className="font-semibold mb-2">Viết đánh giá của bạn</h4>
            <div className="flex items-center gap-3 mb-3">
              <label className="text-sm text-gray-700">Chấm điểm:</label>
              <select
                value={ratingInput}
                onChange={(e) => setRatingInput(Number(e.target.value))}
                className="border rounded-lg p-2"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <textarea
              placeholder="Chia sẻ cảm nhận của bạn về khóa học..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className="w-full border rounded-lg p-3 min-h-[100px]"
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                disabled={submittingReview}
                onClick={async () => {
                  if (!course?._id) return;
                  setSubmittingReview(true);
                  setReviewMessage("");
                  try {
                    await reviewClient.createCourseReview(String((course as any)._id), ratingInput, commentInput);
                    setCommentInput("");
                    setRatingInput(5);
                    setReviewMessage("Đã gửi đánh giá, chờ duyệt.");
                  } catch (e: any) {
                    setReviewMessage(e?.message || "Không thể gửi đánh giá. Vui lòng đăng nhập và thử lại.");
                  } finally {
                    setSubmittingReview(false);
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                Gửi đánh giá
              </button>
              {reviewMessage && (
                <span className="text-sm text-gray-600">{reviewMessage}</span>
              )}
            </div>
          </div>
        )}

        {/* Review list */}
        {loadingReviews ? (
          <div className="text-gray-500">Đang tải đánh giá...</div>
        ) : reviews.length === 0 ? (
          <div className="text-gray-500">Chưa có đánh giá nào.</div>
        ) : (
          <ul className="space-y-4">
            {reviews.map((rv) => {
              const userRaw = (rv as any).user_id || (rv as any).user;
              const nameRaw = typeof userRaw === "object" ? (userRaw?.name ?? "") : "";
              const displayName = (typeof nameRaw === "string" && nameRaw.trim().length > 0)
                ? nameRaw.trim()
                : "Người dùng";
              return (
                <li key={rv._id} className="border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-gray-800 flex items-center gap-2">
                      {displayName}
                      {(rv as any).verified && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Đã mua</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Number((rv as any).rating || 0) ? "fill-current" : ""}`} />
                      ))}
                    </div>
                  </div>
                  {(rv as any).comment && (
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{(rv as any).comment}</p>
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
      </section>
    </div>
  );
}
