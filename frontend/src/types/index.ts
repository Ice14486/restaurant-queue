export type UserRole = "customer" | "staff" | "admin";

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  restaurant_id?: string | null;
  active_queue_entry_id?: string | null;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  operating_hours: Record<string, { open: string; close: string; closed: boolean }>;
  max_queue_capacity: number;
  avg_turn_time_minutes: number;
  is_accepting_queue: boolean;
  current_queue_length: number;
  estimated_wait_minutes: number;
  table_count: number;
}

export type QueueStatus = "waiting" | "called" | "seated" | "cancelled" | "expired";

export interface QueueEntry {
  id: string;
  restaurant_id: string;
  restaurant_name?: string;
  user_id: string;
  party_size: number;
  status: QueueStatus;
  position: number;
  estimated_wait_minutes: number;
  queue_number: number;
  joined_at: string;
  called_at: string | null;
  seated_at: string | null;
  cancelled_at: string | null;
}

export type TableStatus = "available" | "occupied" | "reserved" | "cleaning";

export interface Table {
  id: string;
  restaurant_id: string;
  table_number: number;
  capacity: number;
  status: TableStatus;
  current_queue_entry_id: string | null;
  updated_at: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
}
