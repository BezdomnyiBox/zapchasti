import { api } from "./api";
import type { CourierProfile } from "../types/order";

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

export async function getCourierProfile(): Promise<CourierProfile> {
  const { data } = await api.get<CourierProfile>("/profile/courier");
  return data;
}

export async function updateCourierProfile(data: Partial<CourierProfile>): Promise<CourierProfile> {
  const { data: profile } = await api.patch<CourierProfile>("/profile/courier", data);
  return profile;
}
