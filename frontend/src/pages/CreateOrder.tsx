import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createOrder } from "../services/orders";

export default function CreateOrder() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"drom" | "search">("drom");
  const [dromUrl, setDromUrl] = useState("");
  const [description, setDescription] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [comment, setComment] = useState("");
  const [prepaid, setPrepaid] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createOrder({
        drom_url: mode === "drom" ? dromUrl.trim() || null : null,
        description: mode === "search" ? description.trim() || null : null,
        target_price: targetPrice ? parseFloat(targetPrice) : null,
        comment: comment.trim() || null,
        prepaid_to_seller: prepaid,
      });
      toast.success("Заявка создана");
      navigate("/client");
    } catch {
      toast.error("Не удалось создать заявку");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-transparent transition";

  const tabCls = (active: boolean) =>
    `flex-1 py-2.5 text-center rounded-xl text-sm font-medium transition cursor-pointer ${
      active
        ? "bg-slate-700 text-white dark:bg-slate-500"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
    }`;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-6">
          Новая заявка
        </h1>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
          <div className="flex gap-2 mb-6">
            <button type="button" className={tabCls(mode === "drom")} onClick={() => setMode("drom")}>
              Есть ссылка Drom
            </button>
            <button type="button" className={tabCls(mode === "search")} onClick={() => setMode("search")}>
              Подобрать деталь
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "drom" ? (
              <div>
                <label htmlFor="drom-url" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Ссылка на объявление Drom
                </label>
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
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Описание детали
                </label>
                <textarea
                  id="description"
                  placeholder="Марка, модель, год, деталь…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  className={inputCls + " resize-none"}
                />
              </div>
            )}

            <div>
              <label htmlFor="target-price" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Желаемая цена (необязательно)
              </label>
              <input
                id="target-price"
                type="number"
                min="0"
                step="100"
                placeholder="₽"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Комментарий
              </label>
              <textarea
                id="comment"
                placeholder="Дополнительные пожелания…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className={inputCls + " resize-none"}
              />
            </div>

            {mode === "drom" && (
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={prepaid}
                  onChange={(e) => setPrepaid(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-slate-700 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Я уже оплатил продавцу
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-medium text-white bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? "Создание…" : "Создать заявку"}
            </button>
          </form>
        </div>

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
