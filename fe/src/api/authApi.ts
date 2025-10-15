import axios from "./axios"; // axios đã setup baseURL và interceptor đọc token

export type LoginPayload = { email: string; password: string };

export const login = (payload: LoginPayload) => {
  // BE: POST /api/auth/login -> { token, user }
  return axios.post("/auth/login", payload);
};


export const register = (payload: {
  name: string;        // BE dùng "name"
  email: string;
  password: string;
  role?: 'customer' | 'teacher' | 'admin';
}) => {
  // BE: POST /api/auth/register
  // trả về { message } hoặc { user, token? } tuỳ bạn
  return axios.post("/auth/register", payload);
};

export const me = () => {
  // BE: GET /api/users/me  (yêu cầu Bearer token)
  return axios.get("/users/me");
};
