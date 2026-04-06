export const TEMPERATURE_UNITS = ["c", "f"] as const;

export type TemperatureUnit = (typeof TEMPERATURE_UNITS)[number];

export const TEMPERATURE_UNIT_STORAGE_KEY = "bokavader:temperature-unit";

export function isTemperatureUnit(value: string): value is TemperatureUnit {
  return TEMPERATURE_UNITS.includes(value as TemperatureUnit);
}

export function parseTemperatureUnit(value?: string) {
  return value && isTemperatureUnit(value) ? value : "c";
}

export function celsiusToFahrenheit(value: number) {
  return (value * 9) / 5 + 32;
}

export function fahrenheitToCelsius(value: number) {
  return ((value - 32) * 5) / 9;
}

export function convertTemperatureFromCelsius(value: number, unit: TemperatureUnit) {
  return unit === "f" ? celsiusToFahrenheit(value) : value;
}

export function convertTemperatureToCelsius(value: number, unit: TemperatureUnit) {
  return unit === "f" ? fahrenheitToCelsius(value) : value;
}

export function formatTemperatureValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

