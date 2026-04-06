export const LOCATION_STORAGE_KEY = "bokavader:selected-location";
export const LOCATION_COOKIE_KEY = "bokavader-location";

export const LOCATION_SCOPES = ["country", "region", "city"] as const;

export type LocationScope = (typeof LOCATION_SCOPES)[number];

export type SelectedLocation = {
  key: string;
  label: string;
  scope: LocationScope;
  path: string[];
};

const LOCATION_LABEL_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bVastra\b/gi, "Västra"],
  [/\bGotalands\b/gi, "Götalands"],
  [/\bLan\b/gi, "Län"],
  [/\bGoteborg\b/gi, "Göteborg"],
  [/\bSkane\b/gi, "Skåne"],
  [/\bMalmo\b/gi, "Malmö"],
  [/\bJonkoping\b/gi, "Jönköping"],
  [/\bOrebro\b/gi, "Örebro"],
  [/\bVaxjo\b/gi, "Växjö"],
  [/\bAngelholm\b/gi, "Ängelholm"],
  [/\bAkersberga\b/gi, "Åkersberga"],
];

const LOCATION_SLUG_ALIAS_GROUPS = [
  ["sweden", "sverige"],
  ["gothenburg", "goteborg"],
  ["scania", "skane"],
  ["vastra-gotalands-lan", "vastra-gotaland", "vastra-gotaland-county"],
] as const;

const LOCATION_SLUG_CANONICAL_MAP = new Map<string, string>();
const LOCATION_SLUG_ALIAS_MAP = new Map<string, string[]>();

for (const group of LOCATION_SLUG_ALIAS_GROUPS) {
  const canonical = group[0];
  const aliases = [...new Set(group)];

  LOCATION_SLUG_ALIAS_MAP.set(canonical, aliases);

  for (const alias of aliases) {
    LOCATION_SLUG_CANONICAL_MAP.set(alias, canonical);
  }
}

type LocationShape = {
  countryCode: string;
  countryName: string;
  regionName?: string;
  cityName?: string;
  scope: LocationScope;
};

function slugifyLocationPart(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return LOCATION_SLUG_CANONICAL_MAP.get(slug) ?? slug;
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

function uniqueKeys(values: string[]) {
  return [...new Set(values)];
}

export function canonicalizeLocationKey(key: string) {
  const parts = key.split(":");

  if (parts.length < 3) {
    return key;
  }

  const [scope, countryCode, ...segments] = parts;

  if (scope === "country" || scope === "region" || scope === "city") {
    return [scope, countryCode, ...segments.map((segment) => LOCATION_SLUG_CANONICAL_MAP.get(segment) ?? segment)].join(":");
  }

  return key;
}

export function canonicalizeLocationPath(path: string[]) {
  return uniqueKeys(path.map(canonicalizeLocationKey));
}

function getLocationSlugAliases(slug: string) {
  const canonical = LOCATION_SLUG_CANONICAL_MAP.get(slug) ?? slug;
  return LOCATION_SLUG_ALIAS_MAP.get(canonical) ?? [canonical];
}

export function expandLocationKeyAliases(key: string) {
  const canonicalKey = canonicalizeLocationKey(key);
  const parts = canonicalKey.split(":");

  if (parts.length < 3) {
    return [canonicalKey];
  }

  const [scope, countryCode, ...segments] = parts;

  if (scope === "country" && segments.length === 1) {
    return getLocationSlugAliases(segments[0]).map((segment) => `${scope}:${countryCode}:${segment}`);
  }

  if (scope === "region" && segments.length === 1) {
    return getLocationSlugAliases(segments[0]).map((segment) => `${scope}:${countryCode}:${segment}`);
  }

  if (scope === "city" && segments.length === 1) {
    return getLocationSlugAliases(segments[0]).map((segment) => `${scope}:${countryCode}:${segment}`);
  }

  if (scope === "city" && segments.length === 2) {
    const [regionSlug, citySlug] = segments;
    const regionAliases = getLocationSlugAliases(regionSlug);
    const cityAliases = getLocationSlugAliases(citySlug);

    return uniqueKeys(
      regionAliases.flatMap((regionAlias) => cityAliases.map((cityAlias) => `${scope}:${countryCode}:${regionAlias}:${cityAlias}`)),
    );
  }

  return [canonicalKey];
}

export function expandLocationPathAliases(path: string[]) {
  return uniqueKeys(canonicalizeLocationPath(path).flatMap(expandLocationKeyAliases));
}

export function normalizeLocationLabel(label: string) {
  return LOCATION_LABEL_REPLACEMENTS.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), label.trim());
}

