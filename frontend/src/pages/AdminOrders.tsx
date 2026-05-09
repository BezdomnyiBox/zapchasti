import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getAdminOrders, updateAdminOrderStatus } from "../services/adminOrders";
import type { AdminOrderListItem } from "../types/admin";
import type { OrderStatus, PaymentStatus } from "../types/order";

const STATUS_OPTIONS: OrderStatus[] = [
  "waiting_courier",
  "courier_assigned",
  "photo_uploaded",
  "confirmed",
  "picked_up",
  "handed_to_carrier",
  "completed",
  "cancelled",
];
const PAYMENT_OPTIONS: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];
const STATUS_LABELS: Record<OrderStatus, string> = {
  waiting_courier: "Ожидает курьера",
  courier_assigned: "Курьер назначен",
  photo_uploaded: "Фото загружены",
  confirmed: "Подтвержден",
  picked_up: "Забран",
  handed_to_carrier: "Передан перевозчику",
  completed: "Завершен",
  cancelled: "Отменен",
};
const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  failed: "Ошибка оплаты",
  refunded: "Возврат",
};

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AdminOrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const [statusDrafts, setStatusDrafts] = useState<Record<number, OrderStatus>>({});

  const canPrev = offset > 0;
  const canNext = offset + limit < total;
  const titleTotal = useMemo(() => `${total}`, [total]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminOrders({
        status: (status || undefined) as OrderStatus | undefined,
        payment_status: (paymentStatus || undefined) as PaymentStatus | undefined,
        search: search.trim() || undefined,
        offset,
        limit,
      });
      setItems(data.items);
      setTotal(data.total);
      setStatusDrafts(
        Object.fromEntries(data.items.map((item) => [item.id, item.status])) as Record<number, OrderStatus>,
      );
    } catch (err: unknown) {
      const statusCode = err && typeof err === "object" && "response" in err
        ? (err as { response?: { status?: number } }).response?.status
        : undefined;
      if (statusCode === 403) {
        toast.error("Доступ только для администратора");
        navigate("/", { replace: true });
        return;
      }
      toast.error("Не удалось загрузить список заказов");
    } finally {
      setLoading(false);
    }
  }, [limit, navigate, offset, paymentStatus, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyFilters = () => {
    if (offset === 0) {
      void load();
      return;
    }
    setOffset(0);
  };

  const updateStatus = async (orderId: number) => {
    const nextStatus = statusDrafts[orderId];
    if (!nextStatus) return;
    try {
      await updateAdminOrderStatus(orderId, nextStatus);
      toast.success("Статус обновлен");
      await load();
    } catch (err: unknown) {
      const detail = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined;
      toast.error(typeof detail === "string" ? detail : "Не удалось обновить статус");
    }
  };

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-topbar-inner">
          <Link to="/admin" className="app-brand" aria-label="Саха Запчасти">
            <span className="app-brand-mark">СЗ</span>
            САХА ЗАПЧАСТИ
          </Link>
          <nav className="app-nav" aria-label="Навигация админа">
            <Link to="/admin">Админка</Link>
            <Link to="/profile">Профиль</Link>
          </nav>
        </div>
      </header>

      <main className="app-page">
        <section className="app-hero">
          <div>
            <div className="app-kicker">Админка</div>
            <h1 className="app-title">Заказы ({titleTotal})</h1>
            <p className="app-subtitle">Просмотр заказов, фильтры и смена статусов.</p>
          </div>
        </section>

        <section className="app-form-card app-section">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="app-input">
              <option value="">Все статусы заказа</option>
              {STATUS_OPTIONS.map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}
            </select>
            <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="app-input">
              <option value="">Все статусы оплаты</option>
              {PAYMENT_OPTIONS.map((value) => <option key={value} value={value}>{PAYMENT_LABELS[value]}</option>)}
            </select>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="app-input"
              placeholder="ID, email, телефон"
            />
            <button type="button" onClick={applyFilters} className="app-btn-primary">Применить</button>
          </div>
        </section>

        {loading && <p className="text-[color:var(--steel-light)] text-center mt-8">Загрузка…</p>}

        {!loading && items.length === 0 && (
          <div className="app-card text-center app-section">
            <h2 className="app-section-title">Заказы не найдены</h2>
          </div>
        )}

        <section className="app-section space-y-3">
          {items.map((item) => (
            <article key={item.id} className="app-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="app-section-title">Заказ #{item.id}</h3>
                <Link to={`/admin/orders/${item.id}`} className="app-btn-ghost">Открыть детали</Link>
              </div>
              <p className="app-section-note mt-2">
                Клиент: {item.client.username} · {item.client.email}{item.client.phone ? ` · ${item.client.phone}` : ""}
              </p>
              <p className="app-section-note">
                Сумма: {item.total_price != null ? `${item.total_price.toLocaleString("ru-RU")} ₽` : "—"}
              </p>
              <p className="app-section-note">
                Создан: {new Date(item.created_at).toLocaleString("ru-RU")}
              </p>
              <p className="app-section-note">
                Статус оплаты: {PAYMENT_LABELS[item.payment_status]}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <select
                  value={statusDrafts[item.id] ?? item.status}
                  onChange={(e) => setStatusDrafts((prev) => ({ ...prev, [item.id]: e.target.value as OrderStatus }))}
                  className="app-input"
                >
                  {STATUS_OPTIONS.map((value) => (
                    <option key={value} value={value}>{STATUS_LABELS[value]}</option>
                  ))}
                </select>
                <button type="button" className="app-btn-secondary" onClick={() => void updateStatus(item.id)}>
                  Сменить статус
                </button>
              </div>
            </article>
          ))}
        </section>

        <section className="app-section flex gap-2">
          <button type="button" disabled={!canPrev} onClick={() => setOffset((v) => Math.max(0, v - limit))} className="app-btn-ghost disabled:opacity-60">
            Назад
          </button>
          <button type="button" disabled={!canNext} onClick={() => setOffset((v) => v + limit)} className="app-btn-ghost disabled:opacity-60">
            Вперед
          </button>
        </section>
      </main>
    </div>
  );
}
