import { FormEvent, useEffect, useMemo, useState } from "react";
import commentApi from "../../../api/commentApi";
import courseTeacherApi from "../../../api/courseTeacherApi";
import type { LessonComment } from "../../../types/comment";
import type { Course } from "../../../types/course";

type StatusFilter = "all" | "open" | "resolved";

const ManageCommentTeacherPages = () => {
  const [threads, setThreads] = useState<LessonComment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState<{ courseId: string; status: StatusFilter; onlyUnanswered: boolean; search: string }>({
    courseId: "",
    status: "open",
    onlyUnanswered: false,
    search: "",
  });
  const [searchDraft, setSearchDraft] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await courseTeacherApi.getAll();
        const list = Array.isArray((res as any)?.data) ? (res as any).data : Array.isArray(res) ? (res as any) : [];
        setCourses(list as Course[]);
      } catch {
        // ignore loading course errors
      }
    })();
  }, []);

  useEffect(() => {
    setSearchDraft(filters.search);
  }, [filters.search]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMessage("");
      try {
        const params: Record<string, unknown> = {
          page: pagination.page,
          limit: pagination.limit,
          onlyUnanswered: filters.onlyUnanswered,
        };
        if (filters.courseId) params.courseId = filters.courseId;
        if (filters.status !== "all") params.status = filters.status;
        if (filters.search.trim()) params.search = filters.search.trim();
        const res = await commentApi.listForTeacher(params);
        const list = Array.isArray(res?.data) ? res.data : [];
        setThreads(list);
        setPagination((prev) => ({ ...prev, total: Number(res?.total ?? res?.count ?? list.length) }));
      } catch (error: any) {
        setThreads([]);
        setMessage(error?.message || "Không thể tải danh sách hỏi đáp.");
      } finally {
        setLoading(false);
      }
    })();
  }, [filters.courseId, filters.status, filters.onlyUnanswered, filters.search, pagination.page, pagination.limit]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((pagination.total || 0) / pagination.limit)),
    [pagination.total, pagination.limit]
  );

  const formatTimestamp = (iso?: string) => {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.valueOf())) return "";
    return date.toLocaleString("vi-VN");
  };

  const handleFilterChange = (key: keyof typeof filters, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleFilterChange("search", searchDraft.trim());
  };

  const handleReply = async (thread: LessonComment) => {
    const content = replyDrafts[thread._id]?.trim();
    if (!content) return;
    const lessonId = thread.lesson?._id || thread.lesson_id;
    if (!lessonId) {
      setMessage("Thiếu thông tin bài học để phản hồi.");
      return;
    }
    setReplying((prev) => ({ ...prev, [thread._id]: true }));
    setMessage("");
    try {
      const created = await commentApi.create({ lesson_id: lessonId, parent_id: thread._id, content });
      setThreads((prev) =>
        prev.map((item) =>
          item._id === thread._id
            ? {
                ...item,
                replies: [...(item.replies || []), created],
                reply_count: (item.reply_count || 0) + 1,
                teacher_reply_count: (item.teacher_reply_count || 0) + 1,
                last_activity_at: created.created_at || item.last_activity_at,
              }
            : item
        )
      );
      setReplyDrafts((prev) => ({ ...prev, [thread._id]: "" }));
    } catch (error: any) {
      setMessage(error?.message || "Không thể gửi phản hồi.");
    } finally {
      setReplying((prev) => ({ ...prev, [thread._id]: false }));
    }
  };

  const handleToggleStatus = async (thread: LessonComment) => {
    const nextStatus = thread.status === "resolved" ? "open" : "resolved";
    try {
      const updated = await commentApi.updateStatus(thread._id, nextStatus);
      setThreads((prev) => prev.map((item) => (item._id === thread._id ? { ...item, status: updated.status } : item)));
    } catch (error: any) {
      setMessage(error?.message || "Không thể cập nhật trạng thái.");
    }
  };

  const changePage = (offset: number) => {
    setPagination((prev) => {
      const nextPage = Math.min(Math.max(1, prev.page + offset), totalPages);
      if (nextPage === prev.page) return prev;
      return { ...prev, page: nextPage };
    });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Hỏi đáp của học viên</h1>
        <p className="text-gray-600">Theo dõi câu hỏi theo từng bài học và phản hồi trực tiếp.</p>
      </header>

      <div className="bg-white border rounded-2xl p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">Khóa học</label>
            <select
              value={filters.courseId}
              onChange={(e) => handleFilterChange("courseId", e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Tất cả khóa học</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value as StatusFilter)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">Tất cả</option>
              <option value="open">Đang mở</option>
              <option value="resolved">Đã giải quyết</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={filters.onlyUnanswered}
                onChange={(e) => handleFilterChange("onlyUnanswered", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Chưa được giáo viên trả lời
            </label>
          </div>
          <form onSubmit={handleSearchSubmit} className="flex flex-col">
            <label className="text-xs text-gray-500 uppercase tracking-wide">Tìm kiếm nội dung</label>
            <div className="mt-1 flex gap-2">
              <input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder="Từ khóa..."
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Lọc
              </button>
            </div>
          </form>
        </div>
      </div>

      {message && <div className="text-sm text-red-600">{message}</div>}

      {loading ? (
        <div className="text-gray-500">Đang tải dữ liệu hỏi đáp...</div>
      ) : threads.length === 0 ? (
        <div className="text-gray-500">Không có câu hỏi nào phù hợp bộ lọc.</div>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => (
            <div key={thread._id} className="bg-white border rounded-2xl p-4 shadow-sm space-y-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs uppercase text-gray-500">{thread.course?.title || "Khóa học"}</p>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {thread.lesson?.title || "Bài học"}{" "}
                    {thread.lesson?.position ? <span className="text-sm text-gray-500">(Bài {thread.lesson.position})</span> : null}
                  </h3>
                  <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{thread.content}</p>
                  <div className="mt-2 text-xs text-gray-500 flex gap-4 flex-wrap">
                    <span>Người hỏi: {thread.user?.name || "Học viên"}</span>
                    <span>Tạo lúc: {formatTimestamp(thread.created_at)}</span>
                    <span>Cập nhật: {formatTimestamp(thread.last_activity_at)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 text-sm">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      thread.status === "resolved" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {thread.status === "resolved" ? "Đã giải quyết" : "Đang mở"}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(thread)}
                    className="text-blue-600 hover:text-blue-700 text-xs"
                  >
                    {thread.status === "resolved" ? "Mở lại câu hỏi" : "Đánh dấu đã giải quyết"}
                  </button>
                  <span className="text-xs text-gray-500">
                    {thread.teacher_reply_count || 0} phản hồi từ giáo viên
                  </span>
                </div>
              </div>

              {thread.replies && thread.replies.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  {thread.replies.map((reply) => (
                    <div key={reply._id} className="rounded-xl bg-gray-50 p-3">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="font-medium text-gray-800">{reply.user?.name || "Người dùng"}</span>
                        <span>{formatTimestamp(reply.created_at)}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                <textarea
                  value={replyDrafts[thread._id] || ""}
                  onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [thread._id]: e.target.value }))}
                  placeholder="Phản hồi thêm cho học viên..."
                  className="border rounded-xl p-3 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <button
                  onClick={() => handleReply(thread)}
                  disabled={replying[thread._id] || !replyDrafts[thread._id]?.trim()}
                  className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {replying[thread._id] ? "Đang gửi..." : "Gửi phản hồi"}
                </button>
                <div className="text-xs text-gray-500 flex flex-col justify-center items-start">
                  <span>{thread.reply_count || 0} tổng phản hồi</span>
                  {thread.teacher_reply_count === 0 && <span className="text-red-500">Chưa có phản hồi từ giáo viên</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-gray-600">
          Trang {pagination.page} / {totalPages} — {pagination.total} câu hỏi
        </div>
        <div className="flex items-center gap-3">
          <select
            value={pagination.limit}
            onChange={(e) => setPagination((prev) => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
            className="border rounded-lg px-3 py-1.5 text-sm"
          >
            {[5, 10, 20, 50].map((opt) => (
              <option key={opt} value={opt}>
                {opt} / trang
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button
              onClick={() => changePage(-1)}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50"
            >
              Trước
            </button>
            <button
              onClick={() => changePage(1)}
              disabled={pagination.page === totalPages}
              className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCommentTeacherPages;
