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

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2>Pending Edits</h2>
      {loading ? (
        <div>Đang tải...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          <section>
            <h3>Courses</h3>
            {courses.length === 0 ? (
              <div>Không có yêu cầu chỉnh sửa.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Tiêu đề</th>
                    <th>Thời gian</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <div><strong>Trước:</strong> {c.title}</div>
                        {c?.draft?.title !== undefined && (
                          <div><strong>Sau:</strong> {String(c.draft.title)}</div>
                        )}
                        <div style={{ marginTop: 4 }}>
                          <Link to={`/dashboard/manage-courses/${c._id}`}>Chi tiết</Link>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>{fmt((c as any)?.pending_at)}</td>
                      <td style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button onClick={() => openCourseDetail(c)}>Chi tiết</button>
                        <button onClick={() => approveCourse(c._id)}>Approve</button>
                        <button onClick={() => rejectCourse(c._id)} style={{ color: '#b91c1c' }}>Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section>
            <h3>Lessons</h3>
            {lessons.length === 0 ? (
              <div>Không có yêu cầu chỉnh sửa.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Tiêu đề</th>
                    <th>Khóa học</th>
                    <th>Thời gian</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((l) => (
                    <tr key={l._id}>
                      <td>
                        <div><strong>Trước:</strong> {l.title}</div>
                        {l?.draft?.title !== undefined && (
                          <div><strong>Sau:</strong> {String(l.draft.title)}</div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Link to={`/dashboard/manage-courses/${l.course_id}/lessons/${l._id}`}>Xem</Link>
                      </td>
                      <td style={{ textAlign: 'center' }}>{fmt((l as any)?.pending_at)}</td>
                      <td style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button onClick={() => openLessonDetail(l)}>Chi tiết</button>
                        <button onClick={() => approveLesson(l._id)}>Approve</button>
                        <button onClick={() => rejectLesson(l._id)} style={{ color: '#b91c1c' }}>Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section>
            <h3>Recent changes</h3>
            {recent.length === 0 ? (
              <div>Chưa có lịch sử gần đây.</div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {recent.map((h) => (
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
      <DetailModal
        data={detail}
        onClose={() => setDetail(null)}
        onApprove={detail ? (detail.type === 'course' ? () => approveCourse(detail.id) : () => approveLesson(detail.id)) : undefined}
        onReject={detail ? (detail.type === 'course' ? () => rejectCourse(detail.id) : () => rejectLesson(detail.id)) : undefined}
      />
    </div>
  );
}

// Inline lightweight modal renderer (no external deps)
function DetailModal({ data, onClose, onApprove, onReject }: {
  data: { type: 'course'|'lesson'; title?: string; keys: string[]; before: Record<string, any>; after: Record<string, any>; pending_at?: string } | null,
  onClose: () => void,
  onApprove?: () => void,
  onReject?: () => void,
}) {
  if (!data) return null as any;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <div style={{ width: 'min(900px, 96vw)', maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 10px 40px rgba(0,0,0,.2)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0, flex: 1 }}>Chi tiết thay đổi ({data.type})</h3>
          <button onClick={onClose}>Đóng</button>
        </div>
        {data.title && <div style={{ marginTop: 6, color: '#6b7280' }}>Đối tượng: {data.title}</div>}
        {data.pending_at && <div style={{ fontSize: 12, color: '#6b7280' }}>Gửi lúc: {new Date(data.pending_at).toLocaleString('vi-VN')}</div>}
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ fontWeight: 600 }}>Field</div>
          <div style={{ fontWeight: 600 }}>Before</div>
          <div style={{ fontWeight: 600 }}>After</div>
          {data.keys.map((k) => (
            <>
              <div key={String(k) + 'f'} style={{ fontFamily: 'monospace' }}>{String(k)}</div>
              <div key={String(k) + 'b'} style={{ whiteSpace: 'pre-wrap' }}>{String((data.before as any)[k] ?? '')}</div>
              <div key={String(k) + 'a'} style={{ whiteSpace: 'pre-wrap' }}>{String((data.after as any)[k] ?? '')}</div>
            </>
          ))}
        </div>
        {(onApprove || onReject) && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {onApprove && <button onClick={onApprove}>Approve</button>}
            {onReject && <button onClick={onReject} style={{ color: '#b91c1c' }}>Reject</button>}
          </div>
        )}
      </div>
    </div>
  )
}
