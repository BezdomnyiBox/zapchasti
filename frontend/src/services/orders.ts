import { api } from "./api";
import type { Order, OrderListItem, OrderCreatePayload } from "../types/order";

export async function createOrder(data: OrderCreatePayload): Promise<Order> {
  const { data: order } = await api.post<Order>("/orders", data);
  return order;
}

export async function getOrders(): Promise<OrderListItem[]> {
  const { data } = await api.get<OrderListItem[]>("/orders");
  return data;
}

export async function getOrder(id: number): Promise<Order> {
  const { data } = await api.get<Order>(`/orders/${id}`);
  return data;
}

export async function uploadPhoto(
  file: File,
  orderItemId: number,
  taskType?: "selection" | "pickup",
  taskId?: number,
): Promise<{ id: number; file_url: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("order_item_id", String(orderItemId));
  if (taskType === "selection" && taskId) form.append("selection_task_id", String(taskId));
  if (taskType === "pickup" && taskId) form.append("pickup_task_id", String(taskId));
  const { data } = await api.post<{ id: number; file_url: string }>("/media", form);
  return data;
}
