// The Imposter game handlers (เดิม Undercover)

import type { Server as SocketIOServer, Socket } from "socket.io";
import type { ServerToClientEvents, ClientToServerEvents } from "@/types/game";
import {
  gameRooms,
  playerRoomMap,
  broadcastRoomList,
  isImposterRoom,
} from "../rooms";
import {
  getRandomImposterWords,
  distributeImposterRoles,
  checkImposterWinCondition,
} from "../utils/game";

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type GameIO = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

export function registerImposterHandlers(io: GameIO, socket: GameSocket) {
  socket.on("toggleSpectator", (isSpectator) => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) return;

    const room = gameRooms.get(roomId);
    if (!room || !isImposterRoom(room)) return;

    if (room.isPlaying) {
      socket.emit("error", "ไม่สามารถเปลี่ยนสถานะระหว่างเล่น");
      return;
    }

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    player.isSpectator = isSpectator;

    const alivePlayers = room.players.filter((p) => !p.isSpectator);
    const spectators = room.players.filter((p) => p.isSpectator);
    io.to(`room-${roomId}`).emit("imposterPlayersUpdate", {
      alivePlayers,
      spectators,
    });
  });

  socket.on("startImposterGame", () => {
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

    if (!isImposterRoom(room)) {
      socket.emit("error", "ห้องนี้ไม่ใช่ The Imposter");
      return;
    }

    const activePlayers = room.players.filter((p) => !p.isSpectator);

    if (activePlayers.length < 3 || activePlayers.length > 10) {
      socket.emit("error", "ต้องมีผู้เล่น 3-10 คน");
      return;
    }

    const wordPair = getRandomImposterWords(room.usedWordPairIndices || []);

    room.citizenWord = wordPair.citizen;
    room.imposterWord = wordPair.imposter;

    if (!room.usedWordPairIndices) {
      room.usedWordPairIndices = [];
    }
    room.usedWordPairIndices.push(wordPair.index);

    const roles = distributeImposterRoles(activePlayers.length);

    activePlayers.forEach((player, index) => {
      player.role = roles[index];
      player.isAlive = true;

      if (player.role === "citizen") {
        player.word = room.citizenWord!;
      } else if (player.role === "imposter") {
        player.word = room.imposterWord!;
      } else {
        player.word = undefined;
      }
    });

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
    room.waitingForBlankGuess = false;
    room.roundResult = null;

    const playersWithWord = activePlayers.filter((p) => p.role !== "blank");
    const randomFirstPlayer =
      playersWithWord[Math.floor(Math.random() * playersWithWord.length)];
    room.currentTurnPlayerId = randomFirstPlayer.id;

    const alivePlayersForEmit = room.players.filter(
      (p) => p.isAlive && !p.isSpectator,
    );
    const spectators = room.players.filter((p) => p.isSpectator);
    const firstPlayerName = randomFirstPlayer.name;

    room.players.forEach((player) => {
      if (player.isSpectator) {
        io.to(player.id).emit("imposterGameStarted", {
          role: "citizen",
          word: null,
          currentRound: room.currentRound,
          alivePlayers: alivePlayersForEmit,
          spectators,
          currentTurnPlayerId: room.currentTurnPlayerId!,
          currentTurnPlayerName: firstPlayerName,
        });
      } else {
        io.to(player.id).emit("imposterGameStarted", {
          role: player.role!,
          word: player.word || null,
          currentRound: room.currentRound,
          alivePlayers: alivePlayersForEmit.map((p) => ({
            ...p,
            role: undefined,
            word: undefined,
          })),
          spectators,
          currentTurnPlayerId: room.currentTurnPlayerId!,
          currentTurnPlayerName: firstPlayerName,
        });
      }
    });

    broadcastRoomList(io);
  });

  socket.on("imposterVote", ({ playerId }) => {
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

    if (!isImposterRoom(room)) {
      socket.emit("error", "ห้องนี้ไม่ใช่ The Imposter");
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

    votedPlayer.isAlive = false;
    room.lastVotedPlayerId = playerId;

    const isBlank = votedPlayer.role === "blank";

    const blankWhoGuesses = isBlank ? votedPlayer : null;
    room.players.forEach((p) => {
      const isYouGuessing =
        blankWhoGuesses !== null && p.id === blankWhoGuesses.id;
      io.to(p.id).emit("imposterVoteResult", {
        votedPlayerId: playerId,
        votedPlayerName: votedPlayer.name,
        votedPlayerRole: votedPlayer.role!,
        votedPlayerWord: votedPlayer.word,
        isBlankGuessing: isBlank,
        isYouGuessing,
      });
    });

    if (isBlank) {
      room.waitingForBlankGuess = true;
    } else {
      handleWinConditionCheck(io, room, roomId);
    }
  });

  socket.on("imposterBlankGuess", ({ guess }) => {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) {
      socket.emit("error", "คุณไม่ได้อยู่ในห้อง");
      return;
    }

    const room = gameRooms.get(roomId);
    if (!room || !isImposterRoom(room)) {
      socket.emit("error", "ห้องนี้ไม่ใช่ The Imposter");
      return;
    }

    if (!room.waitingForBlankGuess) {
      socket.emit("error", "ไม่ได้อยู่ในช่วงทายคำ");
      return;
    }

    const currentPlayer = room.players.find((p) => p.id === socket.id);
    if (!currentPlayer || currentPlayer.role !== "blank") {
      socket.emit("error", "คุณไม่ใช่ Blank");
      return;
    }

    const blankPlayer = room.players.find(
      (p) => p.role === "blank" && !p.isAlive,
    );
    if (!blankPlayer) {
      socket.emit("error", "ไม่พบ Blank ที่ถูกโหวต");
      return;
    }

    room.waitingForBlankGuess = false;

    const isCorrect =
      guess.trim().toLowerCase() === room.citizenWord!.trim().toLowerCase();

    io.to(`room-${roomId}`).emit("imposterBlankGuessResult", {
      playerId: blankPlayer.id,
      playerName: blankPlayer.name,
      isCorrect,
    });

    if (isCorrect) {
      room.isPlaying = false;
      room.roundFinished = true;
      room.roundResult = "blank-win";

      blankPlayer.score += 3;
      blankPlayer.wins += 1;

      room.players.forEach((p) => {
        p.isSpectator = false;
      });

      io.to(`room-${roomId}`).emit("imposterRoundEnded", {
        players: room.players,
        result: "blank-win",
        citizenWord: room.citizenWord!,
        imposterWord: room.imposterWord!,
        currentRound: room.currentRound,
      });

      broadcastRoomList(io);
    } else {
      handleWinConditionCheck(io, room, roomId);
    }
  });

  socket.on("imposterSkipBlankGuess", () => {
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

    if (!isImposterRoom(room)) {
      socket.emit("error", "ห้องนี้ไม่ใช่ The Imposter");
      return;
    }

    if (!room.waitingForBlankGuess) {
      socket.emit("error", "ไม่ได้อยู่ในช่วงทายคำ");
      return;
    }

    room.waitingForBlankGuess = false;

    const blankPlayer = room.players.find(
      (p) => p.role === "blank" && !p.isAlive,
    );

    if (blankPlayer) {
      io.to(`room-${roomId}`).emit("imposterBlankGuessResult", {
        playerId: blankPlayer.id,
        playerName: blankPlayer.name,
        isCorrect: false,
      });
    }

    handleWinConditionCheck(io, room, roomId);
  });

  socket.on("endImposterGame", () => {
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

    if (!isImposterRoom(room)) {
      socket.emit("error", "ห้องนี้ไม่ใช่ The Imposter");
      return;
    }

    room.isPlaying = false;
    room.roundFinished = true;
    room.waitingForBlankGuess = false;

    room.players.forEach((p) => {
      p.isAlive = true;
      p.isSpectator = false;
      p.role = undefined;
      p.word = undefined;
    });

    io.to(`room-${roomId}`).emit("imposterRoundEnded", {
      players: room.players,
      result: room.roundResult || "citizen-win",
      citizenWord: room.citizenWord || "",
      imposterWord: room.imposterWord || "",
      currentRound: room.currentRound,
    });

    broadcastRoomList(io);
  });
}

