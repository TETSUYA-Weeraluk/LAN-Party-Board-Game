"use client";

import type { RoomInfo } from "@/types/game";

interface RoomListProps {
  rooms: RoomInfo[];
  onCreateRoom: () => void;
  onSelectRoom: (room: RoomInfo) => void;
  onRefresh: () => void;
}

export default function RoomList({
  rooms,
  onCreateRoom,
  onSelectRoom,
  onRefresh,
}: RoomListProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
              🎭 Who Am I?
            </h1>
            <p className="text-purple-200">เลือกห้องเพื่อเข้าร่วมเกม</p>
          </div>

          {/* Room List */}
          <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
            {rooms.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">🏠</div>
                <p className="text-purple-200">ยังไม่มีห้อง</p>
                <p className="text-purple-300 text-sm">กดสร้างห้องเพื่อเริ่มเกม!</p>
              </div>
            ) : (
              rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => onSelectRoom(room)}
                  disabled={room.isPlaying}
                  className={`w-full p-4 rounded-xl border transition-all text-left ${
                    room.isPlaying
                      ? "bg-gray-500/20 border-gray-500/30 cursor-not-allowed opacity-60"
                      : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-pink-500/50 hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold text-lg">
                          {room.name}
                        </span>
                        {room.hasPassword && (
                          <span className="text-yellow-400 text-sm" title="ห้องมีรหัสผ่าน">
                            🔒
                          </span>
                        )}
                        {room.isPlaying && (
                          <span className="bg-orange-500/30 text-orange-300 text-xs px-2 py-0.5 rounded-full">
                            กำลังเล่น
                          </span>
                        )}
                      </div>
                      <div className="text-purple-300 text-sm mt-1">
                        Host: {room.hostName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white flex items-center gap-1">
                        <span className="text-2xl">👥</span>
                        <span className="text-lg font-medium">{room.playerCount}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={onCreateRoom}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-purple-900 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              ➕ สร้างห้องใหม่
            </button>
            <button
              onClick={onRefresh}
              className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl border border-white/20 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
            >
              🔄 รีเฟรชรายการห้อง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
