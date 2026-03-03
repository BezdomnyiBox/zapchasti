import { createContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { api } from "../services/api";
import { toast } from "react-toastify";

export const TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";

export type UserRole = "user" | "admin";

export type User = {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  is_active: boolean;
};

type AuthContextType = {
  user: User | null;
  /** false пока идёт проверка токена при загрузке (не редиректить на логин) */
  isAuthReady: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  register: (email: string, username: string, password: string) => Promise<User | null>;
  logout: () => void;
};

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | null>(null);

async function fetchMe(signal?: AbortSignal): Promise<User> {
  const { data } = await api.get<User>("/auth/me", { signal });
  return data;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  const setToken = useCallback((newToken: string | null, newRefreshToken?: string | null) => {
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    if (newRefreshToken !== undefined) {
      if (newRefreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      } else {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    }
    setTokenState(newToken);
  }, []);

  useEffect(() => {
    if (!token) {
      setIsAuthReady(true);
      return;
    }
    const controller = new AbortController();
    fetchMe(controller.signal)
      .then(setUser)
      .catch((err) => {
        if (err.name === "CanceledError" || err.name === "AbortError") return;
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsAuthReady(true));
    return () => controller.abort();
  }, [token, setToken]);

  useEffect(() => {
    const onLogout = () => {
      setToken(null, null);
      setUser(null);
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [setToken]);

  const login = useCallback(
    async (username: string, password: string): Promise<User | null> => {
      try {
        const { data } = await api.post<{ access_token: string; refresh_token: string }>(
          "/auth/login",
          { username, password }
        );
        setToken(data.access_token, data.refresh_token);
        const u = await fetchMe();
        setUser(u);
        toast.success("Вход выполнен");
        return u;
      } catch (err: unknown) {
        const msg = err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
        toast.error(typeof msg === "string" ? msg : "Ошибка входа");
        return null;
      }
    },
    [setToken]
  );

  const register = useCallback(
    async (email: string, username: string, password: string): Promise<User | null> => {
      try {
        const { data } = await api.post<{ access_token: string; refresh_token: string }>(
          "/auth/register",
          { email, username, password }
        );
        setToken(data.access_token, data.refresh_token);
        const u = await fetchMe();
        setUser(u);
        toast.success("Регистрация успешна");
        return u;
      } catch (err: unknown) {
        const msg = err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
        toast.error(typeof msg === "string" ? msg : "Ошибка регистрации");
        return null;
      }
    },
    [setToken]
  );

  const logout = useCallback(() => {
    setToken(null, null);
    setUser(null);
    toast.info("Выход выполнен");
  }, [setToken]);

  return (
    <AuthContext.Provider value={{ user, isAuthReady, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
