import axios from "./axios.ts";

const courseApi = {
    // GET /api/courses?status=approved
    getAll: (params?: { status?: string; limit?: number }) =>
        axios.get("/courses", { params }),

    // GET /api/courses/slug/:courseSlug
    getBySlug: (courseSlug: string) =>
        axios.get(`/courses/slug/${courseSlug}`),
};
export default courseApi;
