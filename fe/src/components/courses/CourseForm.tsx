import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import type { Course } from "../../types/course";
import type { Category } from "../../types/category";
import categoryApi from "../../api/categoryApi";
import axios from "../../api/axios";
import type { UserDto } from "../../types/user.d";
import "./CourseForm.css";

interface CourseFormProps {
  initialData?: Partial<Course>;
  onSubmit: (data: Partial<Course>) => void;
  showTeacherAssign?: boolean;
  hideStatus?: boolean;
}

const CourseForm = ({ initialData = {}, onSubmit, showTeacherAssign = false, hideStatus = false }: CourseFormProps) => {
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
  const [teacherOptions, setTeacherOptions] = useState<UserDto[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [teacherIds, setTeacherIds] = useState<string[]>(
    Array.isArray((initialData as any)?.teacher_ids)
      ? ((initialData as any).teacher_ids as string[])
      : []
  );
  const [teacherTouched, setTeacherTouched] = useState(false);

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

  useEffect(() => {
    if (!showTeacherAssign) return;
    const run = async () => {
      try {
        setLoadingTeachers(true);
        const res = await axios.get("/users", { params: { role: "teacher", limit: 1000 } });
        const list = Array.isArray((res as any)?.data)
          ? (res as any).data
          : Array.isArray(res)
            ? (res as any)
            : Array.isArray((res as any)?.data?.data)
              ? (res as any).data.data
              : [];
        setTeacherOptions(list as UserDto[]);
      } catch (e) {
        setTeacherOptions([]);
      } finally {
        setLoadingTeachers(false);
      }
    };
    run();
  }, [showTeacherAssign]);

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
    };

    if (showTeacherAssign && teacherTouched) {
      (payload as any).teacher_ids = teacherIds;
    }

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

      {showTeacherAssign && (
        <div className="form-group">
          <label>Assigned Teachers</label>
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "12px",
              maxHeight: "200px",
              overflowY: "auto",
              backgroundColor: "#fff",
            }}
          >
            {loadingTeachers ? (
              <div style={{ padding: "8px", color: "#6b7280" }}>Đang tải danh sách giáo viên...</div>
            ) : teacherOptions.length === 0 ? (
              <div style={{ padding: "8px", color: "#6b7280" }}>Không tìm thấy giáo viên</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {teacherOptions.map((t) => (
                  <label
                    key={t._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      padding: "6px 8px",
                      borderRadius: "4px",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f3f4f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={teacherIds.includes(t._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTeacherIds([...teacherIds, t._id]);
                        } else {
                          setTeacherIds(teacherIds.filter((id) => id !== t._id));
                        }
                        setTeacherTouched(true);
                      }}
                      style={{
                        cursor: "pointer",
                        width: "18px",
                        height: "18px",
                        minWidth: "18px",
                        flexShrink: 0,
                        margin: 0,
                      }}
                    />
                    <span style={{ flex: 1, wordBreak: "break-word" }}>{t.name || t.email}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="description">Mô tả</label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
          rows={3}
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

      {!hideStatus && (
        <div className="form-group">
          <label htmlFor="status">Trạng thái</label>
          <select
            id="status"
            name="status"
            value={formData.status || "pending"}
            onChange={handleChange}
          >
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="is_published">Trạng thái hiển thị</label>
        <select
          id="is_published"
          name="is_published"
          value={formData.is_published ? "true" : "false"}
          onChange={(e) => {
            setFormData((prev) => ({
              ...prev,
              is_published: e.target.value === "true",
            }));
          }}
        >
          <option value="false">Ẩn</option>
          <option value="true">Hiển thị</option>
        </select>
      </div>

      <button type="submit">Lưu khóa học</button>
    </form>
  );
};

export default CourseForm;

