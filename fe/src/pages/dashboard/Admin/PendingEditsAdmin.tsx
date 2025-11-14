import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import courseAdminApi from "../../../api/courseAdminApi";
import lessonApi from "../../../api/lessonApi";
// import historyApi, { type EditHistoryItem } from "../../../api/historyApi";
import type { Course } from "../../../types/course";
import type { Lesson } from "../../../types/lesson";
import CourseForm from "../../../components/courses/CourseForm";
import LessonManager from "../../../components/courses/LessonManager";
import "./PendingEditsAdmin.css";

type PendingCourse = {
  _id: string;
  title: string;
  pending_at?: string;
  draft?: any;
};

type PendingLesson = {
  _id: string;
  title: string;
  course_id: string;
  pending_at?: string;
  draft?: any;
};

export default function PendingEditsAdmin() {
  const [courses, setCourses] = useState<PendingCourse[]>([]);
  const [lessons, setLessons] = useState<PendingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [recent, setRecent] = useState<EditHistoryItem[]>([]);
  const [viewingCourseId, setViewingCourseId] = useState<string | null>(null);
  const [viewingLessonId, setViewingLessonId] = useState<string | null>(null);
  const [courseDetail, setCourseDetail] = useState<Course | null>(null);
  const [courseDetailLoading, setCourseDetailLoading] = useState(false);
  const [lessonDetail, setLessonDetail] = useState<Lesson | null>(null);
  const [lessonDetailLoading, setLessonDetailLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [cRes, lRes] = await Promise.all([
        courseAdminApi.getPending().catch(() => ({ data: [], count: 0 } as any)),
        lessonApi.getPending().catch(() => ({ data: [], count: 0 } as any)),
        // historyApi.listAdminRecent({ limit: 30 }).catch(() => ({ data: [], count: 0 } as any)),
      ]);
      const cData: any[] = (cRes as any)?.data?.data || (cRes as any)?.data || cRes || [];
      const lData: any[] = (lRes as any)?.data?.data || (lRes as any)?.data || lRes || [];
      // const rData: any[] = (rRes as any)?.data?.data || (rRes as any)?.data || rRes || [];
      setCourses(cData as PendingCourse[]);
      setLessons(lData as PendingLesson[]);
      // setRecent(rData as EditHistoryItem[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load pending edits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approveCourse = async (id: string) => {
    try {
      await courseAdminApi.approveChanges(id);
      load();
    } catch (e: any) {
      alert(e?.message || "Không thể phê duyệt yêu cầu");
    }
  };

  const rejectCourse = async (id: string) => {
    try {
      await courseAdminApi.rejectChanges(id);
      load();
    } catch (e: any) {
      alert(e?.message || "Không thể từ chối yêu cầu");
    }
  };

  const approveLesson = async (id: string) => {
    try {
      await lessonApi.approveChanges(id);
      load();
    } catch (e: any) {
      alert(e?.message || "Không thể phê duyệt yêu cầu");
    }
  };

  const rejectLesson = async (id: string) => {
    try {
      await lessonApi.rejectChanges(id);
      load();
    } catch (e: any) {
      alert(e?.message || "Không thể từ chối yêu cầu");
    }
  };

  const fmt = (d?: string) => (d ? new Date(d).toLocaleString("vi-VN") : "");

  // Load course detail
  const loadCourseDetail = async (courseId: string) => {
    // Toggle: if clicking the same course, hide it
    if (viewingCourseId === courseId) {
      setViewingCourseId(null);
      setCourseDetail(null);
      return;
    }
    // Hide lesson detail if showing
    setViewingLessonId(null);
    setLessonDetail(null);
    // Load new course detail
    setViewingCourseId(courseId);
    setCourseDetailLoading(true);
    try {
      const res = await courseAdminApi.getById(courseId);
      setCourseDetail(res.data ?? res);
    } catch (e: any) {
      alert(e?.message || "Không tải được chi tiết khóa học");
      setViewingCourseId(null);
    } finally {
      setCourseDetailLoading(false);
    }
  };

  // Load lesson detail
  const loadLessonDetail = async (lessonId: string) => {
    // Toggle: if clicking the same lesson, hide it
    if (viewingLessonId === lessonId) {
      setViewingLessonId(null);
      setLessonDetail(null);
      return;
    }
    // Hide course detail if showing
    setViewingCourseId(null);
    setCourseDetail(null);
    // Load new lesson detail
    setViewingLessonId(lessonId);
    setLessonDetailLoading(true);
    try {
      const res = await lessonApi.getById(lessonId);
      setLessonDetail(res as any);
    } catch (e: any) {
      alert(e?.message || "Không tải được chi tiết bài học");
      setViewingLessonId(null);
    } finally {
      setLessonDetailLoading(false);
    }
  };

  // Filter different types of requests
  const courseDeleteRequests = (courses || []).filter((c) => (c as any)?.draft?.__action === 'delete');
  const lessonDeleteRequests = (lessons || []).filter((l) => (l as any)?.draft?.__action === 'delete');

  // const recentDeletes = (recent || []).filter((h) => Boolean((h as any)?.changes?.deleted));

  return (
    <div className="pending-edits-container">
      <div className="pending-edits-header">
        <h2>Quản lý yêu cầu chỉnh sửa</h2>
        <p>Xem xét và phê duyệt các yêu cầu từ giáo viên</p>
      </div>

      {loading ? (
        <div className="loading-state">Đang tải dữ liệu...</div>
      ) : error ? (
        <div className="error-state">
          <strong>Lỗi:</strong> {error}
          <button className="btn btn-primary" onClick={load} style={{ marginTop: 12 }}>
            Thử lại
          </button>
        </div>
      ) : (
        <div>
          {/* Course Delete Requests */}
          <section className="pending-section">
            <div className="section-header">
              <h3 className="section-title">
                🗑️ Khóa học • Yêu cầu xóa
              </h3>
              <span className={`section-count ${courseDeleteRequests.length > 0 ? 'has-items' : ''}`}>
                {courseDeleteRequests.length} yêu cầu
              </span>
            </div>
            {courseDeleteRequests.length === 0 ? (
              <div className="empty-state">Không có yêu cầu xóa khóa học.</div>
            ) : (
              <div>
                  {courseDeleteRequests.map((c) => (
                  <div key={c._id}>
                    <div className="request-card">
                      <div className="request-header">
                        <div className="request-title-section">
                          <h4 className="request-title">
                            {c.title}
                            <span className="request-badge delete">Xóa</span>
                          </h4>
                          <div className="request-meta">
                            <div className="request-time">
                              🕒 {fmt((c as any)?.pending_at) || "Chưa có thời gian"}
                          </div>
                            <Link
                              to={`/dashboard/manage-courses/${c._id}`}
                              className="request-link"
                            >
                              📄 Mở trang khóa học
                            </Link>
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => loadCourseDetail(c._id)} 
                            >
                              {viewingCourseId === c._id ? "👁️ Ẩn chi tiết" : "👁️ Xem chi tiết"}
                            </button>
                          </div>
                        </div>
                        <div className="request-actions">
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              if (confirm('⚠️ Phê duyệt xóa khóa học này?\n\nHành động này sẽ xóa toàn bộ khóa học và các bài học liên quan. Hành động này không thể hoàn tác!')) {
                                approveCourse(c._id);
                              }
                            }}
                          >
                            ✓ Phê duyệt xóa
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                            const ok = confirm('Từ chối yêu cầu xóa khóa học này?');
                              if (ok) rejectCourse(c._id);
                            }}
                          >
                            ✗ Từ chối
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Inline Course Detail */}
                    {viewingCourseId === c._id && (
                      <div style={{ 
                        marginTop: 16, 
                        padding: 20, 
                        backgroundColor: '#f9fafb', 
                        borderRadius: 12, 
                        border: '1px solid #e5e7eb' 
                      }}>
                        {courseDetailLoading ? (
                          <div>Đang tải chi tiết khóa học...</div>
                        ) : courseDetail ? (
                          <div style={{ display: "grid", gap: 20 }}>
                            <div style={{ background: "#fff", borderRadius: 12, padding: 16 }}>
                              <h3 style={{ marginTop: 0 }}>Thông tin khóa học</h3>
                              <CourseForm
                                initialData={{
                                  ...courseDetail,
                                  category_id: (() => {
                                    const cat = (courseDetail as any)?.category;
                                    if (Array.isArray(cat) && cat.length > 0) return String(cat[0]?._id || cat[0]);
                                    if ((courseDetail as any)?.category_id) return String((courseDetail as any).category_id);
                                    return "";
                                  })(),
                                  teacher_ids: Array.isArray((courseDetail as any)?.teacher)
                                    ? ((courseDetail as any).teacher as any[]).map((t: any) => t?._id).filter(Boolean)
                                    : [],
                                }}
                                onSubmit={async () => {
                                  await loadCourseDetail(c._id);
                                }}
                                showTeacherAssign
                              />
                            </div>
                            <div style={{ background: "#fff", borderRadius: 12, padding: 16 }}>
                              <LessonManager courseId={courseDetail._id} />
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: "red" }}>Không tải được chi tiết khóa học</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Lesson Delete Requests */}
          <section className="pending-section">
            <div className="section-header">
              <h3 className="section-title">
                📝 Bài học • Yêu cầu xóa
              </h3>
              <span className={`section-count ${lessonDeleteRequests.length > 0 ? 'has-items' : ''}`}>
                {lessonDeleteRequests.length} yêu cầu
              </span>
            </div>
            {lessonDeleteRequests.length === 0 ? (
              <div className="empty-state">Không có yêu cầu xóa bài học.</div>
            ) : (
              <div>
                  {lessonDeleteRequests.map((l) => (
                  <div key={l._id}>
                    <div className="request-card">
                      <div className="request-header">
                        <div className="request-title-section">
                          <h4 className="request-title">
                            {l.title}
                            <span className="request-badge delete">Xóa</span>
                          </h4>
                          <div className="request-meta">
                            <div className="request-time">
                              🕒 {fmt((l as any)?.pending_at) || "Chưa có thời gian"}
                            </div>
                            <Link
                              to={`/dashboard/manage-courses/${l.course_id}/lessons/${l._id}`}
                              className="request-link"
                            >
                              📄 Xem bài học
                            </Link>
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => loadLessonDetail(l._id)} 
                            >
                              {viewingLessonId === l._id ? "👁️ Ẩn chi tiết" : "👁️ Xem chi tiết"}
                            </button>
                          </div>
                        </div>
                        <div className="request-actions">
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              if (confirm('Phê duyệt xóa bài học này?')) {
                                approveLesson(l._id);
                              }
                            }}
                          >
                            ✓ Phê duyệt xóa
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                            const ok = confirm('Từ chối yêu cầu xóa bài học này?');
                              if (ok) rejectLesson(l._id);
                            }}
                          >
                            ✗ Từ chối
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Inline Lesson Detail */}
                    {viewingLessonId === l._id && (
                      <div style={{ 
                        marginTop: 16, 
                        padding: 20, 
                        backgroundColor: '#f9fafb', 
                        borderRadius: 12, 
                        border: '1px solid #e5e7eb' 
                      }}>
                        {lessonDetailLoading ? (
                          <div>Đang tải chi tiết bài học...</div>
                        ) : lessonDetail ? (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div style={{ background: "#fff", borderRadius: 12, padding: 16 }}>
                              <h3 style={{ marginTop: 0 }}>Xem trước</h3>
                              {lessonDetail.video_url ? (
                                <video 
                                  controls 
                                  src={lessonDetail.video_url} 
                                  style={{ width: "100%", borderRadius: 8, background: "#000" }} 
                                />
                              ) : (
                                <div style={{ color: "#999" }}>Chưa có video</div>
                              )}
                              {lessonDetail.description && (
                                <div style={{ marginTop: 12 }}>
                                  <strong>Mô tả:</strong>
                                  <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>
                                    {lessonDetail.description}
                                  </div>
                                </div>
                              )}
                              {Array.isArray(lessonDetail.reviews) && lessonDetail.reviews.length > 0 && (
                                <div style={{ marginTop: 12 }}>
                                  <strong>Đánh giá:</strong>
                                  <ul style={{ marginTop: 6 }}>
                                    {lessonDetail.reviews.map((rv: any, i: number) => (
                                      <li key={i} style={{ fontSize: 13 }}>
                                        ⭐ {rv.rating}/5 {rv.comment ? `- ${rv.comment}` : ""}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            <div style={{ background: "#fff", borderRadius: 12, padding: 16 }}>
                              <h3 style={{ marginTop: 0 }}>Thông tin bài học</h3>
                              <div style={{ display: 'grid', gap: 12 }}>
                                <div>
                                  <strong>Tiêu đề:</strong>
                                  <div>{lessonDetail.title}</div>
                                </div>
                                {lessonDetail.duration_minutes && (
                                  <div>
                                    <strong>Thời lượng:</strong>
                                    <div>{lessonDetail.duration_minutes} phút</div>
                                  </div>
                                )}
                                {lessonDetail.position !== undefined && (
                                  <div>
                                    <strong>Vị trí:</strong>
                                    <div>{lessonDetail.position}</div>
                                  </div>
                                )}
                                {(lessonDetail as any)?.has_pending_changes && (lessonDetail as any)?.draft && (
                                  <div style={{ marginTop: 8, padding: 12, backgroundColor: '#fef3c7', borderRadius: 8 }}>
                                    <strong>Thay đổi đang chờ:</strong>
                                    <div style={{ marginTop: 8, fontSize: 14 }}>
                                      {(lessonDetail as any).draft.__action === 'delete' && (
                                        <div style={{ color: '#dc2626', fontWeight: 600 }}>Yêu cầu xóa</div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: "red" }}>Không tải được chi tiết bài học</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Delete Actions - Hidden */}
          {/* <section className="recent-actions-section">
            ...
          </section> */}
        </div>
      )}
    </div>
  );
}
