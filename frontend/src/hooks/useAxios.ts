import axios from "axios";

const TOKEN_KEY = "access_token";

/** Axios-инстанс с подставленным Bearer-токеном из localStorage (дублирует api.ts для случаев, когда нужен отдельный инстанс). */
export const useAxios = () => {
  const instance = axios.create({ baseURL: "/api" });
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return instance;
};