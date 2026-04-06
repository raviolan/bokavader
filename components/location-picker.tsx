"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { getCopy, type SiteLanguage } from "@/lib/i18n";
import {
  DEFAULT_LOCATION,
  deserializeSelectedLocation,
  encodeSelectedLocationCookie,
  hasLocationSearchParams,
  LOCATION_COOKIE_KEY,
  LOCATION_STORAGE_KEY,
  serializeSelectedLocation,
  type SelectedLocation,
} from "@/lib/location";

type LocationPickerProps = {
  language: SiteLanguage;
  locationSource: "url" | "cookie" | "default";
  selectedLocation: SelectedLocation;
};

type LocationSearchResponse = {
  results: SelectedLocation[];
};

const LOCATION_SEARCH_PARAM_KEYS = ["locationKey", "locationLabel", "locationPath", "locationScope"] as const;

function persistLocation(location: SelectedLocation) {
  window.localStorage.setItem(LOCATION_STORAGE_KEY, serializeSelectedLocation(location));
  document.cookie = `${LOCATION_COOKIE_KEY}=${encodeSelectedLocationCookie(location)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function LocationPicker({ language, locationSource, selectedLocation }: LocationPickerProps) {
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
    if (locationSource === "default") {
      return;
    }

    persistLocation(selectedLocation);
  }, [locationSource, selectedLocation]);

  useEffect(() => {
    const cleanParams = new URLSearchParams(searchParams.toString());
    let hadLegacyLocationParams = false;

    for (const key of LOCATION_SEARCH_PARAM_KEYS) {
      if (cleanParams.has(key)) {
        cleanParams.delete(key);
        hadLegacyLocationParams = true;
      }
    }

    if (locationSource === "url") {
      if (!hadLegacyLocationParams) {
        return;
      }

      const nextHref = cleanParams.size > 0 ? `${pathname}?${cleanParams.toString()}` : pathname;

      startTransition(() => {
        router.replace(nextHref as never, { scroll: false });
      });

      return;
    }

    if (locationSource !== "default") {
      return;
    }

    const stored = window.localStorage.getItem(LOCATION_STORAGE_KEY);

    if (!stored) {
      if (!hadLegacyLocationParams) {
        return;
      }

      const nextHref = cleanParams.size > 0 ? `${pathname}?${cleanParams.toString()}` : pathname;

      startTransition(() => {
        router.replace(nextHref as never, { scroll: false });
      });
      return;
    }

    const persistedLocation = deserializeSelectedLocation(stored);

    if (!persistedLocation || persistedLocation.key === selectedLocation.key) {
      if (!hadLegacyLocationParams) {
        return;
      }

      const nextHref = cleanParams.size > 0 ? `${pathname}?${cleanParams.toString()}` : pathname;

      startTransition(() => {
        router.replace(nextHref as never, { scroll: false });
      });
      return;
    }

    persistLocation(persistedLocation);

    startTransition(() => {
      router.refresh();
    });
  }, [locationSource, pathname, router, searchParams, selectedLocation]);

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
    if (location.key === selectedLocation.key) {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    const hasLegacyLocationParams = hasLocationSearchParams({
      locationKey: params.get("locationKey") ?? undefined,
      locationLabel: params.get("locationLabel") ?? undefined,
      locationPath: params.get("locationPath") ?? undefined,
      locationScope: params.get("locationScope") ?? undefined,
    });

    persistLocation(location);

    startTransition(() => {
      if (hasLegacyLocationParams) {
        for (const key of LOCATION_SEARCH_PARAM_KEYS) {
          params.delete(key);
        }

        const nextHref = params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
        router.replace(nextHref as never, { scroll: false });
        return;
      }

      router.refresh();
    });
  }

  function selectLocation(location: SelectedLocation) {
    if (location.key === selectedLocation.key) {
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
