import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import { updateProfile, getPickerProfile, updatePickerProfile } from "../services/profile";
import type { PickerProfile } from "../types/order";

export default function Profile() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const user = auth?.user;
  const isPicker = user?.role === "picker" || user?.role === "admin";

  const [phone, setPhone] = useState(user?.phone ?? "");
  const [savingPhone, setSavingPhone] = useState(false);

  const [prices, setPrices] = useState<PickerProfile>({
    selection_price: null,
    inspection_price: null,
    purchase_price: null,
    delivery_small_price: null,
    delivery_large_price: null,
  });
  const [savingPrices, setSavingPrices] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);

  useEffect(() => {
    if (!isPicker) return;
    setLoadingPrices(true);
    getPickerProfile()
      .then(setPrices)
      .catch(() => {})
      .finally(() => setLoadingPrices(false));
  }, [isPicker]);

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
      const updated = await updatePickerProfile(prices);
      setPrices(updated);
      toast.success("Наценки сохранены");
    } catch {
      toast.error("Не удалось сохранить наценки");
    } finally {
      setSavingPrices(false);
    }
  };

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-transparent transition";

  const btnCls =
    "w-full py-3 px-4 rounded-xl font-medium text-white bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition";

  const priceField = (
    label: string,
    key: keyof PickerProfile,
  ) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      <input
        type="number"
        min="0"
        step="50"
        placeholder="₽"
        value={prices[key] ?? ""}
        onChange={(e) =>
          setPrices({ ...prices, [key]: e.target.value ? parseFloat(e.target.value) : null })
        }
        className={inputCls}
      />
    </div>
  );

  const backPath = isPicker ? "/picker" : "/client";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 px-4 py-8">
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          Профиль
        </h1>

        {/* Phone section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-4">
            Контактный номер
          </h2>
          <div className="space-y-3">
            <input
              type="tel"
              placeholder="+7 (999) 123-45-67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputCls}
            />
            <button onClick={handleSavePhone} disabled={savingPhone} className={btnCls}>
              {savingPhone ? "Сохранение…" : "Сохранить телефон"}
            </button>
          </div>
        </div>

        {/* Picker pricing section */}
        {isPicker && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-4">
              Мои наценки
            </h2>
            {loadingPrices ? (
              <p className="text-slate-500">Загрузка…</p>
            ) : (
              <div className="space-y-3">
                {priceField("Подбор", "selection_price")}
                {priceField("Осмотр", "inspection_price")}
                {priceField("Покупка", "purchase_price")}
                {priceField("Доставка до перевозчика (мелкая посылка)", "delivery_small_price")}
                {priceField("Доставка до перевозчика (крупногабарит)", "delivery_large_price")}
                <button onClick={handleSavePrices} disabled={savingPrices} className={btnCls}>
                  {savingPrices ? "Сохранение…" : "Сохранить наценки"}
                </button>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
        >
          &larr; Назад
        </button>
      </div>
    </div>
  );
}
