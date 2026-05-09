import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AppHeader from "../components/AppHeader";
import { AuthContext } from "../context/AuthContext";
import { updateProfile, getCourierProfile, updateCourierProfile } from "../services/profile";
import type { CourierProfile } from "../types/order";

export default function Profile() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const user = auth?.user;
  const isCourier = user?.role === "courier" || user?.role === "admin";

  const [phone, setPhone] = useState(user?.phone ?? "");
  const [savingPhone, setSavingPhone] = useState(false);

  const [prices, setPrices] = useState<CourierProfile>({
    pickup_price: null,
    inspection_price: null,
    delivery_price: null,
  });
  const [savingPrices, setSavingPrices] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);

  useEffect(() => {
    if (!isCourier) return;
    setLoadingPrices(true);
    getCourierProfile()
      .then(setPrices)
      .catch(() => {})
      .finally(() => setLoadingPrices(false));
  }, [isCourier]);

  const handleSavePhone = async () => {
    setSavingPhone(true);
    try {
      await updateProfile({ phone: phone.trim() || null });
      toast.success("Телефон сохранён");
    } catch {
      toast.error("Не удалось сохранить телефон");
    } finally {
      setSavingPhone(false);
    }
  };

  const handleSavePrices = async () => {
    setSavingPrices(true);
    try {
      const updated = await updateCourierProfile(prices);
      setPrices(updated);
      toast.success("Наценки сохранены");
    } catch {
      toast.error("Не удалось сохранить наценки");
    } finally {
      setSavingPrices(false);
    }
  };

  const inputCls =
    "app-input";

  const btnCls =
    "app-btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed";

  const priceField = (label: string, key: keyof CourierProfile) => (
    <div>
      <label className="app-label">{label}</label>
      <input
        type="number"
        min="0"
        step="50"
        placeholder="₽"
        value={prices[key] ?? ""}
        onChange={(e) => setPrices({ ...prices, [key]: e.target.value ? parseFloat(e.target.value) : null })}
        className={inputCls}
      />
    </div>
  );

  const backPath = user?.role === "courier" ? "/courier" : user?.role === "carrier" ? "/carrier" : "/client";

  return (
    <div className="app-shell">
      <AppHeader brandTo={backPath} />

      <main className="app-page">
        <section className="app-hero">
          <div>
            <div className="app-kicker">Профиль</div>
            <h1 className="app-title">Настройки аккаунта</h1>
            <p className="app-subtitle">
              Контактные данные используются для связи по заказам и доставке.
            </p>
          </div>
          <div className="app-actions">
            <button type="button" onClick={() => navigate(backPath)} className="app-btn-secondary">
              Вернуться
            </button>
          </div>
        </section>

        <div className="app-form-card app-section">
          <div className="app-section-head mb-4">
            <div>
              <h2 className="app-section-title">Контактный номер</h2>
              <p className="app-section-note">Телефон можно оставить пустым, если связь пока не нужна.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="app-label">Телефон</label>
              <input type="tel" placeholder="+7 (999) 123-45-67" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
            </div>
            <button onClick={handleSavePhone} disabled={savingPhone} className={btnCls}>
              {savingPhone ? "Сохранение…" : "Сохранить телефон"}
            </button>
          </div>
        </div>

        {isCourier && (
          <div className="app-form-card app-section">
            <div className="app-section-head mb-4">
              <div>
                <h2 className="app-section-title">Мои наценки</h2>
                <p className="app-section-note">Стоимость услуг курьера для расчёта заказов.</p>
              </div>
            </div>
            {loadingPrices ? (
              <p className="text-[color:var(--steel-light)]">Загрузка…</p>
            ) : (
              <div className="space-y-3">
                {priceField("Забор запчасти", "pickup_price")}
                {priceField("Осмотр / фото", "inspection_price")}
                {priceField("Доставка до перевозчика", "delivery_price")}
                <button onClick={handleSavePrices} disabled={savingPrices} className={btnCls}>
                  {savingPrices ? "Сохранение…" : "Сохранить наценки"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
