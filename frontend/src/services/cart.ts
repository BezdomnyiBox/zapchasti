import { api } from "./api";
import type {
  CartAddRequest,
  CartCheckoutRequest,
  CartSummary,
  CartUpdateRequest,
} from "../types/cart";
import type { Order } from "../types/order";

export async function getCart(): Promise<CartSummary> {
  const { data } = await api.get<CartSummary>("/cart");
  return data;
}

export async function addCartItem(partId: number, quantity: number): Promise<CartSummary> {
  const payload: CartAddRequest = { part_id: partId, quantity };
  const { data } = await api.post<CartSummary>("/cart/items", payload);
  return data;
}

export async function updateCartItem(itemId: number, quantity: number): Promise<CartSummary> {
  const payload: CartUpdateRequest = { quantity };
  const { data } = await api.patch<CartSummary>(`/cart/items/${itemId}`, payload);
  return data;
}

export async function removeCartItem(itemId: number): Promise<CartSummary> {
  const { data } = await api.delete<CartSummary>(`/cart/items/${itemId}`);
  return data;
}

export async function clearCart(): Promise<CartSummary> {
  const { data } = await api.delete<CartSummary>("/cart");
  return data;
}

export async function checkoutCart(payload: CartCheckoutRequest): Promise<Order> {
  const { data } = await api.post<Order>("/cart/checkout", payload);
  return data;
}
