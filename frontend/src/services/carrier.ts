import { api } from "./api";
import type { Order, OrderListItem } from "../types/order";

export async function getAvailableOrders(): Promise<OrderListItem[]> {
  const { data } = await api.get<OrderListItem[]>("/carrier/available");
  return data;
}

export async function getMyOrders(): Promise<OrderListItem[]> {
  const { data } = await api.get<OrderListItem[]>("/carrier/my");
  return data;
}

export async function acceptOrder(orderId: number): Promise<Order> {
  const { data } = await api.post<Order>(`/carrier/${orderId}/accept`);
  return data;
}

export async function markDelivered(orderId: number): Promise<Order> {
  const { data } = await api.post<Order>(`/carrier/${orderId}/delivered`);
  return data;
}
