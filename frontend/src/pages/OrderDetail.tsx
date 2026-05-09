import { useEffect, useState, useContext } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AppHeader from "../components/AppHeader";
import { ORDER_STATUS_BADGE_CLASS, ORDER_STATUS_LABELS } from "../constants/orderStatus";
import { AuthContext } from "../context/AuthContext";
import { getOrder, approveOrder, rejectOrder, confirmDelivery, submitReview, payOrderMock } from "../services/orders";
import type { Order, OrderStatus, CargoSize, PaymentStatus } from "../types/order";

const CARGO_LABELS: Record<CargoSize, string> = {
  small: "Мелкая посылка",
  large: "Крупногабарит",
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  failed: "Оплата неуспешна",
  refunded: "Возврат",
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
  const canPay = isClient && order?.payment_status === "pending" && order?.status !== "cancelled";

  const role = auth?.user?.role;
  const staffDash = role === "carrier" ? "/carrier" : "/courier";

  useEffect(() => {
    if (!orderId) return;
    getOrder(parseInt(orderId, 10))
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
    } catch {
      toast.error("Ошибка");
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!order) return;
    setActing(true);
    try {
      const updated = await rejectOrder(order.id);
      setOrder(updated);
      toast.success("Заказ отменён, средства вернутся");
    } catch {
      toast.error("Ошибка");
    } finally {
      setActing(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!order) return;
    setActing(true);
    try {
      const updated = await confirmDelivery(order.id);
      setOrder(updated);
      toast.success("Получение подтверждено");
    } catch {
      toast.error("Ошибка");
    } finally {
      setActing(false);
    }
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
    } catch {
      toast.error("Ошибка");
    } finally {
      setActing(false);
    }
  };

  const handlePay = async () => {
    if (!order) return;
    setActing(true);
    try {
      await payOrderMock(order.id);
      const updated = await getOrder(order.id);
      setOrder(updated);
      toast.success("Оплата прошла успешно");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      toast.error(typeof msg === "string" ? msg : "Не удалось провести оплату");
    } finally {
      setActing(false);
    }
  };

  const header =
    role === "client" ? (
      <AppHeader />
    ) : (
      <AppHeader
        brandTo={staffDash}
        nav={
          <>
            <Link to={staffDash}>Кабинет</Link>
            <button
              type="button"
              onClick={() => {
                auth?.logout();
                navigate("/login", { replace: true });
              }}
            >
              Выйти
            </button>
          </>
        }
      />
    );

  if (loading) {
    return (
      <div className="app-shell">
        {header}
        <main className="app-page">
          <p className="text-center text-[color:var(--steel-light)] py-16">Загрузка…</p>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="app-shell">
        {header}
        <main className="app-page">
          <div className="app-card text-center py-12">
            <p className="text-[color:var(--steel-light)]">Заказ не найден</p>
            {role === "client" ? (
              <Link to="/orders" className="app-btn-secondary mt-4 inline-block">
                К списку заказов
              </Link>
            ) : (
              <Link to={staffDash} className="app-btn-secondary mt-4 inline-block">
                В кабинет
              </Link>
            )}
          </div>
        </main>
      </div>
    );
  }

  const sectionCls = "app-card";
  const termCls = "text-[color:var(--steel-light)] shrink-0 w-32";
  const inputCls = "app-input";

  const label =
    order.part_name ||
    (order.drom_url ? "Ссылка Drom" : [order.car_brand, order.car_model, order.car_year].filter(Boolean).join(" ") || "Запчасть");

  const backLink =
    role === "client" ? (
      <Link to="/orders" className="app-btn-ghost inline-block mb-4">
        ← К заказам
      </Link>
    ) : (
      <Link to={staffDash} className="app-btn-ghost inline-block mb-4">
        ← В кабинет
      </Link>
    );

  return (
    <div className="app-shell">
      {header}

      <main className="app-page max-w-2xl mx-auto">
        {backLink}

        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <h1 className="app-title text-2xl">Заказ #{order.id}</h1>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${ORDER_STATUS_BADGE_CLASS[order.status as OrderStatus]}`}
          >
            {ORDER_STATUS_LABELS[order.status as OrderStatus]}
          </span>
        </div>

        <div className="space-y-4">
          <div className={sectionCls}>
            <h2 className="font-display font-semibold text-[color:var(--ink)] mb-3">{label}</h2>
            <dl className="space-y-1.5 text-sm">
              {order.drom_url && (
                <div className="flex gap-2">
                  <dt className={termCls}>Drom:</dt>
                  <dd>
                    <a
                      href={order.drom_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[color:var(--rust)] underline break-all"
                    >
                      {order.drom_url}
                    </a>
                  </dd>
                </div>
              )}
              {order.car_brand && (
                <div className="flex gap-2">
                  <dt className={termCls}>Авто:</dt>
                  <dd className="text-[color:var(--ink)]">
                    {[order.car_brand, order.car_model, order.car_year].filter(Boolean).join(" ")}
                  </dd>
                </div>
              )}
              {order.part_name && (
                <div className="flex gap-2">
                  <dt className={termCls}>Деталь:</dt>
                  <dd className="text-[color:var(--ink)]">
                    {order.part_name}
                    {order.part_number ? ` (${order.part_number})` : ""}
                  </dd>
                </div>
              )}
              {order.description && (
                <div className="flex gap-2">
                  <dt className={termCls}>Описание:</dt>
                  <dd className="text-[color:var(--ink)]">{order.description}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className={termCls}>Тип груза:</dt>
                <dd className="text-[color:var(--ink)]">{CARGO_LABELS[order.cargo_size]}</dd>
              </div>
              {order.seller_address && (
                <div className="flex gap-2">
                  <dt className={termCls}>Продавец:</dt>
                  <dd className="text-[color:var(--ink)]">{order.seller_address}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className={termCls}>Доставка:</dt>
                <dd className="text-[color:var(--ink)]">{order.delivery_address}</dd>
              </div>
              {order.comment && (
                <div className="flex gap-2">
                  <dt className={termCls}>Комментарий:</dt>
                  <dd className="text-[color:var(--ink)]">{order.comment}</dd>
                </div>
              )}
            </dl>
          </div>

          {order.total_price != null && (
            <div className={sectionCls}>
              <h3 className="font-display font-semibold text-[color:var(--ink)] mb-2">Стоимость</h3>
              <div className="text-sm space-y-1 text-[color:var(--steel-light)]">
                {order.part_price != null && <p>Запчасть: {order.part_price.toLocaleString("ru-RU")} ₽</p>}
                {order.service_fee != null && <p>Сервисный сбор: {order.service_fee.toLocaleString("ru-RU")} ₽</p>}
                {order.delivery_fee != null && <p>Доставка: {order.delivery_fee.toLocaleString("ru-RU")} ₽</p>}
                <p className="font-semibold text-[color:var(--ink)] pt-1 border-t border-[color:var(--border)]">
                  Итого: {order.total_price.toLocaleString("ru-RU")} ₽
                </p>
                <p>Статус оплаты: {PAYMENT_LABELS[order.payment_status]}</p>
                {order.payment_id && <p>Payment ID: {order.payment_id}</p>}
                {order.paid_at && <p>Оплачен: {new Date(order.paid_at).toLocaleString("ru-RU")}</p>}
                {canPay && (
                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={acting}
                    className="app-btn-primary mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Оплатить
                  </button>
                )}
              </div>
            </div>
          )}

          {order.items.length > 0 && (
            <div className={sectionCls}>
              <h3 className="font-display font-semibold text-[color:var(--ink)] mb-2">Позиции заказа</h3>
              <div className="space-y-2 text-sm">
                {order.items.map((item) => (
                  <div key={item.id} className="rounded-lg border border-[color:var(--border)] p-3">
                    <p className="font-medium text-[color:var(--ink)]">{item.part_name_snapshot}</p>
                    <p className="text-[color:var(--steel-light)]">
                      {item.part_brand_snapshot} · {item.part_article_snapshot}
                    </p>
                    <p className="text-[color:var(--steel-light)]">
                      {item.quantity} × {item.unit_price_snapshot.toLocaleString("ru-RU")} ₽ ={" "}
                      {item.subtotal.toLocaleString("ru-RU")} ₽
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.photos.length > 0 && (
            <div className={sectionCls}>
              <h3 className="font-display font-semibold text-[color:var(--ink)] mb-3">Фото от курьера</h3>
              <div className="flex gap-2 flex-wrap">
                {order.photos.map((p) => (
                  <a key={p.id} href={p.file_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={p.file_url}
                      alt=""
                      className="h-24 w-24 object-cover rounded-lg border border-[color:var(--border)]"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {isClient && order.status === "photo_uploaded" && (
            <div className={`${sectionCls} border-amber-400/80`}>
              <h3 className="font-medium text-amber-800 mb-3">Просмотрите фото и примите решение</h3>
              <p className="text-sm text-[color:var(--steel-light)] mb-4">
                Курьер сфотографировал запчасть. Если всё устраивает — подтвердите покупку. Если нет — откажитесь, и
                средства будут возвращены.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={acting}
                  className="app-btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Подтвердить покупку
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={acting}
                  className="app-btn-secondary border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  Отказаться
                </button>
              </div>
            </div>
          )}

          {isClient && order.status === "handed_to_carrier" && (
            <div className={`${sectionCls} border-indigo-400/80`}>
              <h3 className="font-medium text-indigo-800 mb-3">Запчасть доставлена?</h3>
              <p className="text-sm text-[color:var(--steel-light)] mb-4">
                Перевозчик должен был доставить вашу запчасть. Подтвердите получение.
              </p>
              <button
                type="button"
                onClick={handleConfirmDelivery}
                disabled={acting}
                className="app-btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Подтвердить получение
              </button>
            </div>
          )}

          {isClient && order.status === "completed" && !order.review && (
            <div className={`${sectionCls} border-emerald-400/80`}>
              <h3 className="font-medium text-emerald-800 mb-3">Оцените заказ</h3>
              <div className="space-y-3">
                <div>
                  <label className="app-label">Оценка курьера (1–5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={courierRating}
                    onChange={(e) => setCourierRating(Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="app-label">Оценка сервиса (1–5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={serviceRating}
                    onChange={(e) => setServiceRating(Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
                <textarea
                  placeholder="Ваш отзыв…"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
                <button
                  type="button"
                  onClick={handleReview}
                  disabled={acting}
                  className="app-btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Отправить отзыв
                </button>
              </div>
            </div>
          )}

          {order.review && (
            <div className={sectionCls}>
              <h3 className="font-display font-semibold text-[color:var(--ink)] mb-2">Ваш отзыв</h3>
              <div className="text-sm space-y-1 text-[color:var(--steel-light)]">
                <p>
                  Курьер: {"★".repeat(order.review.courier_rating)}
                  {"☆".repeat(5 - order.review.courier_rating)}
                </p>
                <p>
                  Сервис: {"★".repeat(order.review.service_rating)}
                  {"☆".repeat(5 - order.review.service_rating)}
                </p>
                {order.review.comment && <p className="mt-1 italic">&quot;{order.review.comment}&quot;</p>}
              </div>
            </div>
          )}

          <p className="text-xs text-[color:var(--steel-light)]">
            Создан: {new Date(order.created_at).toLocaleString("ru-RU")}
          </p>
        </div>
      </main>
    </div>
  );
}
