import { useEffect, useState, useContext, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import {
  getAvailableOrders,
  getMyOrders,
  acceptOrder,
  uploadPhoto,
  markPhotosDone,
  markPickedUp,
  handoffToCarrier,
} from "../services/courier";
import { getOrder } from "../services/orders";
import type { OrderListItem, Order, OrderStatus } from "../types/order";

type Tab = "available" | "my";

const STATUS_LABELS: Record<OrderStatus, string> = {
  waiting_courier: "Ожидает курьера",
  courier_assigned: "Назначен",
  photo_uploaded: "Фото отправлены",
  confirmed: "Подтверждён",
  picked_up: "Забрана",
  handed_to_carrier: "Передано",
  completed: "Завершён",
  cancelled: "Отменён",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  waiting_courier: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  courier_assigned: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  photo_uploaded: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  picked_up: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  handed_to_carrier: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
};

export default function DashboardCourier() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("available");
  const [available, setAvailable] = useState<OrderListItem[]>([]);
  const [myOrders, setMyOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const [expanded, setExpanded] = useState<number | null>(null);
  const [detail, setDetail] = useState<Order | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [a, m] = await Promise.all([getAvailableOrders(), getMyOrders()]);
      setAvailable(a);
      setMyOrders(m);
    } catch { toast.error("Ошибка загрузки"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const expandOrder = async (id: number) => {
    if (expanded === id) { setExpanded(null); setDetail(null); return; }
    setExpanded(id);
    try { setDetail(await getOrder(id)); }
    catch { toast.error("Ошибка"); }
  };

  const handleAccept = async (id: number) => {
    setActing(true);
    try { await acceptOrder(id); toast.success("Заказ принят"); refresh(); }
    catch { toast.error("Ошибка"); }
    finally { setActing(false); }
  };

  const handleUploadPhoto = async (orderId: number, file: File) => {
    setActing(true);
    try {
      await uploadPhoto(orderId, file);
      toast.success("Фото загружено");
      setDetail(await getOrder(orderId));
    } catch { toast.error("Ошибка загрузки фото"); }
    finally { setActing(false); }
  };

  const handlePhotosDone = async (orderId: number) => {
    setActing(true);
    try { await markPhotosDone(orderId); toast.success("Фото отправлены клиенту"); refresh(); }
    catch { toast.error("Ошибка"); }
    finally { setActing(false); }
  };

  const handlePickedUp = async (orderId: number) => {
    setActing(true);
    try { await markPickedUp(orderId); toast.success("Запчасть забрана"); refresh(); }
    catch { toast.error("Ошибка"); }
    finally { setActing(false); }
  };

  const handleHandoff = async (orderId: number) => {
    setActing(true);
    try { await handoffToCarrier(orderId); toast.success("Передано перевозчику"); refresh(); }
    catch { toast.error("Ошибка"); }
    finally { setActing(false); }
  };

  const tabCls = (active: boolean) =>
    `px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
      active ? "bg-slate-700 text-white dark:bg-slate-500" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
    }`;

  const btnCls = "px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-60";

  const renderOrder = (o: OrderListItem, showAccept: boolean) => (
    <div key={o.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => expandOrder(o.id)}>
        <span className="font-medium text-slate-800 dark:text-slate-100">
          #{o.id} — {o.part_name || o.drom_url || "Запчасть"}
        </span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[o.status]}`}>
          {STATUS_LABELS[o.status]}
        </span>
      </div>
      {o.total_price != null && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{o.total_price.toLocaleString("ru-RU")} ₽</p>
      )}

      {/* Expanded detail */}
      {expanded === o.id && detail && (
        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-2 space-y-2 text-sm">
          {detail.seller_address && <p className="text-slate-600 dark:text-slate-400">Продавец: {detail.seller_address}</p>}
          {detail.delivery_address && <p className="text-slate-600 dark:text-slate-400">Доставка: {detail.delivery_address}</p>}
          {detail.description && <p className="text-slate-600 dark:text-slate-400">{detail.description}</p>}

          {detail.photos.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {detail.photos.map((p) => (
                <img key={p.id} src={p.file_url} alt="" className="h-16 w-16 object-cover rounded-lg border border-slate-200 dark:border-slate-600" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-3 flex-wrap">
        {showAccept && o.status === "waiting_courier" && (
          <button className={`${btnCls} bg-blue-600 text-white hover:bg-blue-500`} disabled={acting} onClick={() => handleAccept(o.id)}>
            Принять заказ
          </button>
        )}
        {o.status === "courier_assigned" && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUploadPhoto(o.id, f);
                e.target.value = "";
              }}
            />
            <button className={`${btnCls} bg-cyan-600 text-white hover:bg-cyan-500`} disabled={acting} onClick={() => fileRef.current?.click()}>
              Загрузить фото
            </button>
            <button className={`${btnCls} bg-amber-600 text-white hover:bg-amber-500`} disabled={acting} onClick={() => handlePhotosDone(o.id)}>
              Фото готовы
            </button>
          </>
        )}
        {o.status === "confirmed" && (
          <button className={`${btnCls} bg-orange-600 text-white hover:bg-orange-500`} disabled={acting} onClick={() => handlePickedUp(o.id)}>
            Забрал запчасть
          </button>
        )}
        {o.status === "picked_up" && (
          <button className={`${btnCls} bg-indigo-600 text-white hover:bg-indigo-500`} disabled={acting} onClick={() => handleHandoff(o.id)}>
            Передал перевозчику
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Панель курьера</h1>
          <div className="flex items-center gap-3">
            <Link to="/profile" className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition">Профиль</Link>
            <span className="text-sm text-slate-500 dark:text-slate-400">{auth?.user?.username}</span>
            <button onClick={() => { auth?.logout(); navigate("/login", { replace: true }); }} className="text-sm text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition">Выйти</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex gap-2 flex-wrap mb-6">
          <button className={tabCls(tab === "available")} onClick={() => setTab("available")}>
            Доступные ({available.length})
          </button>
          <button className={tabCls(tab === "my")} onClick={() => setTab("my")}>
            Мои заказы ({myOrders.length})
          </button>
        </div>

        {loading && <p className="text-slate-500 text-center mt-8">Загрузка…</p>}

        {!loading && tab === "available" && (
          <div className="space-y-3">
            {available.length === 0 && <p className="text-slate-500 text-center">Нет доступных заказов</p>}
            {available.map((o) => renderOrder(o, true))}
          </div>
        )}

        {!loading && tab === "my" && (
          <div className="space-y-3">
            {myOrders.length === 0 && <p className="text-slate-500 text-center">Нет ваших заказов</p>}
            {myOrders.map((o) => renderOrder(o, false))}
          </div>
        )}
      </main>
    </div>
  );
}
