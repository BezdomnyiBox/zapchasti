import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import AppHeader from "../components/AppHeader";
import { getOrders } from "../services/orders";
import type { OrderListItem, OrderStatus } from "../types/order";
import { ORDER_STATUS_BADGE_CLASS, ORDER_STATUS_LABELS } from "../constants/orderStatus";

export default function ClientOrders() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch(() => toast.error("Не удалось загрузить заказы"))
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(
    () => [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [orders],
  );

  return (
    <div className="app-shell">
      <AppHeader />

      <main className="app-page">
        <section className="app-hero">
          <div>
            <div className="app-kicker">Клиент</div>
            <h1 className="app-title">Мои заказы</h1>
            <p className="app-subtitle">
              Все заявки и заказы из каталога. Откройте карточку, чтобы увидеть детали, оплату и фото.
            </p>
          </div>
          <div className="app-actions">
            <Link to="/catalog" className="app-btn-secondary">
              Каталог
            </Link>
            <Link to="/client/new" className="app-btn-primary">
              Новый заказ
            </Link>
          </div>
        </section>

        {loading && (
          <p className="mt-10 text-center text-[color:var(--steel-light)]">Загрузка заказов…</p>
        )}

        {!loading && sorted.length === 0 && (
          <div className="app-card text-center app-section">
            <h2 className="font-display text-xl font-semibold">Заказов пока нет</h2>
            <p className="mt-2 text-sm text-[color:var(--steel-light)]">
              Оформите заказ из каталога или создайте заявку вручную.
            </p>
            <div className="app-actions justify-center mt-5">
              <Link to="/catalog" className="app-btn-primary">
                Перейти в каталог
              </Link>
              <Link to="/client/new" className="app-btn-secondary">
                Создать заказ
              </Link>
            </div>
          </div>
        )}

        {!loading && sorted.length > 0 && (
          <section className="app-section">
            <div className="app-grid app-grid-2">
              {sorted.map((order) => (
                <Link
                  key={order.id}
                  to={`/client/orders/${order.id}`}
                  className="app-card app-card-link text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base font-semibold text-[color:var(--ink)]">
                        Заказ #{order.id} — {order.part_name || order.drom_url || "Запчасть"}
                      </p>
                      {order.total_price != null && (
                        <p className="mt-1 text-sm text-[color:var(--steel-light)]">
                          {order.total_price.toLocaleString("ru-RU")} ₽
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_BADGE_CLASS[order.status as OrderStatus]}`}
                    >
                      {ORDER_STATUS_LABELS[order.status as OrderStatus]}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-[color:var(--steel-light)]">
                    {new Date(order.created_at).toLocaleString("ru-RU")}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
