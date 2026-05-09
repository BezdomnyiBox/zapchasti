import type { Order, OrderStatus, PaymentStatus } from "./order";

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
