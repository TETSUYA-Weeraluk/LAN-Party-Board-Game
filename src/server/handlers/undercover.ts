// Undercover game handlers

import type { Server as SocketIOServer, Socket } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/types/game";
import {
  gameRooms,
  playerRoomMap,
  broadcastRoomList,
  isUndercoverRoom,
} from "../rooms";
import {
  getRandomUndercoverWords,
  distributeUndercoverRoles,
  checkUndercoverWinCondition,
} from "../utils/game";

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type GameIO = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

export function registerUndercoverHandlers(io: GameIO, socket: GameSocket) {
  // Toggle spectator mode (Undercover)
  socket.on("toggleSpectator", (isSpectator) => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) return;

    const room = gameRooms.get(roomId);
    if (!room || !isUndercoverRoom(room)) return;

    // Can only toggle when not playing
    if (room.isPlaying) {
      socket.emit("error", "ไม่สามารถเปลี่ยนสถานะระหว่างเล่น");
      return;
    }

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    player.isSpectator = isSpectator;

    // Send players update
    const alivePlayers = room.players.filter((p) => !p.isSpectator);
    const spectators = room.players.filter((p) => p.isSpectator);
    io.to(`room-${roomId}`).emit("undercoverPlayersUpdate", {
      alivePlayers,
      spectators,
    });

    console.log(
      `Room "${room.name}" - ${player.name} is now ${
        isSpectator ? "spectator" : "player"
      }`
    );
  });

  // Start Undercover game (host only)
  socket.on("startUndercoverGame", () => {
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

    if (!isUndercoverRoom(room)) {
      socket.emit("error", "ห้องนี้ไม่ใช่ Undercover");
      return;
    }

    // Get active players (non-spectators)
    const activePlayers = room.players.filter((p) => !p.isSpectator);

    if (activePlayers.length < 3 || activePlayers.length > 10) {
      socket.emit("error", "ต้องมีผู้เล่น 3-10 คน");
      return;
    }

    // Get word pair
    const wordPair = getRandomUndercoverWords();
    room.civilianWord = wordPair.civilians;
    room.undercoverWord = wordPair.undercover;

    // Distribute roles
    const roles = distributeUndercoverRoles(activePlayers.length);

    // Assign roles and words to active players
    activePlayers.forEach((player, index) => {
      player.role = roles[index];
      player.isAlive = true;

      // Assign word based on role
      if (player.role === "civilian") {
        player.word = room.civilianWord!;
      } else if (player.role === "undercover") {
        player.word = room.undercoverWord!;
      } else {
        // Mr.White gets no word
        player.word = undefined;
      }
    });

    // Reset spectators
    room.players
      .filter((p) => p.isSpectator)
      .forEach((p) => {
        p.role = undefined;
        p.word = undefined;
        p.isAlive = false;
      });

    room.currentRound += 1;
    room.isPlaying = true;
    room.roundFinished = false;
    room.lastVotedPlayerId = null;
    room.waitingForMrWhiteGuess = false;
    room.roundResult = null;

    // Send game started to each player
    const alivePlayersForEmit = room.players.filter(
      (p) => p.isAlive && !p.isSpectator
    );
    const spectators = room.players.filter((p) => p.isSpectator);

    room.players.forEach((player) => {
      if (player.isSpectator) {
        // Spectators see everyone's role and word
        io.to(player.id).emit("undercoverGameStarted", {
          role: "civilian", // dummy, spectators will see all
          word: null,
          currentRound: room.currentRound,
          alivePlayers: alivePlayersForEmit,
          spectators: spectators,
        });
      } else {
        // Players see only their own role and word
        io.to(player.id).emit("undercoverGameStarted", {
          role: player.role!,
          word: player.word || null,
          currentRound: room.currentRound,
          alivePlayers: alivePlayersForEmit.map((p) => ({
            ...p,
            role: undefined, // Hide role from other players
            word: undefined, // Hide word from other players
          })),
          spectators: spectators,
        });
      }
    });

    // Broadcast updated room list
    broadcastRoomList(io);

    console.log(
      `Room "${room.name}" - Undercover Round ${room.currentRound} started - Words: ${room.civilianWord}/${room.undercoverWord}`
    );
  });

  // Vote player out (host only)
  socket.on("undercoverVote", ({ playerId }) => {
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

    if (!isUndercoverRoom(room)) {
      socket.emit("error", "ห้องนี้ไม่ใช่ Undercover");
      return;
    }

    if (!room.isPlaying) {
      socket.emit("error", "เกมยังไม่เริ่ม");
      return;
    }

    const votedPlayer = room.players.find((p) => p.id === playerId);
    if (!votedPlayer || !votedPlayer.isAlive || votedPlayer.isSpectator) {
      socket.emit("error", "ไม่พบผู้เล่นหรือผู้เล่นถูกโหวตออกแล้ว");
      return;
    }

    // Mark player as not alive
    votedPlayer.isAlive = false;
    room.lastVotedPlayerId = playerId;

    // Check if voted player is Mr.White
    const isMrWhite = votedPlayer.role === "mrwhite";

    // Send vote result to all players
    io.to(`room-${roomId}`).emit("undercoverVoteResult", {
      votedPlayerId: playerId,
      votedPlayerName: votedPlayer.name,
      votedPlayerRole: votedPlayer.role!,
      votedPlayerWord: votedPlayer.word,
      isMrWhiteGuessing: isMrWhite,
    });

    if (isMrWhite) {
      // Wait for Mr.White to guess
      room.waitingForMrWhiteGuess = true;
      console.log(
        `Room "${room.name}" - ${votedPlayer.name} (Mr.White) was voted out, waiting for guess...`
      );
    } else {
      // Check win condition
      handleWinConditionCheck(io, room, roomId);
    }
  });

  // Mr.White guess (voted Mr.White player only)
  socket.on("undercoverMrWhiteGuess", ({ guess }) => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) {
      socket.emit("error", "คุณไม่ได้อยู่ในห้อง");
      return;
    }

    const room = gameRooms.get(roomId);
    if (!room || !isUndercoverRoom(room)) {
      socket.emit("error", "ห้องนี้ไม่ใช่ Undercover");
      return;
    }

    if (!room.waitingForMrWhiteGuess) {
      socket.emit("error", "ไม่ได้อยู่ในช่วงทายคำ");
      return;
    }

    const mrWhitePlayer = room.players.find(
      (p) => p.id === room.lastVotedPlayerId
    );
    if (!mrWhitePlayer || mrWhitePlayer.id !== socket.id) {
      socket.emit("error", "คุณไม่ใช่ Mr.White ที่ถูกโหวต");
      return;
    }

    room.waitingForMrWhiteGuess = false;

    // Check if guess is correct (case-insensitive, trim whitespace)
    const isCorrect =
      guess.trim().toLowerCase() === room.civilianWord!.trim().toLowerCase();

    // Send guess result (without revealing what was guessed)
    io.to(`room-${roomId}`).emit("undercoverMrWhiteGuessResult", {
      playerId: mrWhitePlayer.id,
      playerName: mrWhitePlayer.name,
      isCorrect,
    });

    if (isCorrect) {
      // Mr.White wins
      room.isPlaying = false;
      room.roundFinished = true;
      room.roundResult = "mrwhite-win";

      // Award points to Mr.White
      mrWhitePlayer.score += 3;
      mrWhitePlayer.wins += 1;

      // Convert spectators to players for next round
      room.players.forEach((p) => {
        p.isSpectator = false;
      });

      io.to(`room-${roomId}`).emit("undercoverRoundEnded", {
        players: room.players,
        result: "mrwhite-win",
        civilianWord: room.civilianWord!,
        undercoverWord: room.undercoverWord!,
        currentRound: room.currentRound,
      });

      // Broadcast updated room list
      broadcastRoomList(io);

      console.log(
        `Room "${room.name}" - Mr.White guessed correctly! Mr.White wins!`
      );
    } else {
      // Mr.White guessed wrong, check win condition
      handleWinConditionCheck(io, room, roomId);
    }
  });

  // End Undercover game (host only) - for manual reset
  socket.on("endUndercoverGame", () => {
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

    if (!isUndercoverRoom(room)) {
      socket.emit("error", "ห้องนี้ไม่ใช่ Undercover");
      return;
    }

    // Reset game state
    room.isPlaying = false;
    room.roundFinished = true;
    room.waitingForMrWhiteGuess = false;

    // Reset all players
    room.players.forEach((p) => {
      p.isAlive = true;
      p.isSpectator = false;
      p.role = undefined;
      p.word = undefined;
    });

    // Send round ended with current result
    io.to(`room-${roomId}`).emit("undercoverRoundEnded", {
      players: room.players,
      result: room.roundResult || "civilian-win",
      civilianWord: room.civilianWord || "",
      undercoverWord: room.undercoverWord || "",
      currentRound: room.currentRound,
    });

    // Broadcast updated room list
    broadcastRoomList(io);

    console.log(`Room "${room.name}" - Game ended by host`);
  });
}

