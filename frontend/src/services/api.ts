import axios from "axios";

export const api = axios.create({
  baseURL: "/api", // backend проксируем через Nginx
});