import type { OrderStatus } from "../types/order";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  waiting_courier: "Ожидает курьера",
  courier_assigned: "Курьер назначен",
  photo_uploaded: "Фото готовы",
  confirmed: "Подтверждён",
  picked_up: "У курьера",
  handed_to_carrier: "У перевозчика",
  completed: "Завершён",
  cancelled: "Отменён",
};

/** Tailwind classes for status pill (aligned with order detail page) */
export const ORDER_STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  waiting_courier: "bg-blue-100 text-blue-800",
  courier_assigned: "bg-cyan-100 text-cyan-800",
  photo_uploaded: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  picked_up: "bg-orange-100 text-orange-800",
  handed_to_carrier: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-slate-200 text-slate-600",
};
