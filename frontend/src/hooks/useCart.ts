import { useCallback, useState } from "react";
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from "../services/cart";
import type { CartSummary } from "../types/cart";

export function useCart() {
  const [cart, setCart] = useState<CartSummary>({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCart();
      setCart(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (partId: number, quantity = 1) => {
    const data = await addCartItem(partId, quantity);
    setCart(data);
    return data;
  }, []);

  const update = useCallback(async (itemId: number, quantity: number) => {
    const data = await updateCartItem(itemId, quantity);
    setCart(data);
    return data;
  }, []);

  const remove = useCallback(async (itemId: number) => {
    const data = await removeCartItem(itemId);
    setCart(data);
    return data;
  }, []);

  const clear = useCallback(async () => {
    const data = await clearCart();
    setCart(data);
    return data;
  }, []);

  return { cart, loading, refresh, add, update, remove, clear };
}
