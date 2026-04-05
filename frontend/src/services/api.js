import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// 🔥 FORCE HEADER EVERY TIME
api.interceptors.request.use((config) => {

  const token = localStorage.getItem("token");

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  console.log("SENDING TOKEN 👉", token); // 🔥 DEBUG

  return config;
});

export default api;