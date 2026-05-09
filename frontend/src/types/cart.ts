export interface CartItem {
  id: number;
  part_id: number;
  part_name: string;
  article: string;
  part_brand: string;
  category: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
}

export interface CartSummary {
  items: CartItem[];
  total: number;
}

export interface CartAddRequest {
  part_id: number;
  quantity: number;
}

export interface CartUpdateRequest {
  quantity: number;
}
