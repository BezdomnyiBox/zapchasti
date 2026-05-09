import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);
    try {
      const u = await auth.login(username.trim(), password);
      if (u) {
        const dest = u.role === "courier" ? "/courier" : u.role === "carrier" ? "/carrier" : "/client";
        navigate(dest, { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/client" className="app-brand justify-center">
            <span className="app-brand-mark">СЗ</span>
            САХА ЗАПЧАСТИ
          </Link>
          <h1 className="auth-title mt-6">Вход</h1>
          <p className="auth-subtitle">Войдите, чтобы открыть заказы, каталог и профиль.</p>
        </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-username" className="app-label">
                Логин или email
              </label>
              <input
                id="login-username"
                type="text"
                placeholder="Логин или email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="app-input"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="app-label">
                Пароль
              </label>
              <input
                id="login-password"
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="app-input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="app-btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Вход…" : "Войти"}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-[color:var(--steel-light)]">
            Нет аккаунта?{" "}
            <Link
              to="/register"
              className="auth-link"
            >
              Регистрация
            </Link>
          </p>
      </div>
    </div>
  );
}
