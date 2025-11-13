import axios from "./axios";

type TeacherStats = {
  students: number;
  revenue: number;
  activeCourses: number;
};

type CountResponse = {
  count: number;
};

const dashboardApi = {
  getTeacherStats: (): Promise<TeacherStats> => axios.get("/dashboard/teacher"),
  getAdminActiveCourseCount: (): Promise<CountResponse> => axios.get("/dashboard/admin/active-courses-count"),
  getAdminReviewCount: (): Promise<CountResponse> => axios.get("/dashboard/admin/reviews-count"),
};

export default dashboardApi;

