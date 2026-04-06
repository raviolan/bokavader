"use client";

import { useEffect, useId, useRef, useState } from "react";

import { getCopy, type SiteLanguage } from "@/lib/i18n";
import {
  formatTemperatureValue,
  parseTemperatureUnit,
  TEMPERATURE_UNIT_STORAGE_KEY,
  type TemperatureUnit,
} from "@/lib/temperature";

type WeatherMetricsFieldsProps = {
  language: SiteLanguage;
  initialTemperatureC?: number | null;
  initialWindSpeedMps?: number | null;
};

export function WeatherMetricsFields({
  language,
  initialTemperatureC = null,
  initialWindSpeedMps = null,
}: WeatherMetricsFieldsProps) {
  const strings = getCopy(language);
  const inputId = useId();
  const temperatureId = `${inputId}-temperature`;
  const windId = `${inputId}-wind`;
  const [unit, setUnit] = useState<TemperatureUnit>("c");
  const [temperatureValue, setTemperatureValue] = useState(
    initialTemperatureC === null ? "" : formatTemperatureValue(initialTemperatureC),
  );
  const previousUnitRef = useRef<TemperatureUnit>("c");
  const temperatureValueRef = useRef(temperatureValue);

  useEffect(() => {
    temperatureValueRef.current = temperatureValue;
  }, [temperatureValue]);

  useEffect(() => {
    const syncUnit = (nextUnit?: string) => {
      const resolvedUnit = parseTemperatureUnit(nextUnit ?? window.localStorage.getItem(TEMPERATURE_UNIT_STORAGE_KEY) ?? undefined);

      setUnit((currentUnit) => {
        const fromUnit = previousUnitRef.current ?? currentUnit;
        const currentTemperatureValue = temperatureValueRef.current;

        if (currentTemperatureValue) {
          const numericTemperature = Number(currentTemperatureValue);

          if (Number.isFinite(numericTemperature) && fromUnit !== resolvedUnit) {
            const temperatureInCelsius = fromUnit === "f" ? (numericTemperature - 32) * (5 / 9) : numericTemperature;
            const nextTemperature = resolvedUnit === "f" ? (temperatureInCelsius * 9) / 5 + 32 : temperatureInCelsius;
            setTemperatureValue(formatTemperatureValue(nextTemperature));
          }
        }

        previousUnitRef.current = resolvedUnit;
        return resolvedUnit;
      });
    };

    syncUnit();

    const handleUnitChange = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      syncUnit(customEvent.detail);
    };

    window.addEventListener("bokavader:temperature-unit-change", handleUnitChange);

    return () => {
      window.removeEventListener("bokavader:temperature-unit-change", handleUnitChange);
    };
  }, []);

  const initialWindValue = initialWindSpeedMps === null ? "" : formatTemperatureValue(initialWindSpeedMps);

  return (
    <>
      <input name="temperatureUnit" type="hidden" value={unit} />

      <div className="metrics-grid">
        <div className="field">
          <label htmlFor={temperatureId}>
            {strings.temperatureField} ({unit === "f" ? "\u00b0F" : "\u00b0C"})
          </label>
          <input
            id={temperatureId}
            inputMode="decimal"
            name="temperature"
            onChange={(event) => setTemperatureValue(event.target.value)}
            placeholder={unit === "f" ? strings.temperaturePlaceholderF : strings.temperaturePlaceholderC}
            required
            step="0.1"
            type="number"
            value={temperatureValue}
          />
        </div>

        <div className="field">
          <label htmlFor={windId}>
            {strings.windField} ({strings.windUnit})
          </label>
          <input
            defaultValue={initialWindValue}
            id={windId}
            inputMode="decimal"
            name="windSpeedMps"
            placeholder={strings.windPlaceholder}
            required
            step="0.1"
            type="number"
          />
        </div>
      </div>
    </>
  );
}
