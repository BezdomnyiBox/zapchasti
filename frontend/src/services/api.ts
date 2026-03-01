import axios, { type InternalAxiosRequestConfig } from "axios";

const TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<{ access_token: string; refresh_token: string } | null> | null = null;

async function refreshTokens(): Promise<{ access_token: string; refresh_token: string } | null> {
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refresh) return null;
  try {
    const { data } = await api.post<{ access_token: string; refresh_token: string }>(
      "/auth/refresh",
      { refresh_token: refresh }
    );
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
    return data;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }
    if (originalConfig.url?.includes("/auth/refresh") || originalConfig._retry) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      window.dispatchEvent(new CustomEvent("auth:logout"));
      return Promise.reject(error);
    }
    if (!refreshPromise) {
      refreshPromise = refreshTokens();
    }
    const tokens = await refreshPromise;
    refreshPromise = null;
    if (!tokens) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      window.dispatchEvent(new CustomEvent("auth:logout"));
      return Promise.reject(error);
    }
    originalConfig._retry = true;
    originalConfig.headers.Authorization = `Bearer ${tokens.access_token}`;
    return api.request(originalConfig);
  }
);
