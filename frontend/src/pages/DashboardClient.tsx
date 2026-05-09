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

const marqueeBrands = [
  "Toyota",
  "Honda",
  "Lada",
  "KIA",
  "Hyundai",
  "BMW",
  "Mercedes",
  "Volkswagen",
  "Ford",
  "Audi",
  "Nissan",
  "Mitsubishi",
];

const popularSearches = ["Тормозные колодки", "Масляный фильтр", "Аккумулятор", "Амортизатор"];

const steps = [
  {
    number: "01",
    title: "Найди или опиши деталь",
    text: "Открой каталог, введи артикул или создай заявку, если нужен подбор по фото, модели и описанию.",
  },
  {
    number: "02",
    title: "Оформи заказ",
    text: "Укажи адрес продавца и доставки. Заявка сразу попадёт в работу курьера и менеджера.",
  },
  {
    number: "03",
    title: "Курьер проверит",
    text: "Курьер заберёт деталь, сделает фотоотчёт и передаст её перевозчику для отправки.",
  },
  {
    number: "04",
    title: "Следи за статусом",
    text: "Все этапы остаются в личном кабинете: от назначения курьера до завершения доставки.",
  },
];

const features = [
  ["01", "Фотоотчёт на каждом этапе", "Курьер фиксирует состояние детали при получении, чтобы у клиента было подтверждение."],
  ["02", "Каталог и ручная заявка", "Можно искать по базе или описать нужную деталь, если точного артикула пока нет."],
  ["03", "Доставка по России", "Сервис связывает продавца, курьера и перевозчика в единой цепочке заказа."],
  ["04", "Личный кабинет клиента", "История заказов, статусы и суммы доступны сразу после авторизации."],
  ["05", "Прозрачные статусы", "Каждый заказ показывает текущий этап: от ожидания курьера до завершения."],
  ["06", "Поддержка сложных заказов", "Комментарии, адреса и размеры груза помогают заранее учесть нюансы доставки."],
];

const categories = [
  ["ДВ", "Двигатель", "Моторы, навесное, фильтры", "двигатель"],
  ["ТР", "Тормозная система", "Колодки, диски, суппорты", "тормоза"],
  ["ПД", "Подвеска и рулевое", "Стойки, рычаги, тяги", "подвеска"],
  ["ЭЛ", "Электрика", "Датчики, блоки, аккумуляторы", "электрика"],
  ["КЗ", "Кузов и оптика", "Фары, двери, бамперы", "кузов"],
  ["КЛ", "Климат-контроль", "Печка, кондиционер, радиаторы", "климат"],
  ["КП", "Трансмиссия", "КПП, приводы, сцепление", "трансмиссия"],
  ["МФ", "Масла и фильтры", "Расходники для ТО", "фильтр"],
];

