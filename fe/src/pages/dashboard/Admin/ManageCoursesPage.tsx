import { useState, useEffect } from "react";
import courseAdminApi from "../../../api/courseAdminApi";
import type { Course } from "../../../types/course";
import CourseForm from "../../../components/courses/CourseForm";
import "./ManageCoursesPage.css";

const ManageCoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Partial<Course> | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Tải danh sách khóa học
  const loadCourses = async () => {
    try {
      const res = await courseAdminApi.getAll();
      setCourses(res.data);
    } catch (error) {
      console.error("Error loading courses:", error);
      alert("Không thể tải danh sách khóa học!");
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Lưu (thêm hoặc cập nhật)
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

  // Sửa
  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  // Thêm mới
  const handleAdd = () => {
    setSelectedCourse(null);
    setShowModal(true);
  };

  // Xóa
  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa khóa học này không?")) {
      try {
        await courseAdminApi.delete(id);
        loadCourses();
      } catch (error) {
        console.error("Error deleting course:", error);
        alert("Không thể xóa khóa học.");
      }
    }
  };

  return (
    <div className="course-management-container">
      <div className="header">
        <h2>Quản lý khóa học</h2>
        <button className="add-btn" onClick={handleAdd}>
          + Thêm khóa học
        </button>
      </div>

      <ul className="course-list">
        {courses.map((course) => (
          <li key={course._id}>
            <div className="course-info">
              <strong>{course.title}</strong>
              <span>{course.category?.name || "Chưa có danh mục"}</span>
              <span>{(course.price_cents / 100).toLocaleString()} VND</span>
              <span className={`status ${course.status}`}>{course.status}</span>
            </div>
            <div className="actions">
              <button className="edit-btn" onClick={() => handleEdit(course)}>
                Sửa
              </button>
              <button className="delete-btn" onClick={() => handleDelete(course._id)}>
                Xóa
              </button>
            </div>
          </li>
        ))}
      </ul>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedCourse ? "Chỉnh sửa khóa học" : "Thêm khóa học mới"}</h3>
            <CourseForm initialData={selectedCourse || {}} onSubmit={handleSave} />
            <button className="close-btn" onClick={() => setShowModal(false)}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCoursesPage;
