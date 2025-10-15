import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/authApi";
import { getAuthToken } from "../api/api.helpers";
import type { UserDto, UserRole } from "../types/user.d";

type AuthContextType = {
  user: UserDto | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

function mapBackendUserToFront(u: any): UserDto {
  // BE: { _id, name, email, phone, avatar, role, is_verified, createdAt, ... }
  return {
    _id: String(u._id),
    fullName: u.name || "",
    email: u.email || "",
    phone: u.phone,
    avatarUrl: u.avatar,
    role: (u.role as UserRole) || "customer",
    isActive: Boolean(u.is_verified), // map tạm: verified -> active
    lockedUntil: u.lockedUntil ? String(u.lockedUntil) : null,
    deletedAt: u.deletedAt ? String(u.deletedAt) : null,
    created_at: u.createdAt ? String(u.createdAt) : undefined,
    updated_at: u.updatedAt ? String(u.updatedAt) : undefined,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        return;
      }
      const res = await authApi.me(); // axios đã gắn Bearer từ interceptor
      const mapped = mapBackendUserToFront(res.data);
      setUser(mapped);
    } catch {
      // token hỏng → sign out
      localStorage.removeItem("accessToken");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email: string, password: string) => {
    // 1) login để lấy token + (optionally user)
    const res = await authApi.login({ email, password });
    const { token, user: rawUser } = res.data || {};
    if (!token) throw new Error("No token returned");

    localStorage.setItem("accessToken", token);

    // 2) lấy /me để đồng bộ chuẩn
    const meRes = await authApi.me();
    const mapped = mapBackendUserToFront(meRes.data);
    setUser(mapped);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
