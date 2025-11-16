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
            : book.category_id || "Chưa có"}
        </p>
        <p>
          <strong>Giá:</strong> {book.price?.toLocaleString()} VND
        </p>
        <p>
          <strong>Stock:</strong> {book.stock ?? 0}
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
            <strong>PDF:</strong>{" "}
            <a href={book.pdf_url} target="_blank" rel="noopener noreferrer">
              Xem PDF
            </a>
          </p>
        ) : (
          <p>
            <strong>PDF:</strong> Chưa upload PDF
          </p>
        )}

        <p>
          <strong>Ngày tạo:</strong>{" "}
          {book.created_at ? new Date(book.created_at).toLocaleString() : "-"}
        </p>
        <p>
          <strong>Ngày cập nhật:</strong>{" "}
          {book.updated_at ? new Date(book.updated_at).toLocaleString() : "-"}
        </p>
      </div>
    </div>
  );
};

export default BookModal;