export function createSelectedLocation(shape: LocationShape): SelectedLocation {
  const countryCode = slugifyLocationPart(shape.countryCode);
  const countryName = normalizeLocationLabel(shape.countryName);
  const countryKey = buildCountryKey(countryCode, countryName);

  if (shape.scope === "country") {
    return {
      key: countryKey,
      label: countryName,
      scope: "country",
      path: [countryKey],
    };
  }

  const regionName = shape.regionName ? normalizeLocationLabel(shape.regionName) : undefined;

  if (shape.scope === "region" || !shape.cityName) {
    const fallbackRegionName = regionName ?? countryName;
    const regionKey = buildRegionKey(countryCode, fallbackRegionName);

    return {
      key: regionKey,
      label: uniqueParts([fallbackRegionName, countryName]).join(", "),
      scope: "region",
      path: [countryKey, regionKey],
    };
  }

  const cityName = normalizeLocationLabel(shape.cityName);
  const cityKey = buildCityKey(countryCode, cityName, regionName);
  const path = uniqueParts([countryKey, regionName ? buildRegionKey(countryCode, regionName) : undefined, cityKey]);

  return {
    key: cityKey,
    label: uniqueParts([cityName, regionName, countryName]).join(", "),
    scope: "city",
    path,
  };
}

export const DEFAULT_LOCATION = createSelectedLocation({
  cityName: "Göteborg",
  countryCode: "se",
  countryName: "Sweden",
  regionName: "Västra Götalands Län",
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
  const canonicalKey = canonicalizeLocationKey(input.locationKey);
  const canonicalPath = path ? canonicalizeLocationPath(path) : null;

  if (!canonicalPath || !canonicalPath.includes(canonicalKey)) {
    return DEFAULT_LOCATION;
  }

  return {
    key: canonicalKey,
    label: normalizeLocationLabel(input.locationLabel),
    scope: input.locationScope,
    path: canonicalPath,
  } satisfies SelectedLocation;
}

export function hasLocationSearchParams(input: {
  locationKey?: string;
  locationLabel?: string;
  locationPath?: string;
  locationScope?: string;
}) {
  return Boolean(input.locationKey || input.locationLabel || input.locationPath || input.locationScope);
}

export function getLocationSearchParams(location: SelectedLocation) {
  const canonicalPath = canonicalizeLocationPath(location.path);
  const canonicalKey = canonicalizeLocationKey(location.key);

  return {
    locationKey: canonicalKey,
    locationLabel: location.label,
    locationPath: serializeLocationPath(canonicalPath),
    locationScope: location.scope,
  };
}

export function serializeSelectedLocation(location: SelectedLocation) {
  return JSON.stringify(location);
}

export function encodeSelectedLocationCookie(location: SelectedLocation) {
  return encodeURIComponent(serializeSelectedLocation(location));
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

    const canonicalKey = canonicalizeLocationKey(parsed.key);
    const canonicalPath = canonicalizeLocationPath(parsed.path);

    if (!canonicalPath.includes(canonicalKey)) {
      return null;
    }

    return {
      key: canonicalKey,
      label: normalizeLocationLabel(parsed.label),
      path: canonicalPath,
      scope: parsed.scope,
    } satisfies SelectedLocation;
  } catch {
    return null;
  }
}

export function decodeSelectedLocationCookie(value?: string) {
  if (!value) {
    return null;
  }

  try {
    return deserializeSelectedLocation(decodeURIComponent(value));
  } catch {
    return null;
  }
}
