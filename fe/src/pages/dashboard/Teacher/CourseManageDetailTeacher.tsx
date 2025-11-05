import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import courseTeacherApi from "../../../api/courseTeacherApi";
import type { Course } from "../../../types/course";
import CourseForm from "../../../components/courses/CourseForm";
import LessonManager from "../../../components/courses/LessonManager";

export default function CourseManageDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await courseTeacherApi.getById(courseId);
      setCourse(res.data ?? res); // support either shape
    } catch (e: any) {
      setError(e?.message || "Không tải được khóa học");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleSave = async (data: Partial<Course>) => {
    if (!courseId) return;
    setSaving(true);
    setError(null);
    try {
      await courseTeacherApi.update(courseId, data);
      await load();
    } catch (e: any) {
      setError(e?.message || "Lưu khóa học thất bại");
    } finally {
      setSaving(false);
    }
  };

  const submitForPublish = async () => {
    if (!courseId) return;
    try {
      await courseTeacherApi.requestPublish(courseId);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Gửi yêu cầu publish thất bại');
    }
  };

  return (
    <div className="p-4">
      {(course as any)?.has_pending_changes && (
        <div style={{ background: '#fff7ed', border: '1px solid #fdba74', color: '#9a3412', padding: 8, borderRadius: 8, marginBottom: 12 }}>
          Thay đổi của bạn đang chờ Admin phê duyệt.
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button onClick={() => navigate("/teacher/manage-courses")}>
          ← Quay lại
        </button>
        <h2 style={{ margin: 0 }}>Thiết kế khóa học</h2>
      </div>

      {loading ? (
        <div>Đang tải khóa học...</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : !course ? (
        <div>Không tìm thấy khóa học.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
          {!((course as any)?.is_published) && (
            <div style={{ gridColumn: '1 / -1', background: '#fff', borderRadius: 12, padding: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              {(course as any)?.publish_requested_at ? (
                <span>Đã gửi yêu cầu publish lúc {(course as any)?.publish_requested_at ? new Date((course as any).publish_requested_at).toLocaleString('vi-VN') : ''}</span>
              ) : (
                <button onClick={submitForPublish}>Gửi yêu cầu publish</button>
              )}
            </div>
          )}
          <div style={{ background: "#fff", borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Thông tin khóa học</h3>
            <CourseForm initialData={course} onSubmit={handleSave} />
            {saving && <div style={{ marginTop: 8 }}>Đang lưu...</div>}
          </div>
          {(course as any)?.has_pending_changes && (course as any)?.draft && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>Bản nháp đang chờ duyệt</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div style={{ fontWeight: 600 }}>Field</div>
                <div style={{ fontWeight: 600 }}>Before</div>
                <div style={{ fontWeight: 600 }}>After (draft)</div>
                {Object.entries((course as any).draft).map(([k, v]) => (
                  <>
                    <div key={k + '-f'} style={{ fontFamily: 'monospace' }}>{k}</div>
                    <div key={k + '-b'} style={{ whiteSpace: 'pre-wrap' }}>{String(((course as any)[k] !== undefined ? (course as any)[k] : ''))}</div>
                    <div key={k + '-a'} style={{ whiteSpace: 'pre-wrap' }}>{String(v as any)}</div>
                  </>
                ))}
              </div>
              <div style={{ marginTop: 8, color: '#6b7280', fontSize: 12 }}>
                Gửi lúc: {((course as any).pending_at ? new Date((course as any).pending_at).toLocaleString() : '')}
              </div>
            </div>
          )}
          <div style={{ background: "#fff", borderRadius: 12, padding: 16 }}>
            <LessonManager courseId={course._id} />
          </div>
        </div>
      )}
    </div>
  );
}

