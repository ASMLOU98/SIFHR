import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // true si tu utilises cookies
});

// Récupérer token depuis localStorage ou sessionStorage
function getStoredToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token") || null;
}

// Attacher Authorization header
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Gestion centralisée des erreurs
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
    }
    return Promise.reject(err);
  }
);

// Helpers auth
export const auth = {
  login: async ({ email, password }) => {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },
  register: async ({ firstName, lastName, username, email, password }) => {
    const res = await api.post("/auth/register", { firstName, lastName, username, email, password });
    return res.data;
  },
  logoutLocal: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    localStorage.removeItem("rememberMe");
  }
};

export default api;
