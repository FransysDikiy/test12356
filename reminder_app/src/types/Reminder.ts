// types/Reminder.ts

import { Pet } from "./Pet";

export interface Reminder {
  _id?: string;
  user?: string; // ID của User (hoặc User nếu populate)
  pet?: Pet; // ID của Pet (hoặc Pet nếu populate)
  time: string; // Ví dụ: '08:00' hoặc định dạng bạn dùng
  repeat?: "daily" | "weekly" | "custom";
  customDays?: number[]; // 0 (Sunday) -> 6 (Saturday)
  isActive?: boolean;
  syncWithGoogle?: boolean;
  lastExecutedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReminderPayload {
  pet?: string;
  time: string;
  repeat?: "daily" | "weekly" | "custom";
  customDays?: number[];
  isActive?: boolean;
  syncWithGoogle?: boolean;
}
