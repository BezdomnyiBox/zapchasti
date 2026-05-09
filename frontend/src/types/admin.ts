import type { Order, OrderStatus, PaymentStatus } from "./order";
import type { UserRole } from "../context/AuthContext";

export interface AdminOrderClient {
  id: number;
  username: string;
  email: string;
  phone: string | null;
}

export interface AdminOrderListItem {
  id: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_price: number | null;
  created_at: string;
  client: AdminOrderClient;
}

export interface AdminOrderListResponse {
  items: AdminOrderListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminOrderDetailResponse {
  order: Order;
  client: AdminOrderClient;
}

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
}

export interface AdminUsersListResponse {
  items: AdminUser[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminUserCreateRequest {
  email: string;
  username: string;
  password: string;
  role: UserRole;
  phone?: string | null;
}
