import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import lessonApi, { type LessonPayload } from "../../api/lessonApi";
import type { Lesson } from "../../types/lesson";
import { supabase } from "../../lib/supabase";
import uploadApi from "../../api/uploadApi";
import {QuizzManage} from "@/pages/dashboard/Admin/QuizzManage.tsx";

type Props = {
  courseId: string;
};

export default function LessonManager({ courseId }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  // detail view state
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Lesson | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string>("");
  const [viewingLoading, setViewingLoading] = useState(false);

  const canCreate = useMemo(() => title.trim().length > 0 && !!file, [title, file]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Our axios wrapper returns payload directly, not { data }
      const list = await lessonApi.listByCourse(courseId);
      const normalized = Array.isArray(list) ? list : [];
      normalized.sort((a, b) => (a.position || 0) - (b.position || 0));
      setLessons(normalized);
    } catch (e: any) {
      setError(e?.message || "Không thể tải danh sách bài học");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleCreate = async () => {
    if (!canCreate) return;
    setCreating(true);
    setError(null);
    try {
      if (!supabase) {
        throw new Error(
          "Thiếu cấu hình Supabase (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). Hãy thêm vào fe/.env.local và khởi động lại."
        );
      }
      // 1) Lấy token upload đã ký từ Backend (Service Role)
      const signed = await uploadApi.createSupabaseSignedUpload({
        courseId,
        filename: file!.name,
        contentType: file!.type || "video/mp4",
      });
      // 2) Upload file bằng signed URL (bỏ qua RLS)
      const upRes = await supabase.storage
        .from(signed.bucket || "videos")
        .uploadToSignedUrl(signed.path, signed.token, file!);
      if ((upRes as any).error) throw (upRes as any).error;

      // 3) Lấy public URL (nếu bucket để Public)
      const { data: pub } = supabase.storage
        .from(signed.bucket || "videos")
        .getPublicUrl(signed.path);
      const publicUrl = pub.publicUrl;

      // 4) Tạo lesson kèm metadata lưu trữ
      const payload: LessonPayload & any = {
        title: title.trim(),
        video_url: publicUrl,
        description: description.trim(),
        storage_provider: "supabase",
        storage_bucket: signed.bucket || "videos",
        storage_path: signed.path,
      };
      await lessonApi.create(courseId, payload);

      // 4) Clear form and refresh list
      setTitle("");
      setFile(null);      
      setDescription("");
      await load();
    } catch (e: any) {
      setError(e?.message || "Tạo bài học thất bại");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (lessonId: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa bài học này?")) return;
    try {
      await lessonApi.delete(lessonId);
      await load();
    } catch (e: any) {
      alert(e?.message || "Xóa bài học thất bại");
    }
  };

  const beginEdit = (ls: Lesson) => {
    setEditingId(ls._id);
    setEditTitle(ls.title);
    setEditFile(null);
    setEditDescription(ls.description || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditFile(null);
    setEditDescription("");
  };

  const saveEdit = async (ls: Lesson) => {
    setSavingEdit(true);
    setError(null);
    try {
      const payload: LessonPayload = { title: editTitle.trim(), description: editDescription.trim() };
      if (editFile) {
        if (!supabase) throw new Error("Thiếu cấu hình Supabase cho upload");
        const signed2 = await uploadApi.createSupabaseSignedUpload({ courseId, filename: editFile.name, contentType: editFile.type || "video/mp4" });       
         const upRes2 = await supabase.storage.from(signed2.bucket || "videos").uploadToSignedUrl(signed2.path, signed2.token, editFile);        if ((upRes2 as any).error) throw (upRes2 as any).error;        const { data: pub } = supabase.storage.from(signed2.bucket || "videos").getPublicUrl(signed2.path);        payload.video_url = pub.publicUrl;        (payload as any).storage_provider = "supabase";        (payload as any).storage_bucket = signed2.bucket || "videos";        (payload as any).storage_path = signed2.path;
      }
      await lessonApi.update(ls._id, payload);
      await load();
      cancelEdit();
    } catch (e: any) {
      setError(e?.message || "Lưu bài học thất bại");
    } finally {
      setSavingEdit(false);
    }
  };

  const swapPositions = async (a: Lesson, b: Lesson) => {
    // Optimistic UI
    setLessons((prev) => {
      const arr = [...prev];
      const ia = arr.findIndex((x) => x._id === a._id);
      const ib = arr.findIndex((x) => x._id === b._id);
      if (ia >= 0 && ib >= 0) {
        const pa = arr[ia].position;
        arr[ia] = { ...arr[ia], position: arr[ib].position } as Lesson;
        arr[ib] = { ...arr[ib], position: pa } as Lesson;
        arr.sort((x, y) => (x.position || 0) - (y.position || 0));
      }
      return arr;
    });

    // Use temporary position to avoid unique constraint clash
    const temp = -Math.floor(Math.random() * 1e9);
    await lessonApi.update(a._id, { position: temp });
    await lessonApi.update(b._id, { position: a.position });
    await lessonApi.update(a._id, { position: b.position });
    await load();
  };

  const moveUp = async (idx: number) => {
    if (idx <= 0) return;
    await swapPositions(lessons[idx], lessons[idx - 1]);
  };

  const moveDown = async (idx: number) => {
    if (idx >= lessons.length - 1) return;
    await swapPositions(lessons[idx], lessons[idx + 1]);
  };

  const openPlayback = async (lessonId: string) => {
    try {
      const res = await lessonApi.playback(lessonId);
      const url = (res as any)?.playbackUrl || (res as any)?.url || res;
      if (typeof url === "string") window.open(url, "_blank");
    } catch (e) {
      alert("Không lấy được playback URL (cần đăng nhập và đã enroll).");
    }
  };

  const viewDetail = async (lessonId: string) => {
    setViewingLoading(true);
    setViewing(null);
    setPlaybackUrl("");
    setViewingId(lessonId);
    try {
      const [detail, pb] = await Promise.all([
        lessonApi.getById(lessonId),
        lessonApi.playback(lessonId).catch(() => null),
      ]);
      setViewing(detail as any);
      const url = (pb as any)?.playbackUrl || (detail as any)?.video_url || "";
      setPlaybackUrl(url);
    } catch (e) {
      setError("Không tải được chi tiết bài học");
    } finally {
      setViewingLoading(false);
    }
  };

  return (
    <div className="lesson-manager">
      <h4>Quản lý bài học</h4>

      {!supabase && (
        <div style={{ background: "#fff3cd", color: "#856404", padding: 8, borderRadius: 6, marginBottom: 10 }}>
          Chưa cấu hình Supabase. Thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY để upload video.
        </div>
      )}

      <div className="lesson-create" style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr auto" }}>
        <input
          type="text"
          placeholder="Tiêu đề bài học"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Mô tả bài học (tuỳ chọn)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
        <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button 
          disabled={!canCreate || creating || !supabase} 
          onClick={handleCreate}
          style={{ 
            backgroundColor: '#a855f7', 
            color: 'white', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: '6px', 
            cursor: !canCreate || creating || !supabase ? 'not-allowed' : 'pointer',
            opacity: !canCreate || creating || !supabase ? 0.6 : 1
          }}
        >
          {creating ? "Đang tạo..." : "Tạo bài học"}
        </button>
      </div>

      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div>Đang tải bài học...</div>
        ) : lessons.length === 0 ? (
          <div>Chưa có bài học nào.</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {lessons.map((ls, idx) => (
              <li key={ls._id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  {editingId === ls._id ? (
                    <>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <strong style={{ minWidth: 28, textAlign: "right" }}>{ls.position}.</strong>
                        <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ flex: 1 }} />
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <textarea
                          placeholder="Mô tả bài học"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={2}
                          style={{ width: '100%', marginBottom: 6 }}
                        />
                        <input type="file" accept="video/*" onChange={(e) => setEditFile(e.target.files?.[0] || null)} />
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button onClick={() => saveEdit(ls)} disabled={savingEdit}>{savingEdit ? "Đang lưu..." : "Lưu"}</button>
                        <button onClick={cancelEdit}>Hủy</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <strong>{ls.position}. {ls.title}</strong>
                      {ls.description && (
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{ls.description}</div>
                      )}
                      {Array.isArray(ls.reviews) && ls.reviews.length > 0 && (
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                          {(() => {
                            const avg = ls.reviews!.reduce((s: number, r: any) => s + (r.rating || 0), 0) / ls.reviews!.length;
                            return `Đánh giá: ${avg.toFixed(1)}/5 (${ls.reviews!.length})`;
                          })()}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                        {ls.video_url ? (
                          <a href={ls.video_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#0ea5e9" }}>
                            Mở video (public)
                          </a>
                        ) : (
                          <span style={{ fontSize: 12, color: "#999" }}>Chưa có video</span>
                        )}
                        {/* <button onClick={() => openPlayback(ls._id)} style={{ fontSize: 12 }}>Play (auth)</button> */}
                        {/* <button onClick={() => navigate(`/dashboard/manage-courses/${courseId}/lessons/${ls._id}`)} style={{ fontSize: 12 }}>Xem chi tiết</button> */}
                        <button onClick={() => viewDetail(ls._id)} style={{ fontSize: 12 }}>Xem chi tiết</button>
                        <button onClick={() => {
                          const isTeacherContext = location.pathname.startsWith('/teacher');
                          const basePath = isTeacherContext ? '/teacher' : '/dashboard';
                          navigate(`${basePath}/manage-courses/${courseId}/lessons/${ls._id}/quizzes`);
                        }} style={{ fontSize: 12 }}>Quizz</button>
                      </div>
                    </>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => moveUp(idx)} disabled={idx === 0}>↑</button>
                  <button onClick={() => moveDown(idx)} disabled={idx === lessons.length - 1}>↓</button>
                  {editingId === ls._id ? null : (
                    <button onClick={() => beginEdit(ls)}>Sửa</button>
                  )}
                  <button onClick={() => handleDelete(ls._id)} className="delete-btn">Xóa</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {viewingId && (
        <div style={{ marginTop: 20, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
          {viewingLoading ? (
            <div>Đang tải chi tiết bài học...</div>
          ) : !viewing ? (
            <div>Không tải được chi tiết bài học.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <h4 style={{ marginTop: 0 }}>{viewing.title}</h4>
                {playbackUrl ? (
                  <video controls src={playbackUrl} style={{ width: '100%', borderRadius: 8, background: '#000' }} />
                ) : viewing.video_url ? (
                  <video controls src={viewing.video_url} style={{ width: '100%', borderRadius: 8, background: '#000' }} />
                ) : (
                  <div style={{ color: '#999' }}>Chưa có video</div>
                )}
              </div>
              <div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Mô tả:</strong>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{viewing.description || '—'}</div>
                </div>
                <div>
                  <strong>Đánh giá:</strong>
                  {Array.isArray(viewing.reviews) && viewing.reviews.length > 0 ? (
                    <ul style={{ marginTop: 6 }}>
                      {viewing.reviews.map((rv: any, i: number) => (
                        <li key={i} style={{ fontSize: 13 }}>
                          ⭐ {rv.rating}/5 {rv.comment ? `- ${rv.comment}` : ''}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ color: '#999' }}>Chưa có đánh giá</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
