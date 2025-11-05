import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import courseAdminApi from "../../../api/courseAdminApi";
import lessonApi from "../../../api/lessonApi";

type PendingCourse = {
  _id: string;
  title: string;
  pending_at?: string;
};

type PendingLesson = {
  _id: string;
  title: string;
  course_id: string;
  pending_at?: string;
};

export default function PendingEditsAdmin() {
  const [courses, setCourses] = useState<PendingCourse[]>([]);
  const [lessons, setLessons] = useState<PendingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [cRes, lRes] = await Promise.all([
        courseAdminApi.getPending().catch(() => ({ data: [], count: 0 } as any)),
        lessonApi.getPending().catch(() => ({ data: [], count: 0 } as any)),
      ]);
      const cData: any[] = (cRes as any)?.data?.data || (cRes as any)?.data || cRes || [];
      const lData: any[] = (lRes as any)?.data?.data || (lRes as any)?.data || lRes || [];
      setCourses(cData as PendingCourse[]);
      setLessons(lData as PendingLesson[]);
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
                        <Link to={`/dashboard/manage-courses/${c._id}`}>{c.title}</Link>
                      </td>
                      <td style={{ textAlign: 'center' }}>{fmt((c as any)?.pending_at)}</td>
                      <td style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
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
                      <td>{l.title}</td>
                      <td style={{ textAlign: 'center' }}>
                        <Link to={`/dashboard/manage-courses/${l.course_id}/lessons/${l._id}`}>Xem</Link>
                      </td>
                      <td style={{ textAlign: 'center' }}>{fmt((l as any)?.pending_at)}</td>
                      <td style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button onClick={() => approveLesson(l._id)}>Approve</button>
                        <button onClick={() => rejectLesson(l._id)} style={{ color: '#b91c1c' }}>Reject</button>
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

