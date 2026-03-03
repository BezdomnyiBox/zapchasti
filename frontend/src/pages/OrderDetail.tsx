import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getOrder } from "../services/orders";
import type { Order, OrderStatus, TaskStatus } from "../types/order";

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Новый",
  selection: "Подбор",
  pickup: "Забор",
  delivery: "Доставка",
  closed: "Завершён",
  cancelled: "Отменён",
};

const TASK_LABELS: Record<TaskStatus, string> = {
  pending: "Ожидает",
  in_progress: "В работе",
  waiting_client: "Ждёт подтверждения",
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

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    getOrder(parseInt(orderId))
      .then(setOrder)
      .catch(() => toast.error("Заказ не найден"))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-500">
        Загрузка…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <p className="text-slate-500">Заказ не найден</p>
      </div>
    );
  }

  const sectionCls = "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => navigate("/client")}
          className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition mb-4"
        >
          &larr; Назад к заявкам
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
            Заявка #{order.id}
          </h1>
          <span className="px-3 py-1 rounded-lg text-sm font-medium bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        <div className="space-y-4">
          <div className={sectionCls}>
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Детали</h2>
            <dl className="space-y-2 text-sm">
              {order.drom_url && (
                <div className="flex gap-2">
                  <dt className="text-slate-500 dark:text-slate-400 shrink-0 w-28">Drom:</dt>
                  <dd>
                    <a
                      href={order.drom_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 underline break-all"
                    >
                      {order.drom_url}
                    </a>
                  </dd>
                </div>
              )}
              {order.description && (
                <div className="flex gap-2">
                  <dt className="text-slate-500 dark:text-slate-400 shrink-0 w-28">Описание:</dt>
                  <dd className="text-slate-800 dark:text-slate-200">{order.description}</dd>
                </div>
              )}
              {order.target_price != null && (
                <div className="flex gap-2">
                  <dt className="text-slate-500 dark:text-slate-400 shrink-0 w-28">Цена:</dt>
                  <dd className="text-slate-800 dark:text-slate-200">{order.target_price.toLocaleString("ru-RU")} ₽</dd>
                </div>
              )}
              {order.comment && (
                <div className="flex gap-2">
                  <dt className="text-slate-500 dark:text-slate-400 shrink-0 w-28">Комментарий:</dt>
                  <dd className="text-slate-800 dark:text-slate-200">{order.comment}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="text-slate-500 dark:text-slate-400 shrink-0 w-28">Предоплата:</dt>
                <dd className="text-slate-800 dark:text-slate-200">{order.prepaid_to_seller ? "Да" : "Нет"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-slate-500 dark:text-slate-400 shrink-0 w-28">Создан:</dt>
                <dd className="text-slate-800 dark:text-slate-200">{new Date(order.created_at).toLocaleString("ru-RU")}</dd>
              </div>
            </dl>
          </div>

          {/* Selection task */}
          {order.selection_task && (
            <div className={sectionCls}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Подбор</h2>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${TASK_COLORS[order.selection_task.status]}`}>
                  {TASK_LABELS[order.selection_task.status]}
                </span>
              </div>
              {order.selection_task.note && (
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{order.selection_task.note}</p>
              )}
              {order.selection_task.photos.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {order.selection_task.photos.map((p) => (
                    <a key={p.id} href={p.file_url} target="_blank" rel="noopener noreferrer">
                      <img src={p.file_url} alt="" className="h-20 w-20 object-cover rounded-lg border border-slate-200 dark:border-slate-600" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pickup task */}
          {order.pickup_task && (
            <div className={sectionCls}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Забор</h2>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${TASK_COLORS[order.pickup_task.status]}`}>
                  {TASK_LABELS[order.pickup_task.status]}
                </span>
              </div>
              {order.pickup_task.seller_address && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Адрес: {order.pickup_task.seller_address}</p>
              )}
              {order.pickup_task.note && (
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{order.pickup_task.note}</p>
              )}
              {order.pickup_task.photos.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {order.pickup_task.photos.map((p) => (
                    <a key={p.id} href={p.file_url} target="_blank" rel="noopener noreferrer">
                      <img src={p.file_url} alt="" className="h-20 w-20 object-cover rounded-lg border border-slate-200 dark:border-slate-600" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Delivery task */}
          {order.delivery_task && (
            <div className={sectionCls}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Доставка</h2>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${TASK_COLORS[order.delivery_task.status]}`}>
                  {TASK_LABELS[order.delivery_task.status]}
                </span>
              </div>
              {order.delivery_task.delivery_address && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Адрес: {order.delivery_task.delivery_address}</p>
              )}
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Перевозчик: {order.delivery_task.is_third_party_carrier ? "Сторонний" : "Наш"}
              </p>
            </div>
          )}

          {/* All photos */}
          {order.photos.length > 0 && (
            <div className={sectionCls}>
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Все фото</h2>
              <div className="flex gap-2 flex-wrap">
                {order.photos.map((p) => (
                  <a key={p.id} href={p.file_url} target="_blank" rel="noopener noreferrer">
                    <img src={p.file_url} alt="" className="h-20 w-20 object-cover rounded-lg border border-slate-200 dark:border-slate-600" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
