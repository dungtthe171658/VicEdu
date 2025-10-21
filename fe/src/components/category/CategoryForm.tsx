// src/components/category/CategoryForm.tsx

import { useState } from "react";
import type { FormEvent } from "react";
import type { Category } from "../../types/category";
import "./CategoryForm.css";

interface CategoryFormProps {
  initialData?: Partial<Category>;
  onSubmit: (data: Partial<Category>) => void;
}

const CategoryForm = ({ initialData = {}, onSubmit }: CategoryFormProps) => {
  const [formData, setFormData] = useState<Partial<Category>>({
    name: initialData.name || "",
    slug: initialData.slug || "",
    description: initialData.description || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const payload: Partial<Category> = {
      name: formData.name?.trim() || "",
      slug: formData.slug?.trim() || "",
      description: formData.description?.trim() || "",
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="category-form">
      <div className="form-group">
        <label htmlFor="name">Tên danh mục</label>
        <input
          id="name"
          type="text"
          name="name"
          value={formData.name || ""}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="slug">Slug</label>
        <input
          id="slug"
          type="text"
          name="slug"
          value={formData.slug || ""}
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
        />
      </div>

      <button type="submit">Lưu danh mục</button>
    </form>
  );
};

export default CategoryForm;
