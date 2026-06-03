import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  weatherService,
  type WeatherData,
  type WeatherDataSource,
} from "@/services/weather.service";

const WEATHER_CACHE_MS = 30 * 60 * 1000;

export type CurrentLocationStatus =
  | "idle"
  | "loading"
  | "ready"
  | "denied"
  | "unsupported"
  | "error";

type Coordinates = {
  lat: number;
  lon: number;
};

class GeolocationRequestError extends Error {
  readonly kind: "permission" | "position" | "unsupported";

  constructor(kind: "permission" | "position" | "unsupported", message: string) {
    super(message);
    this.name = "GeolocationRequestError";
    this.kind = kind;
  }
}

export function resolveWeatherConditionLabel(weatherCode: number): string {
  if (weatherCode === 0) {
    return "Céu limpo";
  }

  if ([1, 2, 3].includes(weatherCode)) {
    return "Parcialmente nublado";
  }

  if ([45, 48].includes(weatherCode)) {
    return "Neblina";
  }

  if ([51, 53, 55, 56, 57].includes(weatherCode)) {
    return "Garoa";
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
    return "Chuva";
  }

  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return "Neve";
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return "Tempestade";
  }

  return "Condição variável";
}

export function isWeatherRiskElevated(
  weather: WeatherData | null | undefined,
): boolean {
  if (!weather) {
    return false;
  }

  return (
    (weather.temperature < 20 && weather.humidity > 70) ||
    weather.pressure < 1000 ||
    weather.precipitation > 0
  );
}

export function resolveWeatherImpactMessage(
  weather: WeatherData | null | undefined,
): string {
  if (!weather) {
    return "Sem leitura climática suficiente no momento.";
  }

  if (weather.temperature < 20 && weather.humidity > 70) {
    return "Frio e umidade alta podem aumentar rigidez e dor hoje.";
  }

  if (weather.pressure < 1000) {
    return "Queda de pressão pode deixar o corpo mais sensível hoje.";
  }

  if (weather.precipitation > 0 && weather.humidity >= 70) {
    return "Chuva e ar úmido podem aumentar fadiga e sensação de peso.";
  }

  if (weather.humidity >= 70) {
    return "Alta umidade pode aumentar fadiga hoje.";
  }

  if (weather.apparentTemperature > 32) {
    return "Calor e sensação térmica elevada podem pedir mais pausas e hidratação.";
  }

  return "Clima relativamente estável para acompanhar sintomas com mais clareza.";
}

export function resolveWeatherSourceLabel(
  source?: WeatherDataSource,
): string | null {
  if (!source || source === "live" || source === "cache") {
    return null;
  }

  if (source === "database-fallback") {
    return "Último clima salvo";
  }

  return "Modo contingência";
}

export function useCurrentLocation(enabled = true) {
  const supportsGeolocation =
    typeof navigator !== "undefined" && Boolean(navigator.geolocation);
  const locationQuery = useQuery<Coordinates, GeolocationRequestError>({
    queryKey: ["current-location", enabled, supportsGeolocation],
    queryFn: () =>
      new Promise<Coordinates>((resolve, reject) => {
        if (!supportsGeolocation) {
          reject(
            new GeolocationRequestError(
              "unsupported",
              "Seu navegador não oferece geolocalização para cruzar clima e sintomas.",
            ),
          );
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: Number(position.coords.latitude.toFixed(6)),
              lon: Number(position.coords.longitude.toFixed(6)),
            });
          },
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              reject(
                new GeolocationRequestError(
                  "permission",
                  "Você pode continuar usando o app normalmente. Quando quiser, habilite o GPS para conectarmos clima e sintomas.",
                ),
              );
              return;
            }

            reject(
              new GeolocationRequestError(
                "position",
                "Não conseguimos acessar sua localização agora. Tente novamente em instantes.",
              ),
            );
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: WEATHER_CACHE_MS,
          },
        );
      }),
    enabled: enabled && supportsGeolocation,
    staleTime: WEATHER_CACHE_MS,
    gcTime: WEATHER_CACHE_MS * 2,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const requestLocation = useCallback(() => {
    if (!enabled || !supportsGeolocation) {
      return;
    }

    void locationQuery.refetch();
  }, [enabled, supportsGeolocation, locationQuery]);

  const resolvedStatus: CurrentLocationStatus = !enabled
    ? "idle"
    : !supportsGeolocation
      ? "unsupported"
      : locationQuery.isPending || locationQuery.isFetching
        ? "loading"
        : locationQuery.isSuccess
          ? "ready"
          : locationQuery.error?.kind === "permission"
            ? "denied"
            : "error";

  const resolvedErrorMessage = !enabled
    ? null
    : !supportsGeolocation
      ? "Seu navegador não oferece geolocalização para cruzar clima e sintomas."
      : locationQuery.error?.message ?? null;

  return {
    coordinates: enabled ? locationQuery.data ?? null : null,
    status: resolvedStatus,
    errorMessage: resolvedErrorMessage,
    requestLocation,
  };
}

export function useWeather(lat?: number | null, lon?: number | null) {
  const hasCoordinates = typeof lat === "number" && typeof lon === "number";

  const query = useQuery({
    queryKey: ["weather", lat ?? null, lon ?? null],
    queryFn: () => weatherService.getCurrentWeather(lat!, lon!),
    enabled: hasCoordinates,
    staleTime: WEATHER_CACHE_MS,
    gcTime: WEATHER_CACHE_MS * 2,
    refetchInterval: hasCoordinates ? WEATHER_CACHE_MS : false,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    weather: query.data ?? null,
    conditionLabel: resolveWeatherConditionLabel(query.data?.weatherCode ?? -1),
    impactMessage: resolveWeatherImpactMessage(query.data),
    sourceLabel: resolveWeatherSourceLabel(query.data?.source),
    isWeatherRiskElevated: isWeatherRiskElevated(query.data),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
