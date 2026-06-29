import { prisma } from "../db";
import { PLACES } from "../../data/places";
import { clearPlacesCache, dbPlaceToDomain, setPlacesCache } from "./placeRepository";
import { seedAiDefaults } from "../ai/seedAi";

const DEFAULT_CATEGORIES = [
  { slug: "history", name: "History", sortOrder: 1 },
  { slug: "nature", name: "Nature", sortOrder: 2 },
  { slug: "food", name: "Food", sortOrder: 3 },
  { slug: "viewpoint", name: "Viewpoint", sortOrder: 4 },
  { slug: "culture", name: "Culture", sortOrder: 5 },
] as const;

const CITY_COUNTRY: Record<string, { code: string; name: string }> = {
  Tbilisi: { code: "GE", name: "Georgia" },
  Paris: { code: "FR", name: "France" },
  Rome: { code: "IT", name: "Italy" },
  Tokyo: { code: "JP", name: "Japan" },
  "New York": { code: "US", name: "United States" },
};

export async function refreshPlacesCache(): Promise<number> {
  const rows = await prisma.place.findMany({
    where: { isPublished: true },
    include: { country: true, category: true, hiddenGem: true, translations: true },
    orderBy: { name: "asc" },
  });

  if (rows.length === 0) {
    clearPlacesCache();
    return 0;
  }

  setPlacesCache(rows.map(dbPlaceToDomain));
  return rows.length;
}

export async function ensureCmsReferenceData(): Promise<void> {
  for (const [index, category] of DEFAULT_CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, sortOrder: category.sortOrder, isActive: true },
      create: {
        slug: category.slug,
        name: category.name,
        sortOrder: category.sortOrder,
        isActive: true,
      },
    });
  }

  const countryByName = new Map<string, string>();
  for (const country of Object.values(CITY_COUNTRY)) {
    const row = await prisma.country.upsert({
      where: { code: country.code },
      update: { name: country.name, isActive: true },
      create: {
        code: country.code,
        name: country.name,
        isActive: true,
        sortOrder: Object.keys(CITY_COUNTRY).indexOf(
          Object.entries(CITY_COUNTRY).find(([, c]) => c.code === country.code)?.[0] ?? ""
        ),
      },
    });
    countryByName.set(country.name, row.id);
  }

  const categories = await prisma.category.findMany();
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  for (const place of PLACES) {
    const countryMeta = CITY_COUNTRY[place.city] ?? { code: "XX", name: place.country || place.city };
    let countryId = countryByName.get(countryMeta.name);
    if (!countryId) {
      const created = await prisma.country.upsert({
        where: { code: countryMeta.code },
        update: { name: countryMeta.name, isActive: true },
        create: { code: countryMeta.code, name: countryMeta.name, isActive: true },
      });
      countryId = created.id;
      countryByName.set(countryMeta.name, countryId);
    }

    const categoryId = categoryBySlug.get(place.category);
    if (!categoryId) {
      continue;
    }

    await prisma.place.upsert({
      where: { id: place.id },
      update: {
        name: place.name,
        city: place.city,
        countryId,
        categoryId,
        lat: place.lat,
        lng: place.lng,
        description: place.description,
        shortDescription: place.shortDescription,
        fullDescription: place.fullDescription,
        localTips: place.localTips,
        avgVisitTime: place.avgVisitTime,
        averageVisitDuration: place.averageVisitDuration,
        bestVisitTime: place.bestVisitTime,
        openingHours: place.openingHours,
        ticketPrice: place.ticketPrice,
        indoor: place.indoor,
        outdoor: place.outdoor,
        rainFriendly: place.rainFriendly,
        photoScore: place.photoScore,
        popularityScore: place.popularityScore,
        experienceScore: place.experienceScore,
        familyFriendly: place.familyFriendly,
        accessibility: place.accessibility,
        tags: JSON.stringify(place.tags),
        isPublished: true,
      },
      create: {
        id: place.id,
        name: place.name,
        city: place.city,
        countryId,
        categoryId,
        lat: place.lat,
        lng: place.lng,
        description: place.description,
        shortDescription: place.shortDescription,
        fullDescription: place.fullDescription,
        localTips: place.localTips,
        avgVisitTime: place.avgVisitTime,
        averageVisitDuration: place.averageVisitDuration,
        bestVisitTime: place.bestVisitTime,
        openingHours: place.openingHours,
        ticketPrice: place.ticketPrice,
        indoor: place.indoor,
        outdoor: place.outdoor,
        rainFriendly: place.rainFriendly,
        photoScore: place.photoScore,
        popularityScore: place.popularityScore,
        experienceScore: place.experienceScore,
        familyFriendly: place.familyFriendly,
        accessibility: place.accessibility,
        tags: JSON.stringify(place.tags),
        isPublished: true,
      },
    });

    await prisma.hiddenGemProfile.upsert({
      where: { placeId: place.id },
      update: {},
      create: {
        placeId: place.id,
        hiddenGemScore: 5,
        touristScore: place.popularityScore,
        localFavoriteScore: 5,
        isHiddenGem: place.tags.includes("local"),
      },
    });
  }
}

export async function initializeCmsData(): Promise<void> {
  await ensureCmsReferenceData();
  await refreshPlacesCache();
  try {
    await seedAiDefaults();
  } catch (err) {
    console.warn("AI defaults seed skipped:", err);
  }
}
