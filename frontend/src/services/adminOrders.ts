import { api } from "./api";
import type { AdminOrderDetailResponse, AdminOrderListResponse } from "../types/admin";
import type { OrderStatus, PaymentStatus } from "../types/order";

type AdminOrdersQuery = {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  search?: string;
  limit?: number;
  offset?: number;
};

function compactParams(params: AdminOrdersQuery) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
  );
}

export async function getAdminOrders(params: AdminOrdersQuery): Promise<AdminOrderListResponse> {
  const { data } = await api.get<AdminOrderListResponse>("/admin/orders", {
    params: compactParams(params),
  });
  return data;
}

export async function getAdminOrder(orderId: number): Promise<AdminOrderDetailResponse> {
  const { data } = await api.get<AdminOrderDetailResponse>(`/admin/orders/${orderId}`);
  return data;
}

export async function updateAdminOrderStatus(
  orderId: number,
  status: OrderStatus,
): Promise<AdminOrderDetailResponse> {
  const { data } = await api.patch<AdminOrderDetailResponse>(`/admin/orders/${orderId}/status`, { status });
  return data;
}
