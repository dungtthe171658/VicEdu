import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import type { Course } from "../../types/course";
import type { Category } from "../../types/category";
import categoryApi from "../../api/categoryApi";
import "./CourseForm.css";

interface CourseFormTeacherProps {
  initialData?: Partial<Course>;
  onSubmit: (data: Partial<Course>) => void;
}

const CourseFormTeacher = ({ initialData = {}, onSubmit }: CourseFormTeacherProps) => {
  const isEditMode = !!initialData._id;
  
  // Backend returns price in VND, form displays VND, so use price directly if price_cents not available
  // price_cents in form state represents VND (what user enters), will be converted to cents when submitting
  const price_cents = initialData.price_cents !== undefined 
    ? initialData.price_cents 
    : (initialData as any).price !== undefined 
      ? (initialData as any).price 
      : undefined;
  
  const [formData, setFormData] = useState<Partial<Course>>({
    ...initialData,
    price_cents: price_cents,
    category_id:
      typeof initialData.category_id === "object"
        ? initialData.category_id?._id
        : initialData.category_id || "",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryApi.getAll();
        console.log("📦 Category API result:", res);
        // Kiểm tra kiểu dữ liệu thực tế
        if (Array.isArray(res.data)) {
          setCategories(res.data);
        } else if (Array.isArray(res)) {
          setCategories(res);
        } else {
          console.warn("⚠️ Category API không trả về mảng:", res);
          setCategories([]);
        }
      } catch (err) {
        console.error("❌ Lỗi load categories:", err);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "price_cents"
            ? Number(value)
            : value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Convert VND to cents (multiply by 100) since backend divides by 100
    const priceInVND = Number(formData.price_cents) || 0;
    const priceInCents = priceInVND * 100;

    const payload: Partial<Course> = {
      ...formData,
      category_id: formData.category_id?.toString() || "",
      price_cents: priceInCents,
      is_published: !!formData.is_published,
      // Ensure description is always sent (required by backend)
      description: formData.description || "",
    };

    // Không gửi status field cho giáo viên
    delete (payload as any).status;

    onSubmit(payload);
  };

  // Cloudinary helpers (fallback: user can paste URL directly if upload fails)
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
    const axios = (await import("../../api/axios")).default;
    const res = await axios.get<CloudinarySign>("/uploads/cloudinary-signature", {
      params: { folder, upload_preset: uploadPreset },
    });
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

  const handleThumbFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingThumb(true);
      const sign = await getCloudinarySignature("vicedu/images/course-thumbs");
      const { secure_url } = await uploadImageToCloudinary(file, sign);
      setFormData((prev) => ({ ...prev, thumbnail_url: secure_url }));
    } catch (e: any) {
      alert(e?.message || "Upload Cloudinary thất bại. Bạn có thể dán URL vào ô trên.");
    } finally {
      setUploadingThumb(false);
      e.currentTarget.value = "";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="book-form">
      <div className="form-group">
        <label htmlFor="title">Tên khóa học</label>
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
        <label htmlFor="description">Mô tả</label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
          rows={3}
          required
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
        <label htmlFor="thumbnail_url">Ảnh Thumbnail (URL)</label>
        <input
          id="thumbnail_url"
          type="text"
          name="thumbnail_url"
          value={formData.thumbnail_url || ""}
          onChange={handleChange}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
          <input type="file" accept="image/*" onChange={handleThumbFileChange} disabled={uploadingThumb} />
          {uploadingThumb && <span style={{ fontSize: 12, color: '#6b7280' }}>Đang tải ảnh lên...</span>}
          <span style={{ fontSize: 12, color: '#6b7280' }}>Hoặc dán URL ảnh vào ô trên.</span>
        </div>
      </div>

      {/* Chỉ hiển thị is_published khi đã tạo khóa học (edit mode) */}
      {isEditMode && (
        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              name="is_published"
              checked={!!formData.is_published}
              onChange={handleChange}
            />
            Public khóa học
          </label>
        </div>
      )}

      <button type="submit">Lưu khóa học</button>
    </form>
  );
};

export default CourseFormTeacher;

