import axios from "./axios";
import type { Category } from "../types/category";

export const categoryApi = {
  getAll: (): Promise<Category[]> => axios.get("/categories"),
  getById: (id: string) => axios.get(`/categories/${id}`),
};

export default categoryApi;
