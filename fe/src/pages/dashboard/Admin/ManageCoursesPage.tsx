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
      alert("Khong the tai danh sach khoa hoc");
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
    if (confirm("B?n ch?c ch?n mu?n x�a kh�a h?c n�y?")) {
      try {
        await courseAdminApi.delete(id);
        loadCourses();
      } catch (error) {
        console.error("Error deleting course:", error);
        alert("Kh�ng th? x�a kh�a h?c.");
      }
    }
  };

  return (
    <div className="course-management-container">
      <div className="header">
        <h2>Qu?n l� kh�a h?c</h2>
        <button className="add-btn" onClick={handleAdd}>+ Th�m kh�a h?c</button>
      </div>

      <ul className="course-list">
        {courses.map((course) => (
          <li key={course._id}>
            <div className="course-info">
              <strong>{course.title}</strong>
              <span>{course.category?.name || "Chua c� danh m?c"}</span>
              <span>{(course.price_cents / 100).toLocaleString()} VND</span>
              <span className={`status ${course.status}`}>{course.status}</span>
            </div>
            <div className="actions">
              <button className="detail-btn" onClick={() => navigate(`/dashboard/manage-courses/${course._id}`)}>Chi ti?t</button>
              <button className="edit-btn" onClick={() => handleEdit(course)}>S?a</button>
              <button className="delete-btn" onClick={() => handleDelete(course._id)}>X�a</button>
            </div>
          </li>
        ))}
      </ul>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedCourse ? "Ch?nh s?a kh�a h?c" : "Th�m kh�a h?c m?i"}</h3>
            <CourseForm initialData={selectedCourse || {}} onSubmit={handleSave} />
            <button className="close-btn" onClick={() => setShowModal(false)}>��ng</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCoursesPage;
