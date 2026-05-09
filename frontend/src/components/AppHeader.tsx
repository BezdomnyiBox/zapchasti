import { useContext, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useCart } from "../hooks/useCart";

export type AppHeaderProps = {
  /** Полная замена содержимого `<nav>` */
  nav?: ReactNode;
  /** Куда ведёт логотип (по умолчанию — от роли) */
  brandTo?: string;
};

function brandHrefForUser(user: { role: string } | null | undefined): string {
  if (!user) return "/catalog";
  if (user.role === "courier") return "/courier";
  if (user.role === "carrier") return "/carrier";
  if (user.role === "admin") return "/admin";
  return "/client";
}

export default function AppHeader({ nav, brandTo }: AppHeaderProps) {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const { cart } = useCart();
  const user = auth?.user;
  const home = brandTo ?? brandHrefForUser(user);

  const logout = () => {
    auth?.logout();
    navigate("/login", { replace: true });
  };

  const cartCount =
    user?.role === "client" ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  const defaultNav = (() => {
    if (!user) {
      return (
        <>
          <Link to="/catalog">Каталог</Link>
          <Link to="/login">Войти</Link>
          <Link to="/register">Регистрация</Link>
        </>
      );
    }
    if (user.role === "client") {
      return (
        <>
          <Link to="/catalog">Каталог</Link>
          <Link to="/orders">Заказы</Link>
          <Link to="/cart" className="app-header-cart">
            Корзина
            {cartCount > 0 ? (
              <span className="app-header-badge">{cartCount > 99 ? "99+" : cartCount}</span>
            ) : null}
          </Link>
          <Link to="/profile">Профиль</Link>
          <button type="button" onClick={logout}>
            Выйти
          </button>
          <Link to="/client/new" className="app-btn-primary">
            Новый заказ
          </Link>
        </>
      );
    }
    if (user.role === "courier") {
      return (
        <>
          <Link to="/profile">Профиль</Link>
          <button type="button" onClick={logout}>
            Выйти
          </button>
        </>
      );
    }
    if (user.role === "carrier") {
      return (
        <>
          <Link to="/profile">Профиль</Link>
          <button type="button" onClick={logout}>
            Выйти
          </button>
        </>
      );
    }
    if (user.role === "admin") {
      return (
        <>
          <Link to="/admin">Админка</Link>
          <button type="button" onClick={logout}>
            Выйти
          </button>
        </>
      );
    }
    return null;
  })();

  return (
    <header className="app-topbar">
      <div className="app-topbar-inner">
        <Link to={home} className="app-brand" aria-label="Саха Запчасти">
          <span className="app-brand-mark">СЗ</span>
          САХА ЗАПЧАСТИ
        </Link>
        <nav className="app-nav" aria-label="Основная навигация">
          {nav ?? defaultNav}
        </nav>
      </div>
    </header>
  );
}
