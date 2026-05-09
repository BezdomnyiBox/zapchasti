import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getOrders } from "../services/orders";
import type { OrderListItem, OrderStatus } from "../types/order";

const STATUS_LABELS: Record<OrderStatus, string> = {
  waiting_courier: "Ожидает курьера",
  courier_assigned: "Курьер назначен",
  photo_uploaded: "Фото готовы",
  confirmed: "Подтверждён",
  picked_up: "У курьера",
  handed_to_carrier: "У перевозчика",
  completed: "Завершён",
  cancelled: "Отменён",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  waiting_courier: "lp-status-waiting",
  courier_assigned: "lp-status-progress",
  photo_uploaded: "lp-status-progress",
  confirmed: "lp-status-success",
  picked_up: "lp-status-progress",
  handed_to_carrier: "lp-status-progress",
  completed: "lp-status-success",
  cancelled: "lp-status-cancelled",
};

const workflowItems = [
  {
    number: "01",
    title: "Заявка",
    text: "Создайте заказ по ссылке Drom или описанию детали.",
  },
  {
    number: "02",
    title: "Проверка",
    text: "Курьер забирает деталь и прикладывает фотоотчёт.",
  },
  {
    number: "03",
    title: "Доставка",
    text: "Заказ передаётся перевозчику и отслеживается по статусам.",
  },
];

export default function DashboardClient() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  const activeOrders = useMemo(
    () => orders.filter((order) => !["completed", "cancelled"].includes(order.status)).length,
    [orders],
  );
  const completedOrders = useMemo(
    () => orders.filter((order) => order.status === "completed").length,
    [orders],
  );

  const logout = () => {
    auth?.logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-topbar-inner">
          <Link to="/client" className="app-brand" aria-label="Саха Запчасти">
            <span className="app-brand-mark">СЗ</span>
            САХА ЗАПЧАСТИ
          </Link>

          <nav className="app-nav" aria-label="Навигация клиента">
            <Link to="/catalog">Каталог</Link>
            <Link to="/profile">Профиль</Link>
            <button type="button" onClick={logout}>
              Выйти
            </button>
            <Link to="/client/new" className="app-btn-primary">
              Новый заказ
            </Link>
          </nav>
        </div>
      </header>

      <main className="app-page">
        <section className="app-hero">
          <div>
            <div className="app-kicker">Кабинет клиента</div>
            <h1 className="app-title">Заказы и каталог запчастей</h1>
            <p className="app-subtitle">
              Быстрый доступ к каталогу, созданию заявки и отслеживанию текущих заказов.
              {auth?.user?.username ? ` Аккаунт: ${auth.user.username}.` : ""}
            </p>
          </div>
          <div className="app-actions">
            <Link to="/catalog" className="app-btn-primary">
              Перейти в каталог
            </Link>
            <Link to="/client/new" className="app-btn-secondary">
              Создать заказ
            </Link>
          </div>
        </section>

        <section className="app-section">
          <div className="app-grid app-grid-3">
            <div className="app-stat-card">
              <div className="app-stat-value">{orders.length}</div>
              <div className="app-stat-label">Всего заказов</div>
            </div>
            <div className="app-stat-card">
              <div className="app-stat-value">{activeOrders}</div>
              <div className="app-stat-label">В работе</div>
            </div>
            <div className="app-stat-card">
              <div className="app-stat-value">{completedOrders}</div>
              <div className="app-stat-label">Завершено</div>
            </div>
          </div>
        </section>

        <section className="app-section">
          <div className="app-section-head">
            <div>
              <h2 className="app-section-title">Как проходит заказ</h2>
              <p className="app-section-note">Короткая схема для клиента без маркетинговых блоков.</p>
            </div>
          </div>
          <div className="app-grid app-grid-3">
            {workflowItems.map((item) => (
              <article key={item.number} className="app-card">
                <span className="app-pill">{item.number}</span>
                <h3 className="mt-4 font-display text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--steel-light)]">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="app-section" id="orders">
          <div className="app-section-head">
            <div>
              <h2 className="app-section-title">Мои заказы</h2>
              <p className="app-section-note">Открывайте карточку заказа, чтобы посмотреть детали и фото.</p>
            </div>
            <Link to="/client/new" className="app-btn-secondary">
              + Новый заказ
            </Link>
          </div>

          {loading && <p className="mt-10 text-center text-[color:var(--steel-light)]">Загрузка заказов…</p>}

          {!loading && orders.length === 0 && (
            <div className="app-card text-center">
              <h3 className="font-display text-xl font-semibold">Заказов пока нет</h3>
              <p className="mt-2 text-sm text-[color:var(--steel-light)]">
                Начните с каталога или создайте заявку вручную.
              </p>
              <div className="app-actions justify-center mt-5">
                <Link to="/catalog" className="app-btn-primary">
                  Перейти в каталог
                </Link>
                <Link to="/client/new" className="app-btn-secondary">
                  Создать заказ
                </Link>
              </div>
            </div>
          )}

          {!loading && orders.length > 0 && (
            <div className="app-grid app-grid-2">
              {orders.map((order) => (
                <Link key={order.id} to={`/client/orders/${order.id}`} className="app-card app-card-link">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="lp-order-title">
                        Заказ #{order.id} — {order.part_name || order.drom_url || "Запчасть"}
                      </p>
                      {order.total_price != null && (
                        <p className="lp-order-meta">{order.total_price.toLocaleString("ru-RU")} ₽</p>
                      )}
                    </div>
                    <span className={`lp-status ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                  </div>
                  <p className="lp-order-meta">{new Date(order.created_at).toLocaleString("ru-RU")}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
