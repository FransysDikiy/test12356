import api from "../lib/axios";

export const login = async (data) => {
  const res = await api.post("/auth/login", data);
  return res.data;
};

export const register = async (username, email, password) => {
  const res = await api.post("/auth/register", { username, email, password });
  return res?.data;
};

export const getUserData = async () => {
  const res = await api.get("/users/me");
  return res.data;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
