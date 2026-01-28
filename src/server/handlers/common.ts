// Common handlers (room management, connection, etc.)

import type { Server as SocketIOServer, Socket } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  Player,
  GameRoom,
  GameType,
  SpyFallPlayer,
  UndercoverPlayer,
} from "@/types/game";
import type { SpyFallGameRoom, UndercoverGameRoom } from "../types";
import { GRACE_PERIOD_MS } from "../types";
import {
  gameRooms,
  pendingDisconnects,
  playerRoomMap,
  generateRoomId,
  getRoomList,
  broadcastRoomList,
  isWhoAmIRoom,
  isSpyFallRoom,
  isUndercoverRoom,
} from "../rooms";

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type GameIO = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

export function registerCommonHandlers(io: GameIO, socket: GameSocket) {
  // Send room list on connection
  socket.emit("roomList", { rooms: getRoomList() });

  // Get room list
  socket.on("getRoomList", () => {
    socket.emit("roomList", { rooms: getRoomList() });
  });

  // Get room info by ID
  socket.on("getRoomInfo", ({ roomId }) => {
    const room = gameRooms.get(roomId);
    if (room) {
      socket.emit("roomInfo", {
        id: room.id,
        name: room.name,
        hostName: room.hostName,
        playerCount: room.players.length,
        hasPassword: room.password !== null,
        isPlaying: room.isPlaying,
        gameType: room.gameType,
      });
    } else {
      socket.emit("roomInfo", null);
    }
  });

  // Create room (become host)
  socket.on(
    "createRoom",
    ({ roomName, password, playerName, sessionId, gameType }) => {
      // Generate unique room ID
      let roomId = generateRoomId();
      while (gameRooms.has(roomId)) {
        roomId = generateRoomId();
      }

      const finalGameType: GameType = gameType || "who-am-i";

      if (finalGameType === "spy-fall") {
        // Create Spy Fall room
        const player: SpyFallPlayer = {
          id: socket.id,
          sessionId,
          name: playerName,
          isHost: true,
          score: 0,
          wins: 0,
        };

        const room: SpyFallGameRoom = {
          id: roomId,
          name: roomName,
          password: password || null,
          hostId: socket.id,
          hostName: playerName,
          players: [player],
          category: null,
          isPlaying: false,
          timerDuration: 0,
          timerStartedAt: null,
          currentRound: 0,
          playedCategories: [],
          answeredCount: 0,
          roundFinished: false,
          gameType: "spy-fall",
          spyId: null,
          currentLocation: null,
          customLocations: [],
          excludedLocations: [],
        };

        gameRooms.set(roomId, room);
        playerRoomMap.set(socket.id, roomId);
        socket.join(`room-${roomId}`);
        socket.emit("roomJoined", {
          roomId,
          roomName,
          player: player as unknown as Player,
          isHost: true,
          gameType: "spy-fall",
        });
        io.to(`room-${roomId}`).emit("playersUpdate", room.players);
      } else if (finalGameType === "undercover") {
        // Create Undercover room
        const player: UndercoverPlayer = {
          id: socket.id,
          sessionId,
          name: playerName,
          isHost: true,
          isAlive: true,
          isSpectator: false,
          score: 0,
          wins: 0,
        };

        const room: UndercoverGameRoom = {
          id: roomId,
          name: roomName,
          password: password || null,
          hostId: socket.id,
          hostName: playerName,
          players: [player],
          isPlaying: false,
          currentRound: 0,
          roundFinished: false,
          gameType: "undercover",
          civilianWord: null,
          undercoverWord: null,
          lastVotedPlayerId: null,
          waitingForMrWhiteGuess: false,
          roundResult: null,
        };

        gameRooms.set(roomId, room);
        playerRoomMap.set(socket.id, roomId);
        socket.join(`room-${roomId}`);
        socket.emit("roomJoined", {
          roomId,
          roomName,
          player: player as unknown as Player,
          isHost: true,
          gameType: "undercover",
        });
        io.to(`room-${roomId}`).emit("playersUpdate", room.players);
      } else {
        // Create Who Am I room
        const player: Player = {
          id: socket.id,
          sessionId,
          name: playerName,
          isHost: true,
          score: 0,
          hasAnswered: false,
          isEliminated: false,
          isWaiting: false,
        };

        const room: GameRoom = {
          id: roomId,
          name: roomName,
          password: password || null,
          hostId: socket.id,
          hostName: playerName,
          players: [player],
          category: null,
          isPlaying: false,
          timerDuration: 0,
          timerStartedAt: null,
          currentRound: 0,
          playedCategories: [],
          answeredCount: 0,
          roundFinished: false,
          gameType: "who-am-i",
        };

        gameRooms.set(roomId, room);
        playerRoomMap.set(socket.id, roomId);
        socket.join(`room-${roomId}`);
        socket.emit("roomJoined", {
          roomId,
          roomName,
          player,
          isHost: true,
          gameType: "who-am-i",
        });
        io.to(`room-${roomId}`).emit("playersUpdate", room.players);
      }

      // Broadcast updated room list to all clients in room-list
      broadcastRoomList(io);

      console.log(
        `Room "${roomName}" (${roomId}) created by ${playerName} - Type: ${finalGameType}`
      );
    }
  );

  // Join existing room
  socket.on("joinRoom", ({ roomId, password, playerName, sessionId }) => {
    const room = gameRooms.get(roomId);

    if (!room) {
      socket.emit("error", "ไม่พบห้องนี้");
      return;
    }

    // Check password
    if (room.password && room.password !== password) {
      socket.emit("error", "รหัสผ่านไม่ถูกต้อง");
      return;
    }

    if (isSpyFallRoom(room)) {
      // Spy Fall: Can't join if playing
      if (room.isPlaying) {
        socket.emit("error", "เกมกำลังเล่นอยู่ ไม่สามารถเข้าร่วมได้");
        return;
      }

      const player: SpyFallPlayer = {
        id: socket.id,
        sessionId,
        name: playerName,
        isHost: false,
        score: 0,
        wins: 0,
      };

      room.players.push(player);
      playerRoomMap.set(socket.id, roomId);
      socket.join(`room-${roomId}`);
      socket.emit("roomJoined", {
        roomId,
        roomName: room.name,
        player: player as unknown as Player,
        isHost: false,
        gameType: "spy-fall",
      });
      io.to(`room-${roomId}`).emit("playersUpdate", room.players);
    } else if (isUndercoverRoom(room)) {
      // Undercover: Join as spectator if game is playing
      const isSpectator = room.isPlaying;

      const player: UndercoverPlayer = {
        id: socket.id,
        sessionId,
        name: playerName,
        isHost: false,
        isAlive: true,
        isSpectator,
        score: 0,
        wins: 0,
      };

      room.players.push(player);
      playerRoomMap.set(socket.id, roomId);
      socket.join(`room-${roomId}`);
      socket.emit("roomJoined", {
        roomId,
        roomName: room.name,
        player: player as unknown as Player,
        isHost: false,
        gameType: "undercover",
      });

      // Send players update with alive/spectator separation
      const alivePlayers = room.players.filter((p) => !p.isSpectator);
      const spectators = room.players.filter((p) => p.isSpectator);
      io.to(`room-${roomId}`).emit("undercoverPlayersUpdate", {
        alivePlayers,
        spectators,
      });

      if (isSpectator) {
        socket.emit("error", "เกมกำลังเล่นอยู่ คุณจะเข้าร่วมเป็นผู้ดู");
      }
    } else {
      // Who Am I: Allow late join but mark as waiting
      const isWaiting = room.isPlaying;

      const player: Player = {
        id: socket.id,
        sessionId,
        name: playerName,
        isHost: false,
        score: 0,
        hasAnswered: false,
        isEliminated: false,
        isWaiting,
      };

      room.players.push(player);
      playerRoomMap.set(socket.id, roomId);
      socket.join(`room-${roomId}`);
      socket.emit("roomJoined", {
        roomId,
        roomName: room.name,
        player,
        isHost: false,
        gameType: "who-am-i",
      });
      io.to(`room-${roomId}`).emit("playersUpdate", room.players);

      if (isWaiting) {
        socket.emit("error", "เกมกำลังเล่นอยู่ คุณจะได้เข้าร่วมในรอบถัดไป");
      }
    }

    // Broadcast updated room list
    broadcastRoomList(io);

    console.log(`${playerName} joined room "${room.name}" (${roomId})`);
  });

  // Leave room (go back to room list)
  socket.on("leaveRoom", ({ roomId }) => {
    const room = gameRooms.get(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    // Remove player from room
    room.players = room.players.filter(
      (p) => p.id !== socket.id
    ) as typeof room.players;
    playerRoomMap.delete(socket.id);
    socket.leave(`room-${roomId}`);

    // If host left or no players, close the room
    if (room.hostId === socket.id || room.players.length === 0) {
      io.to(`room-${roomId}`).emit("roomClosed");
      gameRooms.delete(roomId);
      console.log(`Room "${room.name}" (${roomId}) closed - host left`);
    } else {
      io.to(`room-${roomId}`).emit("playersUpdate", room.players);
      console.log(`${player.name} left room "${room.name}" (${roomId})`);
    }

    // Send room list to the player who left
    socket.emit("leftRoom");
    socket.emit("roomList", { rooms: getRoomList() });

    // Broadcast updated room list
    broadcastRoomList(io);
  });

  // Close room (host only)
  socket.on("closeRoom", () => {
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

    // Notify all players and clean up
    io.to(`room-${roomId}`).emit("roomClosed");

    // Clean up player mappings
    room.players.forEach((p) => {
      playerRoomMap.delete(p.id);
    });

    gameRooms.delete(roomId);

    // Broadcast updated room list
    broadcastRoomList(io);

    console.log(`Room "${room.name}" (${roomId}) closed by host`);
  });

  // Handle disconnect - use grace period instead of immediate removal
  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);

    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) return;

    const room = gameRooms.get(roomId);
    if (!room) return;

    // Find the disconnected player
    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    const wasHost = room.hostId === socket.id;
    const sessionId = player.sessionId;

    console.log(
      `Player ${player.name} disconnected from room "${
        room.name
      }". Starting ${GRACE_PERIOD_MS / 60000} minute grace period...`
    );

    // Set up grace period timeout
    const timeout = setTimeout(() => {
      // Grace period expired - actually remove the player
      console.log(
        `Grace period expired for ${player.name} (session: ${sessionId})`
      );
      pendingDisconnects.delete(sessionId);

      const currentRoom = gameRooms.get(roomId);
      if (!currentRoom) return;

      // Remove player from room
      currentRoom.players = currentRoom.players.filter(
        (p) => p.sessionId !== sessionId
      ) as typeof currentRoom.players;
      playerRoomMap.delete(socket.id);

      // If host disconnected, close the room
      if (wasHost) {
        io.to(`room-${roomId}`).emit("roomClosed");
        // Clean up all player mappings
        currentRoom.players.forEach((p) => {
          playerRoomMap.delete(p.id);
        });
        gameRooms.delete(roomId);
        broadcastRoomList(io);
        console.log(
          `Room "${currentRoom.name}" closed because host's grace period expired`
        );
        return;
      }

      // Update remaining players
      if (currentRoom.players.length > 0) {
        io.to(`room-${roomId}`).emit("playersUpdate", currentRoom.players);
        broadcastRoomList(io);
      } else {
        gameRooms.delete(roomId);
        broadcastRoomList(io);
        console.log(
          `Room "${currentRoom.name}" closed because no players left`
        );
      }
    }, GRACE_PERIOD_MS);

    // Store pending disconnect
    pendingDisconnects.set(sessionId, {
      player,
      roomId,
      timeout,
      wasHost,
    });
  });

  // Handle rejoin request
  socket.on("rejoin", ({ sessionId }) => {
    console.log(`Rejoin attempt with session: ${sessionId}`);

    // Check if there's a pending disconnect for this session
    const pending = pendingDisconnects.get(sessionId);

    // Also check if sessionId already exists in any room (active player)
    let activeRoomId: string | null = null;
    let activePlayer: Player | SpyFallPlayer | UndercoverPlayer | null = null;
    let activeWasHost = false;

    if (!pending) {
      // Search for active session in all rooms
      for (const [roomId, room] of gameRooms.entries()) {
        const existingPlayer = room.players.find(
          (p) => p.sessionId === sessionId
        );
        if (existingPlayer) {
          activeRoomId = roomId;
          activePlayer = existingPlayer;
          activeWasHost = room.hostId === existingPlayer.id;
          break;
        }
      }
    }

    if (pending || activePlayer) {
      const roomId = pending ? pending.roomId : activeRoomId!;
      const room = gameRooms.get(roomId);

      if (room) {
        if (pending) {
          // Clear the grace period timeout
          clearTimeout(pending.timeout);
          pendingDisconnects.delete(sessionId);
        }

        // Get player and host status
        const player = pending ? pending.player : activePlayer!;
        const wasHost = pending ? pending.wasHost : activeWasHost;

        if (player.id === socket.id && !pending) {
          console.log(
            `Duplicate rejoin request from active session: ${sessionId} (Ignored restoration logic)`
          );

          // แค่ส่งข้อมูลล่าสุดกลับไป ไม่ต้อง Join room ซ้ำ หรือ Update map ซ้ำ
          emitRejoinSuccess(socket, io, roomId, room, player, wasHost);
          return;
        }

        // Remove old socket.id from playerRoomMap if different
        if (player.id !== socket.id) {
          playerRoomMap.delete(player.id);
        }

        // Update player's socket id
        player.id = socket.id;

        // Update in room players array
        const playerIndex = room.players.findIndex(
          (p) => p.sessionId === sessionId
        );
        if (playerIndex !== -1) {
          room.players[playerIndex].id = socket.id;
        }

        // Update host id if was host
        if (wasHost) {
          room.hostId = socket.id;
        }

        // Update player-room mapping
        playerRoomMap.set(socket.id, roomId);

        // Rejoin the socket.io room
        socket.join(`room-${roomId}`);

        emitRejoinSuccess(socket, io, roomId, room, player, wasHost);

        const rejoinType = pending ? "reconnected" : "restored session";
        console.log(
          `Player ${player.name} ${rejoinType} to room "${room.name}" successfully!`
        );

        io.to(`room-${roomId}`).emit("playersUpdate", room.players);
      } else {
        // Room no longer exists
        if (pending) {
          pendingDisconnects.delete(sessionId);
        }
        socket.emit("rejoinFailed", "ห้องถูกปิดไปแล้ว");
        socket.emit("roomList", { rooms: getRoomList() });
        console.log(
          `Rejoin failed - room no longer exists for session: ${sessionId}`
        );
      }
    } else {
      // No pending session and no active player found
      socket.emit("rejoinFailed", "ไม่พบ session หรือหมดเวลา reconnect แล้ว");
      socket.emit("roomList", { rooms: getRoomList() });
      console.log(`Rejoin failed for session: ${sessionId}`);
    }
  });
}

