import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import courseAdminApi from "../../../api/courseAdminApi";
import lessonApi from "../../../api/lessonApi";
import historyApi, { type EditHistoryItem } from "../../../api/historyApi";

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
  const [detail, setDetail] = useState<null | {
    type: 'course' | 'lesson';
    id: string;
    title?: string;
    pending_at?: string;
    keys: string[];
    before: Record<string, any>;
    after: Record<string, any>;
    course_id?: string;
  }>(null);
  const [opening, setOpening] = useState(false);

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
    try { await courseAdminApi.approveChanges(id); load(); } catch {}
  };
  const rejectCourse = async (id: string) => {
    try { await courseAdminApi.rejectChanges(id); load(); } catch {}
  };
  const approveLesson = async (id: string) => {
    try { await lessonApi.approveChanges(id); load(); } catch {}
  };
  const rejectLesson = async (id: string) => {
    try { await lessonApi.rejectChanges(id); load(); } catch {}
  };

  const fmt = (d?: string) => (d ? new Date(d).toLocaleString("vi-VN") : "");

  const openCourseDetail = async (c: PendingCourse) => {
    setOpening(true);
    try {
      const full = await courseAdminApi.getById(c._id);
      const entity: any = (full as any)?.data ?? full;
      const keys = Object.keys(c.draft || {});
      const before: any = {};
      const after: any = {};
      keys.forEach((k) => {
        if (k === 'category_id') {
          const cat = (entity as any)?.category;
          before[k] = Array.isArray(cat) && cat.length > 0
            ? (typeof cat[0] === 'object' ? (cat[0]?._id || cat[0]?.id || String(cat[0])) : String(cat[0]))
            : '';
        } else {
          before[k] = (entity as any)?.[k];
        }
        after[k] = (c as any)?.draft?.[k];
      });
      setDetail({ type: 'course', id: c._id, title: c.title, pending_at: c.pending_at, keys, before, after });
    } finally {
      setOpening(false);
    }
  };

  const openLessonDetail = async (l: PendingLesson) => {
    setOpening(true);
    try {
      const full = await lessonApi.getById(l._id);
      const entity: any = (full as any)?.data ?? full;
      const keys = Object.keys(l.draft || {});
      const before: any = {}; const after: any = {};
      keys.forEach((k) => { before[k] = (entity as any)?.[k]; after[k] = (l as any)?.draft?.[k]; });
      setDetail({ type: 'lesson', id: l._id, title: l.title, pending_at: l.pending_at, keys, before, after, course_id: l.course_id });
    } finally {
      setOpening(false);
    }
  };

  // Only focus on delete requests for clearer UI
  const courseDeleteRequests = (courses || []).filter((c) => (c as any)?.draft?.__action === 'delete');
  const lessonDeleteRequests = (lessons || []).filter((l) => (l as any)?.draft?.__action === 'delete');

  const recentDeletes = (recent || []).filter((h) => Boolean((h as any)?.changes?.deleted));

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2>Delete Requests (Teacher → Admin)</h2>
      {loading ? (
        <div>Đang tải...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          <section style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h3 style={{ margin: 0, flex: 1 }}>Courses • Yêu cầu xóa</h3>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{courseDeleteRequests.length} request(s)</span>
            </div>
            {courseDeleteRequests.length === 0 ? (
              <div style={{ paddingTop: 8 }}>Không có yêu cầu xóa khóa học.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Khóa học</th>
                    <th>Gửi lúc</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {courseDeleteRequests.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600 }}>{c.title}</span>
                          <span style={{ fontSize: 12, color: '#ef4444', border: '1px solid #fecaca', background: '#fee2e2', padding: '0 6px', borderRadius: 999 }}>DELETE REQUEST</span>
                        </div>
                        <div style={{ marginTop: 4, fontSize: 12 }}>
                          <Link to={`/dashboard/manage-courses/${c._id}`}>Mở trang khóa học</Link>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>{fmt((c as any)?.pending_at)}</td>
                      <td style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button onClick={() => {
                          if (confirm('Phê duyệt xóa khóa học này? Hành động sẽ xóa toàn bộ khóa học và các bài học liên quan.')) approveCourse(c._id)
                        }}>Approve Delete</button>
                        <button onClick={() => {
                          const ok = confirm('Từ chối yêu cầu xóa khóa học này?');
                          if (ok) rejectCourse(c._id)
                        }} style={{ color: '#b91c1c' }}>Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h3 style={{ margin: 0, flex: 1 }}>Lessons • Yêu cầu xóa</h3>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{lessonDeleteRequests.length} request(s)</span>
            </div>
            {lessonDeleteRequests.length === 0 ? (
              <div style={{ paddingTop: 8 }}>Không có yêu cầu xóa bài học.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Bài học</th>
                    <th>Khóa học</th>
                    <th>Gửi lúc</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {lessonDeleteRequests.map((l) => (
                    <tr key={l._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600 }}>{l.title}</span>
                          <span style={{ fontSize: 12, color: '#ef4444', border: '1px solid #fecaca', background: '#fee2e2', padding: '0 6px', borderRadius: 999 }}>DELETE REQUEST</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Link to={`/dashboard/manage-courses/${l.course_id}/lessons/${l._id}`}>Xem</Link>
                      </td>
                      <td style={{ textAlign: 'center' }}>{fmt((l as any)?.pending_at)}</td>
                      <td style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button onClick={() => {
                          if (confirm('Phê duyệt xóa bài học này?')) approveLesson(l._id)
                        }}>Approve Delete</button>
                        <button onClick={() => {
                          const ok = confirm('Từ chối yêu cầu xóa bài học này?');
                          if (ok) rejectLesson(l._id)
                        }} style={{ color: '#b91c1c' }}>Not delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
            <h3 style={{ margin: 0 }}>Recent delete actions</h3>
            {recentDeletes.length === 0 ? (
              <div style={{ paddingTop: 8 }}>Chưa có lịch sử xóa gần đây.</div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {recentDeletes.map((h) => (
                  <div key={h._id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span>{h.target_type.toUpperCase()}</span>
                      <span style={{ color: '#6b7280' }}>{h.created_at ? new Date(h.created_at).toLocaleString('vi-VN') : ''}</span>
                      <span style={{ marginLeft: 'auto' }}>{h.status}</span>
                    </div>
                    <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                      <div style={{ fontWeight: 600 }}>Field</div>
                      <div style={{ fontWeight: 600 }}>Before</div>
                      <div style={{ fontWeight: 600 }}>After</div>
                      {Object.entries(h.changes || {}).map(([k, v]) => (
                        <>
                          <div key={h._id + k + 'f'} style={{ fontFamily: 'monospace' }}>{k}</div>
                          <div key={h._id + k + 'b'} style={{ whiteSpace: 'pre-wrap' }}>{String((v as any).from ?? '')}</div>
                          <div key={h._id + k + 'a'} style={{ whiteSpace: 'pre-wrap' }}>{String((v as any).to ?? '')}</div>
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
    </div>
  );
}

// Inline lightweight modal renderer (no external deps)
// Detail modal no longer used in the simplified delete-only UI. Keeping removed for clarity.
