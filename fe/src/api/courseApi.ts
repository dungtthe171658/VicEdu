import axios from "./axios.ts";
import type {Course} from "../types/course";

const courseApi = {
    // GET /api/courses?status=approved
    getAll: (params?: { is_published?: boolean; limit?: number }): Promise<Course[]> =>
        axios.get("/courses", {params}),

    // GET /api/courses/slug/:courseSlug
    getBySlug: (courseSlug: string): Promise<Course> =>
        axios.get(`/courses/${courseSlug}`),
};
export default courseApi;