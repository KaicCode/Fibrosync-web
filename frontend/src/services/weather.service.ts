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
  getCurrentWeather: async (lat: number, lon: number): Promise<WeatherData> => {
    return apiCall<WeatherData>("get", "/weather/current", undefined, {
      params: { lat, lon },
    });
  },
};
