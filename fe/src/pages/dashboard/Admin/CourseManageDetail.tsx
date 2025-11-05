import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import courseAdminApi from "../../../api/courseAdminApi";
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
      const res = await courseAdminApi.getById(courseId);
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
      await courseAdminApi.update(courseId, data);
      await load();
    } catch (e: any) {
      setError(e?.message || "Lưu khóa học thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (status: 'approved' | 'rejected' | 'pending') => {
    if (!courseId) return;
    try {
      await courseAdminApi.updateStatus(courseId, status as any);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Cap nhat trang thai that bai');
    }
  };

  const handlePublish = async (publish: boolean) => {
    if (!courseId) return;
    try {
      await courseAdminApi.update(courseId, { is_published: publish } as any);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Cap nhat publish that bai');
    }
  };

  const handleApproveChanges = async () => {
    if (!courseId) return;
    try {
      await courseAdminApi.approveChanges(courseId);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Duyệt chỉnh sửa thất bại');
    }
  };

  const handleRejectChanges = async () => {
    if (!courseId) return;
    try {
      await courseAdminApi.rejectChanges(courseId);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Từ chối chỉnh sửa thất bại');
    }
  };

  return (
    <div className="p-4">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button onClick={() => navigate("/dashboard/manage-courses")}>
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
          <div style={{ gridColumn: '1 / -1', background: '#fff', borderRadius: 12, padding: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <strong>Quick actions:</strong>
            {(course as any)?.has_pending_changes && (
              <>
                <button onClick={handleApproveChanges}>Approve changes</button>
                <button onClick={handleRejectChanges}>Reject changes</button>
              </>
            )}
            <button onClick={() => handleStatus('approved')}>Approve</button>
            <button onClick={() => handleStatus('rejected')}>Reject</button>
            {((course as any)?.is_published ? (
              <button onClick={() => handlePublish(false)}>Hide</button>
            ) : (
              <button onClick={() => handlePublish(true)}>Publish</button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280' }}>
              Status: {course.status} • {((course as any)?.is_published ? 'published' : 'unpublished')}
            </span>
          </div>
          <div style={{ background: "#fff", borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Thông tin khóa học</h3>
            <CourseForm
              initialData={{
                ...course,
                teacher_ids: Array.isArray((course as any)?.teacher)
                  ? ((course as any).teacher as any[]).map((t: any) => t?._id).filter(Boolean)
                  : [],
              }}
              onSubmit={handleSave}
              showTeacherAssign
            />
            {saving && <div style={{ marginTop: 8 }}>Đang lưu...</div>}
          </div>
          <div style={{ background: "#fff", borderRadius: 12, padding: 16 }}>
            <LessonManager courseId={course._id} />
          </div>
        </div>
      )}
    </div>
  );
}
