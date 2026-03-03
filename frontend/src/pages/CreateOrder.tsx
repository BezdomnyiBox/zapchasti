import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createOrder } from "../services/orders";
import type { OrderItemCreatePayload, CargoSize } from "../types/order";

interface ItemForm {
  mode: "drom" | "search";
  dromUrl: string;
  description: string;
  carBrand: string;
  carModel: string;
  carYear: string;
  bodyType: string;
  partName: string;
  partNumber: string;
  targetPrice: string;
  comment: string;
  prepaid: boolean;
  cargoSize: CargoSize;
}

function emptyItem(): ItemForm {
  return {
    mode: "drom",
    dromUrl: "",
    description: "",
    carBrand: "",
    carModel: "",
    carYear: "",
    bodyType: "",
    partName: "",
    partNumber: "",
    targetPrice: "",
    comment: "",
    prepaid: false,
    cargoSize: "small",
  };
}

function toPayload(f: ItemForm): OrderItemCreatePayload {
  if (f.mode === "drom") {
    return {
      drom_url: f.dromUrl.trim() || null,
      target_price: f.targetPrice ? parseFloat(f.targetPrice) : null,
      comment: f.comment.trim() || null,
      prepaid_to_seller: f.prepaid,
      cargo_size: f.cargoSize,
    };
  }
  return {
    description: f.description.trim() || null,
    car_brand: f.carBrand.trim() || null,
    car_model: f.carModel.trim() || null,
    car_year: f.carYear ? parseInt(f.carYear, 10) : null,
    body_type: f.bodyType.trim() || null,
    part_name: f.partName.trim() || null,
    part_number: f.partNumber.trim() || null,
    target_price: f.targetPrice ? parseFloat(f.targetPrice) : null,
    comment: f.comment.trim() || null,
    prepaid_to_seller: f.prepaid,
    cargo_size: f.cargoSize,
  };
}

export default function CreateOrder() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ItemForm[]>([emptyItem()]);
  const [orderComment, setOrderComment] = useState("");
  const [loading, setLoading] = useState(false);

  const updateItem = (idx: number, patch: Partial<ItemForm>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createOrder({
        comment: orderComment.trim() || null,
        items: items.map(toPayload),
      });
      toast.success("Заявка создана");
      navigate("/client");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      toast.error(typeof msg === "string" ? msg : "Не удалось создать заявку");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-transparent transition";

  const tabCls = (active: boolean) =>
    `flex-1 py-2 text-center rounded-xl text-sm font-medium transition cursor-pointer ${
      active
        ? "bg-slate-700 text-white dark:bg-slate-500"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
    }`;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-6">
          Новая заявка
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100">
                  Позиция {idx + 1}
                </h2>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-sm text-red-500 hover:text-red-700 transition"
                  >
                    Удалить
                  </button>
                )}
              </div>

              {/* Mode tabs */}
              <div className="flex gap-2 mb-4">
                <button type="button" className={tabCls(item.mode === "drom")} onClick={() => updateItem(idx, { mode: "drom" })}>
                  Есть ссылка Drom
                </button>
                <button type="button" className={tabCls(item.mode === "search")} onClick={() => updateItem(idx, { mode: "search" })}>
                  Подобрать деталь
                </button>
              </div>

              <div className="space-y-3">
                {item.mode === "drom" ? (
                  <input
                    type="url"
                    placeholder="https://baza.drom.ru/..."
                    value={item.dromUrl}
                    onChange={(e) => updateItem(idx, { dromUrl: e.target.value })}
                    required
                    className={inputCls}
                  />
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        placeholder="Марка авто"
                        value={item.carBrand}
                        onChange={(e) => updateItem(idx, { carBrand: e.target.value })}
                        className={inputCls}
                      />
                      <input
                        placeholder="Модель авто"
                        value={item.carModel}
                        onChange={(e) => updateItem(idx, { carModel: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        placeholder="Год выпуска"
                        min="1900"
                        max="2100"
                        value={item.carYear}
                        onChange={(e) => updateItem(idx, { carYear: e.target.value })}
                        className={inputCls}
                      />
                      <input
                        placeholder="Тип кузова"
                        value={item.bodyType}
                        onChange={(e) => updateItem(idx, { bodyType: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        placeholder="Название детали"
                        value={item.partName}
                        onChange={(e) => updateItem(idx, { partName: e.target.value })}
                        className={inputCls}
                      />
                      <input
                        placeholder="Артикул / номер"
                        value={item.partNumber}
                        onChange={(e) => updateItem(idx, { partNumber: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <textarea
                      placeholder="Доп. описание детали…"
                      value={item.description}
                      onChange={(e) => updateItem(idx, { description: e.target.value })}
                      rows={2}
                      className={inputCls + " resize-none"}
                    />
                  </>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Желаемая цена ₽"
                    value={item.targetPrice}
                    onChange={(e) => updateItem(idx, { targetPrice: e.target.value })}
                    className={inputCls}
                  />
                  <select
                    value={item.cargoSize}
                    onChange={(e) => updateItem(idx, { cargoSize: e.target.value as CargoSize })}
                    className={inputCls}
                  >
                    <option value="small">Мелкая посылка</option>
                    <option value="large">Крупногабарит</option>
                  </select>
                </div>

                <textarea
                  placeholder="Комментарий к позиции…"
                  value={item.comment}
                  onChange={(e) => updateItem(idx, { comment: e.target.value })}
                  rows={2}
                  className={inputCls + " resize-none"}
                />

                {item.mode === "drom" && (
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={item.prepaid}
                      onChange={(e) => updateItem(idx, { prepaid: e.target.checked })}
                      className="h-5 w-5 rounded border-slate-300 text-slate-700 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Я уже оплатил продавцу
                    </span>
                  </label>
                )}
              </div>
            </div>
          ))}

          {/* Add item button */}
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, emptyItem()])}
            className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium transition"
          >
            + Добавить позицию
          </button>

          {/* Order-level comment */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Общий комментарий к заявке
            </label>
            <textarea
              placeholder="Дополнительные пожелания…"
              value={orderComment}
              onChange={(e) => setOrderComment(e.target.value)}
              rows={2}
              className={inputCls + " resize-none"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-medium text-white bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? "Создание…" : `Создать заявку (${items.length} поз.)`}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/client")}
          className="mt-4 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
        >
          &larr; Назад к заявкам
        </button>
      </div>
    </div>
  );
}
