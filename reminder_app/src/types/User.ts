export interface User {
  id?: string;
  username: string;
  email?: string;
  password?: string;
  role?: "User" | "Admin" | string;
  googleId?: string;
  lastLoggedOutAt?: string | null;
  avatar?: string;
  devices?: string[]; // Array of device IDs (or Device[] if populated)
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginPayload {
  username?: string;
  email?: string;
  password: string;
}

