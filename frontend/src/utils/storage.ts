import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "rq_auth_token";

export const getToken = (): Promise<string | null> => {
  if (Platform.OS === "web") {
    return Promise.resolve(localStorage.getItem(TOKEN_KEY));
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const setToken = (token: string): Promise<void> => {
  if (Platform.OS === "web") {
    localStorage.setItem(TOKEN_KEY, token);
    return Promise.resolve();
  }
  return SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const deleteToken = (): Promise<void> => {
  if (Platform.OS === "web") {
    localStorage.removeItem(TOKEN_KEY);
    return Promise.resolve();
  }
  return SecureStore.deleteItemAsync(TOKEN_KEY);
};
