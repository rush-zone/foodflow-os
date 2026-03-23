"use client";

import { useEffect, useState } from "react";

interface KDSTimerProps {
  since: Date;
  urgent?: number;  // minutes before turning red
  warning?: number; // minutes before turning yellow
}

export default function KDSTimer({ since, urgent = 15, warning = 8 }: KDSTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const update = () =>
      setElapsed(Math.floor((Date.now() - since.getTime()) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [since]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const color =
    minutes >= urgent
      ? "text-red-400 bg-red-400/10 border-red-400/30"
      : minutes >= warning
      ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/30"
      : "text-green-400 bg-green-400/10 border-green-400/30";

  return (
    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {display}
    </span>
  );
}
