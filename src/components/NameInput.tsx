"use client";

import { useState } from "react";

interface NameInputProps {
  onSubmit: (name: string) => void;
  isCreating: boolean;
}

export default function NameInput({ onSubmit, isCreating }: NameInputProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
              🎭 Who Am I?
            </h1>
            <p className="text-purple-200">
              {isCreating ? "สร้างห้องใหม่" : "เข้าร่วมห้อง"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-purple-200 mb-2"
              >
                ชื่อของคุณ
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ใส่ชื่อที่ต้องการแสดง..."
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                autoFocus
                maxLength={20}
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-purple-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isCreating ? "🚀 สร้างห้องและเข้าเกม" : "🎮 เข้าร่วมเกม"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
