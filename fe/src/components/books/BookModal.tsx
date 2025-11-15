import React from "react";
import type { BookDto } from "../../types/book";
import "./BookModal.css";

interface BookModalProps {
  book: BookDto;
  isOpen: boolean;
  onClose: () => void;
}

const BookModal = ({ book, isOpen, onClose }: BookModalProps) => {
  if (!isOpen) return null;

  console.log("Rendering BookModal with pdf_url:", book.pdf_url);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <h2>{book.title}</h2>

        <p>
          <strong>Tác giả:</strong> {book.author || "Chưa cập nhật"}
        </p>

        <p>
          <strong>Danh mục:</strong>{" "}
          {typeof book.category_id === "object"
            ? book.category_id.name
            : book.category_id || "Chưa có danh mục"}
        </p>

        <p>
          <strong>Giá:</strong> {book.price_cents?.toLocaleString("vi-VN")} VND
        </p>

        <p>
          <strong>Mô tả:</strong> {book.description || "Không có mô tả"}
        </p>

        {book.images && book.images.length > 0 && (
          <div className="modal-images">
            {book.images.map((url, idx) => (
              <img key={idx} src={url} alt={`Hình ${idx + 1}`} />
            ))}
          </div>
        )}

        {/* PDF link */}
        {book.pdf_url && book.pdf_url !== "" ? (
          <p>
            <strong>Tệp PDF:</strong>{" "}
            <a href={book.pdf_url} target="_blank" rel="noopener noreferrer">
              Xem tài liệu PDF
            </a>
          </p>
        ) : (
          <p>
            <strong>Tệp PDF:</strong> Chưa có tệp PDF
          </p>
        )}

        <p>
          <strong>Ngày tạo:</strong>{" "}
          {book.created_at
            ? new Date(book.created_at).toLocaleString("vi-VN")
            : "-"}
        </p>

        <p>
          <strong>Ngày cập nhật:</strong>{" "}
          {book.updated_at
            ? new Date(book.updated_at).toLocaleString("vi-VN")
            : "-"}
        </p>
      </div>
    </div>
  );
};

export default BookModal;
