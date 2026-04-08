"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { getCopy, type SiteLanguage } from "@/lib/i18n";
import {
  DEFAULT_LOCATION,
  deserializeSelectedLocation,
  encodeSelectedLocationCookie,
  LOCATION_COOKIE_KEY,
  LOCATION_STORAGE_KEY,
  serializeSelectedLocation,
  type SelectedLocation,
} from "@/lib/location";

type LocationPickerProps = {
  language: SiteLanguage;
  locationSource: "cookie" | "default";
  selectedLocation: SelectedLocation;
};

type LocationSearchResponse = {
  results: SelectedLocation[];
};

function persistLocation(location: SelectedLocation) {
  window.localStorage.setItem(LOCATION_STORAGE_KEY, serializeSelectedLocation(location));
  document.cookie = `${LOCATION_COOKIE_KEY}=${encodeSelectedLocationCookie(location)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function LocationPicker({ language, locationSource, selectedLocation }: LocationPickerProps) {
  const strings = getCopy(language);
  const router = useRouter();
  const [currentLocation, setCurrentLocation] = useState(selectedLocation);
  const [query, setQuery] = useState(selectedLocation.label);
  const [results, setResults] = useState<SelectedLocation[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const showResetButton = currentLocation.key !== DEFAULT_LOCATION.key;

  useEffect(() => {
    setCurrentLocation(selectedLocation);
    setQuery(selectedLocation.label);
  }, [selectedLocation]);

  useEffect(() => {
    if (locationSource === "default") {
      return;
    }

    persistLocation(selectedLocation);
  }, [locationSource, selectedLocation]);

  useEffect(() => {
    if (locationSource !== "default") {
      return;
    }

    const stored = window.localStorage.getItem(LOCATION_STORAGE_KEY);

    if (!stored) {
      return;
    }

    const persistedLocation = deserializeSelectedLocation(stored);

    if (!persistedLocation || persistedLocation.key === selectedLocation.key) {
      return;
    }

    setCurrentLocation(persistedLocation);
    setQuery(persistedLocation.label);
    persistLocation(persistedLocation);

    window.setTimeout(() => {
      startTransition(() => {
        router.refresh();
      });
    }, 0);
  }, [locationSource, router, selectedLocation]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!open || trimmedQuery.length < 2 || trimmedQuery === currentLocation.label) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setLoading(true);

        try {
          const response = await fetch(`/api/location-search?q=${encodeURIComponent(trimmedQuery)}&lang=${encodeURIComponent(language)}`, {
            signal: controller.signal,
          });

          if (!response.ok) {
            setResults([]);
            return;
          }

          const payload = (await response.json()) as LocationSearchResponse;
          setResults(payload.results);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      })();
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
      setLoading(false);
    };
  }, [currentLocation.label, language, open, query]);

  function replaceLocation(location: SelectedLocation) {
    if (location.key === currentLocation.key) {
      return;
    }

    setCurrentLocation(location);
    persistLocation(location);

    window.setTimeout(() => {
      startTransition(() => {
        router.refresh();
      });
    }, 0);
  }

  function selectLocation(location: SelectedLocation) {
    if (location.key === currentLocation.key) {
      setQuery(location.label);
      setResults([]);
      setOpen(false);
      return;
    }

    setQuery(location.label);
    setResults([]);
    setOpen(false);
    replaceLocation(location);
  }

  return (
    <div className="location-picker">
      <div className="location-picker__header">
        <label className="location-picker__label" htmlFor="location-search">
          {strings.locationLabel}
        </label>
        {showResetButton ? (
          <button className="location-reset" onClick={() => selectLocation(DEFAULT_LOCATION)} type="button">
            {strings.locationReset}
          </button>
        ) : null}
      </div>

      <div className="location-picker__surface">
        <input
          autoComplete="off"
          className="location-picker__input"
          id="location-search"
          name="location-search"
          onClick={(event) => {
            if (query === currentLocation.label) {
              event.currentTarget.select();
            }
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={(event) => {
            if (query === currentLocation.label) {
              event.currentTarget.select();
            }

            setOpen(true);
          }}
          placeholder={strings.locationPlaceholder}
          value={query}
        />

        <p className="location-picker__current">{strings.showingCalendarFor(currentLocation.label)}</p>

        {open ? (
          <div className="location-picker__results">
            {query.trim().length < 2 ? <p className="location-picker__message">{strings.locationSearchEmpty}</p> : null}
            {query.trim().length >= 2 && loading ? (
              <p className="location-picker__message">{strings.locationSearching}</p>
            ) : null}
            {query.trim().length >= 2 && !loading && results.length === 0 ? (
              <p className="location-picker__message">{strings.locationNoResults}</p>
            ) : null}
            {results.map((location) => (
              <button className="location-option" key={location.key} onClick={() => selectLocation(location)} type="button">
                <strong>{location.label}</strong>
                <span>{location.scope}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <p className="hint">{strings.locationSearchHint}</p>
    </div>
  );
}
