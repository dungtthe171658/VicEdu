import axios from "axios";
import type { UserDto } from "../types/user.d";
import { getAuthHeaders } from "./api.helpers"; 

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8888/api";
const API_URL = `${BASE_URL}/users`;

const userApi = {
  // [Admin] Lấy tất cả user
  getAll: () => 
    axios.get<UserDto[]>(API_URL, { headers: getAuthHeaders() }),

  // [Admin] Lấy 1 user theo ID
  getById: (id: string) => 
    axios.get<UserDto>(`${API_URL}/${id}`, { headers: getAuthHeaders() }),

  // [User] Lấy thông tin cá nhân
  getProfile: () => 
    axios.get<UserDto>(`${API_URL}/me`, { headers: getAuthHeaders() }),

  // [User] Cập nhật thông tin cá nhân
  updateMyProfile: (data: Partial<UserDto>) =>
    axios.put(`${API_URL}/me`, data, { headers: getAuthHeaders() }),

  // [User] Đổi mật khẩu
  changeMyPassword: (currentPassword: string, newPassword: string) =>
    axios.put(`${API_URL}/me/password`, { currentPassword, newPassword }, { headers: getAuthHeaders() }),

  // [Admin] Cập nhật thông tin user
  update: (id: string, data: Partial<UserDto>) =>
    axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() }),

  getProfileFull: () =>
    axios.get<{ user: UserDto }>(`${API_URL}/me/full`, {
      headers: getAuthHeaders(),
    }),

  // [User] Lấy avatar (nhẹ, chỉ trả avatar)
  getMyAvatar: () =>
    axios.get<{ avatar: string | null }>(`${API_URL}/me/avatar`, {
      headers: getAuthHeaders(),
    }),


    
  // [Admin] Khóa tài khoản
  lock: (id: string, hours: number) =>
    axios.post(`${API_URL}/${id}/lock`, { hours }, { headers: getAuthHeaders() }),

  // [Admin] Mở khóa tài khoản
  unlock: (id: string) => 
    axios.post(`${API_URL}/${id}/unlock`, {}, { headers: getAuthHeaders() }),

  // [Admin] Xóa mềm tài khoản
  softDelete: (id: string) => 
    axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() }),

  // [Admin] Khôi phục tài khoản
  restore: (id: string) => 
    axios.post(`${API_URL}/${id}/restore`, {}, { headers: getAuthHeaders() }),

   // [Admin] Tạo mới user
  create: (data: Partial<UserDto>) =>
    axios.post(API_URL, data, { headers: getAuthHeaders() }),
};


export default userApi;
