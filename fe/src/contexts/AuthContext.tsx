import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/authApi";
import { getAuthToken } from "../api/api.helpers";
import type { UserDto, UserRole } from "../types/user.d";
import { buildAvatarUrl } from "../utils/buildAvatarUrl";

type AuthContextType = {
  user: UserDto | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loginWithGoogle: (token: String, userData: any) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  loginWithGoogle: async () => {},
});

// Kiểu user trả về từ BE (có thể khác FE)
type BackendUser = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role?: UserRole;
  is_verified?: boolean;
  lockedUntil?: string | null;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

function mapBackendUserToFront(u: BackendUser): UserDto {
  return {
    _id: String(u._id),
    name: u.name || "",
    email: u.email || "",
    phone: u.phone,
    // Ensure avatar becomes an absolute URL when BE returns a relative path
    avatar: buildAvatarUrl(u.avatar) || undefined,
    role: (u.role as UserRole) || "customer",
    is_verified: Boolean(u.is_verified),
    lockedUntil: u.lockedUntil ?? null,
    deletedAt: u.deletedAt ?? null,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
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
      // axios interceptor của bạn trả THẲNG data => me chính là object user
      const me = await authApi.me();
      const mapped = mapBackendUserToFront(me as BackendUser);
      setUser(mapped);
    } catch {
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
    // axios interceptor trả THẲNG data => res chính là { message, token, user }
    const res = await authApi.login({ email, password });
    const token = (res as any)?.token;
    if (!token) throw new Error("No token returned");

    // Lưu token để interceptor request tự gắn Authorization cho các call sau
    localStorage.setItem("accessToken", token);

    // Gọi /me để đồng bộ user
    const me = await authApi.me(); // trả thẳng object user
    const mapped = mapBackendUserToFront(me as BackendUser);
    setUser(mapped);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    setUser(null);
  }, []);
  const loginWithGoogle = useCallback(async (token: String) => {
      localStorage.setItem("accessToken", String(token));
    try {
      const me = await authApi.me();
      const mapped = mapBackendUserToFront(me as BackendUser);
      setUser(mapped);
    } catch (error) {
      console.error("Google login failed:", error);
      localStorage.removeItem("accessToken");
      setUser(null);
      throw error;
    }
  }, []);
    
  const value = useMemo(
    () => ({ user, isLoading, login, logout, loginWithGoogle }),
    [user, isLoading, login, logout, loginWithGoogle]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
