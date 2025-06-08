// types/Device.ts

export interface Device {
  _id?: string;
  owner: string; // ID của User (hoặc User nếu populate)
  serialNumber: string;
  isActive?: boolean;
  lastSynced?: string;
  createdAt?: string;
  updatedAt?: string;
}
