// services/reminderLogService.ts
import api from "../lib/axios";
import { ReminderLog } from "../types/ReminderLog";

export const fetchReminderLogs = async (): Promise<ReminderLog[]> => {
  const res = await api.get<{ data: ReminderLog[] }>("/reminder-logs");
  return res.data.data;
};

export const deleteReminderLog = async (id: string): Promise<void> => {
  await api.delete(`/reminder-logs/${id}`);
};



/*
// Mocked reminder logs data
let mockReminderLogs = [
  {
    _id: "log1",
    reminder: "r1", // This would reference a reminder ID
    status: "notified",
    executedAt: new Date().toISOString(),
  },
  {
    _id: "log2",
    reminder: "r1", // This would reference a reminder ID
    status: "completed",
    executedAt: new Date().toISOString(),
  },
  {
    _id: "log3",
    reminder: "r2", // This would reference a reminder ID
    status: "missed",
    executedAt: new Date().toISOString(),
  },
];

// Simulate API delay
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export const getLogs = async (reminderId) => {
  await delay(300); // Simulate API delay

  // Filter logs by reminder ID
  const logs = mockReminderLogs.filter((log) => log.reminder === reminderId);

  return logs;
  // For real implementation:
  // const res = await api.get(`/reminder-logs?reminderId=${reminderId}`);
  // return res.data;
};
*/