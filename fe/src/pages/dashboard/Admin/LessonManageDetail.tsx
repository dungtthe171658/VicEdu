import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import lessonApi from "../../../api/lessonApi";
import type { Lesson } from "../../../types/lesson";
import { supabase } from "../../../lib/supabase";

export default function LessonManageDetail() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // edit state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [playbackUrl, setPlaybackUrl] = useState<string>("");

  const canSave = useMemo(() => title.trim().length > 0, [title]);

  const load = async () => {
    if (!lessonId) return;
    setLoading(true);
    setError(null);
    try {
      const [ls, pb] = await Promise.all([
        lessonApi.getById(lessonId),
        lessonApi.playback(lessonId).catch(() => null),
      ]);
      const url = (pb as any)?.playbackUrl || (ls as any)?.video_url || "";
      setLesson(ls as any);
      setTitle((ls as any)?.title || "");
      setDescription((ls as any)?.description || "");
      setPlaybackUrl(url);
    } catch (e: any) {
      setError(e?.message || "Không tải được bài học");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const handleSave = async () => {
    if (!lessonId || !canSave) return;
    setSaving(true);
    setError(null);
    try {
      const payload: any = { title: title.trim(), description: description.trim() };
      if (file) {
        if (!supabase) throw new Error("Thiếu cấu hình Supabase");
        const path = `lessons/${courseId}/${Date.now()}_${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("videos")
          .upload(path, file, { upsert: true, contentType: file.type || "video/mp4" });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("videos").getPublicUrl(path);
        payload.video_url = pub.publicUrl;
      }
      await lessonApi.update(lessonId, payload);
      await load();
    } catch (e: any) {
      setError(e?.message || "Lưu bài học thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!lessonId) return;
    if (!confirm("Bạn chắc chắn muốn xóa bài học này?")) return;
    setDeleting(true);
    try {
      await lessonApi.delete(lessonId);
      navigate(`/dashboard/manage-courses/${courseId}`);
    } catch (e: any) {
      setError(e?.message || "Xóa bài học thất bại");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button onClick={() => navigate(`/dashboard/manage-courses/${courseId}`)}>← Quay lại</button>
        <h2 style={{ margin: 0 }}>Quản trị bài học</h2>
      </div>

      {loading ? (
        <div>Đang tải bài học...</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : !lesson ? (
        <div>Không tìm thấy bài học.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Xem trước</h3>
            {playbackUrl ? (
              <video controls src={playbackUrl} style={{ width: "100%", borderRadius: 8, background: "#000" }} />
            ) : lesson.video_url ? (
              <video controls src={lesson.video_url} style={{ width: "100%", borderRadius: 8, background: "#000" }} />
            ) : (
              <div style={{ color: "#999" }}>Chưa có video</div>
            )}
            <div style={{ marginTop: 10 }}>
              <strong>Đánh giá:</strong>
              {Array.isArray(lesson.reviews) && lesson.reviews.length > 0 ? (
                <ul style={{ marginTop: 6 }}>
                  {lesson.reviews.map((rv: any, i: number) => (
                    <li key={i} style={{ fontSize: 13 }}>
                      ⭐ {rv.rating}/5 {rv.comment ? `- ${rv.comment}` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ color: "#999" }}>Chưa có đánh giá</div>
              )}
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Chỉnh sửa</h3>
            <div style={{ display: "grid", gap: 10 }}>
              <label>
                <div>Tiêu đề</div>
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label>
                <div>Mô tả</div>
                <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>
              <label>
                <div>Thay video (tuỳ chọn)</div>
                <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleSave} disabled={!canSave || saving}>{saving ? "Đang lưu..." : "Lưu"}</button>
                <button onClick={handleDelete} disabled={deleting} style={{ color: "#dc2626" }}>
                  {deleting ? "Đang xóa..." : "Xóa bài học"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

