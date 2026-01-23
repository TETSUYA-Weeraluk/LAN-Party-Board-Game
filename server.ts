import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import type {
  Player,
  GameRoom,
  RoomInfo,
  ServerToClientEvents,
  ClientToServerEvents,
  PlayerWithWord,
} from "./src/types/game";
import { CATEGORY_LIST, PRESET_CATEGORIES } from "./src/constant";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0"; // Listen on all network interfaces for LAN access
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Grace period duration (10 minutes in milliseconds)
const GRACE_PERIOD_MS = 10 * 60 * 1000;

// Pending disconnect data
interface PendingDisconnect {
  player: Player;
  roomId: string;
  timeout: NodeJS.Timeout;
  wasHost: boolean;
}

// Game rooms map (roomId -> GameRoom)
const gameRooms = new Map<string, GameRoom>();

// Pending disconnects map (sessionId -> PendingDisconnect)
const pendingDisconnects = new Map<string, PendingDisconnect>();

// Player to room mapping (socketId -> roomId)
const playerRoomMap = new Map<string, string>();

// Generate unique room ID
function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Get room list for clients
function getRoomList(): RoomInfo[] {
  const rooms: RoomInfo[] = [];
  gameRooms.forEach((room) => {
    rooms.push({
      id: room.id,
      name: room.name,
      hostName: room.hostName,
      playerCount: room.players.length,
      hasPassword: room.password !== null,
      isPlaying: room.isPlaying,
    });
  });
  return rooms;
}

// Broadcast room list to all clients not in a room
function broadcastRoomList(io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>) {
  const rooms = getRoomList();
  // Broadcast to all sockets not in any game room
  io.sockets.sockets.forEach((socket) => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) {
      socket.emit("roomList", { rooms });
    }
  });
}

// Calculate score based on answer order
function calculateScore(order: number): number {
  if (order === 1) return 3;
  if (order === 2) return 2;
  if (order === 3) return 1;
  return 0;
}

// Generate words from preset categories
function generateWordsFromPreset(
  category: string,
  playerCount: number
): string[] {
  const preset = PRESET_CATEGORIES.find((p) => p.name === category);
  
  if (preset) {
    // Shuffle and pick words from preset
    const shuffled = [...preset.words].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, playerCount);
  }
  
  // Fallback: if category not found, use first preset
  const fallback = PRESET_CATEGORIES[0];
  const shuffled = [...fallback.words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, playerCount);
}

