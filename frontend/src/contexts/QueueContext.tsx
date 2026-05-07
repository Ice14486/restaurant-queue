import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { QueueEntry } from "../types";
import { myStatus } from "../api/queues";
import { useAuthContext } from "./AuthContext";
import { useSocket } from "./SocketContext";

interface QueueContextValue {
  activeEntry: QueueEntry | null;
  refreshEntry: () => Promise<void>;
  setActiveEntry: (entry: QueueEntry | null) => void;
}

const QueueContext = createContext<QueueContextValue>({
  activeEntry: null,
  refreshEntry: async () => {},
  setActiveEntry: () => {},
});

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthContext();
  const { socket } = useSocket();
  const [activeEntry, setActiveEntry] = useState<QueueEntry | null>(null);

  const refreshEntry = useCallback(async () => {
    if (!user || user.role !== "customer") return;
    try {
      const { entry } = await myStatus();
      setActiveEntry(entry);
    } catch {
      // Network required; silently fail
    }
  }, [user]);

  useEffect(() => {
    refreshEntry();
  }, [refreshEntry]);

  useEffect(() => {
    if (!socket) return;
    const handleQueueUpdate = (data: { queue: QueueEntry[] }) => {
      if (!activeEntry) return;
      const updated = data.queue.find((e) => e.id === activeEntry.id);
      if (updated) setActiveEntry(updated);
    };
    const handleYourTurn = () => refreshEntry();

    socket.on("queue_update", handleQueueUpdate);
    socket.on("your_turn", handleYourTurn);
    return () => {
      socket.off("queue_update", handleQueueUpdate);
      socket.off("your_turn", handleYourTurn);
    };
  }, [socket, activeEntry, refreshEntry]);

  return (
    <QueueContext.Provider value={{ activeEntry, refreshEntry, setActiveEntry }}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueueContext = () => useContext(QueueContext);
