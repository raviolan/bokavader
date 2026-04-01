export const LOCATION_STORAGE_KEY = "bokavader:selected-location";

export const LOCATION_SCOPES = ["country", "region", "city"] as const;

export type LocationScope = (typeof LOCATION_SCOPES)[number];

export type SelectedLocation = {
  key: string;
  label: string;
  scope: LocationScope;
  path: string[];
};

type LocationShape = {
  countryCode: string;
  countryName: string;
  regionName?: string;
  cityName?: string;
  scope: LocationScope;
};

function slugifyLocationPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function buildCountryKey(countryCode: string, countryName: string) {
  return `country:${countryCode}:${slugifyLocationPart(countryName)}`;
}

function buildRegionKey(countryCode: string, regionName: string) {
  return `region:${countryCode}:${slugifyLocationPart(regionName)}`;
}

function buildCityKey(countryCode: string, cityName: string, regionName?: string) {
  const parts = ["city", countryCode];

  if (regionName) {
    parts.push(slugifyLocationPart(regionName));
  }

  parts.push(slugifyLocationPart(cityName));

  return parts.join(":");
}

function uniqueParts(parts: Array<string | undefined>) {
  const seen = new Set<string>();

  return parts.filter((part): part is string => {
    if (!part) {
      return false;
    }

    const normalized = part.trim();

    if (!normalized) {
      return false;
    }

    const dedupeKey = normalized.toLowerCase();

    if (seen.has(dedupeKey)) {
      return false;
    }

    seen.add(dedupeKey);
    return true;
  });
}

export function createSelectedLocation(shape: LocationShape): SelectedLocation {
  const countryCode = slugifyLocationPart(shape.countryCode);
  const countryKey = buildCountryKey(countryCode, shape.countryName);

  if (shape.scope === "country") {
    return {
      key: countryKey,
      label: shape.countryName,
      scope: "country",
      path: [countryKey],
    };
  }

  const regionName = shape.regionName?.trim();

  if (shape.scope === "region" || !shape.cityName) {
    const fallbackRegionName = regionName ?? shape.countryName;
    const regionKey = buildRegionKey(countryCode, fallbackRegionName);

    return {
      key: regionKey,
      label: uniqueParts([fallbackRegionName, shape.countryName]).join(", "),
      scope: "region",
      path: [countryKey, regionKey],
    };
  }

  const cityName = shape.cityName.trim();
  const cityKey = buildCityKey(countryCode, cityName, regionName);
  const path = uniqueParts([countryKey, regionName ? buildRegionKey(countryCode, regionName) : undefined, cityKey]);

  return {
    key: cityKey,
    label: uniqueParts([cityName, regionName, shape.countryName]).join(", "),
    scope: "city",
    path,
  };
}

export const DEFAULT_LOCATION = createSelectedLocation({
  cityName: "Gothenburg",
  countryCode: "se",
  countryName: "Sweden",
  regionName: "Vastra Gotalands lan",
  scope: "city",
});

export function isLocationScope(value: string): value is LocationScope {
  return LOCATION_SCOPES.includes(value as LocationScope);
}

export function serializeLocationPath(path: string[]) {
  return path.join(",");
}

export function parseLocationPath(value?: string) {
  if (!value) {
    return null;
  }

  const path = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return path.length > 0 ? path : null;
}

export function parseSelectedLocation(input: {
  locationKey?: string;
  locationLabel?: string;
  locationPath?: string;
  locationScope?: string;
}) {
  if (!input.locationKey || !input.locationLabel || !input.locationScope) {
    return DEFAULT_LOCATION;
  }

  if (!isLocationScope(input.locationScope)) {
    return DEFAULT_LOCATION;
  }

  const path = parseLocationPath(input.locationPath);

  if (!path || !path.includes(input.locationKey)) {
    return DEFAULT_LOCATION;
  }

  return {
    key: input.locationKey,
    label: input.locationLabel,
    scope: input.locationScope,
    path,
  } satisfies SelectedLocation;
}

export function getLocationSearchParams(location: SelectedLocation) {
  return {
    locationKey: location.key,
    locationLabel: location.label,
    locationPath: serializeLocationPath(location.path),
    locationScope: location.scope,
  };
}

export function serializeSelectedLocation(location: SelectedLocation) {
  return JSON.stringify(location);
}

export function deserializeSelectedLocation(value: string) {
  try {
    const parsed = JSON.parse(value) as Partial<SelectedLocation>;

    if (
      typeof parsed.key !== "string" ||
      typeof parsed.label !== "string" ||
      typeof parsed.scope !== "string" ||
      !Array.isArray(parsed.path) ||
      !isLocationScope(parsed.scope)
    ) {
      return null;
    }

    if (!parsed.path.every((entry) => typeof entry === "string") || !parsed.path.includes(parsed.key)) {
      return null;
    }

    return {
      key: parsed.key,
      label: parsed.label,
      path: parsed.path,
      scope: parsed.scope,
    } satisfies SelectedLocation;
  } catch {
    return null;
  }
}
