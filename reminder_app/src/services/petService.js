import api from "../lib/axios";

let mockPets = [
  {
    _id: "1",
    owner: "user1",
    name: "Buddy",
    species: "Dog",
    age: 3,
    weight: 12.5,
    device: "SN12345",
    deviceId: "1",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "2",
    owner: "user2",
    name: "Milo",
    species: "Cat",
    age: 2,
    weight: 4.3,
    device: "SN67890",
    deviceId: "2",
    createdAt: new Date().toISOString(),
  },
];

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
export const getPets = async () => {
  const res = await api.get("/pets");
  return res.data;
};

export const getPetById = async (id) => {
  const res = await api.get(`/pets/${id}`);
  return res.data;
};

export const createPet = async (data) => {
  const res = await api.post("/pets", data);
  return res.data;
};

export const updatePet = async (id, updatedData) => {
  const res = await api.put(`/pets/${id}`, updatedData);
  return res.data;
};

export const deletePet = async (id) => {
  const res = await api.delete(`/pets/${id}`);
  return res.data;
};
