import axios from "axios";
import { useAuthStore } from "../store/authStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Attach the logged-in user's token to every request.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Central error handling — surfaces a clean message for the UI to show.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    const message =
      error?.response?.data?.detail ||
      error?.message ||
      "Something went wrong talking to the server.";
    return Promise.reject(new Error(message));
  }
);
