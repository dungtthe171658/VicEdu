import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import courseTeacherApi from "../../../api/courseTeacherApi";
import lessonApi from "../../../api/lessonApi";
import type { Course } from "../../../types/course";
import historyApi, { type EditHistoryItem } from "../../../api/historyApi";

type PendingLesson = { _id: string; title: string; course_id: string; pending_at?: string; draft?: any };
type PendingCourse = { _id: string; title: string; pending_at?: string; draft?: any };

export default function PendingEditsTeacher() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [pendingLessons, setPendingLessons] = useState<PendingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<EditHistoryItem[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const cRes = await courseTeacherApi.getAll();
      const cData: any[] = (cRes as any)?.data || cRes || [];
      setCourses(cData as Course[]);

      // Load lessons pending per course (scaffold)
      const lessonPending: PendingLesson[] = [];
      await Promise.all(
        (cData || []).map(async (c: any) => {
          try {
            const lRes = await lessonApi.listByCourse(c._id);
            const lData: any[] = (lRes as any)?.data || lRes || [];
            lData.filter((l: any) => !!l?.has_pending_changes).forEach((l: any) => {
              lessonPending.push({ _id: l._id, title: l.title, course_id: String(l.course_id), pending_at: (l as any)?.pending_at, draft: (l as any)?.draft });
            });
          } catch {}
        })
      );
      setPendingLessons(lessonPending);
      try {
        const rRes = await historyApi.listMyRecent({ limit: 30 });
        const rData: any[] = (rRes as any)?.data?.data || (rRes as any)?.data || rRes || [];
        setRecent(rData as EditHistoryItem[]);
      } catch {}
    } catch (e: any) {
      setError(e?.message || "Failed to load pending edits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fmt = (d?: string) => (d ? new Date(d).toLocaleString("vi-VN") : "");

  const pendingCourses = courses.filter((c: any) => !!(c as any)?.has_pending_changes);
  
  // Filter delete requests
  const courseDeleteRequests = pendingCourses.filter((c: any) => (c as any)?.draft?.__action === 'delete');
  const lessonDeleteRequests = pendingLessons.filter((l: any) => (l as any)?.draft?.__action === 'delete');

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2>Yêu cầu đã gửi</h2>
      {loading ? (
        <div>Đang tải...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {/* Course Delete Requests */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>🗑️ Khóa học • Yêu cầu xóa</h3>
              <span style={{ 
                padding: '4px 12px', 
                borderRadius: 12, 
                backgroundColor: courseDeleteRequests.length > 0 ? '#fee2e2' : '#f3f4f6',
                color: courseDeleteRequests.length > 0 ? '#dc2626' : '#6b7280',
                fontSize: 14,
                fontWeight: 600
              }}>
                {courseDeleteRequests.length} yêu cầu
              </span>
            </div>
            {courseDeleteRequests.length === 0 ? (
              <div style={{ padding: 16, backgroundColor: '#f9fafb', borderRadius: 8, color: '#6b7280' }}>
                Không có yêu cầu xóa khóa học.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {courseDeleteRequests.map((c: any) => (
                  <div key={c._id} style={{ 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 8, 
                    padding: 16,
                    backgroundColor: '#fff'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <h4 style={{ margin: 0 }}>{c.title}</h4>
                          <span style={{ 
                            padding: '2px 8px', 
                            borderRadius: 4, 
                            backgroundColor: '#fee2e2', 
                            color: '#dc2626',
                            fontSize: 12,
                            fontWeight: 600
                          }}>
                            Xóa
                          </span>
                        </div>
                        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                          🕒 {fmt(c.pending_at) || "Chưa có thời gian"}
                        </div>
                        <Link 
                          to={`/teacher/manage-courses/${c._id}`}
                          style={{ color: '#3b82f6', textDecoration: 'none', fontSize: 14 }}
                        >
                          📄 Xem chi tiết khóa học →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Lesson Delete Requests */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>📝 Bài học • Yêu cầu xóa</h3>
              <span style={{ 
                padding: '4px 12px', 
                borderRadius: 12, 
                backgroundColor: lessonDeleteRequests.length > 0 ? '#fee2e2' : '#f3f4f6',
                color: lessonDeleteRequests.length > 0 ? '#dc2626' : '#6b7280',
                fontSize: 14,
                fontWeight: 600
              }}>
                {lessonDeleteRequests.length} yêu cầu
              </span>
            </div>
            {lessonDeleteRequests.length === 0 ? (
              <div style={{ padding: 16, backgroundColor: '#f9fafb', borderRadius: 8, color: '#6b7280' }}>
                Không có yêu cầu xóa bài học.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {lessonDeleteRequests.map((l) => (
                  <div key={l._id} style={{ 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 8, 
                    padding: 16,
                    backgroundColor: '#fff'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <h4 style={{ margin: 0 }}>{l.title}</h4>
                          <span style={{ 
                            padding: '2px 8px', 
                            borderRadius: 4, 
                            backgroundColor: '#fee2e2', 
                            color: '#dc2626',
                            fontSize: 12,
                            fontWeight: 600
                          }}>
                            Xóa
                          </span>
                        </div>
                        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                          🕒 {fmt(l.pending_at) || "Chưa có thời gian"}
                        </div>
                        <Link 
                          to={`/teacher/manage-courses/${l.course_id}/lessons/${l._id}`}
                          style={{ color: '#3b82f6', textDecoration: 'none', fontSize: 14 }}
                        >
                          📄 Xem chi tiết bài học →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Other Pending Changes */}
          <section>
            <h3>Chỉnh sửa khác</h3>
            {pendingCourses.filter((c: any) => (c as any)?.draft?.__action !== 'delete').length === 0 && 
             pendingLessons.filter((l: any) => (l as any)?.draft?.__action !== 'delete').length === 0 ? (
              <div>Không có thay đổi đang chờ duyệt.</div>
            ) : (
              <>
                {pendingCourses.filter((c: any) => (c as any)?.draft?.__action !== 'delete').length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <h4>Khóa học</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left' }}>Tiêu đề</th>
                          <th>Thời gian</th>
                          <th>Xem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingCourses.filter((c: any) => (c as any)?.draft?.__action !== 'delete').map((c: any) => (
                          <tr key={c._id}>
                            <td>
                              <div><strong>Trước:</strong> {c.title}</div>
                              {c?.draft?.title !== undefined && (
                                <div><strong>Sau:</strong> {String(c.draft.title)}</div>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>{fmt(c.pending_at)}</td>
                            <td style={{ textAlign: 'center' }}>
                              <Link to={`/teacher/manage-courses/${c._id}`}>Chi tiết</Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {pendingLessons.filter((l: any) => (l as any)?.draft?.__action !== 'delete').length > 0 && (
                  <div>
                    <h4>Bài học</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left' }}>Tiêu đề</th>
                          <th>Khóa học</th>
                          <th>Thời gian</th>
                          <th>Xem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingLessons.filter((l: any) => (l as any)?.draft?.__action !== 'delete').map((l) => (
                          <tr key={l._id}>
                            <td>
                              <div><strong>Trước:</strong> {l.title}</div>
                              {l?.draft?.title !== undefined && (
                                <div><strong>Sau:</strong> {String(l.draft.title)}</div>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>{l.course_id}</td>
                            <td style={{ textAlign: 'center' }}>{fmt(l.pending_at)}</td>
                            <td style={{ textAlign: 'center' }}>
                              <Link to={`/teacher/manage-courses/${l.course_id}/lessons/${l._id}`}>Chi tiết</Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Lịch sử gần đây - Hidden */}
          {/* <section>
            <h3>Lịch sử gần đây</h3>
            ...
          </section> */}
        </div>
      )}
    </div>
  );
}
