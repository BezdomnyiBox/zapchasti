export type OrderStatus =
  | "waiting_courier"
  | "courier_assigned"
  | "photo_uploaded"
  | "confirmed"
  | "picked_up"
  | "handed_to_carrier"
  | "completed"
  | "cancelled";

export type CargoSize = "small" | "large";

export interface Photo {
  id: number;
  file_url: string;
  created_at: string;
}

export interface Review {
  id: number;
  order_id: number;
  client_id: number;
  courier_rating: number;
  service_rating: number;
  comment: string | null;
  created_at: string;
}

export interface Order {
  id: number;
  client_id: number;
  courier_id: number | null;
  carrier_id: number | null;

  description: string | null;
  drom_url: string | null;
  car_brand: string | null;
  car_model: string | null;
  car_year: number | null;
  body_type: string | null;
  part_name: string | null;
  part_number: string | null;

  seller_address: string | null;
  delivery_address: string | null;

  part_price: number | null;
  service_fee: number | null;
  delivery_fee: number | null;
  total_price: number | null;
  cargo_size: CargoSize;
  comment: string | null;

  status: OrderStatus;
  photos: Photo[];
  review: Review | null;

  created_at: string;
  updated_at: string;
}

export interface OrderListItem {
  id: number;
  status: OrderStatus;
  part_name: string | null;
  drom_url: string | null;
  total_price: number | null;
  created_at: string;
}

export interface OrderCreatePayload {
  drom_url?: string | null;
  description?: string | null;
  car_brand?: string | null;
  car_model?: string | null;
  car_year?: number | null;
  body_type?: string | null;
  part_name?: string | null;
  part_number?: string | null;
  seller_address?: string | null;
  seller_lat?: number | null;
  seller_lng?: number | null;
  delivery_address: string;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  part_price?: number | null;
  cargo_size: CargoSize;
  comment?: string | null;
}

export interface ReviewPayload {
  courier_rating: number;
  service_rating: number;
  comment?: string | null;
}

export interface CourierProfile {
  pickup_price: number | null;
  inspection_price: number | null;
  delivery_price: number | null;
}
