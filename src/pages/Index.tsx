import { useState } from "react";
import LandingPage from "@/components/LandingPage";
import RoulettePage from "@/components/RoulettePage";

type Page = "landing" | "roulette";

export default function Index() {
  const [page, setPage] = useState<Page>("landing");
  const [playerName, setPlayerName] = useState("Игрок");
  const [balance, setBalance] = useState(10000);

  if (page === "roulette") {
    return (
      <RoulettePage
        playerName={playerName}
        balance={balance}
        setBalance={setBalance}
        onExit={() => setPage("landing")}
      />
    );
  }

  return (
    <LandingPage
      onEnter={(name) => {
        setPlayerName(name);
        setPage("roulette");
      }}
    />
  );
}
