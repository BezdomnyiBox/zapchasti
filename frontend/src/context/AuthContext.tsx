import { createContext, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../services/api";
import { toast } from "react-toastify";

type User = { email: string; role: string; token: string };
type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

// Контекст и провайдер в одном файле — eslint-disable для react-refresh
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      setUser(res.data);
      toast.success("Logged in!");
    } catch {
      toast.error("Login failed");
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
