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
      return NextResponse.json({ results: [] });
    }

    const payload = (await response.json()) as { features?: PhotonFeature[] };
    const results = dedupeLocations((payload.features ?? []).map(normalizeLocation).filter((location): location is SelectedLocation => Boolean(location)));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
