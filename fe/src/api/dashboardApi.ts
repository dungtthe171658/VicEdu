import axios from "./axios";

type TeacherStats = {
  students: number;
  revenue: number;
  activeCourses: number;
};

const dashboardApi = {
  getTeacherStats: (): Promise<TeacherStats> => axios.get("/dashboard/teacher"),
};

export default dashboardApi;

