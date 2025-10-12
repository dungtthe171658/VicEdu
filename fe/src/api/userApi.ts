import axiosClient from "./axiosClient";
import type { UserDto } from "../types/user.d";

const API_URL = "/users";

const userApi = {
  // [Admin] Lấy tất cả user (cả đã xóa)
  getAll: () => axiosClient.get<UserDto[]>(API_URL),

  // [Admin] Lấy 1 user theo ID
  getById: (id: string) => axiosClient.get<UserDto>(`${API_URL}/${id}`),

  // [User] Lấy thông tin cá nhân
  getProfile: () => axiosClient.get<UserDto>(`${API_URL}/me`),

  // [Admin] Cập nhật thông tin user
  update: (id: string, data: Partial<Pick<UserDto, 'fullName' | 'phone' | 'role' | 'isActive'>>) =>
    axiosClient.put(`${API_URL}/${id}`, data),

  // [Admin] Khóa tài khoản
  lock: (id: string, hours: number) => 
    axiosClient.post(`${API_URL}/${id}/lock`, { hours }),

  // [Admin] Mở khóa tài khoản
  unlock: (id: string) => axiosClient.post(`${API_URL}/${id}/unlock`),

  // [Admin] Xóa mềm tài khoản
  softDelete: (id: string) => axiosClient.delete(`${API_URL}/${id}`),
  
  // [Admin] Khôi phục tài khoản
  restore: (id: string) => axiosClient.post(`${API_URL}/${id}/restore`),
};

export default userApi;