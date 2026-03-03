import { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getOrders } from "../services/orders";
import type { OrderListItem, OrderStatus } from "../types/order";

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Новый",
  selection: "Подбор",
  pickup: "Забор",
  delivery: "Доставка",
  closed: "Завершён",
  cancelled: "Отменён",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  selection: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  pickup: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  delivery: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  closed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
};

export default function DashboardClient() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Мои заявки</h1>
          <div className="flex items-center gap-3">
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

      <main className="mx-auto max-w-3xl px-4 py-6">
        <Link
          to="/client/new"
          className="mb-6 inline-flex items-center gap-2 py-2.5 px-5 rounded-xl font-medium text-white bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 transition"
        >
          + Новая заявка
        </Link>

        {loading && (
          <p className="text-slate-500 dark:text-slate-400 mt-8 text-center">Загрузка…</p>
        )}

        {!loading && orders.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-2">Заявок пока нет</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">Создайте первую заявку, чтобы начать</p>
          </div>
        )}

        <div className="space-y-3 mt-4">
          {orders.map((o) => (
            <Link
              key={o.id}
              to={`/client/orders/${o.id}`}
              className="block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                    Заявка #{o.id}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {o.drom_url || o.description || "—"}
                  </p>
                </div>
                <span className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[o.status]}`}>
                  {STATUS_LABELS[o.status]}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                {new Date(o.created_at).toLocaleString("ru-RU")}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
