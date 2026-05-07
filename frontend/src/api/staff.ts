import client from "./client";
import { QueueEntry, Table } from "../types";

export const callNext = (): Promise<{ entry: QueueEntry; message?: string }> =>
  client.post("/api/staff/call-next").then((r) => r.data);

export const seatParty = (
  entry_id: string,
  table_id?: string
): Promise<void> =>
  client.post(`/api/staff/seat/${entry_id}`, { table_id }).then((r) => r.data);

export const updateTableStatus = (
  table_id: string,
  status: string
): Promise<{ table: Table }> =>
  client.post(`/api/staff/tables/${table_id}/status`, { status }).then((r) => r.data);

export const updateRestaurantSettings = (settings: Record<string, unknown>) =>
  client.patch("/api/staff/settings", settings).then((r) => r.data);
