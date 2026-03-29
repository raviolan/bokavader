"use client";

import { useId, useState } from "react";

import { getCopy, translateWeatherLabel, type SiteLanguage } from "@/lib/i18n";
import { WEATHER_PRESETS } from "@/lib/weather";

type WeatherPickerProps = {
  defaultPreset: string;
  initialMode?: "preset" | "custom";
  initialCustomWeather?: string;
  language: SiteLanguage;
};

export function WeatherPicker({
  defaultPreset,
  initialMode = "preset",
  initialCustomWeather = "",
  language,
}: WeatherPickerProps) {
  const strings = getCopy(language);
  const [mode, setMode] = useState<"preset" | "custom">(initialMode);
  const inputId = useId();
  const presetId = `${inputId}-weather-mode-preset`;
  const customId = `${inputId}-weather-mode-custom`;
  const presetSelectId = `${inputId}-weather-preset`;
  const customInputId = `${inputId}-custom-weather`;

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
              onChange={() => setMode("preset")}
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
              onChange={() => setMode("custom")}
              type="radio"
              value="custom"
            />
            <label htmlFor={customId}>{strings.customWrite}</label>
          </div>
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor={presetSelectId}>{strings.presetWeather}</label>
        <select defaultValue={defaultPreset} disabled={mode !== "preset"} id={presetSelectId} name="weatherPreset">
          {WEATHER_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {translateWeatherLabel(preset, language)}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor={customInputId}>{strings.customWeather}</label>
        <input
          defaultValue={initialCustomWeather}
          disabled={mode !== "custom"}
          id={customInputId}
          maxLength={32}
          name="customWeather"
          placeholder={strings.customPlaceholder}
          type="text"
        />
      </div>
    </>
  );
}
