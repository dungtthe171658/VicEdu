import { useState, useEffect } from "react";
import categoryApi from "../../../api/categoryApi";
import type { Category } from "../../../types/category";
import CategoryForm from "../../../components/category/CategoryForm";
import "./ManageCategoriesPage.css";

const ManageCategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Partial<Category> | null>(null);
  const [showModal, setShowModal] = useState(false);

  // 🔹 Load tất cả category
  const loadCategories = async () => {
    try {
      const res = await categoryApi.getAll();
      setCategories(res.data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // 🔹 Thêm hoặc sửa category
  const handleSave = async (data: Partial<Category>) => {
    try {
      if (selectedCategory?._id) {
        await categoryApi.update(selectedCategory._id, data);
      } else {
        await categoryApi.create(data);
      }
      setShowModal(false);
      setSelectedCategory(null);
      loadCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Error saving category. Please check your data.");
    }
  };

  // 🔹 Mở modal để sửa
  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setShowModal(true);
  };

  // 🔹 Mở modal để thêm
  const handleAdd = () => {
    setSelectedCategory(null);
    setShowModal(true);
  };

  // 🔹 Xóa category
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await categoryApi.delete(id);
        loadCategories();
      } catch (error) {
        console.error("Error deleting category:", error);
        alert("Cannot delete category. Please try again.");
      }
    }
  };

  return (
    <div className="category-management-container">
      <div className="header">
        <h2>Category Management</h2>
        <button className="add-btn" onClick={handleAdd}>
          Add Category
        </button>
      </div>

      <ul className="category-list">
        {categories.map((category) => (
          <li key={category._id}>
            <span>{category.name}</span>
            <div className="actions">
              <button className="edit-btn" onClick={() => handleEdit(category)}>
                Edit
              </button>
              <button
                className="delete-btn"
                onClick={() => handleDelete(category._id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedCategory ? "Edit Category" : "Add Category"}</h3>
            <CategoryForm initialData={selectedCategory || {}} onSubmit={handleSave} />
            <button className="close-btn" onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCategoriesPage;
