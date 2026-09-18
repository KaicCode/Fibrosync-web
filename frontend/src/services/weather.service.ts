import { apiCall } from "@/lib/api-client";

export type WeatherDataSource =
  | "live"
  | "cache"
  | "database-fallback"
  | "safe-fallback";

export interface WeatherData {
  temperature: number;
  humidity: number;
  apparentTemperature: number;
  precipitation: number;
  pressure: number;
  windSpeed: number;
  weatherCode: number;
  source?: WeatherDataSource;
  fetchedAt?: string;
}

export const weatherService = {
  // F-20: coordinates travel in the POST body, never in a query string, so
  // they never land in the browser's URL history, proxy/CDN access logs or
  // Referer headers.
  getCurrentWeather: async (lat: number, lon: number): Promise<WeatherData> => {
    return apiCall<WeatherData>("post", "/weather/current", { lat, lon });
  },
};
