// Room storage and management functions

import type { Server as SocketIOServer } from "socket.io";
import type {
  GameRoom,
  RoomInfo,
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/types/game";
import type { SpyFallGameRoom, ImposterGameRoom, PendingDisconnect, AnyGameRoom } from "./types";

// Game rooms map (roomId -> GameRoom | SpyFallGameRoom | ImposterGameRoom)
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
  io.sockets.sockets.forEach((socket) => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) {
      socket.emit("roomList", { rooms });
    }
  });
}

// Check if room is Guess Me type (เดิม Who Am I)
export function isGuessMeRoom(
  room: AnyGameRoom
): room is GameRoom {
  return room.gameType === "guess-me";
}

// Check if room is Where Are We type (เดิม Spy Fall)
export function isWhereAreWeRoom(
  room: AnyGameRoom
): room is SpyFallGameRoom {
  return room.gameType === "where-are-we";
}

// Check if room is The Imposter type (เดิม Undercover)
export function isImposterRoom(
  room: AnyGameRoom
): room is ImposterGameRoom {
  return room.gameType === "imposter";
}
