import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useCart } from "../hooks/useCart";
import { checkoutCart } from "../services/cart";
import type { CheckoutCargoSize } from "../types/cart";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, loading, refresh, setCart } = useCart();
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [comment, setComment] = useState("");
  const [cargoSize, setCargoSize] = useState<CheckoutCargoSize>("small");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    refresh().catch(() => toast.error("Не удалось загрузить корзину"));
  }, [refresh]);

  const totalLabel = useMemo(() => cart.total.toLocaleString("ru-RU"), [cart.total]);

  const submitCheckout = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!deliveryAddress.trim()) {
      toast.error("Укажите адрес доставки");
      return;
    }

    setSubmitting(true);
    try {
      const order = await checkoutCart({
        delivery_address: deliveryAddress.trim(),
        cargo_size: cargoSize,
        comment: comment.trim() || null,
      });
      setCart({ items: [], total: 0 });
      toast.success("Заказ успешно создан");
      navigate(`/client/orders/${order.id}`);
    } catch (err: unknown) {
      const detail = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { detail?: string }, status?: number } }).response?.data?.detail
        : null;
      await refresh().catch(() => undefined);
      toast.error(typeof detail === "string" ? detail : "Не удалось оформить заказ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-topbar-inner">
          <Link to="/client" className="app-brand" aria-label="Саха Запчасти">
            <span className="app-brand-mark">СЗ</span>
            САХА ЗАПЧАСТИ
          </Link>
          <nav className="app-nav" aria-label="Навигация checkout">
            <Link to="/catalog">Каталог</Link>
            <Link to="/cart">Корзина</Link>
            <Link to="/client">Мои заказы</Link>
          </nav>
        </div>
      </header>

      <main className="app-page">
        <section className="app-hero">
          <div>
            <div className="app-kicker">Checkout</div>
            <h1 className="app-title">Оформление заказа</h1>
            <p className="app-subtitle">Проверьте состав корзины и подтвердите заказ.</p>
          </div>
        </section>

        {loading && (
          <p className="text-[color:var(--steel-light)] text-center mt-8">Загрузка…</p>
        )}

        {!loading && cart.items.length === 0 && (
          <div className="app-card text-center app-section">
            <h2 className="app-section-title">Корзина пуста</h2>
            <p className="app-section-note">Добавьте позиции в каталоге, чтобы перейти к оформлению.</p>
            <Link to="/catalog" className="app-btn-primary mt-4">Перейти в каталог</Link>
          </div>
        )}

        {!loading && cart.items.length > 0 && (
          <form onSubmit={submitCheckout} className="app-section space-y-4">
            <div className="app-form-card">
              <h2 className="app-section-title mb-3">Состав заказа</h2>
              <div className="space-y-2">
                {cart.items.map((item) => (
                  <article key={item.id} className="app-product-card">
                    <p className="app-product-title">{item.part_name}</p>
                    <p className="app-product-meta">{item.part_brand} · {item.article}</p>
                    <p className="app-product-meta">Количество: {item.quantity}</p>
                    <p className="app-product-meta">Цена: {item.unit_price.toLocaleString("ru-RU")} ₽</p>
                    <p className="app-product-meta">Подытог: {item.subtotal.toLocaleString("ru-RU")} ₽</p>
                  </article>
                ))}
              </div>
              <p className="mt-3 text-lg font-semibold text-[color:var(--ink-light)]">
                Итого: {totalLabel} ₽
              </p>
            </div>

            <div className="app-form-card">
              <h2 className="app-section-title mb-3">Доставка и комментарий</h2>
              <div className="space-y-3">
                <div>
                  <label className="app-label">Адрес доставки *</label>
                  <input
                    value={deliveryAddress}
                    onChange={(event) => setDeliveryAddress(event.target.value)}
                    className="app-input"
                    required
                    placeholder="Город, улица, дом"
                  />
                </div>
                <div>
                  <label className="app-label">Размер груза</label>
                  <select
                    value={cargoSize}
                    onChange={(event) => setCargoSize(event.target.value as CheckoutCargoSize)}
                    className="app-input"
                  >
                    <option value="small">Мелкая посылка</option>
                    <option value="large">Крупногабарит</option>
                  </select>
                </div>
                <div>
                  <label className="app-label">Комментарий</label>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    rows={3}
                    className="app-input resize-none"
                    placeholder="Комментарий к заказу"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || cart.items.length === 0}
              className="app-btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Оформление…" : "Подтвердить заказ"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
