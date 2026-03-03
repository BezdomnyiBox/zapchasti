export type OrderStatus = "new" | "selection" | "pickup" | "delivery" | "closed" | "cancelled";
export type TaskStatus = "pending" | "in_progress" | "waiting_client" | "approved" | "rejected" | "completed" | "cancelled";

export interface Photo {
  id: number;
  file_url: string;
  created_at: string;
}

export interface SelectionTask {
  id: number;
  order_id: number;
  picker_id: number | null;
  status: TaskStatus;
  note: string | null;
  photos: Photo[];
  created_at: string;
  updated_at: string;
}

export interface PickupTask {
  id: number;
  order_id: number;
  picker_id: number | null;
  seller_address: string | null;
  seller_lat: number | null;
  seller_lng: number | null;
  needs_inspection: boolean;
  status: TaskStatus;
  note: string | null;
  photos: Photo[];
  created_at: string;
  updated_at: string;
}

export interface DeliveryTask {
  id: number;
  order_id: number;
  picker_id: number | null;
  delivery_address: string | null;
  is_third_party_carrier: boolean;
  status: TaskStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  client_id: number;
  drom_url: string | null;
  description: string | null;
  target_price: number | null;
  comment: string | null;
  prepaid_to_seller: boolean;
  status: OrderStatus;
  selection_task: SelectionTask | null;
  pickup_task: PickupTask | null;
  delivery_task: DeliveryTask | null;
  photos: Photo[];
  created_at: string;
  updated_at: string;
}

export interface OrderListItem {
  id: number;
  drom_url: string | null;
  description: string | null;
  status: OrderStatus;
  created_at: string;
}

export interface OrderCreatePayload {
  drom_url?: string | null;
  description?: string | null;
  target_price?: number | null;
  comment?: string | null;
  prepaid_to_seller: boolean;
}
