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
  GameType,
  SpyFallPlayer,
} from "./src/types/game";
import { CATEGORY_LIST, PRESET_CATEGORIES, SPYFALL_LOCATIONS } from "./src/constant";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0"; // Listen on all network interfaces for LAN access
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Grace period duration (10 minutes in milliseconds)
const GRACE_PERIOD_MS = 10 * 60 * 1000;

// Pending disconnect data
interface PendingDisconnect {
  player: Player | SpyFallPlayer;
  roomId: string;
  timeout: NodeJS.Timeout;
  wasHost: boolean;
}

// Extended GameRoom for Spy Fall
interface SpyFallGameRoom {
  id: string;
  name: string;
  password: string | null;
  hostId: string;
  hostName: string;
  players: SpyFallPlayer[];
  category: string | null;
  isPlaying: boolean;
  timerDuration: number;
  timerStartedAt: number | null;
  currentRound: number;
  playedCategories: string[];
  answeredCount: number;
  roundFinished: boolean;
  gameType: "spy-fall";
  spyId: string | null;
  currentLocation: string | null;
  customLocations: string[];
}

// Game rooms map (roomId -> GameRoom | SpyFallGameRoom)
const gameRooms = new Map<string, GameRoom | SpyFallGameRoom>();

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
      gameType: room.gameType,
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

// Get random location for Spy Fall
function getRandomLocation(customLocations: string[]): string {
  const allLocations = [...SPYFALL_LOCATIONS, ...customLocations];
  const randomIndex = Math.floor(Math.random() * allLocations.length);
  return allLocations[randomIndex];
}

// Check if room is Who Am I type
function isWhoAmIRoom(room: GameRoom | SpyFallGameRoom): room is GameRoom {
  return room.gameType === "who-am-i";
}

