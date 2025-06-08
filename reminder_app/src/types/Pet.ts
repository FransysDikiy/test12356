export interface Pet {
  _id?: string;
  owner: string; // ID của User
  name: string;
  species: string;

  ageValue?: number;
  ageUnit?: "day" | "month" | "year";

  weightValue?: number;
  weightUnit?: "kg" | "gr";

  device?: string;
  createdAt?: string;
  updatedAt?: string;
  portions?: number;
}

