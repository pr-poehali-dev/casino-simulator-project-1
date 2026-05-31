import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  onEnter: (name: string) => void;
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 5.5 + 3) % 100}%`,
  delay: `${(i * 0.7) % 6}s`,
  duration: `${6 + (i % 5)}s`,
  color: i % 3 === 0 ? "#f5c842" : i % 3 === 1 ? "#c8140a" : "#c8940a",
  size: i % 4 === 0 ? 8 : 5,
}));

export default function LandingPage({ onEnter }: Props) {
  const [name, setName] = useState("");
  const [focused, setFocused] = useState(false);
  const [hovering, setHovering] = useState(false);

  const handleEnter = () => {
    const playerName = name.trim() || "Игрок";
    onEnter(playerName);
  };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0a0a0a 0%, #1a0000 50%, #0a0000 100%)" }}
    >
      {/* Particles */}
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            boxShadow: `0 0 6px ${p.color}`,
          }}
        />
      ))}

      {/* Decorative corner lines */}
      <div className="absolute top-0 left-0 w-40 h-40 opacity-30"
        style={{ borderRight: "1px solid #f5c842", borderBottom: "1px solid #f5c842", borderRadius: "0 0 100% 0" }} />
      <div className="absolute bottom-0 right-0 w-40 h-40 opacity-30"
        style={{ borderLeft: "1px solid #f5c842", borderTop: "1px solid #f5c842", borderRadius: "100% 0 0 0" }} />

      {/* Top bar */}
      <div className="absolute top-6 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-3 opacity-50">
          <div style={{ width: 60, height: 1, background: "linear-gradient(to right, transparent, #f5c842)" }} />
          <span className="font-casino text-xs tracking-[0.4em] text-yellow-400 uppercase">Est. 2024</span>
          <div style={{ width: 60, height: 1, background: "linear-gradient(to left, transparent, #f5c842)" }} />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg w-full">

        {/* Crown icon area */}
        <div className="animate-fade-in-up-1 mb-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2 pulse-glow"
            style={{ background: "radial-gradient(circle, #3a1500 0%, #1a0000 100%)", border: "2px solid #c8940a" }}
          >
            <span className="text-4xl">👑</span>
          </div>
        </div>

        {/* Title */}
        <div className="animate-fade-in-up-2 mb-2">
          <p className="font-casino text-xs tracking-[0.5em] text-red-500 uppercase mb-1">Grand Royal</p>
          <h1 className="font-display text-6xl md:text-7xl font-black leading-none">
            <span className="gold-shimmer">CASINO</span>
          </h1>
        </div>

        {/* Divider */}
        <div className="animate-fade-in-up-3 flex items-center gap-3 my-6">
          <div style={{ width: 80, height: 1, background: "linear-gradient(to right, transparent, #c8940a)" }} />
          <span className="text-yellow-500 text-sm">♠ ♦ ♣ ♥</span>
          <div style={{ width: 80, height: 1, background: "linear-gradient(to left, transparent, #c8940a)" }} />
        </div>

        {/* Subtitle */}
        <p className="animate-fade-in-up-3 font-body text-sm tracking-widest text-yellow-200 opacity-60 uppercase mb-10">
          Симулятор казино · Рулетка
        </p>

        {/* Input */}
        <div className="animate-fade-in-up-4 w-full max-w-sm mb-4">
          <div
            className="relative"
            style={{
              border: `1px solid ${focused ? "#f5c842" : "#3a2a00"}`,
              borderRadius: 4,
              transition: "border-color 0.3s",
              boxShadow: focused ? "0 0 20px rgba(245,200,66,0.2)" : "none",
            }}
          >
            <Icon name="User" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-600" />
            <input
              type="text"
              placeholder="Ваше имя (необязательно)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && handleEnter()}
              className="w-full bg-transparent py-4 pl-11 pr-4 font-casino text-sm tracking-wider text-yellow-100 placeholder-yellow-900 outline-none"
            />
          </div>
        </div>

        {/* CTA Button */}
        <div className="animate-fade-in-up-5 w-full max-w-sm">
          <button
            onClick={handleEnter}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            className="relative w-full py-5 font-casino text-base tracking-[0.3em] uppercase font-semibold overflow-hidden transition-all duration-300"
            style={{
              background: hovering
                ? "linear-gradient(135deg, #f5c842, #e8a500)"
                : "linear-gradient(135deg, #c8940a, #a07200)",
              color: "#0a0000",
              border: "1px solid #f5c842",
              borderRadius: 4,
              transform: hovering ? "translateY(-2px)" : "translateY(0)",
              boxShadow: hovering
                ? "0 8px 30px rgba(245,200,66,0.5), 0 2px 10px rgba(245,200,66,0.3)"
                : "0 4px 15px rgba(200,148,10,0.3)",
            }}
          >
            Войти в казино
            <Icon name="ArrowRight" size={16} className="inline ml-3" />
          </button>
        </div>

        {/* Balance info */}
        <div className="animate-fade-in-up-5 mt-6 flex items-center gap-2 opacity-50">
          <Icon name="Coins" size={14} className="text-yellow-500" fallback="CircleDollarSign" />
          <span className="font-casino text-xs tracking-widest text-yellow-500">
            Начальный баланс: 10 000 фишек
          </span>
        </div>
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center opacity-20">
        <div style={{ width: "60%", height: 1, background: "linear-gradient(to right, transparent, #f5c842, transparent)" }} />
      </div>
    </div>
  );
}