// Check if room is Spy Fall type
function isSpyFallRoom(room: GameRoom | SpyFallGameRoom): room is SpyFallGameRoom {
  return room.gameType === "spy-fall";
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
    socket.on("createRoom", ({ roomName, password, playerName, sessionId, gameType }) => {
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
        };

        gameRooms.set(roomId, room);
        playerRoomMap.set(socket.id, roomId);
        socket.join(`room-${roomId}`);
        socket.emit("roomJoined", { roomId, roomName, player: player as unknown as Player, isHost: true, gameType: "spy-fall" });
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
        socket.emit("roomJoined", { roomId, roomName, player, isHost: true, gameType: "who-am-i" });
        io.to(`room-${roomId}`).emit("playersUpdate", room.players);
      }

      // Broadcast updated room list to all clients in room-list
      broadcastRoomList(io);

      console.log(`Room "${roomName}" (${roomId}) created by ${playerName} - Type: ${finalGameType}`);
    });

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
        socket.emit("roomJoined", { roomId, roomName: room.name, player: player as unknown as Player, isHost: false, gameType: "spy-fall" });
        io.to(`room-${roomId}`).emit("playersUpdate", room.players);
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
        socket.emit("roomJoined", { roomId, roomName: room.name, player, isHost: false, gameType: "who-am-i" });
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
      room.players = room.players.filter((p) => p.id !== socket.id) as typeof room.players;
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

    // Start game (host only) - Who Am I
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

      if (!isWhoAmIRoom(room)) {
        socket.emit("error", "ห้องนี้ไม่ใช่ Who Am I");
        return;
      }

      // Filter out waiting players for the game
      const activePlayers = room.players.filter(p => !p.isWaiting);

      if (activePlayers.length < 2) {
        socket.emit("error", "ต้องมีผู้เล่นอย่างน้อย 2 คน");
        return;
      }

      // Generate category if random
      const finalCategory =
        category || generateRandomCategory(room.playedCategories);

      // Generate words for each active player
      const words = generateWordsFromPreset(
        finalCategory,
        activePlayers.length
      );

      // Shuffle and assign words to active players, reset round state
      const shuffledWords = words.sort(() => Math.random() - 0.5);
      activePlayers.forEach((player, index) => {
        player.word = shuffledWords[index];
        player.hasAnswered = false;
        player.answerOrder = undefined;
        player.isEliminated = false;
      });

      // Mark waiting players as still waiting
      room.players.filter(p => p.isWaiting).forEach(p => {
        p.word = undefined;
        p.hasAnswered = false;
        p.answerOrder = undefined;
        p.isEliminated = false;
      });

      room.category = finalCategory;
      room.isPlaying = true;
      room.timerDuration = timerMinutes * 60 * 1000;
      room.timerStartedAt = Date.now();
      room.currentRound += 1;
      room.playedCategories.push(finalCategory);
      room.answeredCount = 0;
      room.roundFinished = false;

      // Send game started event with words to active players
      activePlayers.forEach((player) => {
        const otherPlayersWithWords = activePlayers
          .filter((p) => p.id !== player.id)
          .map((p) => ({
            id: p.id,
            name: p.name,
            word: p.word!,
            score: p.score,
            hasAnswered: p.hasAnswered,
            answerOrder: p.answerOrder,
            isEliminated: p.isEliminated,
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

      if (!isWhoAmIRoom(room)) {
        socket.emit("error", "ห้องนี้ไม่ใช่ Who Am I");
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

      if (player.isEliminated) {
        socket.emit("error", "ผู้เล่นนี้ถูกคัดออกแล้ว");
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

      // Check if round should end (all active players answered or eliminated)
      const activePlayers = room.players.filter(p => !p.isWaiting);
      const activeRemaining = activePlayers.filter(p => !p.hasAnswered && !p.isEliminated);
      
      if (activeRemaining.length === 0) {
        room.roundFinished = true;
        room.isPlaying = false;

        // Convert waiting players to active for next round
        room.players.forEach(p => {
          p.isWaiting = false;
        });

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

    // Mark player as wrong (host only) - eliminate from round
    socket.on("markWrong", (playerId) => {
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

      if (!isWhoAmIRoom(room)) {
        socket.emit("error", "ห้องนี้ไม่ใช่ Who Am I");
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

      if (player.isEliminated) {
        socket.emit("error", "ผู้เล่นนี้ถูกคัดออกไปแล้ว");
        return;
      }

      // Mark as eliminated
      player.isEliminated = true;

      // Notify all players
      io.to(`room-${roomId}`).emit("playerEliminated", {
        playerId: player.id,
        playerName: player.name,
      });

      console.log(
        `Room "${room.name}" - ${player.name} answered wrong and is eliminated!`
      );

      // Check if round should end (all active players answered or eliminated)
      const activePlayers = room.players.filter(p => !p.isWaiting);
      const activeRemaining = activePlayers.filter(p => !p.hasAnswered && !p.isEliminated);
      
      if (activeRemaining.length === 0) {
        room.roundFinished = true;
        room.isPlaying = false;

        // Convert waiting players to active for next round
        room.players.forEach(p => {
          p.isWaiting = false;
        });

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

      if (!isWhoAmIRoom(room)) {
        socket.emit("error", "ห้องนี้ไม่ใช่ Who Am I");
        return;
      }

      if (!room.roundFinished) {
        socket.emit("error", "รอบนี้ยังไม่จบ");
        return;
      }

      // All players are now active (waiting players joined)
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
        player.isEliminated = false;
        player.isWaiting = false;
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
            isEliminated: p.isEliminated,
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

    // ==================== SPY FALL EVENTS ====================

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

      // Check if already exists
      const allLocations = [...SPYFALL_LOCATIONS, ...room.customLocations];
      if (allLocations.includes(location)) {
        socket.emit("error", "สถานที่นี้มีอยู่แล้ว");
        return;
      }

      room.customLocations.push(location);
      io.to(`room-${roomId}`).emit("locationsUpdate", room.customLocations);
      console.log(`Room "${room.name}" - Added location: ${location}`);
    });

    // Remove custom location (Spy Fall)
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

      room.customLocations = room.customLocations.filter(l => l !== location);
      io.to(`room-${roomId}`).emit("locationsUpdate", room.customLocations);
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
      room.players.forEach(p => {
        if (p.id !== spy.id) {
          p.isSpy = false;
        }
      });

      // Pick random location
      room.currentLocation = getRandomLocation(room.customLocations);

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
      room.players.forEach(p => {
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
      const spy = room.players.find(p => p.id === room.spyId);
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

    // ==================== COMMON EVENTS ====================

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

    // Reveal own word (Who Am I only)
    socket.on("revealMyWord", () => {
      const roomId = playerRoomMap.get(socket.id);
      if (!roomId) return;

      const room = gameRooms.get(roomId);
      if (!room || !isWhoAmIRoom(room)) return;

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
        currentRoom.players = currentRoom.players.filter((p) => p.sessionId !== sessionId) as typeof currentRoom.players;
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
      
      // Also check if sessionId already exists in any room (active player)
      let activeRoomId: string | null = null;
      let activePlayer: Player | SpyFallPlayer | null = null;
      let activeWasHost = false;
      
      if (!pending) {
        // Search for active session in all rooms
        for (const [roomId, room] of gameRooms.entries()) {
          const existingPlayer = room.players.find(p => p.sessionId === sessionId);
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
          
          // Remove old socket.id from playerRoomMap if different
          if (player.id !== socket.id) {
            playerRoomMap.delete(player.id);
          }
          
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

          if (isSpyFallRoom(room)) {
            // Spy Fall rejoin
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
              myLocation: currentGameState === "playing" ? (spyFallPlayer.isSpy ? null : room.currentLocation) : undefined,
              isSpy: currentGameState === "playing" ? spyFallPlayer.isSpy : undefined,
              timerDuration: room.timerDuration || undefined,
              timerStartedAt: room.timerStartedAt || undefined,
              currentRound: room.currentRound || undefined,
              spyId: currentGameState === "round-end" ? room.spyId || undefined : undefined,
              actualLocation: currentGameState === "round-end" ? room.currentLocation || undefined : undefined,
            });
          } else {
            // Who Am I rejoin
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
              category: room.category || undefined,
              otherPlayers,
              timerDuration: room.timerDuration || undefined,
              timerStartedAt: room.timerStartedAt || undefined,
              currentRound: room.currentRound || undefined,
              playedCategories: room.playedCategories,
            });
          }

          const rejoinType = pending ? "reconnected" : "restored session";
          console.log(`Player ${player.name} ${rejoinType} to room "${room.name}" successfully!`);
          
          // Update all players about the reconnection
          io.to(`room-${roomId}`).emit("playersUpdate", room.players);
        } else {
          // Room no longer exists
          if (pending) {
            pendingDisconnects.delete(sessionId);
          }
          socket.emit("rejoinFailed", "ห้องถูกปิดไปแล้ว");
          socket.emit("roomList", { rooms: getRoomList() });
          console.log(`Rejoin failed - room no longer exists for session: ${sessionId}`);
        }
      } else {
        // No pending session and no active player found
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
