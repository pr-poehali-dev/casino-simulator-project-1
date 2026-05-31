import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  playerName: string;
  balance: number;
  setBalance: (b: number) => void;
  onExit: () => void;
}

// European roulette wheel order
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

function getColor(n: number): "red" | "black" | "green" {
  if (n === 0) return "green";
  return RED_NUMBERS.has(n) ? "red" : "black";
}

const CHIP_VALUES = [50, 100, 500, 1000, 5000];

type BetType =
  | { type: "number"; value: number }
  | { type: "color"; value: "red" | "black" }
  | { type: "parity"; value: "even" | "odd" }
  | { type: "half"; value: "1-18" | "19-36" }
  | { type: "dozen"; value: 1 | 2 | 3 }
  | { type: "column"; value: 1 | 2 | 3 };

interface Bet {
  betType: BetType;
  amount: number;
}

function betKey(b: BetType): string {
  return `${b.type}:${b.value}`;
}

function getPayout(b: BetType): number {
  if (b.type === "number") return 35;
  if (b.type === "color" || b.type === "parity" || b.type === "half") return 1;
  if (b.type === "dozen" || b.type === "column") return 2;
  return 1;
}

function isWin(b: BetType, result: number): boolean {
  const color = getColor(result);
  switch (b.type) {
    case "number": return b.value === result;
    case "color": return b.value === color;
    case "parity":
      if (result === 0) return false;
      return b.value === "even" ? result % 2 === 0 : result % 2 !== 0;
    case "half":
      if (result === 0) return false;
      return b.value === "1-18" ? result <= 18 : result >= 19;
    case "dozen":
      if (result === 0) return false;
      return b.value === Math.ceil(result / 12);
    case "column":
      if (result === 0) return false;
      return result % 3 === (b.value === 3 ? 0 : b.value);
  }
}

// SVG Roulette Wheel
function RouletteWheel({ spinning, result }: { spinning: boolean; result: number | null }) {
  const radius = 120;
  const cx = 130;
  const cy = 130;
  const total = WHEEL_NUMBERS.length;
  const angleStep = (2 * Math.PI) / total;

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: 290,
          height: 290,
          background: "radial-gradient(circle, transparent 60%, rgba(245,200,66,0.15) 100%)",
          boxShadow: spinning ? "0 0 40px rgba(245,200,66,0.6)" : "0 0 20px rgba(245,200,66,0.2)",
          transition: "box-shadow 0.5s",
        }}
      />

      <svg
        width={260}
        height={260}
        viewBox="0 0 260 260"
        className={spinning ? "roulette-spinning" : "roulette-idle"}
        style={{ filter: "drop-shadow(0 0 10px rgba(0,0,0,0.8))" }}
      >
        {/* Outer ring */}
        <circle cx={cx} cy={cy} r={125} fill="#1a0a00" stroke="#c8940a" strokeWidth={3} />

        {/* Sectors */}
        {WHEEL_NUMBERS.map((num, i) => {
          const startAngle = i * angleStep - Math.PI / 2;
          const endAngle = (i + 1) * angleStep - Math.PI / 2;
          const x1 = cx + radius * Math.cos(startAngle);
          const y1 = cy + radius * Math.sin(startAngle);
          const x2 = cx + radius * Math.cos(endAngle);
          const y2 = cy + radius * Math.sin(endAngle);
          const midAngle = (startAngle + endAngle) / 2;
          const tx = cx + (radius - 22) * Math.cos(midAngle);
          const ty = cy + (radius - 22) * Math.sin(midAngle);
          const c = getColor(num);
          const fill = c === "green" ? "#1a6b1a" : c === "red" ? "#9b0000" : "#111";

          return (
            <g key={i}>
              <path
                d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                fill={fill}
                stroke="#c8940a"
                strokeWidth={0.8}
              />
              <text
                x={tx}
                y={ty}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#f5f5e0"
                fontSize={8}
                fontFamily="Oswald, sans-serif"
                fontWeight="600"
                transform={`rotate(${(midAngle * 180) / Math.PI + 90}, ${tx}, ${ty})`}
              >
                {num}
              </text>
            </g>
          );
        })}

        {/* Center circle */}
        <circle cx={cx} cy={cy} r={24} fill="#0d0d0d" stroke="#c8940a" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={18} fill="radial-gradient" stroke="#f5c842" strokeWidth={1} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="#f5c842" fontSize={10} fontFamily="Oswald">
          ♦
        </text>
      </svg>

      {/* Ball indicator */}
      {result !== null && !spinning && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-casino font-bold animate-scale-in"
          style={{
            background: getColor(result) === "red" ? "#c8140a" : getColor(result) === "black" ? "#111" : "#1a6b1a",
            border: "2px solid #f5c842",
            color: "#f5c842",
            zIndex: 10,
            fontSize: 9,
          }}
        >
          {result}
        </div>
      )}
    </div>
  );
}

