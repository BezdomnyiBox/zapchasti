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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 text-center mb-6">
            Регистрация
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="register-email" className="sr-only">
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
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label htmlFor="register-username" className="sr-only">
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
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label htmlFor="register-password" className="sr-only">
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
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-transparent transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-medium text-white bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? "Регистрация…" : "Зарегистрироваться"}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">
            Уже есть аккаунт?{" "}
            <Link
              to="/login"
              className="font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 underline underline-offset-2 transition"
            >
              Вход
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
