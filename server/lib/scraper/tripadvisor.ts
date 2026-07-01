import { ScrapedPlace, ScraperListResult } from "./types";

const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const TRIPADVISOR_HOST = "www.tripadvisor.com";

export function isTripAdvisorUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === TRIPADVISOR_HOST || parsed.hostname.endsWith(".tripadvisor.com");
  } catch {
    return false;
  }
}

export function normalizeTripAdvisorUrl(url: string): string {
  const parsed = new URL(url.trim());
  parsed.hash = "";
  return parsed.toString();
}

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTripadvisorId(path: string): string | null {
  const match = path.match(/-d(\d+)-/);
  return match?.[1] ?? null;
}

function nameFromAttractionPath(path: string): string | null {
  const match = path.match(/Reviews-(.+?)-[A-Za-z0-9_]+\.html$/);
  if (!match) return null;
  return decodeHtml(match[1].replace(/_/g, " "));
}

function cityFromPath(path: string): string {
  const match = path.match(/Reviews-[^-]+-([A-Za-z0-9_]+)\.html$/);
  if (!match) return "";
  const raw = match[1].replace(/_/g, " ");
  if (raw.includes("Region")) {
    const parts = raw.split(" ");
    return parts[0] ?? raw;
  }
  return raw;
}

function isListingUrl(url: string): boolean {
  return /\/Attractions-g\d+-Activities/i.test(url) || /\/Attractions-g\d+-Activities-c\d+/i.test(url);
}

function isDetailUrl(url: string): boolean {
  return /\/Attraction_Review-g\d+-d\d+-Reviews-/i.test(url);
}

function parseJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      // skip invalid JSON-LD
    }
  }
  return blocks;
}

function flattenJsonLd(blocks: unknown[]): Record<string, unknown>[] {
  const items: Record<string, unknown>[] = [];
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const record = block as Record<string, unknown>;
    if (Array.isArray(record["@graph"])) {
      for (const node of record["@graph"]) {
        if (node && typeof node === "object") items.push(node as Record<string, unknown>);
      }
    } else {
      items.push(record);
    }
  }
  return items;
}

function extractCategories(html: string): string[] {
  const labels = [
    "Points of Interest & Landmarks",
    "Historic Sites",
    "Historic Walking Areas",
    "Neighborhoods",
    "Churches & Cathedrals",
    "Lookouts",
    "Sacred & Religious Sites",
    "Monuments & Statues",
    "Architectural Buildings",
    "Art Museums",
    "History Museums",
    "Specialty Museums",
    "Bodies of Water",
    "Gardens",
    "National Parks",
    "Mountains",
    "Parks",
    "Bridges",
    "Fountains",
    "Castles",
  ];

  const found = new Set<string>();
  for (const label of labels) {
    const escaped = label.replace(/&/g, "&amp;");
    if (html.includes(label) || html.includes(escaped)) {
      found.add(label);
    }
  }
  return [...found];
}

function mapCategoryToSlug(taCategory: string): string {
  const lower = taCategory.toLowerCase();
  if (lower.includes("museum") || lower.includes("historic") || lower.includes("castle") || lower.includes("religious") || lower.includes("church") || lower.includes("monument")) {
    return "history";
  }
  if (lower.includes("garden") || lower.includes("park") || lower.includes("mountain") || lower.includes("water") || lower.includes("national")) {
    return "nature";
  }
  if (lower.includes("lookout") || lower.includes("bridge") || lower.includes("architectural")) {
    return "viewpoint";
  }
  if (lower.includes("neighborhood") || lower.includes("walking")) {
    return "culture";
  }
  return "culture";
}

export function suggestCategorySlug(taCategory: string): string {
  return mapCategoryToSlug(taCategory);
}

