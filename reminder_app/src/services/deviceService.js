import api from "../lib/axios";

let mockDevices = [
  {
    _id: "1",
    owner: "user1",
    serialNumber: "SN12345",
    isActive: true,
    lastSynced: new Date().toISOString(),
  },
  {
    _id: "2",
    owner: "user2",
    serialNumber: "SN67890",
    isActive: false,
    lastSynced: new Date().toISOString(),
  },
];

// Simulate delay
const delay = (ms) => new Promise((res) => setTimeout(res, ms));
export const getDevices = async () => {
  await delay(300); // Simulate API delay
  const res = await api.get("/devices");
  return res.data;
};

export const getDeviceById = async (id) => {
  await delay(300);
  const res = await api.get(`/devices/${id}`);
  return res.data;
};

export const createDevice = async (data) => {
  await delay(300);
  const res = await api.post("/devices", data);
  return res.data;
};

export const updateDevice = async (id, data) => {
  await delay(300);
  const res = await api.patch(`/devices/${id}`, data);
  return res.data;
};

export const deleteDevice = async (id) => {
  await delay(300);
  const res = await api.delete(`/devices/${id}`);
  return res.data;
};
