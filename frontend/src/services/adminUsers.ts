import { api } from "./api";
import type {
  AdminUser,
  AdminUserCreateRequest,
  AdminUsersListResponse,
} from "../types/admin";
import type { UserRole } from "../context/AuthContext";

type AdminUsersQuery = {
  search?: string;
  limit?: number;
  offset?: number;
};

function compactParams(params: AdminUsersQuery) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
  );
}

export async function getAdminUsers(params: AdminUsersQuery): Promise<AdminUsersListResponse> {
  const { data } = await api.get<AdminUsersListResponse>("/admin/users", {
    params: compactParams(params),
  });
  return data;
}

export async function createAdminUser(payload: AdminUserCreateRequest): Promise<AdminUser> {
  const { data } = await api.post<AdminUser>("/admin/users", payload);
  return data;
}

export async function updateAdminUserRole(userId: number, role: UserRole): Promise<AdminUser> {
  const { data } = await api.patch<AdminUser>(`/admin/users/${userId}/role`, { role });
  return data;
}
