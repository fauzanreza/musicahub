import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { NextApiResponseServerIO } from "@/types/socket";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    console.log("*First use, starting socket.io");

    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
    });

    io.on("connection", (socket) => {
      console.log("Client connected", socket.id);

      socket.on("join-jam", (jamId) => {
        socket.join(jamId);
        console.log(`Socket ${socket.id} joined jam ${jamId}`);
      });

      socket.on("leave-jam", (jamId) => {
        socket.leave(jamId);
        console.log(`Socket ${socket.id} left jam ${jamId}`);
      });

      socket.on("send-message", ({ jamId, message }) => {
        io.to(jamId).emit("new-message", message);
      });

      socket.on("send-reaction", ({ jamId, reaction, userId }) => {
        io.to(jamId).emit("new-reaction", { reaction, userId });
      });

      socket.on("sync-playback", ({ jamId, state }) => {
        // Broadcast to everyone in the jam except the sender (host)
        socket.to(jamId).emit("playback-state", state);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected", socket.id);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log("socket.io already running");
  }
  res.end();
};

export default ioHandler;
