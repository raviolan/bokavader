"use client";

import { useState } from "react";

import { WEATHER_PRESETS } from "@/lib/weather";

type WeatherPickerProps = {
  defaultPreset: string;
};

export function WeatherPicker({ defaultPreset }: WeatherPickerProps) {
  const [mode, setMode] = useState<"preset" | "custom">("preset");

  return (
    <>
      <fieldset className="field">
        <legend>Weather</legend>
        <div className="mode-grid">
          <div className="mode-option">
            <input
              checked={mode === "preset"}
              id="weather-mode-preset"
              name="weatherMode"
              onChange={() => setMode("preset")}
              type="radio"
              value="preset"
            />
            <label htmlFor="weather-mode-preset">Pick from presets</label>
          </div>
          <div className="mode-option">
            <input
              checked={mode === "custom"}
              id="weather-mode-custom"
              name="weatherMode"
              onChange={() => setMode("custom")}
              type="radio"
              value="custom"
            />
            <label htmlFor="weather-mode-custom">Write your own</label>
          </div>
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="weatherPreset">Preset weather</label>
        <select
          defaultValue={defaultPreset}
          disabled={mode !== "preset"}
          id="weatherPreset"
          name="weatherPreset"
        >
          {WEATHER_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {preset}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="customWeather">Custom weather</label>
        <input
          disabled={mode !== "custom"}
          id="customWeather"
          maxLength={32}
          name="customWeather"
          placeholder="Meteor shower, misty glow, frog rain..."
          type="text"
        />
      </div>
    </>
  );
}
