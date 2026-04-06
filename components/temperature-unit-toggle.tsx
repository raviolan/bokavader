"use client";

import { useState } from "react";

import { getCopy, type SiteLanguage } from "@/lib/i18n";
import {
  parseTemperatureUnit,
  TEMPERATURE_UNIT_STORAGE_KEY,
  type TemperatureUnit,
} from "@/lib/temperature";

export function TemperatureUnitToggle({ language }: { language: SiteLanguage }) {
  const strings = getCopy(language);
  const [unit, setUnit] = useState<TemperatureUnit>(() =>
    typeof window === "undefined"
      ? "c"
      : parseTemperatureUnit(window.localStorage.getItem(TEMPERATURE_UNIT_STORAGE_KEY) ?? undefined),
  );

  function updateUnit(nextUnit: TemperatureUnit) {
    setUnit(nextUnit);
    window.localStorage.setItem(TEMPERATURE_UNIT_STORAGE_KEY, nextUnit);
    window.dispatchEvent(new CustomEvent("bokavader:temperature-unit-change", { detail: nextUnit }));
  }

  return (
    <div className="temperature-unit-panel">
      <span className="temperature-unit-label">{strings.temperatureUnitLabel}</span>
      <div className="temperature-unit-switcher" aria-label={strings.temperatureUnitLabel}>
        <button
          className={`temperature-unit-button ${unit === "c" ? "active" : ""}`}
          onClick={() => updateUnit("c")}
          type="button"
        >
          {strings.celsius}
        </button>
        <button
          className={`temperature-unit-button ${unit === "f" ? "active" : ""}`}
          onClick={() => updateUnit("f")}
          type="button"
        >
          {strings.fahrenheit}
        </button>
      </div>
    </div>
  );
}