function handleWinConditionCheck(
  io: GameIO,
  room: ReturnType<typeof gameRooms.get> & { gameType: "imposter" },
  roomId: string,
) {
  if (!room || !isImposterRoom(room)) return;

  const winResult = checkImposterWinCondition(room);

  if (winResult) {
    room.isPlaying = false;
    room.roundFinished = true;
    room.roundResult = winResult;

    room.players.forEach((p) => {
      if (!p.isSpectator) {
        if (winResult === "citizen-win" && p.role === "citizen") {
          p.score += 1;
          p.wins += 1;
        } else if (winResult === "imposter-win" && p.role === "imposter") {
          p.score += 2;
          p.wins += 1;
        }
      }
    });

    room.players.forEach((p) => {
      p.isSpectator = false;
    });

    io.to(`room-${roomId}`).emit("imposterRoundEnded", {
      players: room.players,
      result: winResult,
      citizenWord: room.citizenWord!,
      imposterWord: room.imposterWord!,
      currentRound: room.currentRound,
    });

    broadcastRoomList(io);
  } else {
    const alivePlayers = room.players.filter(
      (p) => p.isAlive && !p.isSpectator,
    );
    const spectators = room.players.filter((p) => p.isSpectator);
    io.to(`room-${roomId}`).emit("imposterPlayersUpdate", {
      alivePlayers,
      spectators,
    });
  }
}
