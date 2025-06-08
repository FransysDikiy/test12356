// types/ReminderLog.ts

export interface ReminderLog {
  _id?: string;
  reminder: {
    pet?: {
      name?: string;
    };
    time?: string;
  } | string;
  status: "notified" | "completed" | "missed";
  executedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
