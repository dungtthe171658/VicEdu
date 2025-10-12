// src/api/api.helpers.ts
export const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
export const getAuthToken = () => {
  const token = localStorage.getItem("accessToken");
  return token;
};