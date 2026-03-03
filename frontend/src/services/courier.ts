import { api } from "./api";
import type { Order, OrderListItem, Photo } from "../types/order";

export async function getAvailableOrders(): Promise<OrderListItem[]> {
  const { data } = await api.get<OrderListItem[]>("/courier/available");
  return data;
}

export async function getMyOrders(): Promise<OrderListItem[]> {
  const { data } = await api.get<OrderListItem[]>("/courier/my");
  return data;
}

export async function acceptOrder(orderId: number): Promise<Order> {
  const { data } = await api.post<Order>(`/courier/${orderId}/accept`);
  return data;
}

export async function uploadPhoto(orderId: number, file: File): Promise<Photo> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<Photo>(`/courier/${orderId}/photo`, form);
  return data;
}

export async function markPhotosDone(orderId: number): Promise<Order> {
  const { data } = await api.post<Order>(`/courier/${orderId}/photos-done`);
  return data;
}

export async function markPickedUp(orderId: number): Promise<Order> {
  const { data } = await api.post<Order>(`/courier/${orderId}/picked-up`);
  return data;
}

export async function handoffToCarrier(orderId: number): Promise<Order> {
  const { data } = await api.post<Order>(`/courier/${orderId}/handoff`);
  return data;
}
