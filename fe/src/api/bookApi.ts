import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") + "/books" ||
  "http://localhost:5000/api/books";

export interface Book {
  _id?: string;
  title: string;
  author: string;
  price: number;
  category?: string;
  description?: string;
  coverImage?: string;
  is_published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 🟢 Lấy danh sách sách (Public)
 */
export const getBooks = async (params?: {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}) => {
  try {
    const response = await axios.get(API_URL, { params });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching books:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 🟡 Lấy chi tiết 1 sách
 */
export const getBookById = async (id: string) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching book by ID:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 🔵 Thêm sách mới (Admin)
 */
export const createBook = async (bookData: Book, token: string) => {
  try {
    const response = await axios.post(API_URL, bookData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error creating book:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 🟠 Cập nhật sách (Admin)
 */
export const updateBook = async (id: string, bookData: Partial<Book>, token: string) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, bookData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error updating book:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 🟣 Ẩn sách (Soft delete)
 */
export const hideBook = async (id: string, token: string) => {
  try {
    const response = await axios.put(
      `${API_URL}/${id}/hide`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error hiding book:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 🔴 Xóa sách hoàn toàn (Hard delete)
 */
export const deleteBook = async (id: string, token: string) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error deleting book:", error.response?.data || error.message);
    throw error;
  }
};
