"use client";

import { useEffect, useState } from "react";

interface TimerProps {
  duration: number; // in milliseconds
  startedAt: number; // timestamp
}

export default function Timer({ duration, startedAt }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0 && !isExpired) {
        setIsExpired(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [duration, startedAt, isExpired]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const progress = (timeLeft / duration) * 100;
  const isLow = timeLeft < 60000; // Less than 1 minute

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 ${
        isExpired
          ? "bg-red-500/30 border-2 border-red-500"
          : isLow
          ? "bg-orange-500/20 border-2 border-orange-500/50"
          : "bg-white/10 border border-white/20"
      }`}
    >
      {/* Progress bar background */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Progress bar */}
      <div
        className={`absolute inset-y-0 left-0 transition-all duration-1000 ${
          isExpired
            ? "bg-red-500/30"
            : isLow
            ? "bg-orange-500/30"
            : "bg-cyan-500/30"
        }`}
        style={{ width: `${progress}%` }}
      />

      {/* Content */}
      <div className="relative flex items-center justify-center gap-3">
        <span className="text-2xl">⏱️</span>
        <div className="text-center">
          <p
            className={`text-3xl font-mono font-bold ${
              isExpired
                ? "text-red-400 animate-pulse"
                : isLow
                ? "text-orange-400"
                : "text-white"
            }`}
          >
            {formatTime(timeLeft)}
          </p>
          {isExpired && (
            <p className="text-sm text-red-300 mt-1">หมดเวลาแล้ว!</p>
          )}
        </div>
      </div>
    </div>
  );
}
