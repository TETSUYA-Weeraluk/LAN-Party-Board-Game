"use client";

import { useState } from "react";
import { CATEGORY_LIST } from "@/constant";

interface CategorySelectorProps {
  onStart: (category: string | null, timerMinutes: number) => void;
  playerCount: number;
  isLoading: boolean;
}

const TIMER_OPTIONS = [3, 5, 10, 15, 20, 30];

export default function CategorySelector({
  onStart,
  playerCount,
  isLoading,
}: CategorySelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [timerMinutes, setTimerMinutes] = useState(10);

  const handleStart = () => {
    if (selectedCategory) {
      onStart(selectedCategory, timerMinutes);
    } else {
      onStart(null, timerMinutes); // Random category
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        🎯 เลือกหมวดหมู่
      </h2>

      {/* Preset categories */}
      <div className="mb-6">
        <p className="text-sm text-purple-300 mb-3">เลือกหมวดหมู่</p>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2">
          {CATEGORY_LIST.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-pink-500 text-white"
                  : "bg-white/10 text-purple-200 hover:bg-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Random option */}
      <div className="mb-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`w-full py-3 rounded-xl text-center font-medium transition-all ${
            !selectedCategory
              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
              : "bg-white/10 text-purple-200 hover:bg-white/20"
          }`}
        >
          🎲 สุ่มหมวดหมู่
        </button>
      </div>

      {/* Timer selection */}
      <div className="mb-6">
        <p className="text-sm text-purple-300 mb-3">⏱️ เวลาในการเล่น</p>
        <div className="flex flex-wrap gap-2">
          {TIMER_OPTIONS.map((mins) => (
            <button
              key={mins}
              onClick={() => setTimerMinutes(mins)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                timerMinutes === mins
                  ? "bg-cyan-500 text-white"
                  : "bg-white/10 text-purple-200 hover:bg-white/20"
              }`}
            >
              {mins} นาที
            </button>
          ))}
        </div>
      </div>

      {/* Player count info */}
      <div className="mb-6 p-3 bg-white/5 rounded-xl">
        <p className="text-sm text-purple-300 text-center">
          👥 ผู้เล่นในห้อง: <span className="text-white font-bold">{playerCount}</span> คน
        </p>
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={isLoading || playerCount < 2}
        className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-lg rounded-xl shadow-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            กำลังสร้างคำ...
          </span>
        ) : playerCount < 2 ? (
          "รอผู้เล่นอย่างน้อย 2 คน"
        ) : (
          "🚀 เริ่มเกม!"
        )}
      </button>
    </div>
  );
}
