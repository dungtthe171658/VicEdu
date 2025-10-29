import axios from "./axios";

type AnyId = string | { _id?: string; $oid?: string } | null | undefined;

function toId(val: AnyId): string {
  if (val == null) return "";
  if (typeof val === "object") {
    if ((val as any).$oid) return String((val as any).$oid);
    if ((val as any)._id) return String((val as any)._id);
  }
  return String(val);
}

export interface ReviewDto {
  _id: string;
  product_id: AnyId | { _id?: AnyId; title?: string; name?: string };
  product_type: "Course" | "Book";
  rating: number;
  comment?: string;
  status?: "pending" | "approved";
  created_at?: string;
  user_id?: AnyId | { _id?: AnyId; name?: string; email?: string };
}

export async function listForCourse(courseId: string, page = 1, limit = 20): Promise<ReviewDto[]> {
  try {
    const params = { product_type: "Course", product_id: courseId, page, limit } as any;
    const data = (await axios.get("/reviews/public", { params })) as any;
    if (Array.isArray(data)) return data as ReviewDto[];
    if (Array.isArray((data as any)?.data)) return (data as any).data as ReviewDto[];
    return [];
  } catch {
    return [];
  }
}

export async function getCourseSummary(courseId: string): Promise<{ count: number; average: number; breakdown: Record<string, number> } | null> {
  try {
    const params = { product_type: "Course", product_id: courseId } as any;
    const data = (await axios.get("/reviews/summary", { params })) as any;
    if (data && typeof data === "object" && "count" in data) return data as any;
    if ((data as any)?.data && typeof (data as any).data === "object") return (data as any).data as any;
    return null;
  } catch {
    return null;
  }
}

export async function createCourseReview(courseId: string, rating: number, comment?: string) {
  return axios.post("/reviews", {
    product_id: courseId,
    product_type: "Course",
    rating,
    comment,
  });
}

export default { listForCourse, createCourseReview, getCourseSummary };
