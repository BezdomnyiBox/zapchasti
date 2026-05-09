import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useCart } from "../hooks/useCart";

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, loading, refresh, update, remove, clear } = useCart();
  const [actingItemId, setActingItemId] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    refresh().catch(() => {
      toast.error("Не удалось загрузить корзину");
    });
  }, [refresh]);

  const totalLabel = useMemo(() => cart.total.toLocaleString("ru-RU"), [cart.total]);

  const changeQuantity = async (itemId: number, nextQuantity: number) => {
    if (nextQuantity < 1) return;
    setActingItemId(itemId);
    try {
      await update(itemId, nextQuantity);
      toast.success("Количество обновлено");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : null;
      toast.error(typeof msg === "string" ? msg : "Не удалось обновить количество");
    } finally {
      setActingItemId(null);
    }
  };

  const removeItem = async (itemId: number) => {
    setActingItemId(itemId);
    try {
      await remove(itemId);
      toast.success("Позиция удалена");
    } catch {
      toast.error("Не удалось удалить позицию");
    } finally {
      setActingItemId(null);
    }
  };

  const clearAll = async () => {
    setClearing(true);
    try {
      await clear();
      toast.success("Корзина очищена");
    } catch {
      toast.error("Не удалось очистить корзину");
    } finally {
      setClearing(false);
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
          <nav className="app-nav" aria-label="Навигация корзины">
            <Link to="/catalog">Каталог</Link>
            <Link to="/client">Мои заказы</Link>
          </nav>
        </div>
      </header>

      <main className="app-page">
        <section className="app-hero">
          <div>
            <div className="app-kicker">Корзина</div>
            <h1 className="app-title">Корзина запчастей</h1>
            <p className="app-subtitle">Проверьте позиции и оформите заказ.</p>
          </div>
          <div className="app-actions">
            <button
              type="button"
              onClick={clearAll}
              disabled={loading || clearing || cart.items.length === 0}
              className="app-btn-secondary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {clearing ? "Очистка…" : "Очистить корзину"}
            </button>
          </div>
        </section>

        {loading && (
          <p className="text-[color:var(--steel-light)] text-center mt-8">Загрузка…</p>
        )}

        {!loading && cart.items.length === 0 && (
          <div className="app-card text-center app-section">
            <h2 className="app-section-title">Корзина пуста</h2>
            <p className="app-section-note">Добавьте запчасти из каталога, чтобы оформить заказ.</p>
            <Link to="/catalog" className="app-btn-primary mt-4">Перейти в каталог</Link>
          </div>
        )}

        {!loading && cart.items.length > 0 && (
          <section className="app-section space-y-3">
            {cart.items.map((item) => (
              <article key={item.id} className="app-product-card">
                <p className="app-product-title">{item.part_name}</p>
                <p className="app-product-meta">Артикул: {item.article}</p>
                <p className="app-product-meta">Бренд: {item.part_brand}</p>
                <p className="app-product-meta">Категория: {item.category}</p>
                <p className="app-product-meta mt-2">
                  Цена: {item.unit_price.toLocaleString("ru-RU")} ₽
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    className="app-btn-ghost"
                    disabled={actingItemId === item.id || item.quantity <= 1}
                    onClick={() => changeQuantity(item.id, item.quantity - 1)}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      if (Number.isFinite(next) && next >= 1) {
                        void changeQuantity(item.id, next);
                      }
                    }}
                    className="app-input w-20 text-center"
                  />
                  <button
                    type="button"
                    className="app-btn-ghost"
                    disabled={actingItemId === item.id}
                    onClick={() => changeQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="app-btn-ghost text-red-400 hover:text-red-300 ml-auto"
                    disabled={actingItemId === item.id}
                    onClick={() => removeItem(item.id)}
                  >
                    Удалить
                  </button>
                </div>
                <p className="app-product-meta mt-2">
                  Подытог: {item.subtotal.toLocaleString("ru-RU")} ₽
                </p>
              </article>
            ))}

            <div className="app-card">
              <div className="flex items-center justify-between">
                <p className="app-section-title">Итого</p>
                <p className="text-xl font-semibold text-[color:var(--ink-light)]">{totalLabel} ₽</p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/checkout")}
                disabled={cart.items.length === 0}
                className="app-btn-primary w-full mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Оформить заказ
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
