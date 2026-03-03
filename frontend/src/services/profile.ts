import { api } from "./api";
import type { PickerProfile } from "../types/order";

export interface UserProfileData {
  phone?: string | null;
}

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  phone: string | null;
  role: string;
  is_active: boolean;
}

export async function updateProfile(data: UserProfileData): Promise<UserResponse> {
  const { data: user } = await api.patch<UserResponse>("/profile", data);
  return user;
}

export async function getPickerProfile(): Promise<PickerProfile> {
  const { data } = await api.get<PickerProfile>("/profile/picker");
  return data;
}

export async function updatePickerProfile(data: Partial<PickerProfile>): Promise<PickerProfile> {
  const { data: profile } = await api.patch<PickerProfile>("/profile/picker", data);
  return profile;
}
