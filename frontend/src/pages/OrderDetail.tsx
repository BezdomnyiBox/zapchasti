import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getOrder } from "../services/orders";
import type { Order, OrderItem, OrderStatus, TaskStatus, CargoSize } from "../types/order";

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

const STATUS_COLORS: Record<OrderStatus, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  selection: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  pickup: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  delivery: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  closed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
};

const CARGO_LABELS: Record<CargoSize, string> = {
  small: "Мелкая посылка",
  large: "Крупногабарит",
};

function ItemCard({ item, idx }: { item: OrderItem; idx: number }) {
  const sectionCls = "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5";
  const label = item.drom_url
    ? "Ссылка Drom"
    : [item.car_brand, item.car_model, item.car_year].filter(Boolean).join(" ") || item.part_name || "Позиция";

  return (
    <div className={sectionCls}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-slate-800 dark:text-slate-100">
          #{idx + 1} — {label}
        </h3>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[item.status]}`}>
          {STATUS_LABELS[item.status]}
        </span>
      </div>

      <dl className="space-y-1.5 text-sm mb-4">
        {item.drom_url && (
          <div className="flex gap-2">
            <dt className="text-slate-500 dark:text-slate-400 shrink-0 w-28">Drom:</dt>
            <dd>
              <a href={item.drom_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline break-all">
                {item.drom_url}
              </a>
            </dd>
          </div>
        )}
        {item.car_brand && (
          <div className="flex gap-2">
            <dt className="text-slate-500 dark:text-slate-400 shrink-0 w-28">Авто:</dt>
            <dd className="text-slate-800 dark:text-slate-200">
              {[item.car_brand, item.car_model, item.car_year].filter(Boolean).join(" ")}
            </dd>
          </div>
        )}
        {item.body_type && (
          <div className="flex gap-2">
            <dt className="text-slate-500 dark:text-slate-400 shrink-0 w-28">Кузов:</dt>
            <dd className="text-slate-800 dark:text-slate-200">{item.body_type}</dd>
          </div>
        )}
        {item.part_name && (
          <div className="flex gap-2">
            <dt className="text-slate-500 dark:text-slate-400 shrink-0 w-28">Деталь:</dt>
            <dd className="text-slate-800 dark:text-slate-200">
              {item.part_name}{item.part_number ? ` (${item.part_number})` : ""}
            </dd>
          </div>
        )}
        {item.description && (
          <div className="flex gap-2">
            <dt className="text-slate-500 dark:text-slate-400 shrink-0 w-28">Описание:</dt>
            <dd className="text-slate-800 dark:text-slate-200">{item.description}</dd>
          </div>
        )}
        {item.target_price != null && (
          <div className="flex gap-2">
            <dt className="text-slate-500 dark:text-slate-400 shrink-0 w-28">Цена:</dt>
            <dd className="text-slate-800 dark:text-slate-200">{item.target_price.toLocaleString("ru-RU")} ₽</dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt className="text-slate-500 dark:text-slate-400 shrink-0 w-28">Тип груза:</dt>
          <dd className="text-slate-800 dark:text-slate-200">{CARGO_LABELS[item.cargo_size]}</dd>
        </div>
        {item.comment && (
          <div className="flex gap-2">
            <dt className="text-slate-500 dark:text-slate-400 shrink-0 w-28">Комментарий:</dt>
            <dd className="text-slate-800 dark:text-slate-200">{item.comment}</dd>
          </div>
        )}
      </dl>

      {/* Tasks */}
      <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-3">
        {item.selection_task && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Подбор</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${TASK_COLORS[item.selection_task.status]}`}>
              {TASK_LABELS[item.selection_task.status]}
            </span>
          </div>
        )}
        {item.pickup_task && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Забор / осмотр</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${TASK_COLORS[item.pickup_task.status]}`}>
              {TASK_LABELS[item.pickup_task.status]}
            </span>
          </div>
        )}
        {item.delivery_task && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Доставка</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${TASK_COLORS[item.delivery_task.status]}`}>
              {TASK_LABELS[item.delivery_task.status]}
            </span>
          </div>
        )}
      </div>

      {/* Photos for this item */}
      {item.photos.length > 0 && (
        <div className="flex gap-2 flex-wrap mt-3 border-t border-slate-200 dark:border-slate-700 pt-3">
          {item.photos.map((p) => (
            <a key={p.id} href={p.file_url} target="_blank" rel="noopener noreferrer">
              <img src={p.file_url} alt="" className="h-20 w-20 object-cover rounded-lg border border-slate-200 dark:border-slate-600" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

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
          <span className={`px-3 py-1 rounded-lg text-sm font-medium ${STATUS_COLORS[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        {order.comment && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Комментарий: {order.comment}
          </p>
        )}
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
          Создан: {new Date(order.created_at).toLocaleString("ru-RU")}
        </p>

        <div className="space-y-4">
          {order.items.map((item, idx) => (
            <ItemCard key={item.id} item={item} idx={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}
