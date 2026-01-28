// Room storage and management functions

import type { Server as SocketIOServer } from "socket.io";
import type {
  GameRoom,
  RoomInfo,
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/types/game";
import type { SpyFallGameRoom, UndercoverGameRoom, PendingDisconnect, AnyGameRoom } from "./types";

// Game rooms map (roomId -> GameRoom | SpyFallGameRoom | UndercoverGameRoom)
export const gameRooms = new Map<string, AnyGameRoom>();

// Pending disconnects map (sessionId -> PendingDisconnect)
export const pendingDisconnects = new Map<string, PendingDisconnect>();

// Player to room mapping (socketId -> roomId)
export const playerRoomMap = new Map<string, string>();

// Generate unique room ID
export function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Get room list for clients
export function getRoomList(): RoomInfo[] {
  const rooms: RoomInfo[] = [];
  gameRooms.forEach((room) => {
    rooms.push({
      id: room.id,
      name: room.name,
      hostName: room.hostName,
      playerCount: room.players.length,
      hasPassword: room.password !== null,
      isPlaying: room.isPlaying,
      gameType: room.gameType,
    });
  });
  return rooms;
}

// Broadcast room list to all clients not in a room
export function broadcastRoomList(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>
) {
  const rooms = getRoomList();
  // Broadcast to all sockets not in any game room
  io.sockets.sockets.forEach((socket) => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) {
      socket.emit("roomList", { rooms });
    }
  });
}

// Check if room is Who Am I type
export function isWhoAmIRoom(
  room: AnyGameRoom
): room is GameRoom {
  return room.gameType === "who-am-i";
}

// Check if room is Spy Fall type
export function isSpyFallRoom(
  room: AnyGameRoom
): room is SpyFallGameRoom {
  return room.gameType === "spy-fall";
}

// Check if room is Undercover type
export function isUndercoverRoom(
  room: AnyGameRoom
): room is UndercoverGameRoom {
  return room.gameType === "undercover";
}
