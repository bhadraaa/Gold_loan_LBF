
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach token and selected branch to every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");
  const activeBranchId = sessionStorage.getItem("active_branch_id");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (role === "owner" && activeBranchId) {
    config.headers["x-active-branch-id"] = activeBranchId;
  }

  return config;
});

export default api;
