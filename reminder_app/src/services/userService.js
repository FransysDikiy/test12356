import api from "../lib/axios"; // Assuming you have axios setup for real API calls

// Mocked users data
let mockUsers = [
  {
    _id: "1",
    username: "user1",
    email: "user1@example.com",
    password: "password123",
    role: "User",
    googleId: null,
    lastLoggedOutAt: null,
    avatar: "user1-avatar.jpg",
    devices: ["1", "2"], // Referencing device IDs
  },
  {
    _id: "2",
    username: "user2",
    email: "user2@example.com",
    password: "password456",
    role: "Admin",
    googleId: null,
    lastLoggedOutAt: null,
    avatar: "user2-avatar.jpg",
    devices: ["2", "1"], // Referencing device IDs
  },
];

// Simulate API delay
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Function to get all users
export const getUsers = async () => {
  await delay(300); // Simulate API delay
  return mockUsers;
  // For real implementation:
  // const res = await api.get("/users");
  // return res.data;
};

export const getUserInfo = async () => {
  const res = await api.get(`/users/me`);
  return res.data;
};
// Function to get a single user by ID
export const getUserById = async (id) => {
  const res = await api.get(`/users/${id}`);
  return res.data;
};

// Function to create a new user
export const createUser = async (data) => {
  await delay(300);
  const newUser = {
    ...data,
    _id: Date.now().toString(), // Generate new user ID
    devices: [], // Initially no devices
  };
  mockUsers.push(newUser);
  return newUser;
  // For real implementation:
  // const res = await api.post("/users", data);
  // return res.data;
};

// Function to update user information
export const updateUser = async (id, data) => {
  await delay(300);
  mockUsers = mockUsers.map((user) =>
    user._id === id ? { ...user, ...data } : user
  );
  return { success: true };
  // For real implementation:
  // const res = await api.put(`/users/${id}`, data);
  // return res.data;
};

// Function to delete a user
export const deleteUser = async (id) => {
  await delay(300);
  mockUsers = mockUsers.filter((user) => user._id !== id);
  return { success: true };
  // For real implementation:
  // const res = await api.delete(`/users/${id}`);
  // return res.data;
};
