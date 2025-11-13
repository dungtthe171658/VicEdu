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
};

export default enrollmentApi;

