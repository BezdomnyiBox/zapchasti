import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import AppHeader from "../components/AppHeader";
import {
  acceptOrder,
  getAvailableOrders,
  getMyOrders,
  markDelivered,
} from "../services/carrier";
import { getOrder } from "../services/orders";
import type { Order, OrderListItem, OrderStatus } from "../types/order";

type Tab = "available" | "my";
const STATUS_LABELS: Record<OrderStatus, string> = {
  waiting_courier: "Ожидает курьера",
  courier_assigned: "Курьер назначен",
  photo_uploaded: "Фото готовы",
  confirmed: "Подтвержден",
  picked_up: "У курьера",
  handed_to_carrier: "У перевозчика",
  completed: "Доставлен",
  cancelled: "Отменен",
};

export default function DashboardCarrier() {
  const [tab, setTab] = useState<Tab>("available");
  const [available, setAvailable] = useState<OrderListItem[]>([]);
  const [myOrders, setMyOrders] = useState<OrderListItem[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [detail, setDetail] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [a, m] = await Promise.all([getAvailableOrders(), getMyOrders()]);
      setAvailable(a);
      setMyOrders(m);
    } catch {
      toast.error("Не удалось загрузить заказы перевозчика");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const expandOrder = async (id: number) => {
    if (expanded === id) {
      setExpanded(null);
      setDetail(null);
      return;
    }
    setExpanded(id);
    try {
      setDetail(await getOrder(id));
    } catch {
      toast.error("Не удалось открыть детали заказа");
    }
  };

  const withAction = async (fn: () => Promise<void>) => {
    setActing(true);
    try {
      await fn();
      await refresh();
    } finally {
      setActing(false);
    }
  };

  const onAccept = (id: number) => withAction(async () => {
    await acceptOrder(id);
    toast.success("Заказ принят");
  });
  const onDelivered = (id: number) => withAction(async () => {
    await markDelivered(id);
    toast.success("Доставка подтверждена");
  });

  const list = tab === "available" ? available : myOrders;

  return (
    <div className="app-shell">
      <AppHeader />

      <main className="app-page">
        <section className="app-hero">
          <div>
            <div className="app-kicker">Перевозчик</div>
            <h1 className="app-title">Панель перевозчика</h1>
            <p className="app-subtitle">Принимайте переданные заказы и отмечайте доставку.</p>
          </div>
        </section>

        <section className="app-form-card app-section">
          <div className="flex gap-2 flex-wrap">
            <button type="button" className={tab === "available" ? "app-btn-primary" : "app-btn-ghost"} onClick={() => setTab("available")}>
              Доступные ({available.length})
            </button>
            <button type="button" className={tab === "my" ? "app-btn-primary" : "app-btn-ghost"} onClick={() => setTab("my")}>
              Мои ({myOrders.length})
            </button>
          </div>
        </section>

        {loading && <p className="text-[color:var(--steel-light)] text-center mt-8">Загрузка…</p>}
        {!loading && list.length === 0 && (
          <div className="app-card text-center app-section">
            <h2 className="app-section-title">Заказов нет</h2>
          </div>
        )}

        <section className="app-section space-y-3">
          {list.map((order) => (
            <article key={order.id} className="app-card">
              <div className="flex items-center justify-between gap-3">
                <button type="button" className="text-left" onClick={() => void expandOrder(order.id)}>
                  <p className="app-section-title">#{order.id} — {order.part_name || "Запчасть"}</p>
                  <p className="app-section-note">{STATUS_LABELS[order.status]}</p>
                </button>
                {order.total_price != null && (
                  <p className="font-semibold text-[color:var(--ink-light)]">{order.total_price.toLocaleString("ru-RU")} ₽</p>
                )}
              </div>

              {expanded === order.id && detail && (
                <div className="mt-3 space-y-1">
                  {detail.delivery_address && <p className="app-section-note">Адрес доставки: {detail.delivery_address}</p>}
                  {detail.seller_address && <p className="app-section-note">Откуда: {detail.seller_address}</p>}
                  {detail.description && <p className="app-section-note">{detail.description}</p>}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                {tab === "available" && order.status === "handed_to_carrier" && (
                  <button type="button" className="app-btn-secondary" disabled={acting} onClick={() => void onAccept(order.id)}>
                    Принять заказ
                  </button>
                )}
                {tab === "my" && order.status === "handed_to_carrier" && (
                  <button type="button" className="app-btn-secondary" disabled={acting} onClick={() => void onDelivered(order.id)}>
                    Доставлено
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
