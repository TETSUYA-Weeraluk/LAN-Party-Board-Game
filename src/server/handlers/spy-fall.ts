// Spy Fall game handlers

import type { Server as SocketIOServer, Socket } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/types/game";
import { SPYFALL_LOCATIONS } from "@/game/spy-fall/constants";
import {
  gameRooms,
  playerRoomMap,
  broadcastRoomList,
  isSpyFallRoom,
} from "../rooms";
import { getRandomLocation } from "../utils/game";

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type GameIO = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

export function registerSpyFallHandlers(io: GameIO, socket: GameSocket) {
  // Add custom location (Spy Fall)
  socket.on("addLocation", ({ location }) => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) return;

    const room = gameRooms.get(roomId);
    if (!room || !isSpyFallRoom(room)) return;

    // Don't allow adding during game
    if (room.isPlaying) {
      socket.emit("error", "ไม่สามารถเพิ่มสถานที่ระหว่างเล่น");
      return;
    }

    // Check if already exists (and not excluded)
    const allLocations = [...SPYFALL_LOCATIONS, ...room.customLocations];
    const activeLocations = allLocations.filter(
      (loc) => !room.excludedLocations.includes(loc)
    );
    if (activeLocations.includes(location)) {
      socket.emit("error", "สถานที่นี้มีอยู่แล้ว");
      return;
    }

    // If this location was previously excluded (preset), restore it
    if (room.excludedLocations.includes(location)) {
      room.excludedLocations = room.excludedLocations.filter(
        (l) => l !== location
      );
    } else {
      // Add as new custom location
      room.customLocations.push(location);
    }

    io.to(`room-${roomId}`).emit("locationsUpdate", {
      customLocations: room.customLocations,
      excludedLocations: room.excludedLocations,
    });
    console.log(`Room "${room.name}" - Added/restored location: ${location}`);
  });

  // Remove location (Spy Fall) - works for both preset and custom
  socket.on("removeLocation", ({ location }) => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) return;

    const room = gameRooms.get(roomId);
    if (!room || !isSpyFallRoom(room)) return;

    // Don't allow removing during game
    if (room.isPlaying) {
      socket.emit("error", "ไม่สามารถลบสถานที่ระหว่างเล่น");
      return;
    }

    // Check minimum locations (must have at least 1)
    const allLocations = [...SPYFALL_LOCATIONS, ...room.customLocations];
    const activeLocations = allLocations.filter(
      (loc) => !room.excludedLocations.includes(loc)
    );
    if (activeLocations.length <= 1) {
      socket.emit("error", "ต้องมีสถานที่อย่างน้อย 1 แห่ง");
      return;
    }

    // If it's a custom location, remove from customLocations
    if (room.customLocations.includes(location)) {
      room.customLocations = room.customLocations.filter((l) => l !== location);
    }

    // Add to excludedLocations (for both preset and custom - prevents re-appearing)
    if (!room.excludedLocations.includes(location)) {
      room.excludedLocations.push(location);
    }

    io.to(`room-${roomId}`).emit("locationsUpdate", {
      customLocations: room.customLocations,
      excludedLocations: room.excludedLocations,
    });
    console.log(`Room "${room.name}" - Removed location: ${location}`);
  });

  // Start Spy Fall game (host only)
  socket.on("startSpyFallGame", () => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) {
      socket.emit("error", "คุณไม่ได้อยู่ในห้อง");
      return;
    }

    const room = gameRooms.get(roomId);
    if (!room || room.hostId !== socket.id) {
      socket.emit("error", "คุณไม่ใช่ Host");
      return;
    }

    if (!isSpyFallRoom(room)) {
      socket.emit("error", "ห้องนี้ไม่ใช่ Spy Fall");
      return;
    }

    if (room.players.length < 3) {
      socket.emit("error", "ต้องมีผู้เล่นอย่างน้อย 3 คน");
      return;
    }

    // Pick random spy
    const spyIndex = Math.floor(Math.random() * room.players.length);
    const spy = room.players[spyIndex];
    room.spyId = spy.id;
    spy.isSpy = true;

    // Reset other players
    room.players.forEach((p) => {
      if (p.id !== spy.id) {
        p.isSpy = false;
      }
    });

    // Pick random location (excluding removed locations)
    room.currentLocation = getRandomLocation(
      room.customLocations,
      room.excludedLocations
    );

    // Set timer (players * 1 minute)
    room.timerDuration = room.players.length * 60 * 1000;
    room.timerStartedAt = Date.now();
    room.currentRound += 1;
    room.isPlaying = true;
    room.roundFinished = false;

    // Send game started to each player
    room.players.forEach((player) => {
      io.to(player.id).emit("spyFallGameStarted", {
        location: player.id === spy.id ? null : room.currentLocation,
        isSpy: player.id === spy.id,
        timerDuration: room.timerDuration,
        timerStartedAt: room.timerStartedAt!,
        currentRound: room.currentRound,
      });
    });

    // Broadcast updated room list
    broadcastRoomList(io);

    console.log(
      `Room "${room.name}" - Spy Fall Round ${room.currentRound} started - Spy: ${spy.name}, Location: ${room.currentLocation}`
    );
  });

  // Spy caught (host only)
  socket.on("spyCaught", () => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) {
      socket.emit("error", "คุณไม่ได้อยู่ในห้อง");
      return;
    }

    const room = gameRooms.get(roomId);
    if (!room || room.hostId !== socket.id) {
      socket.emit("error", "คุณไม่ใช่ Host");
      return;
    }

    if (!isSpyFallRoom(room)) {
      socket.emit("error", "ห้องนี้ไม่ใช่ Spy Fall");
      return;
    }

    // End round - non-spy players win
    room.isPlaying = false;
    room.roundFinished = true;

    // Award points to non-spy players
    room.players.forEach((p) => {
      if (p.id !== room.spyId) {
        p.score += 1;
        p.wins += 1;
      }
    });

    io.to(`room-${roomId}`).emit("spyFallRoundEnded", {
      players: room.players,
      spyId: room.spyId!,
      actualLocation: room.currentLocation!,
      result: "spy-caught",
      currentRound: room.currentRound,
    });

    // Broadcast updated room list
    broadcastRoomList(io);

    console.log(`Room "${room.name}" - Spy caught! Non-spy players win!`);
  });

  // Spy wins (host only)
  socket.on("spyWins", () => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) {
      socket.emit("error", "คุณไม่ได้อยู่ในห้อง");
      return;
    }

    const room = gameRooms.get(roomId);
    if (!room || room.hostId !== socket.id) {
      socket.emit("error", "คุณไม่ใช่ Host");
      return;
    }

    if (!isSpyFallRoom(room)) {
      socket.emit("error", "ห้องนี้ไม่ใช่ Spy Fall");
      return;
    }

    // End round - spy wins
    room.isPlaying = false;
    room.roundFinished = true;

    // Award points to spy
    const spy = room.players.find((p) => p.id === room.spyId);
    if (spy) {
      spy.score += 2;
      spy.wins += 1;
    }

    io.to(`room-${roomId}`).emit("spyFallRoundEnded", {
      players: room.players,
      spyId: room.spyId!,
      actualLocation: room.currentLocation!,
      result: "spy-wins",
      currentRound: room.currentRound,
    });

    // Broadcast updated room list
    broadcastRoomList(io);

    console.log(`Room "${room.name}" - Spy wins!`);
  });

  // Spy wrong guess (host only) - spy guessed wrong location
  socket.on("spyWrongGuess", () => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) {
      socket.emit("error", "คุณไม่ได้อยู่ในห้อง");
      return;
    }

    const room = gameRooms.get(roomId);
    if (!room || room.hostId !== socket.id) {
      socket.emit("error", "คุณไม่ใช่ Host");
      return;
    }

    if (!isSpyFallRoom(room)) {
      socket.emit("error", "ห้องนี้ไม่ใช่ Spy Fall");
      return;
    }

    // End round - non-spy players win (spy guessed wrong)
    room.isPlaying = false;
    room.roundFinished = true;

    // Award points to non-spy players (same as spy-caught)
    room.players.forEach((p) => {
      if (p.id !== room.spyId) {
        p.score += 1;
        p.wins += 1;
      }
    });

    io.to(`room-${roomId}`).emit("spyFallRoundEnded", {
      players: room.players,
      spyId: room.spyId!,
      actualLocation: room.currentLocation!,
      result: "spy-wrong-guess",
      currentRound: room.currentRound,
    });

    // Broadcast updated room list
    broadcastRoomList(io);

    console.log(
      `Room "${room.name}" - Spy guessed wrong! Non-spy players win!`
    );
  });
}
