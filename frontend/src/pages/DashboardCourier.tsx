import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import AppHeader from "../components/AppHeader";
import {
  acceptOrder,
  getAvailableOrders,
  getMyOrders,
  handoffToCarrier,
  markPhotosDone,
  markPickedUp,
  uploadPhoto,
} from "../services/courier";
import { getOrder } from "../services/orders";
import type { Order, OrderListItem, OrderStatus } from "../types/order";

type Tab = "available" | "my";
const STATUS_LABELS: Record<OrderStatus, string> = {
  waiting_courier: "Ожидает курьера",
  courier_assigned: "Назначен",
  photo_uploaded: "Фото отправлены",
  confirmed: "Подтвержден",
  picked_up: "Забрана",
  handed_to_carrier: "Передано",
  completed: "Завершен",
  cancelled: "Отменен",
};

export default function DashboardCourier() {
  const [tab, setTab] = useState<Tab>("available");
  const [available, setAvailable] = useState<OrderListItem[]>([]);
  const [myOrders, setMyOrders] = useState<OrderListItem[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [detail, setDetail] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [a, m] = await Promise.all([getAvailableOrders(), getMyOrders()]);
      setAvailable(a);
      setMyOrders(m);
    } catch {
      toast.error("Не удалось загрузить заказы курьера");
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
  const onPhotosDone = (id: number) => withAction(async () => {
    await markPhotosDone(id);
    toast.success("Фото отправлены клиенту");
  });
  const onPickedUp = (id: number) => withAction(async () => {
    await markPickedUp(id);
    toast.success("Запчасть забрана");
  });
  const onHandoff = (id: number) => withAction(async () => {
    await handoffToCarrier(id);
    toast.success("Передано перевозчику");
  });

  const onUploadPhoto = async (orderId: number, file: File) => {
    setActing(true);
    try {
      await uploadPhoto(orderId, file);
      toast.success("Фото загружено");
      setDetail(await getOrder(orderId));
    } catch {
      toast.error("Не удалось загрузить фото");
    } finally {
      setActing(false);
    }
  };

  const list = tab === "available" ? available : myOrders;

  return (
    <div className="app-shell">
      <AppHeader />

      <main className="app-page">
        <section className="app-hero">
          <div>
            <div className="app-kicker">Курьер</div>
            <h1 className="app-title">Панель курьера</h1>
            <p className="app-subtitle">Принимайте заказы, загружайте фото и передавайте перевозчику.</p>
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
                  <p className="app-section-title">#{order.id} — {order.part_name || order.drom_url || "Запчасть"}</p>
                  <p className="app-section-note">{STATUS_LABELS[order.status]}</p>
                </button>
                {order.total_price != null && (
                  <p className="font-semibold text-[color:var(--ink-light)]">{order.total_price.toLocaleString("ru-RU")} ₽</p>
                )}
              </div>

              {expanded === order.id && detail && (
                <div className="mt-3 space-y-1">
                  {detail.seller_address && <p className="app-section-note">Продавец: {detail.seller_address}</p>}
                  {detail.delivery_address && <p className="app-section-note">Доставка: {detail.delivery_address}</p>}
                  {detail.description && <p className="app-section-note">{detail.description}</p>}
                  {detail.photos.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {detail.photos.map((photo) => (
                        <img key={photo.id} src={photo.file_url} alt="" className="h-16 w-16 object-cover rounded-lg" />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                {tab === "available" && order.status === "waiting_courier" && (
                  <button type="button" className="app-btn-secondary" disabled={acting} onClick={() => void onAccept(order.id)}>
                    Принять заказ
                  </button>
                )}
                {order.status === "courier_assigned" && (
                  <>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void onUploadPhoto(order.id, file);
                        event.target.value = "";
                      }}
                    />
                    <button type="button" className="app-btn-ghost" disabled={acting} onClick={() => fileRef.current?.click()}>
                      Загрузить фото
                    </button>
                    <button type="button" className="app-btn-secondary" disabled={acting} onClick={() => void onPhotosDone(order.id)}>
                      Фото готовы
                    </button>
                  </>
                )}
                {order.status === "confirmed" && (
                  <button type="button" className="app-btn-secondary" disabled={acting} onClick={() => void onPickedUp(order.id)}>
                    Забрал запчасть
                  </button>
                )}
                {order.status === "picked_up" && (
                  <button type="button" className="app-btn-secondary" disabled={acting} onClick={() => void onHandoff(order.id)}>
                    Передал перевозчику
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
