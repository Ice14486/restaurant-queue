import client from "./client";
import { Restaurant, Table } from "../types";

export const listRestaurants = (query?: string): Promise<{ restaurants: Restaurant[] }> =>
  client.get("/api/restaurants/", { params: query ? { q: query } : {} }).then((r) => r.data);

export const getRestaurant = (id: string): Promise<{ restaurant: Restaurant }> =>
  client.get(`/api/restaurants/${id}`).then((r) => r.data);

export const listTables = (restaurantId: string): Promise<{ tables: Table[] }> =>
  client.get(`/api/restaurants/${restaurantId}/tables`).then((r) => r.data);
