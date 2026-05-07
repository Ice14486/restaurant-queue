import client from "./client";
import { User } from "../types";

export interface LoginResponse {
  token: string;
  user: User;
}

export const registerCustomer = (
  email: string,
  password: string,
  name: string
): Promise<LoginResponse> =>
  client.post("/api/auth/register", { email, password, name }).then((r) => r.data);

export const loginCustomer = (
  email: string,
  password: string
): Promise<LoginResponse> =>
  client.post("/api/auth/login", { email, password }).then((r) => r.data);

export const loginStaff = (
  restaurant_id: string,
  staff_id: string,
  pin: string
): Promise<LoginResponse> =>
  client.post("/api/auth/staff/login", { restaurant_id, staff_id, pin }).then((r) => r.data);

export const getMe = (): Promise<{ user: User }> =>
  client.get("/api/auth/me").then((r) => r.data);
