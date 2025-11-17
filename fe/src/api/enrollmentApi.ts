import axios from "./axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8888/api";

type AnyId = string | { _id?: string; $oid?: string } | null | undefined;

function toId(val: AnyId): string {
  if (val == null) return "";
  if (typeof val === "object") {
    if ((val as any).$oid) return String((val as any).$oid);
    if ((val as any)._id) return String((val as any)._id);
  }
  return String(val);
}

export interface EnrollmentMiniRaw {
  _id: string;
  course_id?: AnyId;
  status?: string;
}

export interface EnrollmentByCourse {
  _id: string | null;
  course_id: string;
  status: string;
  completed_lessons: string[];
  progress: number;
}

const enrollmentApi = {
  // Mini list of my enrollments: [{ _id, course_id, status }]
  getMyEnrollMini: (params?: Record<string, unknown>): Promise<EnrollmentMiniRaw[]> =>
    axios.get(`${BASE_URL}/enrollments/my-mini`, { params }),

  // Convenience: return a Set of enrolled course ids
  getMyEnrolledCourseIds: async (): Promise<Set<string>> => {
    try {
      const rows = await axios.get(`${BASE_URL}/enrollments/my-mini`);
      const ids = new Set<string>();
      for (const e of (Array.isArray(rows) ? rows : []) as EnrollmentMiniRaw[]) {
        const id = toId(e.course_id);
        if (id) ids.add(id);
      }
      return ids;
    } catch {
      return new Set<string>();
    }
  },

  // Get enrollment for a specific course with completed_lessons
  getEnrollmentByCourse: (courseId: string): Promise<EnrollmentByCourse> =>
    axios.get(`${BASE_URL}/enrollments/course/${courseId}`),

  // Mark a lesson as completed
  completeLesson: (lessonId: string): Promise<{ message: string; completed_lessons: string[]; progress: number }> =>
    axios.post(`${BASE_URL}/enrollments/complete-lesson`, { lessonId }),

  // [Admin] Get all enrollments with user and course data
  getAllForAdmin: (): Promise<any[]> =>
    axios.get(`${BASE_URL}/enrollments/admin/all`),

  // [Teacher] Get enrollments by course IDs
  getByCoursesForTeacher: (courseIds: string[]): Promise<any[]> =>
    axios.get(`${BASE_URL}/enrollments/teacher/by-courses`, {
      params: { courseIds: courseIds.join(",") },
    }),
};

export default enrollmentApi;

