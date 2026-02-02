"use client";

import { io, Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/types/game";

// Socket instance (singleton)
let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

// Session ID key in localStorage
const SESSION_ID_KEY = "board-game-session-id";

// Generate unique session ID
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// Get or create session ID
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

// Clear session ID (when leaving room intentionally)
export function clearSessionId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_ID_KEY);
}

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    const sessionId = getSessionId();
    
    // Connect to the same host that served the page
    socket = io({
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity, // Keep trying to reconnect
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: {
        sessionId, // Send sessionId with connection
      },
    });
  }
  return socket;
}

// Disconnect socket (for cleanup if needed)
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
