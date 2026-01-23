"use client";

import { useState } from "react";

interface CreateRoomFormProps {
  onSubmit: (roomName: string, password: string | null, playerName: string) => void;
  onBack: () => void;
}

export default function CreateRoomForm({ onSubmit, onBack }: CreateRoomFormProps) {
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [usePassword, setUsePassword] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
              🎭 Who Am I?
            </h1>
            <p className="text-purple-200">สร้างห้องใหม่</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Room Name */}
            <div>
              <label
                htmlFor="roomName"
                className="block text-sm font-medium text-purple-200 mb-2"
              >
                ชื่อห้อง
              </label>
              <input
                type="text"
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="ตั้งชื่อห้องของคุณ..."
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
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
                  usePassword ? "bg-pink-500" : "bg-white/20"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    usePassword ? "translate-x-6" : ""
                  }`}
                />
              </button>
              <span className="text-purple-200 text-sm">ตั้งรหัสผ่านห้อง</span>
            </div>

            {/* Password Input */}
            {usePassword && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-purple-200 mb-2"
                >
                  รหัสผ่าน
                </label>
                <input
                  type="text"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ใส่รหัสผ่าน..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  maxLength={20}
                />
              </div>
            )}

            <hr className="border-white/10" />

            {/* Player Name */}
            <div>
              <label
                htmlFor="playerName"
                className="block text-sm font-medium text-purple-200 mb-2"
              >
                ชื่อของคุณ (Host)
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="ใส่ชื่อที่ต้องการแสดง..."
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                maxLength={20}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isValid}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-purple-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
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
