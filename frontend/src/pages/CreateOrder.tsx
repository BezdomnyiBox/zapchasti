import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AppHeader from "../components/AppHeader";
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
      navigate("/orders");
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
    "app-input";

  const tabCls = (active: boolean) =>
    `flex-1 justify-center rounded-full border px-4 py-2 text-center text-sm font-semibold transition cursor-pointer ${
      active
        ? "border-[color:var(--rust)] bg-[color:var(--rust)] text-white"
        : "border-[color:var(--border)] bg-white text-[color:var(--steel-light)] hover:border-[color:var(--rust)] hover:text-[color:var(--rust)]"
    }`;

  return (
    <div className="app-shell">
      <AppHeader />

      <main className="app-page">
        <section className="app-hero">
          <div>
            <div className="app-kicker">Новый заказ</div>
            <h1 className="app-title">Оформление заявки</h1>
            <p className="app-subtitle">
              Укажите ссылку на объявление или опишите деталь, добавьте адреса и комментарий для курьера.
            </p>
          </div>
          <div className="app-actions">
            <Link to="/catalog" className="app-btn-secondary">Каталог</Link>
            <button type="button" onClick={() => navigate("/orders")} className="app-btn-ghost">
              Назад к заказам
            </button>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="app-section space-y-5">
          {/* Part info */}
          <div className="app-form-card">
            <div className="app-section-head mb-4">
              <div>
                <h2 className="app-section-title">Запчасть</h2>
                <p className="app-section-note">Выберите способ описания позиции.</p>
              </div>
            </div>

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
                <div>
                  <label className="app-label" htmlFor="drom-url">Ссылка на объявление Drom</label>
                  <input
                    id="drom-url"
                    type="url"
                    placeholder="https://baza.drom.ru/..."
                    value={dromUrl}
                    onChange={(e) => setDromUrl(e.target.value)}
                    required
                    className={inputCls}
                  />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="app-label">Марка авто</label>
                      <input placeholder="Toyota" value={carBrand} onChange={(e) => setCarBrand(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="app-label">Модель авто</label>
                      <input placeholder="Camry" value={carModel} onChange={(e) => setCarModel(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="app-label">Год выпуска</label>
                      <input type="number" placeholder="2018" min="1900" max="2100" value={carYear} onChange={(e) => setCarYear(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="app-label">Тип кузова</label>
                      <input placeholder="V70" value={bodyType} onChange={(e) => setBodyType(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="app-label">Название детали</label>
                      <input placeholder="Тормозные колодки" value={partName} onChange={(e) => setPartName(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="app-label">Артикул / номер</label>
                      <input placeholder="04465-06200" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="app-label">Дополнительное описание</label>
                    <textarea placeholder="Состояние, сторона, комплектация..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls + " resize-none"} />
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="app-label">Цена запчасти</label>
                  <input type="number" min="0" step="100" placeholder="₽" value={partPrice} onChange={(e) => setPartPrice(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="app-label">Размер груза</label>
                  <select value={cargoSize} onChange={(e) => setCargoSize(e.target.value as CargoSize)} className={inputCls}>
                    <option value="small">Мелкая посылка</option>
                    <option value="large">Крупногабарит</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="app-form-card">
            <h2 className="app-section-title mb-4">Адреса</h2>
            <div className="space-y-3">
              <div>
                <label className="app-label">
                  Адрес продавца
                </label>
                <input placeholder="Город, улица, дом" value={sellerAddress} onChange={(e) => setSellerAddress(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="app-label">
                  Адрес доставки *
                </label>
                <input placeholder="Куда доставить запчасть" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} required className={inputCls} />
              </div>
            </div>
          </div>

          {/* Comment */}
          <div className="app-form-card">
            <label className="app-label">
              Комментарий к заказу
            </label>
            <textarea placeholder="Дополнительные пожелания…" value={comment} onChange={(e) => setComment(e.target.value)} rows={2} className={inputCls + " resize-none"} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="app-btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Создание…" : "Оформить заказ"}
          </button>
        </form>
      </main>
    </div>
  );
}
