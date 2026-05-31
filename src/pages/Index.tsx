import { useState, useEffect } from "react";
import AuthPage, { AuthUser } from "@/components/AuthPage";
import LandingPage from "@/components/LandingPage";
import RoulettePage from "@/components/RoulettePage";

const AUTH_URL = "https://functions.poehali.dev/32b56b6e-7cce-4500-b357-219bf69929ad";

type Page = "auth" | "landing" | "roulette";

export default function Index() {
  const [page, setPage] = useState<Page>("auth");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string>("");
  const [balance, setBalanceState] = useState(10000);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("casino_token");
    const savedUser = localStorage.getItem("casino_user");
    if (savedToken && savedUser) {
      try {
        const u: AuthUser = JSON.parse(savedUser);
        fetch(AUTH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "me", token: savedToken }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.user) {
              setUser(data.user);
              setToken(savedToken);
              setBalanceState(data.user.balance);
              setPage("landing");
            } else {
              localStorage.removeItem("casino_token");
              localStorage.removeItem("casino_user");
            }
          })
          .catch(() => {
            setUser(u);
            setToken(savedToken);
            setBalanceState(u.balance);
            setPage("landing");
          })
          .finally(() => setChecking(false));
      } catch {
        setChecking(false);
      }
    } else {
      setChecking(false);
    }
  }, []);

  async function setBalance(newBalance: number) {
    setBalanceState(newBalance);
    if (user) {
      const updated = { ...user, balance: newBalance };
      setUser(updated);
      localStorage.setItem("casino_user", JSON.stringify(updated));
    }
    if (token) {
      fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_balance", token, balance: newBalance }),
      }).catch(() => {});
    }
  }

  function handleAuth(authUser: AuthUser, authToken: string) {
    setUser(authUser);
    setToken(authToken);
    setBalanceState(authUser.balance);
    setPage("landing");
  }

  function handleLogout() {
    localStorage.removeItem("casino_token");
    localStorage.removeItem("casino_user");
    setUser(null);
    setToken("");
    setPage("auth");
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin inline-block text-yellow-600">◆</div>
          <p className="font-casino text-sm tracking-widest text-yellow-800 uppercase">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (page === "auth") {
    return <AuthPage onAuth={handleAuth} />;
  }

  if (page === "roulette") {
    return (
      <RoulettePage
        playerName={user?.username ?? "Игрок"}
        balance={balance}
        setBalance={setBalance}
        onExit={() => setPage("landing")}
      />
    );
  }

  return (
    <LandingPage
      username={user?.username}
      onEnter={() => setPage("roulette")}
      onLogout={handleLogout}
    />
  );
}
