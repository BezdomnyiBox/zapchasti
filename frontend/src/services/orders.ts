import { api } from "./api";
import type { Order, OrderListItem, OrderCreatePayload, Review, ReviewPayload } from "../types/order";

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

export async function approveOrder(id: number): Promise<Order> {
  const { data } = await api.post<Order>(`/orders/${id}/approve`);
  return data;
}

export async function rejectOrder(id: number): Promise<Order> {
  const { data } = await api.post<Order>(`/orders/${id}/reject`);
  return data;
}

export async function confirmDelivery(id: number): Promise<Order> {
  const { data } = await api.post<Order>(`/orders/${id}/confirm-delivery`);
  return data;
}

export async function submitReview(orderId: number, payload: ReviewPayload): Promise<Review> {
  const { data } = await api.post<Review>(`/reviews/${orderId}`, payload);
  return data;
}