const NUMBERS_GRID = Array.from({ length: 36 }, (_, i) => i + 1);

export default function RoulettePage({ playerName, balance, setBalance, onExit }: Props) {
  const [bets, setBets] = useState<Record<string, Bet>>({});
  const [selectedChip, setSelectedChip] = useState(100);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; win: boolean } | null>(null);
  const [history, setHistory] = useState<{ number: number; color: string }[]>([]);

  const totalBet = Object.values(bets).reduce((s, b) => s + b.amount, 0);

  function placeBet(betType: BetType) {
    if (spinning) return;
    const key = betKey(betType);
    if (balance - selectedChip < 0 && !bets[key]) return;

    setBets((prev) => {
      const existing = prev[key];
      const newAmount = (existing?.amount ?? 0) + selectedChip;
      setBalance(balance - selectedChip);
      return { ...prev, [key]: { betType, amount: newAmount } };
    });
  }

  function clearBets() {
    if (spinning) return;
    const returned = Object.values(bets).reduce((s, b) => s + b.amount, 0);
    setBalance(balance + returned);
    setBets({});
    setMessage(null);
  }

  function spin() {
    if (spinning || Object.keys(bets).length === 0) return;

    setSpinning(true);
    setMessage(null);
    setResult(null);

    setTimeout(() => {
      const num = Math.floor(Math.random() * 37);
      setResult(num);
      setSpinning(false);

      const color = getColor(num);
      setHistory((h) => [{ number: num, color }, ...h.slice(0, 14)]);

      let winnings = 0;
      Object.values(bets).forEach((b) => {
        if (isWin(b.betType, num)) {
          winnings += b.amount * (getPayout(b.betType) + 1);
        }
      });

      if (winnings > 0) {
        setBalance(balance + winnings);
        setMessage({ text: `Выпало ${num}! Выигрыш: +${winnings.toLocaleString()} фишек 🎉`, win: true });
      } else {
        setMessage({ text: `Выпало ${num}. Увы, не повезло...`, win: false });
      }

      setBets({});
    }, 3200);
  }

  const chipColors: Record<number, string> = {
    50: "#3b82f6",
    100: "#22c55e",
    500: "#f59e0b",
    1000: "#ef4444",
    5000: "#a855f7",
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #0a0a0a 0%, #1a0000 60%, #0a0000 100%)" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-8 py-4 border-b" style={{ borderColor: "#2a1500" }}>
        <button
          onClick={onExit}
          className="flex items-center gap-2 font-casino text-xs tracking-widest text-yellow-700 hover:text-yellow-400 transition-colors uppercase"
        >
          <Icon name="ArrowLeft" size={14} />
          Выход
        </button>

        <div className="flex items-center gap-2">
          <span className="text-yellow-600 text-lg">♦</span>
          <h1 className="font-display text-xl font-bold gold-shimmer">Grand Royal</h1>
          <span className="text-yellow-600 text-lg">♦</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-casino text-xs text-yellow-700 tracking-widest uppercase">Баланс</p>
            <p className="font-casino text-lg text-yellow-400 font-semibold">
              {balance.toLocaleString()} <span className="text-xs">фишек</span>
            </p>
          </div>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-casino font-bold"
            style={{ background: "linear-gradient(135deg, #c8940a, #7a5500)", color: "#0a0000" }}
          >
            {playerName[0].toUpperCase()}
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 p-4 md:p-6 flex-1">
        {/* LEFT: Wheel + History */}
        <div className="flex flex-col items-center gap-4 lg:w-72">
          {/* Wheel */}
          <div
            className="w-full rounded-xl p-6 flex flex-col items-center gap-4"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #2a1500" }}
          >
            <RouletteWheel spinning={spinning} result={result} />

            {/* Result badge */}
            {result !== null && !spinning && (
              <div className="flex items-center gap-3 animate-fade-in">
                <span className="font-casino text-sm text-yellow-600 tracking-widest uppercase">Выпало</span>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-casino text-lg font-bold"
                  style={{
                    background: getColor(result) === "red" ? "#9b0000" : getColor(result) === "black" ? "#111" : "#1a6b1a",
                    border: "2px solid #f5c842",
                    color: "#f5c842",
                  }}
                >
                  {result}
                </div>
              </div>
            )}

            {/* Message */}
            {message && (
              <div
                className="w-full text-center py-3 px-4 rounded font-casino text-sm tracking-wide animate-fade-in"
                style={{
                  background: message.win ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.1)",
                  border: `1px solid ${message.win ? "#22c55e44" : "#ef444444"}`,
                  color: message.win ? "#86efac" : "#fca5a5",
                }}
              >
                {message.text}
              </div>
            )}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="w-full rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #2a1500" }}>
              <p className="font-casino text-xs tracking-widest text-yellow-700 uppercase mb-3">История</p>
              <div className="flex flex-wrap gap-1.5">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-casino font-bold"
                    style={{
                      background: h.color === "red" ? "#9b0000" : h.color === "black" ? "#111" : "#1a6b1a",
                      border: "1px solid #3a2a00",
                      color: "#f5e0c0",
                    }}
                  >
                    {h.number}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Betting table */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Chip selector */}
          <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #2a1500" }}>
            <p className="font-casino text-xs tracking-widest text-yellow-700 uppercase mb-3">Фишка</p>
            <div className="flex gap-2 flex-wrap">
              {CHIP_VALUES.map((v) => (
                <button
                  key={v}
                  onClick={() => setSelectedChip(v)}
                  className="relative w-14 h-14 rounded-full font-casino text-xs font-bold transition-all duration-200 flex items-center justify-center"
                  style={{
                    background: chipColors[v],
                    border: selectedChip === v ? "3px solid #f5c842" : "3px solid transparent",
                    color: "#fff",
                    transform: selectedChip === v ? "scale(1.15)" : "scale(1)",
                    boxShadow: selectedChip === v ? `0 0 15px ${chipColors[v]}88` : "none",
                  }}
                >
                  {v >= 1000 ? `${v / 1000}К` : v}
                </button>
              ))}
            </div>
          </div>

          {/* Betting table */}
          <div className="rounded-xl p-4 flex-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #2a1500" }}>
            <p className="font-casino text-xs tracking-widest text-yellow-700 uppercase mb-3">Стол ставок</p>

            {/* Numbers grid */}
            <div className="mb-3">
              {/* Zero */}
              <div className="flex mb-1 gap-1">
                <button
                  className="bet-cell rounded font-casino text-sm font-bold flex items-center justify-center"
                  style={{
                    width: 44,
                    height: 36,
                    background: bets["number:0"] ? "rgba(245,200,66,0.35)" : "#1a6b1a",
                    border: bets["number:0"] ? "2px solid #f5c842" : "1px solid #2d5a2d",
                    color: "#f5e0c0",
                    gridColumn: "span 3",
                  }}
                  onClick={() => placeBet({ type: "number", value: 0 })}
                >
                  {bets["number:0"] ? (
                    <span className="text-yellow-400">{bets["number:0"].amount}</span>
                  ) : "0"}
                </button>
              </div>

              {/* 1–36 grid (3 columns, 12 rows) */}
              <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(12, 1fr)" }}>
                {Array.from({ length: 12 }, (_, col) =>
                  [3, 2, 1].map((row) => {
                    const num = col * 3 + row;
                    const color = getColor(num);
                    const key = `number:${num}`;
                    const hasBet = !!bets[key];
                    return (
                      <button
                        key={num}
                        className="bet-cell rounded font-casino font-bold flex items-center justify-center"
                        style={{
                          height: 34,
                          fontSize: 11,
                          background: hasBet
                            ? "rgba(245,200,66,0.35)"
                            : color === "red"
                            ? "#7a0000"
                            : "#111",
                          border: hasBet ? "2px solid #f5c842" : "1px solid #2a1000",
                          color: hasBet ? "#f5c842" : "#f5e0c0",
                        }}
                        onClick={() => placeBet({ type: "number", value: num })}
                      >
                        {hasBet ? bets[key].amount : num}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Outside bets */}
            <div className="flex flex-col gap-2">
              {/* 1-18, Even, Red, Black, Odd, 19-36 */}
              <div className="grid grid-cols-6 gap-1">
                {(
                  [
                    { label: "1–18", bet: { type: "half", value: "1-18" } as BetType },
                    { label: "Чёт", bet: { type: "parity", value: "even" } as BetType },
                    { label: "🔴", bet: { type: "color", value: "red" } as BetType, color: "#7a0000" },
                    { label: "⚫", bet: { type: "color", value: "black" } as BetType, color: "#111" },
                    { label: "Нечет", bet: { type: "parity", value: "odd" } as BetType },
                    { label: "19–36", bet: { type: "half", value: "19-36" } as BetType },
                  ] as { label: string; bet: BetType; color?: string }[]
                ).map(({ label, bet, color }) => {
                  const key = betKey(bet);
                  const hasBet = !!bets[key];
                  return (
                    <button
                      key={key}
                      className="bet-cell rounded font-casino text-xs font-semibold py-2 flex items-center justify-center"
                      style={{
                        background: hasBet ? "rgba(245,200,66,0.35)" : color ?? "rgba(255,255,255,0.06)",
                        border: hasBet ? "2px solid #f5c842" : "1px solid #2a1500",
                        color: hasBet ? "#f5c842" : "#f5e0c0",
                      }}
                      onClick={() => placeBet(bet)}
                    >
                      {hasBet ? bets[key].amount : label}
                    </button>
                  );
                })}
              </div>

              {/* Dozens */}
              <div className="grid grid-cols-3 gap-1">
                {([1, 2, 3] as const).map((d) => {
                  const bet: BetType = { type: "dozen", value: d };
                  const key = betKey(bet);
                  const hasBet = !!bets[key];
                  return (
                    <button
                      key={d}
                      className="bet-cell rounded font-casino text-xs font-semibold py-2"
                      style={{
                        background: hasBet ? "rgba(245,200,66,0.35)" : "rgba(255,255,255,0.06)",
                        border: hasBet ? "2px solid #f5c842" : "1px solid #2a1500",
                        color: hasBet ? "#f5c842" : "#f5e0c0",
                      }}
                      onClick={() => placeBet(bet)}
                    >
                      {hasBet ? bets[key].amount : `${d * 12 - 11}–${d * 12}`}
                    </button>
                  );
                })}
              </div>

              {/* Columns */}
              <div className="grid grid-cols-3 gap-1">
                {([1, 2, 3] as const).map((c) => {
                  const bet: BetType = { type: "column", value: c };
                  const key = betKey(bet);
                  const hasBet = !!bets[key];
                  return (
                    <button
                      key={c}
                      className="bet-cell rounded font-casino text-xs font-semibold py-2"
                      style={{
                        background: hasBet ? "rgba(245,200,66,0.35)" : "rgba(255,255,255,0.06)",
                        border: hasBet ? "2px solid #f5c842" : "1px solid #2a1500",
                        color: hasBet ? "#f5c842" : "#f5e0c0",
                      }}
                      onClick={() => placeBet(bet)}
                    >
                      {hasBet ? bets[key].amount : `Колонна ${c}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={clearBets}
              disabled={spinning || Object.keys(bets).length === 0}
              className="flex-1 py-3 font-casino text-sm tracking-widest uppercase transition-all duration-200"
              style={{
                background: "transparent",
                border: "1px solid #3a1500",
                color: Object.keys(bets).length === 0 ? "#3a2000" : "#c8940a",
                borderRadius: 4,
                cursor: Object.keys(bets).length === 0 ? "not-allowed" : "pointer",
              }}
            >
              <Icon name="Trash2" size={14} className="inline mr-2" />
              Сбросить
            </button>

            <button
              onClick={spin}
              disabled={spinning || Object.keys(bets).length === 0}
              className="flex-[2] py-3 font-casino text-sm tracking-widest uppercase font-semibold transition-all duration-300"
              style={{
                background:
                  spinning || Object.keys(bets).length === 0
                    ? "#2a1500"
                    : "linear-gradient(135deg, #c8940a, #a07200)",
                border: "1px solid #f5c842",
                color:
                  spinning || Object.keys(bets).length === 0
                    ? "#4a3000"
                    : "#0a0000",
                borderRadius: 4,
                cursor: spinning || Object.keys(bets).length === 0 ? "not-allowed" : "pointer",
                boxShadow:
                  spinning || Object.keys(bets).length === 0
                    ? "none"
                    : "0 4px 20px rgba(200,148,10,0.4)",
              }}
            >
              {spinning ? (
                <>
                  <span className="inline-block mr-2 animate-spin">◆</span>
                  Крутится...
                </>
              ) : (
                <>
                  <Icon name="Play" size={14} className="inline mr-2" />
                  Крутить — {totalBet.toLocaleString()} фишек
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
