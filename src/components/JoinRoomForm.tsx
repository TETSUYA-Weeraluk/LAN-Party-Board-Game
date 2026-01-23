"use client";

import { useState } from "react";
import type { RoomInfo } from "@/types/game";

interface JoinRoomFormProps {
  room: RoomInfo;
  onSubmit: (roomId: string, password: string | null, playerName: string) => void;
  onBack: () => void;
}

export default function JoinRoomForm({ room, onSubmit, onBack }: JoinRoomFormProps) {
  const [playerName, setPlayerName] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onSubmit(
        room.id,
        room.hasPassword ? password.trim() : null,
        playerName.trim()
      );
    }
  };

  const isValid = playerName.trim() && (!room.hasPassword || password.trim());

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
              🎭 Who Am I?
            </h1>
            <p className="text-purple-200">เข้าร่วมห้อง</p>
          </div>

          {/* Room Info */}
          <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold text-lg flex items-center gap-2">
                {room.name}
                {room.hasPassword && (
                  <span className="text-yellow-400" title="ห้องมีรหัสผ่าน">
                    🔒
                  </span>
                )}
              </span>
              <span className="text-purple-300 flex items-center gap-1">
                <span>👥</span>
                <span>{room.playerCount}</span>
              </span>
            </div>
            <div className="text-purple-300 text-sm">
              Host: <span className="text-white">{room.hostName}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Player Name */}
            <div>
              <label
                htmlFor="playerName"
                className="block text-sm font-medium text-purple-200 mb-2"
              >
                ชื่อของคุณ
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="ใส่ชื่อที่ต้องการแสดง..."
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                autoFocus
                maxLength={20}
              />
            </div>

            {/* Password Input (if required) */}
            {room.hasPassword && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-purple-200 mb-2"
                >
                  รหัสผ่านห้อง
                </label>
                <input
                  type="text"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ใส่รหัสผ่านเพื่อเข้าห้อง..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  maxLength={20}
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isValid}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-purple-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              🎮 เข้าร่วมเกม
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
