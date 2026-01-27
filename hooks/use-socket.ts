import { useEffect, useState } from "react";
import { io as ClientIO } from "socket.io-client";

export const useSocket = () => {
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
    const socketInstance = new (ClientIO as any)(siteUrl, {
      path: "/api/socket",
      addTrailingSlash: false,
    });

    socketInstance.on("connect", () => {
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { socket, isConnected };
};
