import { useEffect, useState, useContext, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import { getSelectionTasks, getPickupTasks, getDeliveryTasks, updateSelectionTask, updatePickupTask, updateDeliveryTask } from "../services/tasks";
import { getOrders } from "../services/orders";
import type { SelectionTask, PickupTask, DeliveryTask, OrderListItem, TaskStatus } from "../types/order";

type Tab = "orders" | "selection" | "pickup" | "delivery";

const TASK_LABELS: Record<TaskStatus, string> = {
  pending: "Ожидает",
  in_progress: "В работе",
  waiting_client: "Ждёт клиента",
  approved: "Подтверждён",
  rejected: "Отклонён",
  completed: "Завершён",
  cancelled: "Отменён",
};

const TASK_COLORS: Record<TaskStatus, string> = {
  pending: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  waiting_client: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
};

export default function DashboardPicker() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [selTasks, setSelTasks] = useState<SelectionTask[]>([]);
  const [pickTasks, setPickTasks] = useState<PickupTask[]>([]);
  const [delTasks, setDelTasks] = useState<DeliveryTask[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [o, s, p, d] = await Promise.all([
        getOrders(),
        getSelectionTasks(),
        getPickupTasks(),
        getDeliveryTasks(),
      ]);
      setOrders(o);
      setSelTasks(s);
      setPickTasks(p);
      setDelTasks(d);
    } catch {
      toast.error("Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const takeTask = async (type: "selection" | "pickup" | "delivery", id: number) => {
    try {
      const fn = type === "selection" ? updateSelectionTask : type === "pickup" ? updatePickupTask : updateDeliveryTask;
      await fn(id, { status: "in_progress" });
      toast.success("Задача взята");
      refresh();
    } catch {
      toast.error("Ошибка");
    }
  };

  const completeTask = async (type: "selection" | "pickup" | "delivery", id: number) => {
    try {
      const fn = type === "selection" ? updateSelectionTask : type === "pickup" ? updatePickupTask : updateDeliveryTask;
      await fn(id, { status: "completed" });
      toast.success("Задача завершена");
      refresh();
    } catch {
      toast.error("Ошибка");
    }
  };

  const tabCls = (active: boolean) =>
    `px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
      active
        ? "bg-slate-700 text-white dark:bg-slate-500"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
    }`;

  const actionBtn = "px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Панель подборщика</h1>
          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition"
            >
              Профиль
            </Link>
            <span className="text-sm text-slate-500 dark:text-slate-400">{auth?.user?.username}</span>
            <button
              onClick={() => { auth?.logout(); navigate("/login", { replace: true }); }}
              className="text-sm text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex gap-2 flex-wrap mb-6">
          <button className={tabCls(tab === "orders")} onClick={() => setTab("orders")}>
            Заказы ({orders.length})
          </button>
          <button className={tabCls(tab === "selection")} onClick={() => setTab("selection")}>
            Подбор ({selTasks.length})
          </button>
          <button className={tabCls(tab === "pickup")} onClick={() => setTab("pickup")}>
            Забор ({pickTasks.length})
          </button>
          <button className={tabCls(tab === "delivery")} onClick={() => setTab("delivery")}>
            Доставка ({delTasks.length})
          </button>
        </div>

        {loading && <p className="text-slate-500 text-center mt-8">Загрузка…</p>}

        {!loading && tab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 && <p className="text-slate-500 text-center">Нет заказов</p>}
            {orders.map((o) => (
              <div
                key={o.id}
                onClick={() => navigate(`/client/orders/${o.id}`)}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 cursor-pointer hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800 dark:text-slate-100">#{o.id}</span>
                  <span className="text-xs text-slate-500">{o.status}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {o.items_count} {o.items_count === 1 ? "позиция" : o.items_count < 5 ? "позиции" : "позиций"}
                </p>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "selection" && (
          <div className="space-y-3">
            {selTasks.length === 0 && <p className="text-slate-500 text-center">Нет задач на подбор</p>}
            {selTasks.map((t) => (
              <div key={t.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-800 dark:text-slate-100">Позиция #{t.order_item_id}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${TASK_COLORS[t.status]}`}>
                    {TASK_LABELS[t.status]}
                  </span>
                </div>
                {t.note && <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{t.note}</p>}
                <div className="flex gap-2 mt-2">
                  {t.status === "pending" && (
                    <button className={`${actionBtn} bg-blue-600 text-white hover:bg-blue-500`} onClick={() => takeTask("selection", t.id)}>
                      Взять
                    </button>
                  )}
                  {t.status === "in_progress" && (
                    <button className={`${actionBtn} bg-green-600 text-white hover:bg-green-500`} onClick={() => completeTask("selection", t.id)}>
                      Завершить
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "pickup" && (
          <div className="space-y-3">
            {pickTasks.length === 0 && <p className="text-slate-500 text-center">Нет задач на забор</p>}
            {pickTasks.map((t) => (
              <div key={t.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-800 dark:text-slate-100">Позиция #{t.order_item_id}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${TASK_COLORS[t.status]}`}>
                    {TASK_LABELS[t.status]}
                  </span>
                </div>
                {t.seller_address && <p className="text-sm text-slate-600 dark:text-slate-400">Адрес: {t.seller_address}</p>}
                {t.note && <p className="text-sm text-slate-600 dark:text-slate-400">{t.note}</p>}
                <div className="flex gap-2 mt-2">
                  {t.status === "pending" && (
                    <button className={`${actionBtn} bg-blue-600 text-white hover:bg-blue-500`} onClick={() => takeTask("pickup", t.id)}>
                      Взять
                    </button>
                  )}
                  {t.status === "in_progress" && (
                    <button className={`${actionBtn} bg-green-600 text-white hover:bg-green-500`} onClick={() => completeTask("pickup", t.id)}>
                      Завершить
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "delivery" && (
          <div className="space-y-3">
            {delTasks.length === 0 && <p className="text-slate-500 text-center">Нет задач на доставку</p>}
            {delTasks.map((t) => (
              <div key={t.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-800 dark:text-slate-100">Позиция #{t.order_item_id}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${TASK_COLORS[t.status]}`}>
                    {TASK_LABELS[t.status]}
                  </span>
                </div>
                {t.delivery_address && <p className="text-sm text-slate-600 dark:text-slate-400">Адрес: {t.delivery_address}</p>}
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t.is_third_party_carrier ? "Сторонний перевозчик" : "Наша доставка"}
                </p>
                <div className="flex gap-2 mt-2">
                  {t.status === "pending" && (
                    <button className={`${actionBtn} bg-blue-600 text-white hover:bg-blue-500`} onClick={() => takeTask("delivery", t.id)}>
                      Взять
                    </button>
                  )}
                  {t.status === "in_progress" && (
                    <button className={`${actionBtn} bg-green-600 text-white hover:bg-green-500`} onClick={() => completeTask("delivery", t.id)}>
                      Завершить
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
