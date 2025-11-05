import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import courseTeacherApi from "../../../api/courseTeacherApi";
import lessonApi from "../../../api/lessonApi";
import type { Course } from "../../../types/course";

type PendingLesson = { _id: string; title: string; course_id: string; pending_at?: string };

export default function PendingEditsTeacher() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [pendingLessons, setPendingLessons] = useState<PendingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              lessonPending.push({ _id: l._id, title: l.title, course_id: String(l.course_id), pending_at: (l as any)?.pending_at });
            });
          } catch {}
        })
      );
      setPendingLessons(lessonPending);
    } catch (e: any) {
      setError(e?.message || "Failed to load pending edits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fmt = (d?: string) => (d ? new Date(d).toLocaleString("vi-VN") : "");

  const pendingCourses = courses.filter((c: any) => !!(c as any)?.has_pending_changes);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2>Yêu cầu đã gửi</h2>
      {loading ? (
        <div>Đang tải...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          <section>
            <h3>Courses</h3>
            {pendingCourses.length === 0 ? (
              <div>Không có thay đổi đang chờ duyệt.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Tiêu đề</th>
                    <th>Thời gian</th>
                    <th>Xem</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCourses.map((c: any) => (
                    <tr key={c._id}>
                      <td>{c.title}</td>
                      <td style={{ textAlign: 'center' }}>{fmt(c.pending_at)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <Link to={`/teacher/manage-courses/${c._id}`}>Chi tiết</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section>
            <h3>Lessons</h3>
            {pendingLessons.length === 0 ? (
              <div>Không có thay đổi đang chờ duyệt.</div>
            ) : (
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
                  {pendingLessons.map((l) => (
                    <tr key={l._id}>
                      <td>{l.title}</td>
                      <td style={{ textAlign: 'center' }}>{l.course_id}</td>
                      <td style={{ textAlign: 'center' }}>{fmt(l.pending_at)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <Link to={`/teacher/manage-courses/${l.course_id}/lessons/${l._id}`}>Chi tiết</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

