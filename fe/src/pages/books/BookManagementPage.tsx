import { useState, useEffect } from "react";
import bookApi from "../../api/bookApi";
import type { BookDto } from "../../types/book";
import BookForm from "../../components/books/BookForm";
import BookModal from "../../components/books/BookModal";
import "./BookManagementPage.css";

type CloudinarySign = {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  upload_preset: string;
};

const BookManagementPage = () => {
  const [books, setBooks] = useState<BookDto[]>([]);
  const [selectedBook, setSelectedBook] = useState<Partial<BookDto> | null>(
    null
  );
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailBook, setDetailBook] = useState<BookDto | null>(null);

  // Load tất cả sách
  const loadBooks = async () => {
    try {
      const res = await bookApi.getAll();
      console.log("Books loaded:", res.data);
      setBooks(res.data);
    } catch (error) {
      console.error("Error loading books:", error);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  // Cloudinary signature (reuse approach from ProfilePage)
  const getCloudinarySignature = async (
    folder: string,
    uploadPreset = "vicedu_default"
  ): Promise<CloudinarySign> => {
    const res = await axios.get<CloudinarySign>("/uploads/cloudinary-signature", {
      params: { folder, upload_preset: uploadPreset },
    });
    return res as unknown as CloudinarySign;
  };

  // Upload trực tiếp lên Cloudinary bằng chữ ký từ BE
  const uploadImageToCloudinary = async (
    file: File,
    sign: CloudinarySign
  ): Promise<{ secure_url: string; public_id: string }> => {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sign.apiKey);
    form.append("timestamp", String(sign.timestamp));
    form.append("upload_preset", sign.upload_preset?.trim());
    form.append("folder", sign.folder);
    form.append("signature", sign.signature);

    const endpoint = `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`;
    const res = await fetch(endpoint, { method: "POST", body: form });
    const json = await res.json();

    if (!json?.secure_url || !json?.public_id) {
      throw new Error(json?.error?.message || "Upload Cloudinary thất bại");
    }

    return { secure_url: json.secure_url, public_id: json.public_id };
  };

  // Expose an upload helper for BookForm to use
  const handleUploadImage = async (file: File): Promise<string> => {
    const sign = await getCloudinarySignature("vicedu/images/books");
    const { secure_url } = await uploadImageToCloudinary(file, sign);
    return secure_url;
  };

  // Thêm hoặc sửa sách
  const handleSave = async (data: Partial<BookDto>) => {
    try {
      console.log("Submitting payload to backend:", data);
      if (selectedBook?._id) {
        const res = await bookApi.update(selectedBook._id, data);
        console.log("Book updated:", res.data);
      } else {
        const res = await bookApi.create(data);
        console.log("Book created:", res.data);
      }
      setShowFormModal(false);
      setSelectedBook(null);
      loadBooks();
    } catch (error) {
      console.error("Error saving book:", error);
      alert("Error saving book. Please check your data.");
    }
  };

  // Mở modal để edit (fetch chi tiết để prefill)
  const handleEdit = async (book: BookDto) => {
    try {
      const res = await bookApi.getById(book._id);
      console.log("Fetched for edit:", res.data);
      setSelectedBook(res.data);
      setShowFormModal(true);
    } catch (err) {
      console.error("Error fetching book details for edit:", err);
      alert("Cannot fetch book details.");
    }
  };

  // Mở modal để add
  const handleAdd = () => {
    setSelectedBook(null);
    setShowFormModal(true);
  };

  // Xóa sách
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this book?")) {
      try {
        await bookApi.delete(id);
        loadBooks();
      } catch (error) {
        console.error("Error deleting book:", error);
        alert("Cannot delete book. Please try again.");
      }
    }
  };

  // Mở popup chi tiết sách (fetch chi tiết để có pdf_url)
  const handleDetail = async (book: BookDto) => {
    try {
      const res = await bookApi.getById(book._id);
      console.log("Detail book fetched:", res.data);
      setDetailBook(res.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error("Error fetching book details:", err);
      alert("Cannot fetch book details.");
    }
  };

  return (
    <div className="book-management-container">
      <div className="header">
        <h2>Quản Lý Sách</h2>
        <button className="add-btn" onClick={handleAdd}>
          Thêm Sách
        </button>
      </div>

      <ul className="book-list">
        {books.map((book) => (
          <li key={book._id}>
            <span>{book.title}</span>
            <div className="actions">
              <button className="edit-btn" onClick={() => handleEdit(book)}>
                Sửa
              </button>
              <button
                className="delete-btn"
                onClick={() => handleDelete(book._id)}
              >
                Xóa
              </button>
              <button
                className="details-btn"
                onClick={() => handleDetail(book)}
              >
                Chi tiết
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Modal thêm/sửa sách */}
      {showFormModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedBook ? "Edit Book" : "Add Book"}</h3>
            <BookForm initialData={selectedBook || {}} onSubmit={handleSave} />
            <button
              className="close-btn"
              onClick={() => setShowFormModal(false)}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Modal hiển thị chi tiết sách */}
      {detailBook && (
        <BookModal
          book={detailBook}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </div>
  );
};

export default BookManagementPage;
