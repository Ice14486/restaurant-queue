const configuredUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:6001";

export const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return configuredUrl;
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:6001`;
  }

  return configuredUrl;
};
