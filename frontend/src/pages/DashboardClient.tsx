import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { ORDER_STATUS_BADGE_CLASS, ORDER_STATUS_LABELS } from "../constants/orderStatus";
import { AuthContext } from "../context/AuthContext";
import { getOrders } from "../services/orders";
import type { OrderListItem, OrderStatus } from "../types/order";

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

  const recentOrders = useMemo(() => {
    const sorted = [...orders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return sorted.slice(0, 4);
  }, [orders]);
  const hasMoreOrders = orders.length > recentOrders.length;

  return (
    <div className="app-shell">
      <AppHeader />

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
              <h2 className="app-section-title">Последние заказы</h2>
              <p className="app-section-note">
                Недавние заявки. Полный список — на странице «Заказы».
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/orders" className="app-btn-secondary">
                Все заказы
              </Link>
              <Link to="/client/new" className="app-btn-primary">
                + Новый заказ
              </Link>
            </div>
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
            <>
              <div className="app-grid app-grid-2">
                {recentOrders.map((order) => (
                  <Link key={order.id} to={`/client/orders/${order.id}`} className="app-card app-card-link">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-base font-semibold text-[color:var(--ink)]">
                          Заказ #{order.id} — {order.part_name || order.drom_url || "Запчасть"}
                        </p>
                        {order.total_price != null && (
                          <p className="mt-1 text-sm text-[color:var(--steel-light)]">
                            {order.total_price.toLocaleString("ru-RU")} ₽
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_BADGE_CLASS[order.status as OrderStatus]}`}
                      >
                        {ORDER_STATUS_LABELS[order.status as OrderStatus]}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-[color:var(--steel-light)]">
                      {new Date(order.created_at).toLocaleString("ru-RU")}
                    </p>
                  </Link>
                ))}
              </div>
              {hasMoreOrders ? (
                <div className="mt-6 text-center">
                  <Link to="/orders" className="app-btn-secondary">
                    Показать все заказы ({orders.length})
                  </Link>
                </div>
              ) : null}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
