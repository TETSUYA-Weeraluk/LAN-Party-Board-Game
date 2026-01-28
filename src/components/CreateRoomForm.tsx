"use client";

import { useState } from "react";

interface CreateRoomFormProps {
  onSubmit: (roomName: string, password: string | null, playerName: string) => void;
  onBack: () => void;
  accentColor?: "pink" | "cyan" | "purple";
}

export default function CreateRoomForm({ onSubmit, onBack, accentColor = "pink" }: CreateRoomFormProps) {
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [usePassword, setUsePassword] = useState(false);

  // Color schemes for different games
  const colorSchemes = {
    pink: {
      bgGradient: "from-indigo-900 via-purple-900 to-pink-800",
      buttonGradient: "from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 focus:ring-pink-500",
      toggleColor: "bg-pink-500",
      inputRing: "focus:ring-pink-500",
      textAccent: "text-purple-200",
      textAccent2: "text-purple-300",
      placeholder: "placeholder-purple-300",
      gameTitle: "🎭 Who Am I?",
    },
    cyan: {
      bgGradient: "from-slate-900 via-cyan-900 to-blue-900",
      buttonGradient: "from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:ring-cyan-500",
      toggleColor: "bg-cyan-500",
      inputRing: "focus:ring-cyan-500",
      textAccent: "text-cyan-200",
      textAccent2: "text-cyan-300",
      placeholder: "placeholder-cyan-300",
      gameTitle: "🕵️ Spy Fall",
    },
    purple: {
      bgGradient: "from-slate-900 via-purple-900 to-indigo-900",
      buttonGradient: "from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:ring-purple-500",
      toggleColor: "bg-purple-500",
      inputRing: "focus:ring-purple-500",
      textAccent: "text-purple-200",
      textAccent2: "text-purple-300",
      placeholder: "placeholder-purple-300",
      gameTitle: "🎭 Undercover",
    },
  };

  const colors = colorSchemes[accentColor];
  const { bgGradient, buttonGradient, toggleColor, inputRing, textAccent, textAccent2, placeholder, gameTitle } = colors;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim() && playerName.trim()) {
      onSubmit(
        roomName.trim(),
        usePassword && password.trim() ? password.trim() : null,
        playerName.trim()
      );
    }
  };

  const isValid = roomName.trim() && playerName.trim();

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${bgGradient} p-4`}>
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
              {gameTitle}
            </h1>
            <p className={textAccent}>สร้างห้องใหม่</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Room Name */}
            <div>
              <label
                htmlFor="roomName"
                className={`block text-sm font-medium ${textAccent} mb-2`}
              >
                ชื่อห้อง
              </label>
              <input
                type="text"
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="ตั้งชื่อห้องของคุณ..."
                className={`w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white ${placeholder} focus:outline-none focus:ring-2 ${inputRing} focus:border-transparent transition-all`}
                autoFocus
                maxLength={30}
              />
            </div>

            {/* Password Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setUsePassword(!usePassword)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  usePassword ? toggleColor : "bg-white/20"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    usePassword ? "translate-x-6" : ""
                  }`}
                />
              </button>
              <span className={`${textAccent} text-sm`}>ตั้งรหัสผ่านห้อง</span>
            </div>

            {/* Password Input */}
            {usePassword && (
              <div>
                <label
                  htmlFor="password"
                  className={`block text-sm font-medium ${textAccent} mb-2`}
                >
                  รหัสผ่าน
                </label>
                <input
                  type="text"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ใส่รหัสผ่าน..."
                  className={`w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white ${textAccent2} focus:outline-none focus:ring-2 ${inputRing} focus:border-transparent transition-all`}
                  maxLength={20}
                />
              </div>
            )}

            <hr className="border-white/10" />

            {/* Player Name */}
            <div>
              <label
                htmlFor="playerName"
                className={`block text-sm font-medium ${textAccent} mb-2`}
              >
                ชื่อของคุณ (Host)
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="ใส่ชื่อที่ต้องการแสดง..."
                className={`w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white ${textAccent2} focus:outline-none focus:ring-2 ${inputRing} focus:border-transparent transition-all`}
                maxLength={20}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isValid}
              className={`w-full py-3 px-4 bg-gradient-to-r ${buttonGradient} text-white font-semibold rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-purple-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]`}
            >
              🚀 สร้างห้องและเข้าเกม
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={onBack}
              className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl border border-white/20 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
            >
              ← ย้อนกลับ
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
