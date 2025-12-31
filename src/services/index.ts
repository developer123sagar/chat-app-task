import axios from "axios";

const { NEXT_PUBLIC_API_URL } = process.env;

export const baseURL = NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL,
  timeout: 5 * 60 * 1000,
  headers: {
    accept: "application/json",
    "Content-Type": "application/json",
  },
});

// request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const token = localStorage.getItem("accessToken");

      // add authorization header if token exists
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (err) {
      return Promise.reject(err);
    }
  },
  (error) => Promise.reject(error)
);
