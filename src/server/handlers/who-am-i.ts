// Who Am I game handlers

import type { Server as SocketIOServer, Socket } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  Player,
  GameRoom,
} from "@/types/game";
import {
  gameRooms,
  playerRoomMap,
  broadcastRoomList,
  isWhoAmIRoom,
} from "../rooms";
import {
  calculateScore,
  generateWordsFromPreset,
  generateRandomCategory,
} from "../utils/game";

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type GameIO = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

export function registerWhoAmIHandlers(io: GameIO, socket: GameSocket) {
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
    const activePlayers = room.players.filter((p) => !p.isWaiting);

    if (activePlayers.length < 2) {
      socket.emit("error", "ต้องมีผู้เล่นอย่างน้อย 2 คน");
      return;
    }

    // Generate category if random
    const finalCategory =
      category || generateRandomCategory(room.playedCategories);

    // Generate words for each active player
    const words = generateWordsFromPreset(finalCategory, activePlayers.length);

    // Shuffle and assign words to active players, reset round state
    const shuffledWords = words.sort(() => Math.random() - 0.5);
    activePlayers.forEach((player, index) => {
      player.word = shuffledWords[index];
      player.hasAnswered = false;
      player.answerOrder = undefined;
      player.isEliminated = false;
    });

    // Mark waiting players as still waiting
    room.players
      .filter((p) => p.isWaiting)
      .forEach((p) => {
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
    checkRoundEnd(io, room, roomId);
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

    // Check if round should end
    checkRoundEnd(io, room, roomId);
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
    const words = generateWordsFromPreset(finalCategory, room.players.length);

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
}

// Helper function to check if round should end
function checkRoundEnd(io: GameIO, room: GameRoom, roomId: string) {
  const activePlayers = room.players.filter((p) => !p.isWaiting);
  const activeRemaining = activePlayers.filter(
    (p) => !p.hasAnswered && !p.isEliminated
  );

  if (activeRemaining.length === 0) {
    room.roundFinished = true;
    room.isPlaying = false;

    // Convert waiting players to active for next round
    room.players.forEach((p) => {
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
}
