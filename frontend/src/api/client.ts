import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { getToken } from "../utils/storage";
import { getApiBaseUrl } from "./baseUrl";

const BASE_URL = getApiBaseUrl();

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.error ?? error.message ?? "Network error";
    return Promise.reject(new Error(message));
  }
);

export default client;