function parseDetailHtml(html: string, sourceUrl: string): ScrapedPlace | null {
  const path = new URL(sourceUrl).pathname;
  const tripadvisorId = extractTripadvisorId(path);
  if (!tripadvisorId) return null;

  const jsonItems = flattenJsonLd(parseJsonLdBlocks(html));
  const business = jsonItems.find(
    (item) =>
      item["@type"] === "LocalBusiness" ||
      item["@type"] === "TouristAttraction" ||
      item["@type"] === "LandmarksOrHistoricalBuildings"
  );

  const breadcrumbs = jsonItems.find((item) => item["@type"] === "BreadcrumbList");
  const breadcrumbNames = Array.isArray((breadcrumbs?.itemListElement as unknown[]) ?? [])
    ? (breadcrumbs!.itemListElement as Array<{ name?: string }>).map((x) => x.name).filter(Boolean)
    : [];

  const thingsIdx = breadcrumbNames.findIndex((n) => n?.startsWith("Things to Do in "));
  let cityFromBreadcrumb = "";
  if (thingsIdx >= 0) {
    cityFromBreadcrumb = breadcrumbNames[thingsIdx]!.replace("Things to Do in ", "");
  } else {
    const geoIdx = breadcrumbNames.indexOf("Georgia");
    if (geoIdx >= 0 && breadcrumbNames[geoIdx + 1]) {
      cityFromBreadcrumb = breadcrumbNames[geoIdx + 1]!;
    }
  }

  const h1 = html.match(/<h1[^>]*>([^<]+)</i);
  const name =
    (typeof business?.name === "string" ? business.name : null) ??
    h1?.[1]?.trim() ??
    nameFromAttractionPath(path) ??
    "Unknown";

  const address = (business?.address ?? {}) as Record<string, string>;
  const city = address.addressLocality || cityFromBreadcrumb || cityFromPath(path);
  const countryCode = address.addressCountry || "GE";
  const country = countryCode === "GE" ? "Georgia" : countryCode;

  const geo = (business?.geo ?? {}) as Record<string, number>;
  const lat = typeof geo.latitude === "number" ? geo.latitude : null;
  const lng = typeof geo.longitude === "number" ? geo.longitude : null;

  const ratingObj = (business?.aggregateRating ?? {}) as Record<string, unknown>;
  const rating =
    ratingObj.ratingValue != null && !Number.isNaN(Number(ratingObj.ratingValue))
      ? Number(ratingObj.ratingValue)
      : null;
  const reviewCount =
    ratingObj.reviewCount != null && !Number.isNaN(Number(ratingObj.reviewCount))
      ? Number(ratingObj.reviewCount)
      : null;

  const image = typeof business?.image === "string" ? business.image : null;
  const ogImage = html.match(/property="og:image" content="([^"]+)"/i)?.[1]?.replace(/&amp;/g, "&") ?? null;
  const photoUrl = image ?? ogImage;

  const categories = extractCategories(html);
  const category = categories[0] ?? "Attraction";

  const ranking = html.match(/#\d+ of [\d,]+ things to do in [^<]+/i)?.[0] ?? null;

  let description = "";
  const ogDesc = html.match(/property="og:description" content="([^"]+)"/i)?.[1];
  if (ogDesc) {
    description = decodeHtml(ogDesc);
  }
  if (!description && ranking) {
    description = `${ranking}.`;
    if (rating && reviewCount) {
      description += ` Rated ${rating}/5 from ${reviewCount.toLocaleString()} TripAdvisor reviews.`;
    }
  }

  return {
    id: `ta-${tripadvisorId}`,
    tripadvisorId,
    name: decodeHtml(name),
    description,
    category,
    location: [city, country].filter(Boolean).join(", "),
    city,
    country,
    lat,
    lng,
    photoUrl,
    rating,
    reviewCount,
    ranking,
    sourceUrl,
  };
}

function parseListingHtml(html: string, sourceUrl: string): ScrapedPlace[] {
  const base = new URL(sourceUrl).origin;
  const re = /href="(\/Attraction_Review-g\d+-d\d+-Reviews-[^"#]+)"/gi;
  const seen = new Set<string>();
  const items: ScrapedPlace[] = [];

  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const path = match[1];
    if (seen.has(path)) continue;
    seen.add(path);

    const tripadvisorId = extractTripadvisorId(path);
    if (!tripadvisorId) continue;

    const name = nameFromAttractionPath(path);
    if (!name || name.startsWith("Review of:")) continue;

    const city = cityFromPath(path);
    items.push({
      id: `ta-${tripadvisorId}`,
      tripadvisorId,
      name,
      description: "",
      category: "Attraction",
      location: city ? `${city}, Georgia` : "Georgia",
      city,
      country: "Georgia",
      lat: null,
      lng: null,
      photoUrl: null,
      rating: null,
      reviewCount: null,
      ranking: null,
      sourceUrl: `${base}${path}`,
    });
  }

  return items;
}

async function fetchTripAdvisorHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": MOBILE_UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`TripAdvisor returned HTTP ${response.status}`);
  }

  const html = await response.text();
  if (html.includes("captcha-delivery.com") || html.includes("Please enable JS and disable any ad blocker")) {
    throw new Error("TripAdvisor blocked the request (captcha). Try again later or use a detail page URL.");
  }

  return html;
}

async function enrichWithDetails(items: ScrapedPlace[], maxItems: number): Promise<ScrapedPlace[]> {
  const slice = items.slice(0, maxItems);
  const results: ScrapedPlace[] = [];

  const batchSize = 5;
  for (let i = 0; i < slice.length; i += batchSize) {
    const batch = slice.slice(i, i + batchSize);
    const detailed = await Promise.all(
      batch.map(async (item) => {
        try {
          const html = await fetchTripAdvisorHtml(item.sourceUrl);
          return parseDetailHtml(html, item.sourceUrl) ?? item;
        } catch {
          return item;
        }
      })
    );
    results.push(...detailed);
  }

  return results;
}

export async function scrapeTripAdvisor(
  url: string,
  options: { fetchDetails?: boolean; maxItems?: number } = {}
): Promise<ScraperListResult> {
  const normalized = normalizeTripAdvisorUrl(url);
  if (!isTripAdvisorUrl(normalized)) {
    throw new Error("Only tripadvisor.com URLs are supported");
  }

  const fetchDetails = options.fetchDetails !== false;
  const maxItems = Math.min(Math.max(options.maxItems ?? 30, 1), 50);

  const html = await fetchTripAdvisorHtml(normalized);
  const pageTitle = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() ?? null;

  if (isDetailUrl(normalized)) {
    const item = parseDetailHtml(html, normalized);
    if (!item) {
      throw new Error("Could not parse attraction detail page");
    }
    return { pageType: "detail", sourceUrl: normalized, pageTitle, items: [item] };
  }

  if (isListingUrl(normalized) || html.includes("Attraction_Review-g")) {
    let items = parseListingHtml(html, normalized);
    if (fetchDetails && items.length > 0) {
      items = await enrichWithDetails(items, maxItems);
    } else {
      items = items.slice(0, maxItems);
    }
    return { pageType: "listing", sourceUrl: normalized, pageTitle, items };
  }

  throw new Error("Unsupported TripAdvisor URL. Use an Attractions listing or Attraction_Review detail page.");
}
