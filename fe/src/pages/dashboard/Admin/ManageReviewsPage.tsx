import { useState, useEffect } from "react";
import reviewApi from "../../../api/reviewApi";
import type { ReviewDto } from "../../../types/review";
import ReviewForm from "../../../components/reviews/ReviewForm";
import "./ManageReviewsPage.css";

const ManageReviewsPage = () => {
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [selectedReview, setSelectedReview] = useState<Partial<ReviewDto> | null>(null);
  const [showModal, setShowModal] = useState(false);

  // 🔹 Load tất cả đánh giá admin/public
  const loadReviews = async () => {
    try {
      const res = await reviewApi.getAll(); // Nếu có token, reviewApi tự thêm
      setReviews(res.data || []);
    } catch (error) {
      console.error("Error loading reviews:", error);
      alert("Không thể tải danh sách đánh giá! Hãy kiểm tra token admin hoặc backend.");
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  // 🔹 Xóa đánh giá
  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa đánh giá này không?")) {
      try {
        await reviewApi.delete(id);
        loadReviews();
      } catch (error) {
        console.error("Error deleting review:", error);
        alert("Không thể xóa đánh giá!");
      }
    }
  };

  // 🔹 Phê duyệt đánh giá
  const handleApprove = async (id: string) => {
    try {
      await reviewApi.updateStatus(id, "approved");
      loadReviews();
    } catch (error) {
      console.error("Error approving review:", error);
      alert("Không thể phê duyệt đánh giá!");
    }
  };

  // 🔹 Mở modal để sửa hoặc thêm
  const handleEdit = (review: ReviewDto) => {
    setSelectedReview(review);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedReview(null);
    setShowModal(true);
  };

  return (
    <div className="review-management-container">
      <div className="header">
        <h2>Quản lý đánh giá</h2>
        <button className="add-btn" onClick={handleAdd}>
          + Thêm đánh giá
        </button>
      </div>

      <ul className="review-list">
        {reviews.map((r) => (
          <li key={r.id}>
            <div className="review-info">
              <span>ID: {r.id}</span>
              <span>User: {r.user_id}</span>
              {r.course_id && <span>Course: {r.course_id}</span>}
              {r.teacher_id && <span>Teacher: {r.teacher_id}</span>}
              <span>⭐ {r.rating}/5</span>
              <span>{r.comment || r.content || "(Không có nhận xét)"}</span>
              <span>Trạng thái: {r.status}</span>
              <span>Ngày tạo: {new Date(r.created_at).toLocaleDateString()}</span>
            </div>
            <div className="actions">
              {r.status !== "approved" && (
                <button className="approve-btn" onClick={() => handleApprove(r.id)}>
                  Phê duyệt
                </button>
              )}
              <button className="edit-btn" onClick={() => handleEdit(r)}>
                Sửa
              </button>
              <button className="delete-btn" onClick={() => handleDelete(r.id)}>
                Xóa
              </button>
            </div>
          </li>

        ))}
      </ul>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedReview ? "Chỉnh sửa đánh giá" : "Thêm đánh giá mới"}</h3>
            <ReviewForm
              initialData={selectedReview || {}}
              onSubmit={() => {
                setShowModal(false);
                loadReviews();
              }}
            />
            <button className="close-btn" onClick={() => setShowModal(false)}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageReviewsPage;