// Helper function to check win condition after vote or Mr.White guess
function handleWinConditionCheck(
  io: GameIO,
  room: ReturnType<typeof gameRooms.get> & { gameType: "undercover" },
  roomId: string
) {
  if (!room || !isUndercoverRoom(room)) return;

  const winResult = checkUndercoverWinCondition(room);

  if (winResult) {
    // End round
    room.isPlaying = false;
    room.roundFinished = true;
    room.roundResult = winResult;

    // Award points
    room.players.forEach((p) => {
      if (!p.isSpectator) {
        if (winResult === "civilian-win" && p.role === "civilian") {
          p.score += 1;
          p.wins += 1;
        } else if (winResult === "undercover-win" && p.role === "undercover") {
          p.score += 2;
          p.wins += 1;
        }
      }
    });

    // Convert spectators to players for next round
    room.players.forEach((p) => {
      p.isSpectator = false;
    });

    io.to(`room-${roomId}`).emit("undercoverRoundEnded", {
      players: room.players,
      result: winResult,
      civilianWord: room.civilianWord!,
      undercoverWord: room.undercoverWord!,
      currentRound: room.currentRound,
    });

    // Broadcast updated room list
    broadcastRoomList(io);

    console.log(`Room "${room.name}" - Round ended: ${winResult}`);
  } else {
    // Game continues - update players
    const alivePlayers = room.players.filter((p) => p.isAlive && !p.isSpectator);
    const spectators = room.players.filter((p) => p.isSpectator);
    io.to(`room-${roomId}`).emit("undercoverPlayersUpdate", {
      alivePlayers,
      spectators,
    });

    console.log(`Room "${room.name}" - Vote processed, game continues`);
  }
}
