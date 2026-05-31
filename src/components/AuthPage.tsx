import { useState } from "react";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/32b56b6e-7cce-4500-b357-219bf69929ad";

export interface AuthUser {
  id: number;
  username: string;
  balance: number;
}

interface Props {
  onAuth: (user: AuthUser, token: string) => void;
}

type Mode = "login" | "register";

export default function AuthPage({ onAuth }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  async function handleSubmit() {
    setError("");
    if (!username.trim() || !password) {
      setError("Заполните все поля");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: mode, username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка сервера");
      } else {
        localStorage.setItem("casino_token", data.token);
        localStorage.setItem("casino_user", JSON.stringify(data.user));
        onAuth(data.user, data.token);
      }
    } catch {
      setError("Нет соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0a0a0a 0%, #1a0000 50%, #0a0000 100%)" }}
    >
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-40 h-40 opacity-20"
        style={{ borderRight: "1px solid #f5c842", borderBottom: "1px solid #f5c842", borderRadius: "0 0 100% 0" }} />
      <div className="absolute bottom-0 right-0 w-40 h-40 opacity-20"
        style={{ borderLeft: "1px solid #f5c842", borderTop: "1px solid #f5c842", borderRadius: "100% 0 0 0" }} />

      {/* Ambient particles */}
      {[...Array(10)].map((_, i) => (
        <div key={i} className="particle" style={{
          left: `${(i * 10 + 5) % 100}%`,
          width: 5, height: 5,
          background: i % 2 === 0 ? "#f5c842" : "#c8140a",
          animationDelay: `${i * 0.8}s`,
          animationDuration: `${7 + i % 4}s`,
          boxShadow: `0 0 5px ${i % 2 === 0 ? "#f5c842" : "#c8140a"}`,
        }} />
      ))}

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Logo */}
        <div className="text-center mb-10 animate-fade-in-up-1">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 pulse-glow"
            style={{ background: "radial-gradient(circle, #3a1500, #1a0000)", border: "2px solid #c8940a" }}
          >
            <span className="text-3xl">👑</span>
          </div>
          <p className="font-casino text-xs tracking-[0.5em] text-red-500 uppercase mb-1">Grand Royal</p>
          <h1 className="font-display text-4xl font-black gold-shimmer">CASINO</h1>
        </div>

        {/* Tab switcher */}
        <div
          className="flex mb-6 rounded animate-fade-in-up-2 overflow-hidden"
          style={{ border: "1px solid #2a1500" }}
        >
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className="flex-1 py-3 font-casino text-xs tracking-widest uppercase transition-all duration-300"
              style={{
                background: mode === m ? "linear-gradient(135deg, #c8940a, #a07200)" : "transparent",
                color: mode === m ? "#0a0000" : "#6a4500",
                fontWeight: mode === m ? 700 : 400,
              }}
            >
              {m === "login" ? "Вход" : "Регистрация"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-3 animate-fade-in-up-3">
          {/* Username */}
          <div
            className="relative"
            style={{
              border: `1px solid ${focusedField === "user" ? "#f5c842" : "#2a1500"}`,
              borderRadius: 4,
              transition: "border-color 0.3s",
              boxShadow: focusedField === "user" ? "0 0 15px rgba(245,200,66,0.15)" : "none",
            }}
          >
            <Icon name="User" size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-700" />
            <input
              type="text"
              placeholder="Логин"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocusedField("user")}
              onBlur={() => setFocusedField(null)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full bg-transparent py-4 pl-11 pr-4 font-casino text-sm tracking-wider text-yellow-100 placeholder-yellow-900 outline-none"
            />
          </div>

          {/* Password */}
          <div
            className="relative"
            style={{
              border: `1px solid ${focusedField === "pass" ? "#f5c842" : "#2a1500"}`,
              borderRadius: 4,
              transition: "border-color 0.3s",
              boxShadow: focusedField === "pass" ? "0 0 15px rgba(245,200,66,0.15)" : "none",
            }}
          >
            <Icon name="Lock" size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-700" />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("pass")}
              onBlur={() => setFocusedField(null)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full bg-transparent py-4 pl-11 pr-4 font-casino text-sm tracking-wider text-yellow-100 placeholder-yellow-900 outline-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div
              className="py-2 px-4 rounded font-casino text-xs text-red-300 tracking-wide animate-fade-in"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              <Icon name="AlertCircle" size={12} className="inline mr-2 text-red-400" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 font-casino text-sm tracking-[0.3em] uppercase font-semibold transition-all duration-300 mt-1"
            style={{
              background: loading ? "#2a1500" : "linear-gradient(135deg, #c8940a, #a07200)",
              color: loading ? "#4a3000" : "#0a0000",
              border: "1px solid #f5c842",
              borderRadius: 4,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 20px rgba(200,148,10,0.35)",
            }}
          >
            {loading ? (
              <><span className="inline-block animate-spin mr-2">◆</span>Загрузка...</>
            ) : mode === "login" ? (
              <>Войти <Icon name="ArrowRight" size={14} className="inline ml-2" /></>
            ) : (
              <>Зарегистрироваться <Icon name="ArrowRight" size={14} className="inline ml-2" /></>
            )}
          </button>
        </div>

        {/* Hint */}
        <p className="text-center font-casino text-xs tracking-widest text-yellow-900 mt-6 animate-fade-in-up-4">
          {mode === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            className="text-yellow-600 hover:text-yellow-400 transition-colors underline"
          >
            {mode === "login" ? "Зарегистрироваться" : "Войти"}
          </button>
        </p>
      </div>
    </div>
  );
}
