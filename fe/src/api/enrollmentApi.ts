import axios from "./axios";

type AnyId = string | { _id?: string; $oid?: string } | null | undefined;

function toId(val: AnyId): string {
  if (val == null) return "";
  if (typeof val === "object") {
    // Support Mongo-like shapes
    if ((val as any).$oid) return String((val as any).$oid);
    if ((val as any)._id) return String((val as any)._id);
  }
  return String(val);
}

export interface EnrollmentMiniRaw {
  _id: string;
  course_id?: AnyId;
  course?: { _id: AnyId } | null;
}

async function getMyEnrollmentsRaw(params?: Record<string, any>): Promise<EnrollmentMiniRaw[]> {
  try {
    // Backend route currently wired: GET /enrollments/my
    const data = (await axios.get("/enrollments/my", { params })) as any;
    if (Array.isArray(data)) return data as EnrollmentMiniRaw[];
    if (Array.isArray((data as any)?.data)) return (data as any).data as EnrollmentMiniRaw[];
    return [];
  } catch {
    return [];
  }
}

export async function getMyEnrolledCourseIds(): Promise<Set<string>> {
  const rows = await getMyEnrollmentsRaw();
  const ids = new Set<string>();
  for (const e of rows) {
    const id = e?.course && (e as any).course?._id ? toId((e as any).course._id) : toId(e.course_id);
    if (id) ids.add(id);
  }
  return ids;
}

export default { getMyEnrolledCourseIds };

