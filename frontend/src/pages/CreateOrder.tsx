import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createOrder } from "../services/orders";
import type { CargoSize } from "../types/order";

export default function CreateOrder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<"drom" | "search">("drom");
  const [dromUrl, setDromUrl] = useState("");
  const [description, setDescription] = useState("");
  const [carBrand, setCarBrand] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carYear, setCarYear] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [partName, setPartName] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [partPrice, setPartPrice] = useState("");
  const [cargoSize, setCargoSize] = useState<CargoSize>("small");
  const [comment, setComment] = useState("");

  const [sellerAddress, setSellerAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryAddress.trim()) {
      toast.error("Укажите адрес доставки");
      return;
    }
    setLoading(true);
    try {
      await createOrder({
        drom_url: mode === "drom" ? dromUrl.trim() || null : null,
        description: mode === "search" ? description.trim() || null : null,
        car_brand: mode === "search" ? carBrand.trim() || null : null,
        car_model: mode === "search" ? carModel.trim() || null : null,
        car_year: carYear ? parseInt(carYear, 10) : null,
        body_type: mode === "search" ? bodyType.trim() || null : null,
        part_name: mode === "search" ? partName.trim() || null : null,
        part_number: mode === "search" ? partNumber.trim() || null : null,
        seller_address: sellerAddress.trim() || null,
        delivery_address: deliveryAddress.trim(),
        part_price: partPrice ? parseFloat(partPrice) : null,
        cargo_size: cargoSize,
        comment: comment.trim() || null,
      });
      toast.success("Заказ создан");
      navigate("/client");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      toast.error(typeof msg === "string" ? msg : "Не удалось создать заказ");
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
          Новый заказ
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Part info */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-4">
              Запчасть
            </h2>

            <div className="flex gap-2 mb-4">
              <button type="button" className={tabCls(mode === "drom")} onClick={() => setMode("drom")}>
                Есть ссылка Drom
              </button>
              <button type="button" className={tabCls(mode === "search")} onClick={() => setMode("search")}>
                Описать деталь
              </button>
            </div>

            <div className="space-y-3">
              {mode === "drom" ? (
                <input
                  type="url"
                  placeholder="https://baza.drom.ru/..."
                  value={dromUrl}
                  onChange={(e) => setDromUrl(e.target.value)}
                  required
                  className={inputCls}
                />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Марка авто" value={carBrand} onChange={(e) => setCarBrand(e.target.value)} className={inputCls} />
                    <input placeholder="Модель авто" value={carModel} onChange={(e) => setCarModel(e.target.value)} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="Год выпуска" min="1900" max="2100" value={carYear} onChange={(e) => setCarYear(e.target.value)} className={inputCls} />
                    <input placeholder="Тип кузова" value={bodyType} onChange={(e) => setBodyType(e.target.value)} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Название детали" value={partName} onChange={(e) => setPartName(e.target.value)} className={inputCls} />
                    <input placeholder="Артикул / номер" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} className={inputCls} />
                  </div>
                  <textarea placeholder="Доп. описание…" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls + " resize-none"} />
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <input type="number" min="0" step="100" placeholder="Цена запчасти ₽" value={partPrice} onChange={(e) => setPartPrice(e.target.value)} className={inputCls} />
                <select value={cargoSize} onChange={(e) => setCargoSize(e.target.value as CargoSize)} className={inputCls}>
                  <option value="small">Мелкая посылка</option>
                  <option value="large">Крупногабарит</option>
                </select>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-4">
              Адреса
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Адрес продавца
                </label>
                <input placeholder="Город, улица, дом" value={sellerAddress} onChange={(e) => setSellerAddress(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Адрес доставки *
                </label>
                <input placeholder="Куда доставить запчасть" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} required className={inputCls} />
              </div>
            </div>
          </div>

          {/* Comment */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Комментарий к заказу
            </label>
            <textarea placeholder="Дополнительные пожелания…" value={comment} onChange={(e) => setComment(e.target.value)} rows={2} className={inputCls + " resize-none"} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-medium text-white bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? "Создание…" : "Оформить заказ"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/client")}
          className="mt-4 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
        >
          &larr; Назад к заказам
        </button>
      </div>
    </div>
  );
}
