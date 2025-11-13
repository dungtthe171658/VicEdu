import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import type { BookDto } from "../../types/book";
import type { Category } from "../../types/category";
import categoryApi from "../../api/categoryApi";
import axios from "../../api/axios";
import "./BookForm.css";

interface BookFormProps {
  initialData?: Partial<BookDto>;
  onSubmit: (data: Partial<BookDto>) => void;
}

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET!;

type CloudinarySign = {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  upload_preset: string;
};

const getCloudinarySignature = async (
  folder: string,
  uploadPreset = "vicedu_default"
): Promise<CloudinarySign> => {
  const res = await axios.get<CloudinarySign>(
    "/uploads/cloudinary-signature",
    {
      params: { folder, upload_preset: uploadPreset },
    }
  );
  return res as unknown as CloudinarySign;
};

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

const BookForm = ({ initialData = {}, onSubmit }: BookFormProps) => {
  const [formData, setFormData] = useState<
    Partial<BookDto> & { images?: string[]; pdf_url?: string }
  >({
    ...initialData,
    category_id:
      typeof initialData.category_id === "object"
        ? initialData.category_id?._id
        : initialData.category_id || "",
    images: Array.isArray(initialData.images) ? initialData.images : [],
    pdf_url: initialData.pdf_url || "",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Load danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryApi.getAll();
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.categories)
          ? res.categories
          : [];
        setCategories(list);
      } catch (err) {
        console.error("Lỗi khi tải danh mục:", err);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const sign = await getCloudinarySignature("vicedu/images/books");
      const { secure_url } = await uploadImageToCloudinary(file, sign);
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), secure_url],
      }));
    } catch (err: any) {
      console.error("Lỗi upload ảnh:", err);
      alert(`Upload ảnh thất bại: ${err?.message || err}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No PDF selected");
      return;
    }

    console.log("Selected PDF file:", file);

    setUploadingPdf(true);
    const formDataCloud = new FormData();
    formDataCloud.append("file", file);
    formDataCloud.append("upload_preset", UPLOAD_PRESET);

    try {
      console.log("Uploading PDF to Cloudinary...");
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
        { method: "POST", body: formDataCloud }
      );

      const data = await res.json();
      console.log("Cloudinary response:", data);

      if (!res.ok || !data.secure_url) {
        throw new Error(data.error?.message || "Upload failed");
      }

      setFormData((prev) => ({
        ...prev,
        pdf_url: data.secure_url,
      }));

      console.log("PDF uploaded successfully:", data.secure_url);
    } catch (err) {
      console.error("Error uploading PDF:", err);
      alert(`Upload PDF failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "price_cents" || name === "stock" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const payload: Partial<BookDto> = {
      ...formData,
      category_id: formData.category_id?.toString() || "",
      price_cents: Number(formData.price_cents) || 0,
      stock: Number(formData.stock) || 0,
      pdf_url: formData.pdf_url,
      images: formData.images,
    };

    console.log("Submitting payload to backend:", payload); // 🔹 thêm dòng này
    onSubmit(payload);
  };

 const handleRemoveImage = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== idx),
    }));
  };

  
  return (
    <form onSubmit={handleSubmit} className="book-form">
      <div className="form-group">
        <label htmlFor="title">Tiêu đề</label>
        <input
          id="title"
          type="text"
          name="title"
          value={formData.title || ""}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="author">Tác giả</label>
        <input
          id="author"
          type="text"
          name="author"
          value={formData.author || ""}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Mô tả</label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="price_cents">Giá (VND)</label>
        <input
          id="price_cents"
          type="number"
          name="price_cents"
          value={formData.price_cents ?? ""}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="stock">Số lượng</label>
        <input
          id="stock"
          type="number"
          name="stock"
          value={formData.stock ?? ""}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="category_id">Danh mục</label>
        <select
          id="category_id"
          name="category_id"
          value={formData.category_id?.toString() || ""}
          onChange={handleChange}
          required
        >
          {loadingCategories ? (
            <option value="">Đang tải danh mục...</option>
          ) : categories.length === 0 ? (
            <option value="">Không có danh mục</option>
          ) : (
            <>
              <option value="">Chọn danh mục</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      <div className="form-group">
        <label>Ảnh bìa</label>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {uploadingImage && <p>Đang tải ảnh lên...</p>}
        <div className="preview-container">
          {formData.images?.map((url, idx) => (
         <div key={idx} className="preview-item">
              <img
                className="preview-thumb"
                src={url}
                alt={`Preview ${idx + 1}`}
              />
              <button
                type="button"
                className="remove-img-btn"
                title="Xóa ảnh"
                onClick={() => handleRemoveImage(idx)}
              >
                -
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>File PDF</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={handlePdfUpload}
        />
        {uploadingPdf && <p>Đang tải PDF lên...</p>}
        {formData.pdf_url && (
          <p>
            PDF đã upload:{" "}
            <a
              href={formData.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Xem PDF
            </a>
          </p>
        )}
      </div>

      <button type="submit" className="btn-save">
        Lưu sách
      </button>
    </form>
  );
};

export default BookForm;
