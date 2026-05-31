import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const ADMIN_URL = "https://functions.poehali.dev/e51eafab-85a4-468e-bb28-2942d4c1e42e";

interface Player {
  id: number;
  username: string;
  balance: number;
  luck_multiplier: number;
}

interface Props {
  token: string;
  onBack: () => void;
}

const LUCK_PRESETS = [
  { label: "x0.1", value: 0.1, color: "#7f1d1d", desc: "Почти нет шансов" },
  { label: "x0.25", value: 0.25, color: "#991b1b", desc: "Сильная антиудача" },
  { label: "x0.5", value: 0.5, color: "#b91c1c", desc: "Антиудача" },
  { label: "x1", value: 1.0, color: "#3a3a3a", desc: "Обычно" },
  { label: "x2", value: 2.0, color: "#1a4a1a", desc: "Удача x2" },
  { label: "x3", value: 3.0, color: "#166534", desc: "Удача x3" },
  { label: "x5", value: 5.0, color: "#14532d", desc: "Большая удача" },
  { label: "x10", value: 10.0, color: "#c8940a", desc: "МАКСИМУМ" },
];

export default function AdminPage({ token, onBack }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Player | null>(null);
  const [tab, setTab] = useState<"chips" | "luck">("chips");
  const [chipMode, setChipMode] = useState<"add" | "subtract" | "set">("add");
  const [chipAmount, setChipAmount] = useState("");
  const [luckValue, setLuckValue] = useState(1.0);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    const res = await fetch(ADMIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "list_users", token }),
    });
    const data = await res.json();
    if (data.users) setPlayers(data.users);
    setLoading(false);
  }, [token]);

  useEffect(() => { loadPlayers(); }, [loadPlayers]);

  async function handleSetBalance() {
    if (!selected || !chipAmount) return;
    const amount = parseInt(chipAmount);
    if (isNaN(amount) || amount < 0) return;
    setSaving(true);
    const res = await fetch(ADMIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_balance", token, username: selected.username, amount, mode: chipMode }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.user) {
      setPlayers((p) => p.map((u) => u.id === data.user.id ? data.user : u));
      setSelected(data.user);
      setChipAmount("");
      const diff = data.user.balance - selected.balance;
      showToast(`${selected.username}: баланс ${diff >= 0 ? "+" : ""}${diff} → ${data.user.balance}`, true);
    } else {
      showToast(data.error || "Ошибка", false);
    }
  }

  async function handleSetLuck() {
    if (!selected) return;
    setSaving(true);
    const res = await fetch(ADMIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_luck", token, username: selected.username, multiplier: luckValue }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.user) {
      setPlayers((p) => p.map((u) => u.id === data.user.id ? data.user : u));
      setSelected(data.user);
      const preset = LUCK_PRESETS.find((p) => p.value === luckValue);
      showToast(`${selected.username}: удача установлена ${preset?.label ?? luckValue}`, true);
    } else {
      showToast(data.error || "Ошибка", false);
    }
  }

  function luckLabel(v: number) {
    if (v < 1) return `x${v} 🔻`;
    if (v === 1) return "обычная";
    return `x${v} 🍀`;
  }

  function luckColor(v: number) {
    if (v < 1) return "#ef4444";
    if (v === 1) return "#6b7280";
    if (v >= 5) return "#f5c842";
    return "#22c55e";
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #0a0a0a 0%, #1a0000 60%, #0a0000 100%)" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#2a1500" }}>
        <button onClick={onBack} className="flex items-center gap-2 font-casino text-xs tracking-widest text-yellow-700 hover:text-yellow-400 transition-colors uppercase">
          <Icon name="ArrowLeft" size={14} />
          Назад
        </button>
        <div className="flex items-center gap-2">
          <span className="text-red-500 text-lg">⚡</span>
          <h1 className="font-display text-xl font-bold" style={{ color: "#f5c842" }}>Админ-панель</h1>
          <span className="text-red-500 text-lg">⚡</span>
        </div>
        <button onClick={loadPlayers} className="font-casino text-xs tracking-widest text-yellow-700 hover:text-yellow-400 transition-colors uppercase flex items-center gap-1">
          <Icon name="RefreshCw" size={13} />
          Обновить
        </button>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 p-4 md:p-6 flex-1">

        {/* Players list */}
        <div className="lg:w-80 flex flex-col gap-3">
          <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #2a1500" }}>
            <p className="font-casino text-xs tracking-widest text-yellow-700 uppercase mb-3">
              Игроки ({players.length})
            </p>
            {loading ? (
              <div className="text-center py-8 text-yellow-800 font-casino text-sm animate-pulse">Загрузка...</div>
            ) : (
              <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
                {players.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelected(p); setChipAmount(""); setLuckValue(p.luck_multiplier); }}
                    className="flex items-center justify-between px-3 py-2.5 rounded transition-all duration-150 text-left"
                    style={{
                      background: selected?.id === p.id ? "rgba(200,148,10,0.15)" : "transparent",
                      border: selected?.id === p.id ? "1px solid #c8940a44" : "1px solid transparent",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-casino font-bold text-xs"
                        style={{ background: "linear-gradient(135deg, #c8940a, #7a5500)", color: "#0a0000" }}
                      >
                        {p.username[0].toUpperCase()}
                      </div>
                      <span className="font-casino text-sm text-yellow-200">{p.username}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-casino text-xs text-yellow-400">{p.balance.toLocaleString()}</p>
                      {p.luck_multiplier !== 1 && (
                        <p className="font-casino text-xs" style={{ color: luckColor(p.luck_multiplier) }}>
                          {luckLabel(p.luck_multiplier)}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action panel */}
        <div className="flex-1">
          {!selected ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center opacity-30">
                <Icon name="MousePointerClick" size={48} className="text-yellow-700 mx-auto mb-3" />
                <p className="font-casino text-sm tracking-widest text-yellow-700 uppercase">Выберите игрока</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Selected player info */}
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #2a1500" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-casino font-bold text-lg"
                      style={{ background: "linear-gradient(135deg, #c8940a, #7a5500)", color: "#0a0000" }}
                    >
                      {selected.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-casino text-base font-bold text-yellow-300">{selected.username}</p>
                      <p className="font-casino text-xs text-yellow-700">ID: {selected.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-casino text-xl font-bold text-yellow-400">{selected.balance.toLocaleString()}</p>
                    <p className="font-casino text-xs text-yellow-700">фишек</p>
                    <p className="font-casino text-xs mt-0.5" style={{ color: luckColor(selected.luck_multiplier) }}>
                      Удача: {luckLabel(selected.luck_multiplier)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex rounded overflow-hidden" style={{ border: "1px solid #2a1500" }}>
                {(["chips", "luck"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="flex-1 py-3 font-casino text-xs tracking-widest uppercase transition-all duration-200"
                    style={{
                      background: tab === t ? "linear-gradient(135deg, #c8940a, #7a5500)" : "transparent",
                      color: tab === t ? "#0a0000" : "#6a4500",
                      fontWeight: tab === t ? 700 : 400,
                    }}
                  >
                    {t === "chips" ? "🎰 Фишки" : "🍀 Удача"}
                  </button>
                ))}
              </div>

              {/* Chips tab */}
              {tab === "chips" && (
                <div className="rounded-xl p-5 flex flex-col gap-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #2a1500" }}>
                  <div>
                    <p className="font-casino text-xs tracking-widest text-yellow-700 uppercase mb-3">Действие</p>
                    <div className="flex gap-2">
                      {(["add", "subtract", "set"] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setChipMode(m)}
                          className="flex-1 py-2.5 font-casino text-xs tracking-widest uppercase rounded transition-all"
                          style={{
                            background: chipMode === m
                              ? m === "add" ? "#14532d" : m === "subtract" ? "#7f1d1d" : "#1e3a5f"
                              : "rgba(255,255,255,0.04)",
                            border: chipMode === m ? "1px solid #f5c842" : "1px solid #2a1500",
                            color: chipMode === m ? "#f5e0c0" : "#4a3000",
                          }}
                        >
                          {m === "add" ? "+ Выдать" : m === "subtract" ? "− Забрать" : "= Установить"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-casino text-xs tracking-widest text-yellow-700 uppercase mb-2">Количество</p>
                    <div className="flex gap-2 flex-wrap mb-3">
                      {[100, 500, 1000, 5000, 10000, 50000].map((v) => (
                        <button
                          key={v}
                          onClick={() => setChipAmount(String(v))}
                          className="px-3 py-1.5 font-casino text-xs rounded transition-all"
                          style={{
                            background: chipAmount === String(v) ? "rgba(245,200,66,0.2)" : "rgba(255,255,255,0.05)",
                            border: chipAmount === String(v) ? "1px solid #f5c842" : "1px solid #2a1500",
                            color: chipAmount === String(v) ? "#f5c842" : "#6a4500",
                          }}
                        >
                          {v.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      placeholder="Или введите вручную..."
                      value={chipAmount}
                      onChange={(e) => setChipAmount(e.target.value)}
                      className="w-full bg-transparent py-3 px-4 font-casino text-sm text-yellow-100 placeholder-yellow-900 outline-none rounded"
                      style={{ border: "1px solid #2a1500" }}
                    />
                  </div>

                  {chipAmount && (
                    <div className="py-2 px-4 rounded font-casino text-xs" style={{ background: "rgba(245,200,66,0.07)", border: "1px solid #2a1500", color: "#c8940a" }}>
                      {chipMode === "add" && `${selected.username} получит +${parseInt(chipAmount || "0").toLocaleString()} → итого ${(selected.balance + parseInt(chipAmount || "0")).toLocaleString()}`}
                      {chipMode === "subtract" && `У ${selected.username} спишется ${parseInt(chipAmount || "0").toLocaleString()} → итого ${Math.max(0, selected.balance - parseInt(chipAmount || "0")).toLocaleString()}`}
                      {chipMode === "set" && `Баланс ${selected.username} станет ${parseInt(chipAmount || "0").toLocaleString()}`}
                    </div>
                  )}

                  <button
                    onClick={handleSetBalance}
                    disabled={saving || !chipAmount}
                    className="w-full py-4 font-casino text-sm tracking-widest uppercase font-semibold transition-all duration-200"
                    style={{
                      background: saving || !chipAmount ? "#1a0a00" : "linear-gradient(135deg, #c8940a, #a07200)",
                      color: saving || !chipAmount ? "#3a2000" : "#0a0000",
                      border: "1px solid #f5c842",
                      borderRadius: 4,
                      cursor: saving || !chipAmount ? "not-allowed" : "pointer",
                    }}
                  >
                    {saving ? "Сохраняю..." : "Применить"}
                  </button>
                </div>
              )}

              {/* Luck tab */}
              {tab === "luck" && (
                <div className="rounded-xl p-5 flex flex-col gap-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #2a1500" }}>
                  <div>
                    <p className="font-casino text-xs tracking-widest text-yellow-700 uppercase mb-3">
                      Множитель удачи (сработает один раз, потом сбросится)
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {LUCK_PRESETS.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => setLuckValue(p.value)}
                          className="flex flex-col items-center py-3 px-2 rounded transition-all"
                          style={{
                            background: luckValue === p.value ? `${p.color}66` : "rgba(255,255,255,0.04)",
                            border: luckValue === p.value ? "2px solid #f5c842" : "1px solid #2a1500",
                          }}
                        >
                          <span className="font-casino font-bold text-sm" style={{ color: luckValue === p.value ? "#f5c842" : "#6a4500" }}>
                            {p.label}
                          </span>
                          <span className="font-casino text-xs mt-0.5 text-center leading-tight" style={{ color: "#4a3000", fontSize: 9 }}>
                            {p.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="py-3 px-4 rounded font-casino text-xs" style={{ background: "rgba(245,200,66,0.07)", border: "1px solid #2a1500", color: "#c8940a" }}>
                    {luckValue < 1
                      ? `🔻 ${selected.username} — антиудача ${luckValue}x. Шансы выиграть в ${(1/luckValue).toFixed(1)} раза ниже.`
                      : luckValue === 1
                      ? `${selected.username} — обычные шансы.`
                      : `🍀 ${selected.username} — удача ${luckValue}x. Шансы выиграть в ${luckValue} раза выше на следующий спин.`}
                  </div>

                  <button
                    onClick={handleSetLuck}
                    disabled={saving}
                    className="w-full py-4 font-casino text-sm tracking-widest uppercase font-semibold transition-all duration-200"
                    style={{
                      background: saving ? "#1a0a00" : luckValue < 1 ? "linear-gradient(135deg, #7f1d1d, #991b1b)" : "linear-gradient(135deg, #c8940a, #a07200)",
                      color: saving ? "#3a2000" : "#fff",
                      border: `1px solid ${luckValue < 1 ? "#ef4444" : "#f5c842"}`,
                      borderRadius: 4,
                      cursor: saving ? "not-allowed" : "pointer",
                    }}
                  >
                    {saving ? "Сохраняю..." : luckValue < 1 ? "Назначить антиудачу" : luckValue === 1 ? "Сбросить удачу" : "Выдать удачу"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded font-casino text-sm tracking-wide animate-fade-in z-50"
          style={{
            background: toast.ok ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
            border: `1px solid ${toast.ok ? "#22c55e55" : "#ef444455"}`,
            color: toast.ok ? "#86efac" : "#fca5a5",
            backdropFilter: "blur(10px)",
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
