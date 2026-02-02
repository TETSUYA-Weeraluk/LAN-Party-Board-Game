import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "./src/types/game";

// Import handlers from server modules
import {
  registerCommonHandlers,
  registerGuessMeHandlers,
  registerSpyFallHandlers,
  registerImposterHandlers,
} from "./src/server";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0"; // Listen on all network interfaces for LAN access
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

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

    // Register all handlers
    registerCommonHandlers(io, socket);     // Room management, connection, rejoin
    registerGuessMeHandlers(io, socket);   // Guess Me game events
    registerSpyFallHandlers(io, socket);   // Where Are We game events
    registerImposterHandlers(io, socket);  // The Imposter game events
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> For LAN access, use your local IP address`);
  });
});
