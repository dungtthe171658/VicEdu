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
      setCourses((res as any).data ?? res);
    } catch (error) {
      console.error("Error loading courses:", error);
      alert("Không thể tải danh sách khóa học.");
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
    if (window.confirm("Bạn chắc chắn muốn xóa khóa học này?")) {
      try {
        await courseAdminApi.delete(id);
        loadCourses();
      } catch (error) {
        console.error("Error deleting course:", error);
        alert("Không thể xóa khóa học.");
      }
    }
  };


  const handlePublish = async (id: string, publish: boolean) => {
    try {
      await courseAdminApi.update(id, { is_published: publish } as any);
      loadCourses();
    } catch (error) {
      console.error("Error updating publish:", error);
      alert("Cập nhật hiển thị thất bại.");
    }
  };

  const getCategoryName = (course: any) => {
    const cat = course?.category;
    if (Array.isArray(cat)) return cat[0]?.name || "Chưa có danh mục";
    return cat?.name || "Chưa có danh mục";
  };

  const formatVND = (n: number) => n.toLocaleString("vi-VN") + " ₫";

  // Helper function to get price in VND from either price_cents or price
  // LƯU Ý: price_cents = price (giữ nguyên giá trị, không nhân/chia)
  const getPriceInVND = (course: any): number => {
    if (course.price_cents !== undefined && course.price_cents !== null) {
      // price_cents = price, giữ nguyên giá trị
      return course.price_cents;
    }
    if (course.price !== undefined && course.price !== null) {
      // price đã là giá trị VND
      return course.price;
    }
    return 0;
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
              <span>{getCategoryName(course as any)}</span>
              <span>{formatVND(getPriceInVND(course as any))}</span>
              {/* Debug info - hiển thị cả price và price_cents nếu có */}
              {/* {((course as any).price !== undefined || (course as any).price_cents !== undefined) && (
                <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: "8px" }}>
                  {((course as any).price !== undefined && `price: ${(course as any).price}`)}
                  {((course as any).price !== undefined && (course as any).price_cents !== undefined) && " | "}
                  {((course as any).price_cents !== undefined && `price_cents: ${(course as any).price_cents}`)}
                </span>
              )} */}

              <span className={`status ${(course as any).is_published ? "published" : "unpublished"}`}>
                {(course as any).is_published ? "Đang hiển thị" : "Đang ẩn"}
              </span>

              <span>
             
              </span>
            </div>

            <div className="actions">
                 <div style={{ display: "inline-flex", gap: 8, marginLeft: 12 }}>
                
                  {(course as any).is_published ? (
                    <button onClick={() => handlePublish(course._id, false)}>Ẩn</button>
                  ) : (
                    <button onClick={() => handlePublish(course._id, true)}>Hiển thị</button>
                  )}
                </div>
              <button className="detail-btn" onClick={() => navigate(`/dashboard/manage-courses/${course._id}`)}>
                Chi tiết
              </button>
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
