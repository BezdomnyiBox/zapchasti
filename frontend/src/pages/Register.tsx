import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const MIN_PASSWORD = 8;
const MIN_USERNAME = 3;
const MAX_USERNAME = 100;

export default function Register() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    const u = username.trim();
    if (u.length < MIN_USERNAME) return;
    if (password.length < MIN_PASSWORD) return;
    setLoading(true);
    try {
      const user = await auth.register(email.trim(), u, password);
      if (user) {
        const dest = user.role === "courier" ? "/courier" : user.role === "carrier" ? "/carrier" : "/client";
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
          <h1 className="auth-title mt-6">Регистрация</h1>
          <p className="auth-subtitle">Создайте аккаунт клиента для заказов и каталога.</p>
        </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="register-email" className="app-label">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="app-input"
              />
            </div>
            <div>
              <label htmlFor="register-username" className="app-label">
                Имя пользователя
              </label>
              <input
                id="register-username"
                type="text"
                placeholder={`Имя пользователя (${MIN_USERNAME}-${MAX_USERNAME} символов)`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={MIN_USERNAME}
                maxLength={MAX_USERNAME}
                autoComplete="username"
                className="app-input"
              />
            </div>
            <div>
              <label htmlFor="register-password" className="app-label">
                Пароль
              </label>
              <input
                id="register-password"
                type="password"
                placeholder={`Пароль (минимум ${MIN_PASSWORD} символов)`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={MIN_PASSWORD}
                autoComplete="new-password"
                className="app-input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="app-btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Регистрация…" : "Зарегистрироваться"}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-[color:var(--steel-light)]">
            Уже есть аккаунт?{" "}
            <Link
              to="/login"
              className="auth-link"
            >
              Вход
            </Link>
          </p>
      </div>
    </div>
  );
}
