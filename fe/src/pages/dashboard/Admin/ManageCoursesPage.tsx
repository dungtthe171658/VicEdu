import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import courseAdminApi from "../../../api/courseAdminApi";
import type { Course } from "../../../types/course";
import CourseForm from "../../../components/courses/CourseForm";
import "./ManageCoursesPage.css";

const ManageCoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Partial<Course> | null>(null);
  const [showModal, setShowModal] = useState(false);

  const loadCourses = async () => {
    try {
      const res = await courseAdminApi.getAll();
      setCourses(res.data ?? res);
    } catch (error) {
      console.error("Error loading courses:", error);
      alert("Không thể tải danh sách khóa học");
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleSave = async (data: Partial<Course>) => {
    try {
      if (selectedCourse?._id) {
        await courseAdminApi.update(selectedCourse._id, data);
      } else {
        await courseAdminApi.create(data);
      }
      setShowModal(false);
      setSelectedCourse(null);
      loadCourses();
    } catch (error) {
      console.error("Error saving course:", error);
      alert("Lưu khóa học thất bại. Vui lòng kiểm tra dữ liệu.");
    }
  };

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedCourse(null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn chắc chắn muốn xóa khóa học này?")) {
      try {
        await courseAdminApi.delete(id);
        loadCourses();
      } catch (error) {
        console.error("Error deleting course:", error);
        alert("Không thể xóa khóa học.");
      }
    }
  };

  const handleStatus = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    try {
      await courseAdminApi.updateStatus(id, status);
      loadCourses();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Cap nhat trang thai that bai');
    }
  };

  const handlePublish = async (id: string, publish: boolean) => {
    try {
      await courseAdminApi.update(id, { is_published: publish } as any);
      loadCourses();
    } catch (error) {
      console.error('Error updating publish:', error);
      alert('Cap nhat publish that bai');
    }
  };

  return (
    <div className="course-management-container">
      <div className="header">
        <h2>Quản lý khóa học</h2>
        <button className="add-btn" onClick={handleAdd}>+ Thêm khóa học</button>
      </div>

      <ul className="course-list">
        {courses.map((course) => (
          <li key={course._id}>
            <div className="course-info">
              <strong>{course.title}</strong>
              {(course as any)?.has_pending_changes && (
                <span style={{ marginLeft: 8, padding: '2px 6px', borderRadius: 6, background: '#fff7ed', border: '1px solid #fdba74', color: '#9a3412', fontSize: 12 }}>Pending edits</span>
              )}
              <span>{course.category?.name || "Chưa có danh mục"}</span>
              <span>{course.price_cents.toLocaleString()} VND</span>
              <span className={`status ${course.status}`}>{course.status}</span>
              <span className={`status ${((course as any).is_published ? 'published' : 'unpublished')}`}>
                {((course as any).is_published ? 'published' : 'unpublished')}
              </span>
              <span>
                <div style={{ display: 'inline-flex', gap: 8, marginLeft: 12 }}>
                  <button onClick={() => handleStatus(course._id, 'approved')}>Approve</button>
                  <button onClick={() => handleStatus(course._id, 'rejected')}>Reject</button>
                  {((course as any).is_published ? (
                    <button onClick={() => handlePublish(course._id, false)}>Hide</button>
                  ) : (
                    <button onClick={() => handlePublish(course._id, true)}>Publish</button>
                  ))}
                </div>
              </span>
            </div>
            <div className="actions">
              <button className="detail-btn" onClick={() => navigate(`/dashboard/manage-courses/${course._id}`)}>Chi tiết</button>
              <button className="edit-btn" onClick={() => handleEdit(course)}>Sửa</button>
              <button className="delete-btn" onClick={() => handleDelete(course._id)}>Xóa</button>
            </div>
          </li>
        ))}
      </ul>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedCourse ? "Chỉnh sửa khóa học" : "Thêm khóa học mới"}</h3>
            <CourseForm initialData={selectedCourse || {}} onSubmit={handleSave} showTeacherAssign />
            <button className="close-btn" onClick={() => setShowModal(false)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCoursesPage;
