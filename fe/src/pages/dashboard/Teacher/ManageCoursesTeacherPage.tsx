import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import courseTeacherApi from "../../../api/courseTeacherApi";
import type { Course } from "../../../types/course";
import CourseFormTeacher from "../../../components/courses/CourseFormTeacher";
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
      console.log("🔵 [handleSave] Saving course data:", JSON.stringify(data, null, 2));
      if (selectedCourse?._id) {
        await courseTeacherApi.update(selectedCourse._id, data);
      } else {
        console.log("🔵 [handleSave] Creating new course");
        await courseTeacherApi.create(data);
      }
      setShowModal(false);
      setSelectedCourse(null);
      loadCourses();
    } catch (error: any) {
      console.error("❌ [handleSave] Error saving course:", error);
      console.error("❌ [handleSave] Error response:", error?.response?.data);
      console.error("❌ [handleSave] Error message:", error?.message);
      
      // Extract detailed error message
      let errorMessage = "Lưu khóa học thất bại. Vui lòng kiểm tra dữ liệu.";
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.validationErrors && Array.isArray(errorData.validationErrors)) {
          const validationMessages = errorData.validationErrors
            .map((err: any) => `${err.field}: ${err.message}`)
            .join("\n");
          errorMessage = `Lỗi validation:\n${validationMessages}`;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
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

  const handlePublish = async (id: string, publish: boolean) => {
    try {
      await courseTeacherApi.update(id, { is_published: publish } as any);
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
        <h2>Quan ly khoa hoc</h2>
        <button className="add-btn" onClick={handleAdd}>+ Them khoa hoc</button>
      </div>

      <ul className="course-list">
        {courses.map((course) => (
          <li key={course._id}>
            <div className="course-info">
              <strong>{course.title}</strong>

              {(course as any)?.has_pending_changes && (
                <span
                  style={{
                    marginLeft: 8,
                    padding: "2px 6px",
                    borderRadius: 6,
                    background: "#fff7ed",
                    border: "1px solid #fdba74",
                    color: "#9a3412",
                    fontSize: 12
                  }}
                >
                  Đang chờ duyệt chỉnh sửa
                </span>
              )}

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
              <button className="detail-btn" onClick={() => navigate(`/teacher/manage-courses/${course._id}`)}>
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
            <h3>{selectedCourse ? "Chinh sua khoa hoc" : "Them khoa hoc moi"}</h3>
            {/* Hiển thị trạng thái (chỉ đọc) - chỉ khi đang chỉnh sửa */}
            {selectedCourse && (selectedCourse as any)?.status && (
              <div style={{ marginBottom: 16, padding: 12, background: "#f3f4f6", borderRadius: 8 }}>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: 14 }}>Trạng thái</label>
                <div style={{ 
                  display: "inline-block", 
                  padding: "4px 12px", 
                  borderRadius: 4,
                  fontSize: 14,
                  fontWeight: 500,
                  backgroundColor: 
                    (selectedCourse as any)?.status === "approved" ? "#d1fae5" :
                    (selectedCourse as any)?.status === "rejected" ? "#fee2e2" :
                    "#fef3c7",
                  color:
                    (selectedCourse as any)?.status === "approved" ? "#065f46" :
                    (selectedCourse as any)?.status === "rejected" ? "#991b1b" :
                    "#92400e"
                }}>
                  {(selectedCourse as any)?.status === "approved" ? "Đã duyệt" :
                    (selectedCourse as any)?.status === "rejected" ? "Từ chối" :
                    "Chờ duyệt"}
                </div>
              </div>
            )}
            <CourseFormTeacher initialData={selectedCourse || {}} onSubmit={handleSave} />
            <button className="close-btn" onClick={() => setShowModal(false)}>Dong</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCoursesTeacherPage;
