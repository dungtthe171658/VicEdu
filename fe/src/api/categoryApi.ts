import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8888/api",
});

const categoryApi = {
  getAll: () => api.get("/categories"),
  getById: (id: string) => api.get(`/categories/${id}`),
};

export default categoryApi;