// Helper function to emit rejoin success
function emitRejoinSuccess(
  socket: GameSocket,
  io: GameIO,
  roomId: string,
  room: GameRoom | SpyFallGameRoom | UndercoverGameRoom,
  player: Player | SpyFallPlayer | UndercoverPlayer,
  wasHost: boolean
) {
  // Determine current game state
  let currentGameState: "lobby" | "playing" | "round-end" = "lobby";
  if (room.isPlaying) {
    currentGameState = "playing";
  } else if (room.roundFinished && room.currentRound > 0) {
    currentGameState = "round-end";
  }

  // Logic การ emit rejoinSuccess ตาม Game Type
  if (isSpyFallRoom(room)) {
    const spyFallPlayer = player as SpyFallPlayer;
    socket.emit("rejoinSuccess", {
      roomId,
      roomName: room.name,
      player: player as unknown as Player,
      isHost: wasHost,
      gameState: currentGameState,
      players: room.players as unknown as Player[],
      gameType: "spy-fall",
      customLocations: room.customLocations,
      excludedLocations: room.excludedLocations,
      myLocation:
        currentGameState === "playing"
          ? spyFallPlayer.isSpy
            ? null
            : room.currentLocation
          : undefined,
      isSpy: currentGameState === "playing" ? spyFallPlayer.isSpy : undefined,
      timerDuration: room.timerDuration || undefined,
      timerStartedAt: room.timerStartedAt || undefined,
      currentRound: room.currentRound || undefined,
      spyId:
        currentGameState === "round-end" ? room.spyId || undefined : undefined,
      actualLocation:
        currentGameState === "round-end"
          ? room.currentLocation || undefined
          : undefined,
    });
  } else if (isUndercoverRoom(room)) {
    const undercoverPlayer = player as UndercoverPlayer;
    const alivePlayers = room.players.filter(
      (p) => p.isAlive && !p.isSpectator
    );
    const spectators = room.players.filter((p) => p.isSpectator);

    socket.emit("rejoinSuccess", {
      roomId,
      roomName: room.name,
      player: player as unknown as Player,
      isHost: wasHost,
      gameState: currentGameState,
      players: room.players as unknown as Player[],
      gameType: "undercover",
      currentRound: room.currentRound || undefined,
      myRole:
        currentGameState === "playing" ? undercoverPlayer.role : undefined,
      myWord:
        currentGameState === "playing"
          ? undercoverPlayer.word || null
          : undefined,
      alivePlayers: currentGameState === "playing" ? alivePlayers : undefined,
      spectators: currentGameState === "playing" ? spectators : undefined,
      civilianWord:
        currentGameState === "round-end"
          ? room.civilianWord || undefined
          : undefined,
      undercoverWord:
        currentGameState === "round-end"
          ? room.undercoverWord || undefined
          : undefined,
      undercoverRoundResult:
        currentGameState === "round-end"
          ? room.roundResult || undefined
          : undefined,
    });
  } else {
    // Who Am I
    const whoAmIRoom = room as GameRoom;
    let otherPlayers;
    if (currentGameState === "playing") {
      otherPlayers = whoAmIRoom.players
        .filter((p) => p.id !== socket.id)
        .map((p) => ({
          id: p.id,
          name: p.name,
          word: p.word!,
          score: p.score,
          hasAnswered: p.hasAnswered,
          answerOrder: p.answerOrder,
          isEliminated: p.isEliminated,
        }));
    }

    socket.emit("rejoinSuccess", {
      roomId,
      roomName: room.name,
      player: player as Player,
      isHost: wasHost,
      gameState: currentGameState,
      players: room.players,
      gameType: "who-am-i",
      category: whoAmIRoom.category || undefined,
      otherPlayers,
      timerDuration: room.timerDuration || undefined,
      timerStartedAt: room.timerStartedAt || undefined,
      currentRound: room.currentRound || undefined,
      playedCategories: whoAmIRoom.playedCategories,
    });
  }
}
