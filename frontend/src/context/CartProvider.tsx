import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from "../services/cart";
import type { CartSummary } from "../types/cart";
import { AuthContext } from "./AuthContext";
import { CartContext } from "./cartContext";

export function CartProvider({ children }: { children: ReactNode }) {
  const auth = useContext(AuthContext);
  const isClient = auth?.user?.role === "client";
  const [cart, setCart] = useState<CartSummary>({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isClient) {
      setCart({ items: [], total: 0 });
      return undefined;
    }
    setLoading(true);
    try {
      const data = await getCart();
      setCart(data);
      return data;
    } catch {
      return undefined;
    } finally {
      setLoading(false);
    }
  }, [isClient]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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

  const clearFn = useCallback(async () => {
    const data = await clearCart();
    setCart(data);
    return data;
  }, []);

  const value = useMemo(
    () => ({
      cart,
      loading,
      refresh,
      add,
      update,
      remove,
      clear: clearFn,
      setCart,
    }),
    [cart, loading, refresh, add, update, remove, clearFn],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