// Generate random category from preset list (excluding already played)
function generateRandomCategory(playedCategories: string[]): string {
  // Filter out already played categories
  const availableCategories = CATEGORY_LIST.filter(
    (cat) => !playedCategories.includes(cat)
  );
  
  // If all categories played, reset and use all
  const categoriesToUse = availableCategories.length > 0 
    ? availableCategories 
    : CATEGORY_LIST;
  
  // Pick random category
  const randomIndex = Math.floor(Math.random() * categoriesToUse.length);
  const selectedCategory = categoriesToUse[randomIndex];
  
  console.log("RandomCategory:", selectedCategory);
  
  return selectedCategory;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    }
  );

  io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Send room list on connection
    socket.emit("roomList", { rooms: getRoomList() });

    // Get room list
    socket.on("getRoomList", () => {
      socket.emit("roomList", { rooms: getRoomList() });
    });

    // Create room (become host)
    socket.on("createRoom", ({ roomName, password, playerName, sessionId }) => {
      // Generate unique room ID
      let roomId = generateRoomId();
      while (gameRooms.has(roomId)) {
        roomId = generateRoomId();
      }

      const player: Player = {
        id: socket.id,
        sessionId,
        name: playerName,
        isHost: true,
        score: 0,
        hasAnswered: false,
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
      };

      gameRooms.set(roomId, room);
      playerRoomMap.set(socket.id, roomId);
      socket.join(`room-${roomId}`);
      socket.emit("roomJoined", { roomId, roomName, player, isHost: true });
      io.to(`room-${roomId}`).emit("playersUpdate", room.players);

      // Broadcast updated room list to all clients in room-list
      broadcastRoomList(io);

      console.log(`Room "${roomName}" (${roomId}) created by ${playerName}`);
    });

    // Join existing room
    socket.on("joinRoom", ({ roomId, password, playerName, sessionId }) => {
      const room = gameRooms.get(roomId);
      
      if (!room) {
        socket.emit("error", "ไม่พบห้องนี้");
        return;
      }

      if (room.isPlaying) {
        socket.emit("error", "เกมกำลังเล่นอยู่ ไม่สามารถเข้าร่วมได้");
        return;
      }

      // Check password
      if (room.password && room.password !== password) {
        socket.emit("error", "รหัสผ่านไม่ถูกต้อง");
        return;
      }

      const player: Player = {
        id: socket.id,
        sessionId,
        name: playerName,
        isHost: false,
        score: 0,
        hasAnswered: false,
      };

      room.players.push(player);
      playerRoomMap.set(socket.id, roomId);
      socket.join(`room-${roomId}`);
      socket.emit("roomJoined", { roomId, roomName: room.name, player, isHost: false });
      io.to(`room-${roomId}`).emit("playersUpdate", room.players);

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
      room.players = room.players.filter((p) => p.id !== socket.id);
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

    // Start game (host only)
    socket.on("startGame", async ({ category, timerMinutes }) => {
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

      if (room.players.length < 2) {
        socket.emit("error", "ต้องมีผู้เล่นอย่างน้อย 2 คน");
        return;
      }

      // Generate category if random
      const finalCategory =
        category || generateRandomCategory(room.playedCategories);

      // Generate words for each player
      const words = generateWordsFromPreset(
        finalCategory,
        room.players.length
      );

      // Shuffle and assign words to players, reset round state
      const shuffledWords = words.sort(() => Math.random() - 0.5);
      room.players.forEach((player, index) => {
        player.word = shuffledWords[index];
        player.hasAnswered = false;
        player.answerOrder = undefined;
      });

      room.category = finalCategory;
      room.isPlaying = true;
      room.timerDuration = timerMinutes * 60 * 1000;
      room.timerStartedAt = Date.now();
      room.currentRound += 1;
      room.playedCategories.push(finalCategory);
      room.answeredCount = 0;
      room.roundFinished = false;

      // Send game started event with words
      room.players.forEach((player) => {
        const otherPlayersWithWords = room.players
          .filter((p) => p.id !== player.id)
          .map((p) => ({
            id: p.id,
            name: p.name,
            word: p.word!,
            score: p.score,
            hasAnswered: p.hasAnswered,
            answerOrder: p.answerOrder,
          }));

        io.to(player.id).emit("gameStarted", {
          category: finalCategory,
          otherPlayers: otherPlayersWithWords,
          timerDuration: room.timerDuration,
          timerStartedAt: room.timerStartedAt!,
          currentRound: room.currentRound,
          playedCategories: room.playedCategories,
        });
      });

      // Broadcast updated room list (room is now playing)
      broadcastRoomList(io);

      console.log(
        `Room "${room.name}" - Game started - Round ${room.currentRound} with category: ${finalCategory}`
      );
    });

    // Mark player as correct (host only)
    socket.on("markCorrect", (playerId) => {
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

      const player = room.players.find((p) => p.id === playerId);
      if (!player) {
        socket.emit("error", "ไม่พบผู้เล่น");
        return;
      }

      if (player.hasAnswered) {
        socket.emit("error", "ผู้เล่นนี้ตอบถูกไปแล้ว");
        return;
      }

      // Mark as answered and calculate score
      room.answeredCount += 1;
      player.hasAnswered = true;
      player.answerOrder = room.answeredCount;
      const scoreEarned = calculateScore(player.answerOrder);
      player.score += scoreEarned;

      // Notify all players
      io.to(`room-${roomId}`).emit("playerAnswered", {
        playerId: player.id,
        playerName: player.name,
        score: scoreEarned,
        order: player.answerOrder,
        totalScore: player.score,
      });

      console.log(
        `Room "${room.name}" - ${player.name} answered correctly! Order: ${player.answerOrder}, Score: +${scoreEarned}`
      );

      // Check if all players have answered
      if (room.answeredCount === room.players.length) {
        room.roundFinished = true;
        room.isPlaying = false;

        io.to(`room-${roomId}`).emit("roundEnded", {
          players: room.players,
          playedCategories: room.playedCategories,
          currentRound: room.currentRound,
        });

        // Broadcast updated room list (room is no longer playing)
        broadcastRoomList(io);

        console.log(`Room "${room.name}" - Round ${room.currentRound} ended!`);
      }
    });

    // Next round (host only)
    socket.on("nextRound", async ({ category, timerMinutes }) => {
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

      if (!room.roundFinished) {
        socket.emit("error", "รอบนี้ยังไม่จบ ต้องรอให้ทุกคนตอบครบก่อน");
        return;
      }

      // Generate category if random
      const finalCategory =
        category || generateRandomCategory(room.playedCategories);

      // Generate words for each player
      const words = generateWordsFromPreset(
        finalCategory,
        room.players.length
      );

      // Shuffle and assign words to players, reset round state
      const shuffledWords = words.sort(() => Math.random() - 0.5);
      room.players.forEach((player, index) => {
        player.word = shuffledWords[index];
        player.hasAnswered = false;
        player.answerOrder = undefined;
      });

      room.category = finalCategory;
      room.isPlaying = true;
      room.timerDuration = timerMinutes * 60 * 1000;
      room.timerStartedAt = Date.now();
      room.currentRound += 1;
      room.playedCategories.push(finalCategory);
      room.answeredCount = 0;
      room.roundFinished = false;

      // Send game started event with words
      room.players.forEach((player) => {
        const otherPlayersWithWords = room.players
          .filter((p) => p.id !== player.id)
          .map((p) => ({
            id: p.id,
            name: p.name,
            word: p.word!,
            score: p.score,
            hasAnswered: p.hasAnswered,
            answerOrder: p.answerOrder,
          }));

        io.to(player.id).emit("gameStarted", {
          category: finalCategory,
          otherPlayers: otherPlayersWithWords,
          timerDuration: room.timerDuration,
          timerStartedAt: room.timerStartedAt!,
          currentRound: room.currentRound,
          playedCategories: room.playedCategories,
        });
      });

      // Broadcast updated room list (room is now playing)
      broadcastRoomList(io);

      console.log(
        `Room "${room.name}" - Next round started - Round ${room.currentRound} with category: ${finalCategory}`
      );
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

    // Reveal own word
    socket.on("revealMyWord", () => {
      const roomId = playerRoomMap.get(socket.id);
      if (!roomId) return;

      const room = gameRooms.get(roomId);
      if (!room) return;

      const player = room.players.find((p) => p.id === socket.id);
      if (player && player.word) {
        socket.emit("wordRevealed", player.word);
      }
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

      console.log(`Player ${player.name} disconnected from room "${room.name}". Starting ${GRACE_PERIOD_MS / 60000} minute grace period...`);

      // Set up grace period timeout
      const timeout = setTimeout(() => {
        // Grace period expired - actually remove the player
        console.log(`Grace period expired for ${player.name} (session: ${sessionId})`);
        pendingDisconnects.delete(sessionId);

        const currentRoom = gameRooms.get(roomId);
        if (!currentRoom) return;

        // Remove player from room
        currentRoom.players = currentRoom.players.filter((p) => p.sessionId !== sessionId);
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
          console.log(`Room "${currentRoom.name}" closed because host's grace period expired`);
          return;
        }

        // Update remaining players
        if (currentRoom.players.length > 0) {
          io.to(`room-${roomId}`).emit("playersUpdate", currentRoom.players);
          broadcastRoomList(io);
        } else {
          gameRooms.delete(roomId);
          broadcastRoomList(io);
          console.log(`Room "${currentRoom.name}" closed because no players left`);
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
      
      if (pending) {
        const room = gameRooms.get(pending.roomId);
        
        if (room) {
          // Clear the grace period timeout
          clearTimeout(pending.timeout);
          pendingDisconnects.delete(sessionId);

          // Restore the player with new socket.id
          const player = pending.player;
          const wasHost = pending.wasHost;
          const roomId = pending.roomId;
          
          // Update player's socket id
          player.id = socket.id;
          
          // Update in room players array
          const playerIndex = room.players.findIndex((p) => p.sessionId === sessionId);
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

          // Determine current game state
          let currentGameState: "lobby" | "playing" | "round-end" = "lobby";
          if (room.isPlaying) {
            currentGameState = "playing";
          } else if (room.roundFinished && room.currentRound > 0) {
            currentGameState = "round-end";
          }

          // Get other players with words if playing
          let otherPlayers: PlayerWithWord[] | undefined;
          if (currentGameState === "playing") {
            otherPlayers = room.players
              .filter((p) => p.id !== socket.id)
              .map((p) => ({
                id: p.id,
                name: p.name,
                word: p.word!,
                score: p.score,
                hasAnswered: p.hasAnswered,
                answerOrder: p.answerOrder,
              }));
          }

          // Send rejoin success with full game state
          socket.emit("rejoinSuccess", {
            roomId,
            roomName: room.name,
            player,
            isHost: wasHost,
            gameState: currentGameState,
            players: room.players,
            category: room.category || undefined,
            otherPlayers,
            timerDuration: room.timerDuration || undefined,
            timerStartedAt: room.timerStartedAt || undefined,
            currentRound: room.currentRound || undefined,
            playedCategories: room.playedCategories,
          });

          console.log(`Player ${player.name} rejoined room "${room.name}" successfully!`);
          
          // Update all players about the reconnection
          io.to(`room-${roomId}`).emit("playersUpdate", room.players);
        } else {
          // Room no longer exists
          pendingDisconnects.delete(sessionId);
          socket.emit("rejoinFailed", "ห้องถูกปิดไปแล้ว");
          socket.emit("roomList", { rooms: getRoomList() });
          console.log(`Rejoin failed - room no longer exists for session: ${sessionId}`);
        }
      } else {
        // No pending session found
        socket.emit("rejoinFailed", "ไม่พบ session หรือหมดเวลา reconnect แล้ว");
        socket.emit("roomList", { rooms: getRoomList() });
        console.log(`Rejoin failed for session: ${sessionId}`);
      }
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> For LAN access, use your local IP address`);
  });
});
