"use client";

import { useId, useState } from "react";

import { getCopy, translateWeatherLabel, type SiteLanguage } from "@/lib/i18n";
import { WEATHER_PRESETS } from "@/lib/weather";

type WeatherPickerProps = {
  defaultPreset: string;
  initialMode?: "preset" | "custom";
  initialCustomWeather?: string;
  language: SiteLanguage;
  mode?: "preset" | "custom";
  presetValue?: string;
  customWeatherValue?: string;
  onModeChange?: (mode: "preset" | "custom") => void;
  onPresetChange?: (preset: string) => void;
  onCustomWeatherChange?: (customWeather: string) => void;
};

export function WeatherPicker({
  defaultPreset,
  initialMode = "preset",
  initialCustomWeather = "",
  language,
  mode: controlledMode,
  presetValue,
  customWeatherValue,
  onModeChange,
  onPresetChange,
  onCustomWeatherChange,
}: WeatherPickerProps) {
  const strings = getCopy(language);
  const [uncontrolledMode, setUncontrolledMode] = useState<"preset" | "custom">(initialMode);
  const inputId = useId();
  const presetId = `${inputId}-weather-mode-preset`;
  const customId = `${inputId}-weather-mode-custom`;
  const presetSelectId = `${inputId}-weather-preset`;
  const customInputId = `${inputId}-custom-weather`;
  const mode = controlledMode ?? uncontrolledMode;
  const resolvedPresetValue = presetValue ?? defaultPreset;
  const resolvedCustomWeatherValue = customWeatherValue ?? initialCustomWeather;

  function handleModeChange(nextMode: "preset" | "custom") {
    if (controlledMode === undefined) {
      setUncontrolledMode(nextMode);
    }

    onModeChange?.(nextMode);
  }

  return (
    <>
      <fieldset className="field">
        <legend>{strings.weather}</legend>
        <div className="mode-grid">
          <div className="mode-option">
            <input
              checked={mode === "preset"}
              id={presetId}
              name="weatherMode"
              onChange={() => handleModeChange("preset")}
              type="radio"
              value="preset"
            />
            <label htmlFor={presetId}>{strings.pickPreset}</label>
          </div>
          <div className="mode-option">
            <input
              checked={mode === "custom"}
              id={customId}
              name="weatherMode"
              onChange={() => handleModeChange("custom")}
              type="radio"
              value="custom"
            />
            <label htmlFor={customId}>{strings.customWrite}</label>
          </div>
        </div>
      </fieldset>

      {mode === "preset" ? (
        <div className="field">
          <label htmlFor={presetSelectId}>{strings.presetWeather}</label>
          <select
            id={presetSelectId}
            name="weatherPreset"
            onChange={(event) => onPresetChange?.(event.target.value)}
            value={resolvedPresetValue}
          >
            {WEATHER_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {translateWeatherLabel(preset, language)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {mode === "custom" ? (
        <div className="field">
          <label htmlFor={customInputId}>{strings.customWeather}</label>
          <input
            id={customInputId}
            maxLength={32}
            name="customWeather"
            onChange={(event) => onCustomWeatherChange?.(event.target.value)}
            placeholder={strings.customPlaceholder}
            type="text"
            value={resolvedCustomWeatherValue}
          />
        </div>
      ) : null}
    </>
  );
}
