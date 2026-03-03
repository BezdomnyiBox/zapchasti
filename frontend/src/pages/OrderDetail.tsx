import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import { getOrder, approveOrder, rejectOrder, confirmDelivery, submitReview } from "../services/orders";
import type { Order, OrderStatus, CargoSize } from "../types/order";

const STATUS_LABELS: Record<OrderStatus, string> = {
  waiting_courier: "Ожидает курьера",
  courier_assigned: "Курьер назначен",
  photo_uploaded: "Фото готовы — просмотрите",
  confirmed: "Подтверждён",
  picked_up: "Запчасть у курьера",
  handed_to_carrier: "Передано перевозчику",
  completed: "Заказ завершён",
  cancelled: "Заказ отменён",
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

const CARGO_LABELS: Record<CargoSize, string> = {
  small: "Мелкая посылка",
  large: "Крупногабарит",
};

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const [courierRating, setCourierRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const isClient = order?.client_id === auth?.user?.id;

  useEffect(() => {
    if (!orderId) return;
    getOrder(parseInt(orderId))
      .then(setOrder)
      .catch(() => toast.error("Заказ не найден"))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleApprove = async () => {
    if (!order) return;
    setActing(true);
    try {
      const updated = await approveOrder(order.id);
      setOrder(updated);
      toast.success("Покупка подтверждена");
    } catch { toast.error("Ошибка"); }
    finally { setActing(false); }
  };

  const handleReject = async () => {
    if (!order) return;
    setActing(true);
    try {
      const updated = await rejectOrder(order.id);
      setOrder(updated);
      toast.success("Заказ отменён, средства вернутся");
    } catch { toast.error("Ошибка"); }
    finally { setActing(false); }
  };

  const handleConfirmDelivery = async () => {
    if (!order) return;
    setActing(true);
    try {
      const updated = await confirmDelivery(order.id);
      setOrder(updated);
      toast.success("Получение подтверждено");
    } catch { toast.error("Ошибка"); }
    finally { setActing(false); }
  };

  const handleReview = async () => {
    if (!order) return;
    setActing(true);
    try {
      await submitReview(order.id, {
        courier_rating: courierRating,
        service_rating: serviceRating,
        comment: reviewComment.trim() || null,
      });
      const updated = await getOrder(order.id);
      setOrder(updated);
      toast.success("Спасибо за отзыв!");
    } catch { toast.error("Ошибка"); }
    finally { setActing(false); }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-500">Загрузка…</div>;
  }
  if (!order) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900"><p className="text-slate-500">Заказ не найден</p></div>;
  }

  const sectionCls = "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5";
  const btnPrimary = "px-5 py-2.5 rounded-xl font-medium text-white transition disabled:opacity-60 disabled:cursor-not-allowed";
  const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 transition";

  const label = order.part_name || (order.drom_url ? "Ссылка Drom" : [order.car_brand, order.car_model, order.car_year].filter(Boolean).join(" ") || "Запчасть");

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition mb-4">
          &larr; Назад
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
            Заказ #{order.id}
          </h1>
          <span className={`px-3 py-1 rounded-lg text-sm font-medium ${STATUS_COLORS[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        <div className="space-y-4">
          {/* Part info */}
          <div className={sectionCls}>
            <h2 className="font-medium text-slate-800 dark:text-slate-100 mb-3">{label}</h2>
            <dl className="space-y-1.5 text-sm">
              {order.drom_url && (
                <div className="flex gap-2">
                  <dt className="text-slate-500 dark:text-slate-400 shrink-0 w-32">Drom:</dt>
                  <dd><a href={order.drom_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline break-all">{order.drom_url}</a></dd>
                </div>
              )}
              {order.car_brand && (
                <div className="flex gap-2">
                  <dt className="text-slate-500 dark:text-slate-400 shrink-0 w-32">Авто:</dt>
                  <dd className="text-slate-800 dark:text-slate-200">{[order.car_brand, order.car_model, order.car_year].filter(Boolean).join(" ")}</dd>
                </div>
              )}
              {order.part_name && (
                <div className="flex gap-2">
                  <dt className="text-slate-500 dark:text-slate-400 shrink-0 w-32">Деталь:</dt>
                  <dd className="text-slate-800 dark:text-slate-200">{order.part_name}{order.part_number ? ` (${order.part_number})` : ""}</dd>
                </div>
              )}
              {order.description && (
                <div className="flex gap-2">
                  <dt className="text-slate-500 dark:text-slate-400 shrink-0 w-32">Описание:</dt>
                  <dd className="text-slate-800 dark:text-slate-200">{order.description}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="text-slate-500 dark:text-slate-400 shrink-0 w-32">Тип груза:</dt>
                <dd className="text-slate-800 dark:text-slate-200">{CARGO_LABELS[order.cargo_size]}</dd>
              </div>
              {order.seller_address && (
                <div className="flex gap-2">
                  <dt className="text-slate-500 dark:text-slate-400 shrink-0 w-32">Продавец:</dt>
                  <dd className="text-slate-800 dark:text-slate-200">{order.seller_address}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="text-slate-500 dark:text-slate-400 shrink-0 w-32">Доставка:</dt>
                <dd className="text-slate-800 dark:text-slate-200">{order.delivery_address}</dd>
              </div>
              {order.comment && (
                <div className="flex gap-2">
                  <dt className="text-slate-500 dark:text-slate-400 shrink-0 w-32">Комментарий:</dt>
                  <dd className="text-slate-800 dark:text-slate-200">{order.comment}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Pricing */}
          {order.total_price != null && (
            <div className={sectionCls}>
              <h3 className="font-medium text-slate-800 dark:text-slate-100 mb-2">Стоимость</h3>
              <div className="text-sm space-y-1">
                {order.part_price != null && <p className="text-slate-600 dark:text-slate-400">Запчасть: {order.part_price.toLocaleString("ru-RU")} ₽</p>}
                {order.service_fee != null && <p className="text-slate-600 dark:text-slate-400">Сервисный сбор: {order.service_fee.toLocaleString("ru-RU")} ₽</p>}
                {order.delivery_fee != null && <p className="text-slate-600 dark:text-slate-400">Доставка: {order.delivery_fee.toLocaleString("ru-RU")} ₽</p>}
                <p className="font-semibold text-slate-800 dark:text-slate-100 pt-1 border-t border-slate-200 dark:border-slate-700">
                  Итого: {order.total_price.toLocaleString("ru-RU")} ₽
                </p>
              </div>
            </div>
          )}

          {/* Photos from courier (stage 3) */}
          {order.photos.length > 0 && (
            <div className={sectionCls}>
              <h3 className="font-medium text-slate-800 dark:text-slate-100 mb-3">Фото от курьера</h3>
              <div className="flex gap-2 flex-wrap">
                {order.photos.map((p) => (
                  <a key={p.id} href={p.file_url} target="_blank" rel="noopener noreferrer">
                    <img src={p.file_url} alt="" className="h-24 w-24 object-cover rounded-lg border border-slate-200 dark:border-slate-600" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Stage 4: Client decision */}
          {isClient && order.status === "photo_uploaded" && (
            <div className={`${sectionCls} border-amber-300 dark:border-amber-600`}>
              <h3 className="font-medium text-amber-700 dark:text-amber-300 mb-3">Просмотрите фото и примите решение</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Курьер сфотографировал запчасть. Если всё устраивает — подтвердите покупку.
                Если нет — откажитесь, и средства будут возвращены.
              </p>
              <div className="flex gap-3">
                <button onClick={handleApprove} disabled={acting} className={`${btnPrimary} bg-green-600 hover:bg-green-500`}>
                  Подтвердить покупку
                </button>
                <button onClick={handleReject} disabled={acting} className={`${btnPrimary} bg-red-600 hover:bg-red-500`}>
                  Отказаться
                </button>
              </div>
            </div>
          )}

          {/* Stage 7: Confirm delivery */}
          {isClient && order.status === "handed_to_carrier" && (
            <div className={`${sectionCls} border-indigo-300 dark:border-indigo-600`}>
              <h3 className="font-medium text-indigo-700 dark:text-indigo-300 mb-3">Запчасть доставлена?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Перевозчик должен был доставить вашу запчасть. Подтвердите получение.
              </p>
              <button onClick={handleConfirmDelivery} disabled={acting} className={`${btnPrimary} bg-indigo-600 hover:bg-indigo-500`}>
                Подтвердить получение
              </button>
            </div>
          )}

          {/* Stage 8: Review */}
          {isClient && order.status === "completed" && !order.review && (
            <div className={`${sectionCls} border-green-300 dark:border-green-600`}>
              <h3 className="font-medium text-green-700 dark:text-green-300 mb-3">Оцените заказ</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Оценка курьера (1–5)</label>
                  <input type="number" min={1} max={5} value={courierRating} onChange={(e) => setCourierRating(Number(e.target.value))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Оценка сервиса (1–5)</label>
                  <input type="number" min={1} max={5} value={serviceRating} onChange={(e) => setServiceRating(Number(e.target.value))} className={inputCls} />
                </div>
                <textarea placeholder="Ваш отзыв…" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={2} className={inputCls + " resize-none"} />
                <button onClick={handleReview} disabled={acting} className={`${btnPrimary} bg-green-600 hover:bg-green-500`}>
                  Отправить отзыв
                </button>
              </div>
            </div>
          )}

          {/* Show existing review */}
          {order.review && (
            <div className={sectionCls}>
              <h3 className="font-medium text-slate-800 dark:text-slate-100 mb-2">Ваш отзыв</h3>
              <div className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                <p>Курьер: {"★".repeat(order.review.courier_rating)}{"☆".repeat(5 - order.review.courier_rating)}</p>
                <p>Сервис: {"★".repeat(order.review.service_rating)}{"☆".repeat(5 - order.review.service_rating)}</p>
                {order.review.comment && <p className="mt-1 italic">"{order.review.comment}"</p>}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400 dark:text-slate-500">
            Создан: {new Date(order.created_at).toLocaleString("ru-RU")}
          </p>
        </div>
      </div>
    </div>
  );
}
