import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import courseTeacherApi from "../../../api/courseTeacherApi";
import type { Course } from "../../../types/course";
import CourseForm from "../../../components/courses/CourseForm";
import "../Admin/ManageCoursesPage.css";

const ManageCoursesTeacherPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Partial<Course> | null>(null);
  const [showModal, setShowModal] = useState(false);

  const loadCourses = async () => {
    try {
      const res = await courseTeacherApi.getAll();
      setCourses(res.data ?? res);
    } catch (error) {
      console.error("Error loading courses:", error);
      alert("Khong the tai danh sach khoa hoc");
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleSave = async (data: Partial<Course>) => {
    try {
      if (selectedCourse?._id) {
        await courseTeacherApi.update(selectedCourse._id, data);
      } else {
        await courseTeacherApi.create(data);
      }
      setShowModal(false);
      setSelectedCourse(null);
      loadCourses();
    } catch (error) {
      console.error("Error saving course:", error);
      alert("Luu khoa hoc that bai. Vui long kiem tra du lieu.");
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
    if (confirm("Ban chac chan muon xoa khoa hoc nay?")) {
      try {
        await courseTeacherApi.delete(id);
        loadCourses();
      } catch (error) {
        console.error("Error deleting course:", error);
        alert("Khong the xoa khoa hoc.");
      }
    }
  };

  return (
    <div className="course-management-container">
      <div className="header">
        <h2>Quan ly khoa hoc</h2>
        <button className="add-btn" onClick={handleAdd}>+ Them khoa hoc</button>
      </div>

      <ul className="course-list">
        {courses.map((course) => (
          <li key={course._id}>
            <div className="course-info">
              <strong>{course.title}</strong>
              <span>{course.category?.name || "Chua co danh muc"}</span>
              <span>{course.price_cents.toLocaleString()} VND</span>
              {/* <span className={`status ${course.status}`}>{course.status}</span> */}
            </div>
            <div className="actions">
              {/* Detail view for teacher is not implemented yet */}
              <button className="detail-btn" onClick={() => navigate(`/teacher/manage-courses/${course._id}`)}>Chi tiet</button>
              <button className="edit-btn" onClick={() => handleEdit(course)}>Sua</button>
              <button className="delete-btn" onClick={() => handleDelete(course._id)}>Xoa</button>
            </div>
          </li>
        ))}
      </ul>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedCourse ? "Chinh sua khoa hoc" : "Them khoa hoc moi"}</h3>
            <CourseForm initialData={selectedCourse || {}} onSubmit={handleSave} />
            <button className="close-btn" onClick={() => setShowModal(false)}>Dong</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCoursesTeacherPage;
