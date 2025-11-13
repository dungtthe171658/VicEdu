import { useEffect, useState } from "react";
import courseAdminApi from "../../api/courseAdminApi";
import type { Course } from "../../types/course";
import CourseForm from "./CourseForm";
import LessonManager from "./LessonManager";
import historyApi, { type EditHistoryItem } from "../../api/historyApi";
import lessonApi from "../../api/lessonApi";
import "./CourseDetailModal.css";

interface CourseDetailModalProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CourseDetailModal({ courseId, isOpen, onClose }: CourseDetailModalProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hist, setHist] = useState<EditHistoryItem[]>([]);
  const [pendingLessons, setPendingLessons] = useState<any[]>([]);

  const load = async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await courseAdminApi.getById(courseId);
      setCourse(res.data ?? res);
      try {
        const h = await historyApi.listByCourse(courseId);
        setHist((h as any)?.data || []);
      } catch {}
      try {
        const list = await lessonApi.listByCourse(courseId);
        const arr = Array.isArray((list as any)) ? (list as any) : ((list as any)?.data || []);
        const pend = arr.filter((x: any) => !!x?.has_pending_changes);
        setPendingLessons(pend);
      } catch {}
    } catch (e: any) {
      setError(e?.message || "Không tải được khóa học");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && courseId) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, courseId]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content course-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <h2 style={{ marginTop: 0 }}>Chi tiết khóa học</h2>

        {loading ? (
          <div>Đang tải khóa học...</div>
        ) : error ? (
          <div style={{ color: "red" }}>{error}</div>
        ) : !course ? (
          <div>Không tìm thấy khóa học.</div>
        ) : (
          <div style={{ display: "grid", gap: 20 }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>Thông tin khóa học</h3>
              <CourseForm
                initialData={{
                  ...course,
                  category_id: (() => {
                    const cat = (course as any)?.category;
                    if (Array.isArray(cat) && cat.length > 0) return String(cat[0]?._id || cat[0]);
                    if ((course as any)?.category_id) return String((course as any).category_id);
                    return "";
                  })(),
                  teacher_ids: Array.isArray((course as any)?.teacher)
                    ? ((course as any).teacher as any[]).map((t: any) => t?._id).filter(Boolean)
                    : [],
                }}
                onSubmit={async () => {
                  await load();
                }}
                showTeacherAssign
              />
            </div>
            <div style={{ background: "#fff", borderRadius: 12, padding: 16 }}>
              <LessonManager courseId={course._id} />
            </div>
            {(course as any)?.has_pending_changes && (course as any)?.draft && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
                <h3 style={{ marginTop: 0 }}>Pending draft (course)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <div style={{ fontWeight: 600 }}>Field</div>
                  <div style={{ fontWeight: 600 }}>Before</div>
                  <div style={{ fontWeight: 600 }}>After</div>
                  {Object.entries((course as any).draft).map(([k, v]) => (
                    <>
                      <div key={String(k) + '-f'} style={{ fontFamily: 'monospace' }}>{String(k)}</div>
                      <div key={String(k) + '-b'} style={{ whiteSpace: 'pre-wrap' }}>{String(((course as any)[k as any] !== undefined ? (course as any)[k as any] : ''))}</div>
                      <div key={String(k) + '-a'} style={{ whiteSpace: 'pre-wrap' }}>{String(v as any)}</div>
                    </>
                  ))}
                </div>
                <div style={{ marginTop: 8, color: '#6b7280', fontSize: 12 }}>
                  Submitted: {((course as any).pending_at ? new Date((course as any).pending_at).toLocaleString('vi-VN') : '')}
                </div>
              </div>
            )}
            {pendingLessons.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
                <h3 style={{ marginTop: 0 }}>Pending lesson edits</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {pendingLessons.map((ls: any) => (
                    <div key={ls._id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <strong>{ls.title}</strong>
                        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280' }}>{ls.pending_at ? new Date(ls.pending_at).toLocaleString('vi-VN') : ''}</span>
                        <button onClick={async () => { await lessonApi.approveChanges(ls._id); await load(); }}>Approve</button>
                        <button onClick={async () => { await lessonApi.rejectChanges(ls._id); await load(); }} style={{ color: '#b91c1c' }}>Reject</button>
                      </div>
                      {ls?.draft && (
                        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                          <div style={{ fontWeight: 600 }}>Field</div>
                          <div style={{ fontWeight: 600 }}>Before</div>
                          <div style={{ fontWeight: 600 }}>After</div>
                          {Object.entries(ls.draft).map(([k, v]: any) => (
                            <>
                              <div key={ls._id + String(k) + 'f'} style={{ fontFamily: 'monospace' }}>{String(k)}</div>
                              <div key={ls._id + String(k) + 'b'} style={{ whiteSpace: 'pre-wrap' }}>{String((ls as any)[k as any] !== undefined ? (ls as any)[k as any] : '')}</div>
                              <div key={ls._id + String(k) + 'a'} style={{ whiteSpace: 'pre-wrap' }}>{String(v ?? '')}</div>
                            </>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>History</h3>
              {hist.length === 0 ? (
                <div>Chưa có lịch sử chỉnh sửa.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {hist.map((item) => (
                    <div key={item._id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>{item.submitted_role}</span>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 12, padding: '2px 8px', borderRadius: 999, background: '#f3f4f6' }}>{item.status}</span>
                      </div>
                      <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        <div style={{ fontWeight: 600 }}>Field</div>
                        <div style={{ fontWeight: 600 }}>Before</div>
                        <div style={{ fontWeight: 600 }}>After</div>
                        {Object.entries(item.changes || {}).map(([k, v]) => (
                          <>
                            <div key={k + '-f'} style={{ fontFamily: 'monospace' }}>{k}</div>
                            <div key={k + '-b'} style={{ whiteSpace: 'pre-wrap' }}>{String((v as any).from ?? '')}</div>
                            <div key={k + '-a'} style={{ whiteSpace: 'pre-wrap' }}>{String((v as any).to ?? '')}</div>
                          </>
                        ))}
                      </div>
                      {item.reason && (
                        <div style={{ marginTop: 6, fontSize: 12, color: '#9ca3af' }}>Reason: {item.reason}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

