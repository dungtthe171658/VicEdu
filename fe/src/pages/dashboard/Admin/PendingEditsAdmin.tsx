import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import courseAdminApi from "../../../api/courseAdminApi";
import lessonApi from "../../../api/lessonApi";
import historyApi, { type EditHistoryItem } from "../../../api/historyApi";
import CourseDetailModal from "../../../components/courses/CourseDetailModal";
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
  const [recent, setRecent] = useState<EditHistoryItem[]>([]);
  const [viewingCourseId, setViewingCourseId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [cRes, lRes, rRes] = await Promise.all([
        courseAdminApi.getPending().catch(() => ({ data: [], count: 0 } as any)),
        lessonApi.getPending().catch(() => ({ data: [], count: 0 } as any)),
        historyApi.listAdminRecent({ limit: 30 }).catch(() => ({ data: [], count: 0 } as any)),
      ]);
      const cData: any[] = (cRes as any)?.data?.data || (cRes as any)?.data || cRes || [];
      const lData: any[] = (lRes as any)?.data?.data || (lRes as any)?.data || lRes || [];
      const rData: any[] = (rRes as any)?.data?.data || (rRes as any)?.data || rRes || [];
      setCourses(cData as PendingCourse[]);
      setLessons(lData as PendingLesson[]);
      setRecent(rData as EditHistoryItem[]);
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

  // Filter different types of requests
  const courseDeleteRequests = (courses || []).filter((c) => (c as any)?.draft?.__action === 'delete');
  const lessonDeleteRequests = (lessons || []).filter((l) => (l as any)?.draft?.__action === 'delete');

  const recentDeletes = (recent || []).filter((h) => Boolean((h as any)?.changes?.deleted));

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
                  <div key={c._id} className="request-card">
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
                            onClick={() => setViewingCourseId(c._id)} 
                          >
                            👁️ Xem chi tiết
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
                  <div key={l._id} className="request-card">
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
                ))}
              </div>
            )}
          </section>

          {/* Recent Delete Actions */}
          <section className="recent-actions-section">
            <div className="section-header">
              <h3 className="section-title">
                📋 Lịch sử xóa gần đây
              </h3>
              <span className={`section-count ${recentDeletes.length > 0 ? 'has-items' : ''}`}>
                {recentDeletes.length} hành động
              </span>
            </div>
            {recentDeletes.length === 0 ? (
              <div className="empty-state">Chưa có lịch sử xóa gần đây.</div>
            ) : (
              <div>
                {recentDeletes.map((h) => (
                  <div key={h._id} className="history-card">
                    <div className="history-header">
                      <span className="history-type">{h.target_type.toUpperCase()}</span>
                      <span className="history-time">
                        🕒 {h.created_at ? new Date(h.created_at).toLocaleString('vi-VN') : 'Chưa có thời gian'}
                      </span>
                      <span className={`history-status ${h.status?.toLowerCase() || 'pending'}`}>
                        {h.status || 'pending'}
                      </span>
                    </div>
                    <div className="history-changes">
                      <div className="history-changes-header">Trường</div>
                      <div className="history-changes-header">Trước</div>
                      <div className="history-changes-header">Sau</div>
                      {Object.entries(h.changes || {}).map(([k, v]) => (
                        <>
                          <div key={h._id + k + 'f'} className="history-field">{k}</div>
                          <div key={h._id + k + 'b'} className="history-value">
                            {String((v as any).from ?? '') || '(trống)'}
                          </div>
                          <div key={h._id + k + 'a'} className="history-value">
                            {String((v as any).to ?? '') || '(trống)'}
                          </div>
                        </>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
      
      {viewingCourseId && (
        <CourseDetailModal
          courseId={viewingCourseId}
          isOpen={!!viewingCourseId}
          onClose={() => setViewingCourseId(null)}
        />
      )}
    </div>
  );
}
