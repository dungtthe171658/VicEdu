import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import courseAdminApi from "../../../api/courseAdminApi";
import type { Course } from "../../../types/course";
import CourseForm from "../../../components/courses/CourseForm";
import historyApi, { type EditHistoryItem } from "../../../api/historyApi";

export default function CourseCreationRequestDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hist, setHist] = useState<EditHistoryItem[]>([]);

  const load = async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await courseAdminApi.getById(courseId);
      const courseData: any = res.data ?? res;
      setCourse(courseData);
      try {
        const h = await historyApi.listByCourse(courseId);
        setHist((h as any)?.data || []);
      } catch {}
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

  const handleApprove = async () => {
    if (!courseId) return;
    try {
      await courseAdminApi.approveChanges(courseId);
      alert("Đã phê duyệt yêu cầu tạo khóa học");
      navigate("/dashboard/pending-edits");
    } catch (e: any) {
      alert(e?.message || "Phê duyệt thất bại");
    }
  };

  const handleReject = async () => {
    if (!courseId) return;
    const reason = prompt("Lý do từ chối (tùy chọn):");
    try {
      await courseAdminApi.rejectChanges(courseId);
      alert("Đã từ chối yêu cầu tạo khóa học");
      navigate("/dashboard/pending-edits");
    } catch (e: any) {
      alert(e?.message || "Từ chối thất bại");
    }
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  if (!course) {
    return <div>Không tìm thấy khóa học.</div>;
  }

  const draft = (course as any)?.draft || {};
  const isCreationRequest = draft.__action === 'create';

  // Prepare form data from draft
  const draftFormData = {
    title: draft.title || course.title,
    description: draft.description || course.description,
    price_cents: draft.price ? Math.round(draft.price * 100) : course.price ? Math.round((course as any).price * 100) : 0,
    thumbnail_url: draft.thumbnail_url || course.thumbnail_url,
    category_id: draft.category_id || (() => {
      const cat = (course as any)?.category;
      if (Array.isArray(cat) && cat.length > 0) return String(cat[0]?._id || cat[0]);
      return "";
    })(),
    teacher_ids: Array.isArray((course as any)?.teacher)
      ? ((course as any).teacher as any[]).map((t: any) => t?._id || t).filter(Boolean)
      : [],
  };

  return (
    <div className="p-4">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button onClick={() => navigate("/dashboard/pending-edits")}>
          ← Quay lại
        </button>
        <h2 style={{ margin: 0 }}>Chi tiết yêu cầu tạo khóa học</h2>
      </div>

      {!isCreationRequest && (
        <div style={{ padding: 12, background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 16 }}>
          Cảnh báo: Đây không phải là yêu cầu tạo mới. Vui lòng quay lại.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Thông tin khóa học (Yêu cầu tạo mới)</h3>
          <div style={{ marginBottom: 16, padding: 12, background: "#f3f4f6", borderRadius: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Trạng thái: <span style={{ color: "#059669" }}>Đang chờ phê duyệt</span></div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Gửi lúc: {(course as any)?.pending_at ? new Date((course as any).pending_at).toLocaleString("vi-VN") : "N/A"}
            </div>
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <h4 style={{ marginTop: 0, marginBottom: 12 }}>Thông tin đề xuất:</h4>
            <div style={{ display: "grid", gap: 8 }}>
              <div>
                <strong>Tên khóa học:</strong> {draft.title || "N/A"}
              </div>
              <div>
                <strong>Mô tả:</strong> {draft.description || "N/A"}
              </div>
              <div>
                <strong>Giá:</strong> {draft.price ? new Intl.NumberFormat("vi-VN").format(draft.price) + " ₫" : "N/A"}
              </div>
              <div>
                <strong>Thumbnail URL:</strong> {draft.thumbnail_url ? (
                  <a href={draft.thumbnail_url} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb" }}>
                    {draft.thumbnail_url}
                  </a>
                ) : "N/A"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button
              onClick={handleApprove}
              style={{
                flex: 1,
                padding: "10px 20px",
                background: "#059669",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Phê duyệt
            </button>
            <button
              onClick={handleReject}
              style={{
                flex: 1,
                padding: "10px 20px",
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Từ chối
            </button>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Lịch sử</h3>
          {hist.length === 0 ? (
            <div>Chưa có lịch sử chỉnh sửa.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {hist.map((item) => (
                <div key={item._id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontWeight: 600 }}>{item.submitted_role}</span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>
                      {item.created_at ? new Date(item.created_at).toLocaleString() : ""}
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 12,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "#f3f4f6",
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <div style={{ fontWeight: 600 }}>Field</div>
                    <div style={{ fontWeight: 600 }}>Before</div>
                    <div style={{ fontWeight: 600 }}>After</div>
                    {Object.entries(item.changes || {}).map(([k, v]) => (
                      <>
                        <div key={k + "-f"} style={{ fontFamily: "monospace" }}>
                          {k}
                        </div>
                        <div key={k + "-b"} style={{ whiteSpace: "pre-wrap" }}>
                          {String((v as any).from ?? "")}
                        </div>
                        <div key={k + "-a"} style={{ whiteSpace: "pre-wrap" }}>
                          {String((v as any).to ?? "")}
                        </div>
                      </>
                    ))}
                  </div>
                  {item.reason && (
                    <div style={{ marginTop: 6, fontSize: 12, color: "#9ca3af" }}>
                      Reason: {item.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

