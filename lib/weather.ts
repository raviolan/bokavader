export const WEATHER_PRESETS = [
  "Sunny",
  "Rainy",
  "Snowy",
  "Cloudy",
  "Stormy",
  "Windy",
] as const;

export const MAX_CUSTOM_WEATHER_LENGTH = 32;
export const MAX_OCCASION_LENGTH = 280;

type WeatherTone = {
  stripe: string;
  surface: string;
  border: string;
};

export function getWeatherTone(weatherLabel: string, weatherSource: "PRESET" | "CUSTOM"): WeatherTone {
  if (weatherSource === "CUSTOM") {
    return {
      stripe: "rgba(134, 92, 176, 0.24)",
      surface: "rgba(247, 241, 255, 0.96)",
      border: "rgba(134, 92, 176, 0.38)",
    };
  }

  const normalized = weatherLabel.trim().toLowerCase();

  switch (normalized) {
    case "sunny":
      return {
        stripe: "rgba(245, 166, 35, 0.22)",
        surface: "rgba(255, 248, 226, 0.98)",
        border: "rgba(245, 166, 35, 0.42)",
      };
    case "rainy":
      return {
        stripe: "rgba(91, 124, 153, 0.22)",
        surface: "rgba(240, 246, 251, 0.98)",
        border: "rgba(91, 124, 153, 0.38)",
      };
    case "snowy":
      return {
        stripe: "rgba(197, 220, 232, 0.3)",
        surface: "rgba(248, 252, 255, 0.98)",
        border: "rgba(162, 191, 209, 0.42)",
      };
    case "cloudy":
      return {
        stripe: "rgba(148, 156, 166, 0.24)",
        surface: "rgba(245, 246, 248, 0.98)",
        border: "rgba(148, 156, 166, 0.4)",
      };
    case "stormy":
      return {
        stripe: "rgba(78, 89, 110, 0.26)",
        surface: "rgba(239, 242, 247, 0.98)",
        border: "rgba(78, 89, 110, 0.42)",
      };
    case "windy":
      return {
        stripe: "rgba(125, 170, 160, 0.24)",
        surface: "rgba(241, 249, 247, 0.98)",
        border: "rgba(125, 170, 160, 0.4)",
      };
    default:
      return {
        stripe: "rgba(134, 92, 176, 0.24)",
        surface: "rgba(247, 241, 255, 0.96)",
        border: "rgba(134, 92, 176, 0.38)",
      };
  }
}