export default function DashboardClient() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [carBrand, setCarBrand] = useState("");
  const [carModel, setCarModel] = useState("");

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
  const marqueeItems = [...marqueeBrands, ...marqueeBrands];

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = [searchQuery, carBrand, carModel].map((item) => item.trim()).filter(Boolean).join(" ");
    navigate(query ? `/catalog?q=${encodeURIComponent(query)}` : "/catalog");
  };

  const logout = () => {
    auth?.logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="client-landing">
      <header className="lp-nav">
        <Link to="/client" className="lp-logo" aria-label="Саха Запчасти">
          <span className="lp-logo-mark">СЗ</span>
          САХА ЗАПЧАСТИ
        </Link>

        <div className="lp-nav-links">
          <a href="#orders">Мои заказы</a>
          <a href="#how">Как работает</a>
          <a href="#delivery">Доставка</a>
          <Link to="/profile">Профиль</Link>
          <button type="button" onClick={logout}>
            Выйти
          </button>
          <Link to="/client/new" className="lp-nav-cta">
            Новый заказ
          </Link>
        </div>
      </header>

      <main>
        <section className="lp-hero">
          <div>
            <div className="lp-badge">Личный кабинет клиента</div>
            <h1 className="lp-title">
              Найди нужную <em>деталь</em> и доставь её без лишних звонков
            </h1>
            <p className="lp-subtitle">
              Каталог, ручная заявка, курьерская проверка и статусы заказа собраны в одной клиентской странице.
              {auth?.user?.username ? ` Вы вошли как ${auth.user.username}.` : ""}
            </p>

            <div className="lp-actions">
              <Link to="/client/new" className="lp-btn-primary">
                Создать заказ →
              </Link>
              <Link to="/catalog" className="lp-btn-secondary">
                Открыть каталог
              </Link>
            </div>

            <div className="lp-stats" aria-label="Статистика клиента">
              <div>
                <div className="lp-stat-num">{orders.length}</div>
                <div className="lp-stat-label">Всего заказов</div>
              </div>
              <div>
                <div className="lp-stat-num">{activeOrders}</div>
                <div className="lp-stat-label">В работе</div>
              </div>
              <div>
                <div className="lp-stat-num">{completedOrders}</div>
                <div className="lp-stat-label">Завершено</div>
              </div>
            </div>
          </div>

          <div className="lp-panel">
            <form className="lp-search-card" onSubmit={submitSearch}>
              <h2 className="lp-card-title">Быстрый поиск запчасти</h2>
              <div className="lp-search-grid">
                <div className="lp-field">
                  <label htmlFor="client-car-brand">Марка</label>
                  <input
                    id="client-car-brand"
                    className="lp-input"
                    value={carBrand}
                    onChange={(event) => setCarBrand(event.target.value)}
                    placeholder="Toyota, Honda..."
                  />
                </div>
                <div className="lp-field">
                  <label htmlFor="client-car-model">Модель</label>
                  <input
                    id="client-car-model"
                    className="lp-input"
                    value={carModel}
                    onChange={(event) => setCarModel(event.target.value)}
                    placeholder="Camry, Fit..."
                  />
                </div>
              </div>
              <div className="lp-field">
                <label htmlFor="client-part-query">Название / артикул</label>
                <input
                  id="client-part-query"
                  className="lp-input"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Тормозные колодки, 04465-06200..."
                />
              </div>
              <button type="submit" className="lp-btn-primary w-full">
                Найти запчасть
              </button>
              <div className="lp-tags">
                <span className="text-xs text-[color:var(--mid)]">Популярное:</span>
                {popularSearches.map((item) => (
                  <Link key={item} to={`/catalog?q=${encodeURIComponent(item)}`} className="lp-tag">
                    {item}
                  </Link>
                ))}
              </div>
            </form>
          </div>
        </section>

        <div className="lp-marquee-wrap" aria-hidden="true">
          <div className="lp-marquee">
            {marqueeItems.map((brand, index) => (
              <span key={`${brand}-${index}`} className="lp-marquee-item">
                {brand}
              </span>
            ))}
          </div>
        </div>

        <section className="lp-section" id="how">
          <div className="lp-section-label">Процесс</div>
          <h2 className="lp-section-title">
            Как клиентский заказ <em>проходит путь</em>
          </h2>
          <div className="lp-steps">
            {steps.map((step) => (
              <article key={step.number} className="lp-step">
                <div className="lp-step-num">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-section lp-section-dark">
          <div className="lp-section-label">Преимущества</div>
          <h2 className="lp-section-title">
            Почему удобно работать через <em>Саха Запчасти</em>
          </h2>
          <div className="lp-features-grid">
            {features.map(([icon, title, text]) => (
              <article key={title} className="lp-feature">
                <div className="lp-feature-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-section" id="catalog">
          <div className="lp-section-label">Каталог</div>
          <h2 className="lp-section-title">
            Популярные <em>категории</em>
          </h2>
          <div className="lp-cats-grid">
            {categories.map(([icon, title, description, query]) => (
              <Link key={title} to={`/catalog?q=${encodeURIComponent(query)}`} className="lp-category">
                <div className="lp-cat-icon">{icon}</div>
                <h3>{title}</h3>
                <span>{description}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="lp-section" id="delivery">
          <div className="lp-delivery">
            <div className="lp-delivery-copy">
              <div className="lp-section-label">Доставка</div>
              <h2 className="lp-section-title">
                От продавца до клиента — <em>с понятными статусами</em>
              </h2>
              <p>
                В заказе хранится адрес продавца, адрес доставки, размер груза и комментарий.
                Это помогает курьеру и перевозчику быстро согласовать забор детали и довести заказ до завершения.
              </p>
              <div className="lp-actions">
                <Link to="/client/new" className="lp-btn-primary">
                  Оформить доставку
                </Link>
                <a href="#orders" className="lp-btn-secondary">
                  Проверить статусы
                </a>
              </div>
            </div>

            <div className="lp-timeline">
              {[
                ["01", "Заявка создана", "Клиент указал деталь, продавца и адрес доставки."],
                ["02", "Курьер назначен", "Курьер забирает заказ и загружает фотоотчёт."],
                ["03", "Передано перевозчику", "Деталь едет выбранным маршрутом до клиента."],
                ["04", "Заказ завершён", "Клиент получил деталь, история осталась в кабинете."],
              ].map(([number, title, text]) => (
                <div key={number} className="lp-timeline-item">
                  <div className="lp-timeline-dot">{number}</div>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section" id="orders">
          <div className="lp-orders-head">
            <div>
              <div className="lp-section-label">Личный кабинет</div>
              <h2 className="lp-section-title">
                Мои <em>заказы</em>
              </h2>
            </div>
            <Link to="/client/new" className="lp-btn-dark">
              + Новый заказ
            </Link>
          </div>

          {loading && <p className="mt-10 text-center text-[color:var(--steel-light)]">Загрузка заказов…</p>}

          {!loading && orders.length === 0 && (
            <div className="lp-empty">
              <h3 className="font-display text-xl font-semibold">Заказов пока нет</h3>
              <p className="mt-2">Создайте первый заказ или начните с поиска детали в каталоге.</p>
              <div className="lp-actions justify-center">
                <Link to="/client/new" className="lp-btn-primary">
                  Создать заказ
                </Link>
                <Link to="/catalog" className="lp-btn-secondary">
                  Перейти в каталог
                </Link>
              </div>
            </div>
          )}

          {!loading && orders.length > 0 && (
            <div className="lp-orders-grid">
              {orders.map((order) => (
                <Link key={order.id} to={`/client/orders/${order.id}`} className="lp-order-card">
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

        <section className="lp-cta">
          <div className="lp-cta-content">
            <h2>Нужна деталь, которой нет в каталоге?</h2>
            <p>Опишите автомобиль, артикул или приложите ссылку Drom — заявка попадёт в работу как обычный заказ.</p>
          </div>
          <div className="lp-cta-actions">
            <Link to="/client/new" className="lp-btn-light">
              Создать заявку
            </Link>
            <Link to="/catalog" className="lp-btn-secondary">
              Посмотреть каталог
            </Link>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div>
          <Link to="/client" className="lp-logo">
            <span className="lp-logo-mark">СЗ</span>
            САХА ЗАПЧАСТИ
          </Link>
          <p className="mt-4 max-w-sm">
            Маркетплейс автозапчастей с заявками, каталогом, курьерской проверкой и доставкой по России.
          </p>
        </div>
        <div>
          <h3>Клиенту</h3>
          <nav>
            <Link to="/client/new">Новый заказ</Link>
            <Link to="/catalog">Каталог</Link>
            <a href="#orders">Мои заказы</a>
          </nav>
        </div>
        <div>
          <h3>Сервис</h3>
          <nav>
            <a href="#how">Как работает</a>
            <a href="#delivery">Доставка</a>
            <Link to="/profile">Профиль</Link>
          </nav>
        </div>
        <div>
          <h3>Статус</h3>
          <p>{activeOrders > 0 ? `Сейчас в работе: ${activeOrders}` : "Активных заказов пока нет"}</p>
        </div>
      </footer>
    </div>
  );
}
