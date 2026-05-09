import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getAdminOrder, updateAdminOrderStatus } from "../services/adminOrders";
import type { AdminOrderDetailResponse } from "../types/admin";
import type { OrderStatus } from "../types/order";

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

export default function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AdminOrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [draftStatus, setDraftStatus] = useState<OrderStatus>("waiting_courier");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    const id = Number(orderId);
    if (!Number.isFinite(id)) {
      setLoading(false);
      return;
    }
    getAdminOrder(id)
      .then((res) => {
        setData(res);
        setDraftStatus(res.order.status);
      })
      .catch((err: unknown) => {
        const status = err && typeof err === "object" && "response" in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
        if (status === 403) {
          toast.error("Доступ только для администратора");
          navigate("/", { replace: true });
          return;
        }
        toast.error("Не удалось загрузить заказ");
      })
      .finally(() => setLoading(false));
  }, [orderId, navigate]);

  const saveStatus = async () => {
    if (!data) return;
    setActing(true);
    try {
      const updated = await updateAdminOrderStatus(data.order.id, draftStatus);
      setData(updated);
      setDraftStatus(updated.order.status);
      toast.success("Статус обновлен");
    } catch (err: unknown) {
      const detail = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined;
      toast.error(typeof detail === "string" ? detail : "Не удалось обновить статус");
    } finally {
      setActing(false);
    }
  };

  if (loading) return <div className="auth-shell text-[color:var(--steel-light)]">Загрузка…</div>;
  if (!data) return <div className="auth-shell text-[color:var(--steel-light)]">Заказ не найден</div>;

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-topbar-inner">
          <Link to="/admin" className="app-brand" aria-label="Саха Запчасти">
            <span className="app-brand-mark">СЗ</span>
            САХА ЗАПЧАСТИ
          </Link>
          <nav className="app-nav" aria-label="Навигация админа">
            <Link to="/admin">К списку заказов</Link>
          </nav>
        </div>
      </header>

      <main className="app-page">
        <section className="app-hero">
          <div>
            <div className="app-kicker">Админка</div>
            <h1 className="app-title">Заказ #{data.order.id}</h1>
            <p className="app-subtitle">Детали заказа и ручное управление статусом.</p>
          </div>
        </section>

        <section className="app-card app-section">
          <h2 className="app-section-title">Клиент</h2>
          <p className="app-section-note mt-2">
            {data.client.username} · {data.client.email}{data.client.phone ? ` · ${data.client.phone}` : ""}
          </p>
        </section>

        <section className="app-card app-section">
          <h2 className="app-section-title">Заказ</h2>
          <p className="app-section-note mt-2">Статус: {data.order.status}</p>
          <p className="app-section-note">Статус оплаты: {data.order.payment_status}</p>
          <p className="app-section-note">
            Итого: {data.order.total_price != null ? `${data.order.total_price.toLocaleString("ru-RU")} ₽` : "—"}
          </p>
          <p className="app-section-note">
            Создан: {new Date(data.order.created_at).toLocaleString("ru-RU")}
          </p>
          <div className="flex gap-2 mt-3">
            <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value as OrderStatus)} className="app-input">
              {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <button type="button" disabled={acting} onClick={() => void saveStatus()} className="app-btn-secondary disabled:opacity-60">
              Сохранить статус
            </button>
          </div>
        </section>

        <section className="app-section space-y-2">
          <h2 className="app-section-title">Позиции заказа</h2>
          {data.order.items.length === 0 && (
            <div className="app-card">
              <p className="app-section-note">Позиции отсутствуют</p>
            </div>
          )}
          {data.order.items.map((item) => (
            <article key={item.id} className="app-product-card">
              <p className="app-product-title">{item.part_name_snapshot}</p>
              <p className="app-product-meta">{item.part_brand_snapshot} · {item.part_article_snapshot}</p>
              <p className="app-product-meta">{item.quantity} x {item.unit_price_snapshot.toLocaleString("ru-RU")} ₽</p>
              <p className="app-product-meta">Subtotal: {item.subtotal.toLocaleString("ru-RU")} ₽</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
