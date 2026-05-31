import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const ADMIN_URL = "https://functions.poehali.dev/e51eafab-85a4-468e-bb28-2942d4c1e42e";
const SUPER_ADMIN = "Lavrov1yList";

interface Player {
  id: number;
  username: string;
  balance: number;
  luck_multiplier: number;
  is_admin: boolean;
}

interface Props {
  token: string;
  callerUsername: string;
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

export default function AdminPage({ token, callerUsername, onBack }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Player | null>(null);
  const [tab, setTab] = useState<"chips" | "luck" | "rights">("chips");
  const [chipMode, setChipMode] = useState<"add" | "subtract" | "set">("add");
  const [chipAmount, setChipAmount] = useState("");
  const [luckValue, setLuckValue] = useState(1.0);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; win: boolean } | null>(null);

  const isSuper = callerUsername === SUPER_ADMIN;

  const showToast = (msg: string, win: boolean) => {
    setToast({ msg, win });
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

  const filtered = players.filter((p) =>
    p.username.toLowerCase().includes(search.toLowerCase())
  );

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
      showToast(`${selected.username}: баланс ${diff >= 0 ? "+" : ""}${diff.toLocaleString()} → ${data.user.balance.toLocaleString()}`, true);
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
      showToast(`${selected.username}: удача ${preset?.label ?? luckValue}`, true);
    } else {
      showToast(data.error || "Ошибка", false);
    }
  }

  async function handleSetAdmin(grant: boolean) {
    if (!selected || !isSuper) return;
    setSaving(true);
    const res = await fetch(ADMIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_admin", token, username: selected.username, grant }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.user) {
      setPlayers((p) => p.map((u) => u.id === data.user.id ? data.user : u));
      setSelected(data.user);
      showToast(`${selected.username}: права ${grant ? "выданы ✓" : "отозваны"}`, true);
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

  const tabs = [
    { key: "chips" as const, label: "🎰 Фишки" },
    { key: "luck" as const, label: "🍀 Удача" },
    ...(isSuper ? [{ key: "rights" as const, label: "⚡ Права" }] : []),
  ];

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
          {isSuper && <span className="font-casino text-xs px-2 py-0.5 rounded" style={{ background: "rgba(245,200,66,0.15)", border: "1px solid #c8940a44", color: "#f5c842" }}>Суперадмин</span>}
          <span className="text-red-500 text-lg">⚡</span>
        </div>
        <button onClick={loadPlayers} className="font-casino text-xs tracking-widest text-yellow-700 hover:text-yellow-400 transition-colors uppercase flex items-center gap-1">
          <Icon name="RefreshCw" size={13} />
          Обновить
        </button>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 p-4 md:p-6 flex-1">

        {/* Players list + search */}
        <div className="lg:w-80 flex flex-col gap-3">
          <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #2a1500" }}>
            {/* Search */}
            <div className="relative mb-3">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-800" />
              <input
                type="text"
                placeholder="Поиск по нику..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent py-2.5 pl-9 pr-3 font-casino text-xs text-yellow-100 placeholder-yellow-900 outline-none rounded"
                style={{ border: "1px solid #2a1500" }}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-800 hover:text-yellow-500">
                  <Icon name="X" size={12} />
                </button>
              )}
            </div>

            <p className="font-casino text-xs tracking-widest text-yellow-700 uppercase mb-2">
              {search ? `Найдено: ${filtered.length}` : `Игроки (${players.length})`}
            </p>

            {loading ? (
              <div className="text-center py-8 text-yellow-800 font-casino text-sm animate-pulse">Загрузка...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-6 opacity-30">
                <p className="font-casino text-xs text-yellow-700">Никого не найдено</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 max-h-[55vh] overflow-y-auto">
                {filtered.map((p) => (
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
                        className="w-7 h-7 rounded-full flex items-center justify-center font-casino font-bold text-xs flex-shrink-0"
                        style={{
                          background: p.username === SUPER_ADMIN
                            ? "linear-gradient(135deg, #ef4444, #7f1d1d)"
                            : p.is_admin
                            ? "linear-gradient(135deg, #c8940a, #7a5500)"
                            : "linear-gradient(135deg, #374151, #1f2937)",
                          color: "#fff",
                        }}
                      >
                        {p.username[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="font-casino text-xs text-yellow-200 block">{p.username}</span>
                        {p.is_admin && p.username !== SUPER_ADMIN && (
                          <span className="font-casino text-xs" style={{ color: "#c8940a", fontSize: 9 }}>admin</span>
                        )}
                        {p.username === SUPER_ADMIN && (
                          <span className="font-casino text-xs" style={{ color: "#ef4444", fontSize: 9 }}>super</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-casino text-xs text-yellow-400">{p.balance.toLocaleString()}</p>
                      {p.luck_multiplier !== 1 && (
                        <p className="font-casino text-xs" style={{ color: luckColor(p.luck_multiplier), fontSize: 9 }}>
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
              {/* Selected player card */}
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #2a1500" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-casino font-bold text-lg"
                      style={{
                        background: selected.username === SUPER_ADMIN
                          ? "linear-gradient(135deg, #ef4444, #7f1d1d)"
                          : selected.is_admin
                          ? "linear-gradient(135deg, #c8940a, #7a5500)"
                          : "linear-gradient(135deg, #374151, #1f2937)",
                        color: "#fff",
                      }}
                    >
                      {selected.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-casino text-base font-bold text-yellow-300">{selected.username}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {selected.username === SUPER_ADMIN && (
                          <span className="font-casino text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", fontSize: 9 }}>SUPER</span>
                        )}
                        {selected.is_admin && selected.username !== SUPER_ADMIN && (
                          <span className="font-casino text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(200,148,10,0.15)", color: "#f5c842", fontSize: 9 }}>ADMIN</span>
                        )}
                        <p className="font-casino text-xs text-yellow-800">ID: {selected.id}</p>
                      </div>
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
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className="flex-1 py-3 font-casino text-xs tracking-widest uppercase transition-all duration-200"
                    style={{
                      background: tab === t.key ? "linear-gradient(135deg, #c8940a, #7a5500)" : "transparent",
                      color: tab === t.key ? "#0a0000" : "#6a4500",
                      fontWeight: tab === t.key ? 700 : 400,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* CHIPS TAB */}
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
                      {[1000, 5000, 10000, 50000, 100000, 1000000].map((v) => (
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
                          {v >= 1000000 ? "1M" : v >= 1000 ? `${v / 1000}K` : v}
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

                  {chipAmount && !isNaN(parseInt(chipAmount)) && (
                    <div className="py-2 px-4 rounded font-casino text-xs" style={{ background: "rgba(245,200,66,0.07)", border: "1px solid #2a1500", color: "#c8940a" }}>
                      {chipMode === "add" && `+${parseInt(chipAmount).toLocaleString()} → итого ${(selected.balance + parseInt(chipAmount)).toLocaleString()}`}
                      {chipMode === "subtract" && `−${parseInt(chipAmount).toLocaleString()} → итого ${Math.max(0, selected.balance - parseInt(chipAmount)).toLocaleString()}`}
                      {chipMode === "set" && `Баланс станет ${parseInt(chipAmount).toLocaleString()}`}
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

              {/* LUCK TAB */}
              {tab === "luck" && (
                <div className="rounded-xl p-5 flex flex-col gap-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #2a1500" }}>
                  <div>
                    <p className="font-casino text-xs tracking-widest text-yellow-700 uppercase mb-3">
                      Множитель удачи (сбросится после одного спина)
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
                          <span className="font-casino text-center leading-tight" style={{ color: "#4a3000", fontSize: 9 }}>
                            {p.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="py-3 px-4 rounded font-casino text-xs" style={{ background: "rgba(245,200,66,0.07)", border: "1px solid #2a1500", color: "#c8940a" }}>
                    {luckValue < 1
                      ? `🔻 ${selected.username} — шансы выиграть в ${(1 / luckValue).toFixed(1)}x ниже`
                      : luckValue === 1
                      ? `${selected.username} — обычные шансы`
                      : `🍀 ${selected.username} — шансы выиграть в ${luckValue}x выше`}
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

              {/* RIGHTS TAB (только суперадмин) */}
              {tab === "rights" && isSuper && (
                <div className="rounded-xl p-5 flex flex-col gap-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #2a1500" }}>
                  {selected.username === SUPER_ADMIN ? (
                    <div className="text-center py-8 opacity-40">
                      <p className="font-casino text-sm text-yellow-700">Нельзя изменить права суперадмина</p>
                    </div>
                  ) : (
                    <>
                      <div className="py-4 px-4 rounded flex items-center gap-4" style={{ background: "rgba(245,200,66,0.05)", border: "1px solid #2a1500" }}>
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                          style={{
                            background: selected.is_admin ? "rgba(200,148,10,0.2)" : "rgba(55,65,81,0.3)",
                            border: selected.is_admin ? "2px solid #c8940a" : "2px solid #374151",
                          }}
                        >
                          {selected.is_admin ? "🛡️" : "👤"}
                        </div>
                        <div>
                          <p className="font-casino text-sm text-yellow-300 font-bold">{selected.username}</p>
                          <p className="font-casino text-xs mt-1" style={{ color: selected.is_admin ? "#f5c842" : "#6b7280" }}>
                            {selected.is_admin ? "Имеет права администратора" : "Обычный игрок"}
                          </p>
                          <p className="font-casino text-xs mt-1 opacity-50" style={{ color: "#6b7280", fontSize: 10 }}>
                            Доступно: фишки, удача. Управление правами — только у тебя.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleSetAdmin(true)}
                          disabled={saving || selected.is_admin}
                          className="flex-1 py-4 font-casino text-sm tracking-widest uppercase font-semibold transition-all"
                          style={{
                            background: selected.is_admin || saving ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg, #14532d, #166534)",
                            color: selected.is_admin || saving ? "#2a4a2a" : "#86efac",
                            border: `1px solid ${selected.is_admin ? "#1a3a1a" : "#22c55e55"}`,
                            borderRadius: 4,
                            cursor: selected.is_admin || saving ? "not-allowed" : "pointer",
                          }}
                        >
                          <Icon name="ShieldCheck" size={14} className="inline mr-2" />
                          Выдать права
                        </button>
                        <button
                          onClick={() => handleSetAdmin(false)}
                          disabled={saving || !selected.is_admin}
                          className="flex-1 py-4 font-casino text-sm tracking-widest uppercase font-semibold transition-all"
                          style={{
                            background: !selected.is_admin || saving ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg, #7f1d1d, #991b1b)",
                            color: !selected.is_admin || saving ? "#3a1a1a" : "#fca5a5",
                            border: `1px solid ${!selected.is_admin ? "#3a1a1a" : "#ef444455"}`,
                            borderRadius: 4,
                            cursor: !selected.is_admin || saving ? "not-allowed" : "pointer",
                          }}
                        >
                          <Icon name="ShieldOff" size={14} className="inline mr-2" />
                          Забрать права
                        </button>
                      </div>
                    </>
                  )}
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
            background: toast.win ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
            border: `1px solid ${toast.win ? "#22c55e55" : "#ef444455"}`,
            color: toast.win ? "#86efac" : "#fca5a5",
            backdropFilter: "blur(10px)",
            whiteSpace: "nowrap",
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
