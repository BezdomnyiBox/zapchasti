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
      if (user) navigate(user.role === "admin" ? "/picker" : "/client", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "2rem auto", padding: "1rem" }}>
      <h1>Регистрация</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder={`Имя пользователя (${MIN_USERNAME}-${MAX_USERNAME} символов)`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={MIN_USERNAME}
            maxLength={MAX_USERNAME}
            autoComplete="username"
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="password"
            placeholder={`Пароль (минимум ${MIN_PASSWORD} символов)`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={MIN_PASSWORD}
            autoComplete="new-password"
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ width: "100%", padding: "0.6rem" }}>
          {loading ? "Регистрация…" : "Зарегистрироваться"}
        </button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        Уже есть аккаунт? <Link to="/login">Вход</Link>
      </p>
    </div>
  );
}
