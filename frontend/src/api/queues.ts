import client from "./client";
import { QueueEntry } from "../types";

export const joinQueue = (
  restaurant_id: string,
  party_size: number
): Promise<{ entry: QueueEntry }> =>
  client.post("/api/queues/join", { restaurant_id, party_size }).then((r) => r.data);

export const cancelQueue = (entry_id: string): Promise<void> =>
  client.post(`/api/queues/${entry_id}/cancel`).then((r) => r.data);

export const myStatus = (): Promise<{ entry: QueueEntry | null }> =>
  client.get("/api/queues/my-status").then((r) => r.data);

export const bookingHistory = (): Promise<{ history: QueueEntry[] }> =>
  client.get("/api/queues/history").then((r) => r.data);

export const restaurantQueue = (
  restaurant_id: string
): Promise<{ queue: QueueEntry[] }> =>
  client.get(`/api/queues/restaurant/${restaurant_id}`).then((r) => r.data);
