import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";

export const useAxios = () => {
  const auth = useContext(AuthContext);

  const instance = axios.create({
    baseURL: "/api", // Nginx проксирует /api/ на backend
  });

  instance.interceptors.request.use((config) => {
    if (auth?.user?.token) {
      config.headers.Authorization = `Bearer ${auth.user.token}`;
    }
    return config;
  });

  return instance;
};