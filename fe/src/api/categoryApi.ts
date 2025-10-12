import axios from "./axios.ts";


const categoryApi = {
    getAll: () => axios.get("/categories"),
    getById: (id: string) => axios.get(`/categories/${id}`),
};

export default categoryApi;
