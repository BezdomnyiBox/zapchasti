import { createContext } from "react";
import type { CartSummary } from "../types/cart";

export type CartContextValue = {
  cart: CartSummary;
  loading: boolean;
  refresh: () => Promise<CartSummary | undefined>;
  add: (partId: number, quantity?: number) => Promise<CartSummary>;
  update: (itemId: number, quantity: number) => Promise<CartSummary>;
  remove: (itemId: number) => Promise<CartSummary>;
  clear: () => Promise<CartSummary>;
  setCart: (summary: CartSummary) => void;
};

export const CartContext = createContext<CartContextValue | null>(null);
