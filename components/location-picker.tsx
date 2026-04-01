"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { getCopy, type SiteLanguage } from "@/lib/i18n";
import {
  DEFAULT_LOCATION,
  deserializeSelectedLocation,
  getLocationSearchParams,
  LOCATION_STORAGE_KEY,
  serializeSelectedLocation,
  type SelectedLocation,
} from "@/lib/location";

type LocationPickerProps = {
  hasExplicitLocation: boolean;
  language: SiteLanguage;
  selectedLocation: SelectedLocation;
};

type LocationSearchResponse = {
  results: SelectedLocation[];
};

export function LocationPicker({ hasExplicitLocation, language, selectedLocation }: LocationPickerProps) {
  const strings = getCopy(language);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(selectedLocation.label);
  const [results, setResults] = useState<SelectedLocation[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setQuery(selectedLocation.label);
  }, [selectedLocation.label]);

  useEffect(() => {
    if (hasExplicitLocation) {
      window.localStorage.setItem(LOCATION_STORAGE_KEY, serializeSelectedLocation(selectedLocation));
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

    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(getLocationSearchParams(persistedLocation))) {
      params.set(key, value);
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}` as never, { scroll: false });
    });
  }, [hasExplicitLocation, pathname, router, searchParams, selectedLocation]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!open || trimmedQuery.length < 2 || trimmedQuery === selectedLocation.label) {
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
  }, [language, open, query, selectedLocation.label]);

  function replaceLocation(location: SelectedLocation) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(getLocationSearchParams(location))) {
      params.set(key, value);
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}` as never, { scroll: false });
    });
  }

  function selectLocation(location: SelectedLocation) {
    window.localStorage.setItem(LOCATION_STORAGE_KEY, serializeSelectedLocation(location));
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
        <button className="location-reset" onClick={() => selectLocation(DEFAULT_LOCATION)} type="button">
          {strings.locationReset}
        </button>
      </div>

      <div className="location-picker__surface">
        <input
          autoComplete="off"
          className="location-picker__input"
          id="location-search"
          name="location-search"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={strings.locationPlaceholder}
          value={query}
        />

        <p className="location-picker__current">{strings.showingCalendarFor(selectedLocation.label)}</p>

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
