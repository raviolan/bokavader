import { NextResponse } from "next/server";

import { createSelectedLocation, type SelectedLocation } from "@/lib/location";

type PhotonFeature = {
  properties?: {
    city?: string;
    country?: string;
    countrycode?: string;
    county?: string;
    district?: string;
    locality?: string;
    name?: string;
    osm_value?: string;
    state?: string;
    type?: string;
  };
};

const FALLBACK_LOCATIONS = [
  createSelectedLocation({
    cityName: "Gothenburg",
    countryCode: "se",
    countryName: "Sweden",
    regionName: "Vastra Gotalands Lan",
    scope: "city",
  }),
  createSelectedLocation({
    cityName: "Stockholm",
    countryCode: "se",
    countryName: "Sweden",
    regionName: "Stockholms Lan",
    scope: "city",
  }),
  createSelectedLocation({
    cityName: "Malmo",
    countryCode: "se",
    countryName: "Sweden",
    regionName: "Skane Lan",
    scope: "city",
  }),
  createSelectedLocation({
    cityName: "Uppsala",
    countryCode: "se",
    countryName: "Sweden",
    regionName: "Uppsala Lan",
    scope: "city",
  }),
  createSelectedLocation({
    cityName: "Helsingborg",
    countryCode: "se",
    countryName: "Sweden",
    regionName: "Skane Lan",
    scope: "city",
  }),
  createSelectedLocation({
    cityName: "Lund",
    countryCode: "se",
    countryName: "Sweden",
    regionName: "Skane Lan",
    scope: "city",
  }),
  createSelectedLocation({
    cityName: "Umea",
    countryCode: "se",
    countryName: "Sweden",
    regionName: "Vasterbottens Lan",
    scope: "city",
  }),
  createSelectedLocation({
    countryCode: "se",
    countryName: "Sweden",
    regionName: "Skane Lan",
    scope: "region",
  }),
  createSelectedLocation({
    countryCode: "se",
    countryName: "Sweden",
    regionName: "Stockholms Lan",
    scope: "region",
  }),
  createSelectedLocation({
    countryCode: "se",
    countryName: "Sweden",
    regionName: "Vastra Gotalands Lan",
    scope: "region",
  }),
  createSelectedLocation({
    countryCode: "se",
    countryName: "Sweden",
    scope: "country",
  }),
  createSelectedLocation({
    cityName: "Oslo",
    countryCode: "no",
    countryName: "Norway",
    regionName: "Oslo",
    scope: "city",
  }),
  createSelectedLocation({
    cityName: "Copenhagen",
    countryCode: "dk",
    countryName: "Denmark",
    regionName: "Capital Region of Denmark",
    scope: "city",
  }),
  createSelectedLocation({
    cityName: "Helsinki",
    countryCode: "fi",
    countryName: "Finland",
    regionName: "Uusimaa",
    scope: "city",
  }),
  createSelectedLocation({
    cityName: "London",
    countryCode: "gb",
    countryName: "United Kingdom",
    regionName: "England",
    scope: "city",
  }),
  createSelectedLocation({
    cityName: "Berlin",
    countryCode: "de",
    countryName: "Germany",
    regionName: "Berlin",
    scope: "city",
  }),
  createSelectedLocation({
    cityName: "Paris",
    countryCode: "fr",
    countryName: "France",
    regionName: "Ile-de-France",
    scope: "city",
  }),
  createSelectedLocation({
    cityName: "New York",
    countryCode: "us",
    countryName: "United States",
    regionName: "New York",
    scope: "city",
  }),
  createSelectedLocation({
    cityName: "Tokyo",
    countryCode: "jp",
    countryName: "Japan",
    regionName: "Tokyo",
    scope: "city",
  }),
  createSelectedLocation({
    cityName: "Sydney",
    countryCode: "au",
    countryName: "Australia",
    regionName: "New South Wales",
    scope: "city",
  }),
];

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function searchFallbackLocations(query: string) {
  const normalizedQuery = normalizeSearchText(query);

  if (normalizedQuery.length < 2) {
    return [];
  }

  return FALLBACK_LOCATIONS.filter((location) => {
    const haystack = normalizeSearchText(`${location.label} ${location.scope}`);
    return haystack.includes(normalizedQuery);
  }).slice(0, 8);
}

function normalizeScope(feature: PhotonFeature) {
  const type = String(feature.properties?.type ?? "").toLowerCase();
  const osmValue = String(feature.properties?.osm_value ?? "").toLowerCase();

  if (type === "country" || osmValue === "country") {
    return "country" as const;
  }

  if (type === "state" || type === "county" || osmValue === "state" || osmValue === "county") {
    return "region" as const;
  }

  if (type === "city" || type === "locality" || osmValue === "city" || osmValue === "locality" || type === "administrative") {
    return "city" as const;
  }

  return null;
}

function normalizeLocation(feature: PhotonFeature) {
  const scope = normalizeScope(feature);
  const countryCode = feature.properties?.countrycode?.toLowerCase();
  const countryName = feature.properties?.country?.trim();

  if (!scope || !countryCode || !countryName) {
    return null;
  }

  const regionName =
    feature.properties?.state?.trim() ||
    feature.properties?.county?.trim() ||
    feature.properties?.district?.trim() ||
    undefined;

  const cityName =
    feature.properties?.city?.trim() ||
    feature.properties?.locality?.trim() ||
    (scope === "city" ? feature.properties?.name?.trim() : undefined);

  if (scope === "city" && !cityName) {
    return null;
  }

  return createSelectedLocation({
    cityName,
    countryCode,
    countryName,
    regionName,
    scope,
  });
}

function dedupeLocations(locations: SelectedLocation[]) {
  const seen = new Set<string>();

  return locations.filter((location) => {
    if (seen.has(location.key)) {
      return false;
    }

    seen.add(location.key);
    return true;
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const language = searchParams.get("lang")?.trim() || "en";

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const fallbackResults = searchFallbackLocations(query);

  const photonUrl = new URL("https://photon.komoot.io/api");
  photonUrl.searchParams.set("q", query);
  photonUrl.searchParams.set("lang", language);
  photonUrl.searchParams.set("limit", "8");
  photonUrl.searchParams.set("dedupe", "1");
  photonUrl.searchParams.append("layer", "city");
  photonUrl.searchParams.append("layer", "locality");
  photonUrl.searchParams.append("layer", "county");
  photonUrl.searchParams.append("layer", "state");
  photonUrl.searchParams.append("layer", "country");

  try {
    const response = await fetch(photonUrl, {
      headers: {
        "User-Agent": "bokavader-location-picker/1.0",
      },
      next: {
        revalidate: 86400,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ results: fallbackResults });
    }

    const payload = (await response.json()) as { features?: PhotonFeature[] };
    const remoteResults = (payload.features ?? [])
      .map(normalizeLocation)
      .filter((location): location is SelectedLocation => Boolean(location));
    const results = dedupeLocations([...fallbackResults, ...remoteResults]).slice(0, 8);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: fallbackResults });
  }
}
