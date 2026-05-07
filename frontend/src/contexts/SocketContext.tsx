import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthContext } from "./AuthContext";
import { getApiBaseUrl } from "../api/baseUrl";

const BASE_URL = getApiBaseUrl();

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  subscribeRestaurant: (id: string) => void;
  unsubscribeRestaurant: (id: string) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
  subscribeRestaurant: () => {},
  unsubscribeRestaurant: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuthContext();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const s = io(BASE_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    socketRef.current = s;

    return () => {
      s.disconnect();
      setConnected(false);
    };
  }, [token]);

  const subscribeRestaurant = (id: string) =>
    socketRef.current?.emit("subscribe_restaurant", { restaurant_id: id });

  const unsubscribeRestaurant = (id: string) =>
    socketRef.current?.emit("unsubscribe_restaurant", { restaurant_id: id });

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, connected, subscribeRestaurant, unsubscribeRestaurant }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
