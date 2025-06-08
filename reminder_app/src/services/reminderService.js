import api from "../lib/axios";

// import { Reminder } from "@/app/admin/reminders";

let mockReminders = [
  {
    _id: "r1",
    user: "user1",
    userId: "1",
    pet: "pet1",
    petId: "1",
    time: "08:00",
    repeat: "daily", // must match 'daily' | 'weekly' | 'custom'
    customDays: [],
    isActive: true,
    syncWithGoogle: false,
    lastExecutedAt: new Date().toISOString(),
  },
  {
    _id: "r2",
    user: "user2",
    userId: "2",
    pet: "pet2",
    petId: "2",
    time: "20:00",
    repeat: "custom",
    customDays: [1, 3, 5],
    isActive: false,
    syncWithGoogle: true,
    lastExecutedAt: new Date().toISOString(),
  },
];

// Simulate delay
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export const getReminders = async (params = {}) => {
  const res = await api.get("/reminders", { params });
  return res.data;
};


export const getReminderById = async (id) => {
  const res = await api.get(`/reminders/${id}`);
  return res.data;
};

export const createReminder = async (data) => {
  const res = await api.post("/reminders", data);
  return res.data;
};

export const updateReminder = async (id, updatedData) => {
  const res = await api.put(`/reminders/${id}`, updatedData);
  return res.data;
};

export const deleteReminder = async (id) => {
  const res = await api.delete(`/reminders/${id}`);
  return res.data;
};
