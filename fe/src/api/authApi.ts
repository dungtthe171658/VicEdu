import axiosClient from "./axiosClient";
// Giả sử bạn có LoginFormData và RegisterFormData trong types
import type { LoginFormData, RegisterFormData } from "../types/auth.d";

const API_URL = "/auth";

const authApi = {
  login: (data: LoginFormData) => axiosClient.post(`${API_URL}/login`, data),

  register: (data: RegisterFormData) => axiosClient.post(`${API_URL}/register`, data),
};

export default authApi;