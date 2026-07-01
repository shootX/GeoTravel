import { Router, Request, Response } from "express";
import { prisma } from "../lib/db";
import { requireAdmin, requireAuth, requireCsrf } from "../lib/auth/middleware";
import { refreshPlacesCache } from "../lib/cms/initializeCms";
import { maskApiKey } from "../lib/ai/config";
import { AI_PROVIDER_CATALOG } from "../lib/ai/catalog";
import { scrapeTripAdvisor, suggestCategorySlug } from "../lib/scraper/tripadvisor";
import type { ScraperField } from "../lib/scraper/types";

const router = Router();

router.use(requireAuth, requireAdmin);

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseJsonArray(raw: string, fallback: unknown[] = []): unknown[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

async function invalidatePlaces(): Promise<void> {
  await refreshPlacesCache();
}

// ── Dashboard ───────────────────────────────────────────────────────────────

router.get("/stats", async (_req: Request, res: Response) => {
  const [places, categories, countries, translations, hiddenGems, templates, packages] =
    await Promise.all([
      prisma.place.count(),
      prisma.category.count(),
      prisma.country.count(),
      prisma.placeTranslation.count(),
      prisma.hiddenGemProfile.count({ where: { isHiddenGem: true } }),
      prisma.routeTemplate.count(),
      prisma.travelPackage.count(),
    ]);

  res.json({ places, categories, countries, translations, hiddenGems, templates, packages });
});

// ── Countries ───────────────────────────────────────────────────────────────

router.get("/countries", async (_req, res) => {
  const countries = await prisma.country.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  res.json({ countries });
});

router.post("/countries", requireCsrf, async (req, res) => {
  const { code, name, isActive = true, sortOrder = 0 } = req.body ?? {};
  if (!code || !name) {
    return res.status(400).json({ error: "code and name are required" });
  }
  const country = await prisma.country.create({
    data: { code: String(code).toUpperCase(), name: String(name), isActive: !!isActive, sortOrder: Number(sortOrder) || 0 },
  });
  res.status(201).json({ country });
});

router.put("/countries/:id", requireCsrf, async (req, res) => {
  const { code, name, isActive, sortOrder } = req.body ?? {};
  const country = await prisma.country.update({
    where: { id: req.params.id },
    data: {
      ...(code !== undefined ? { code: String(code).toUpperCase() } : {}),
      ...(name !== undefined ? { name: String(name) } : {}),
      ...(isActive !== undefined ? { isActive: !!isActive } : {}),
      ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) || 0 } : {}),
    },
  });
  res.json({ country });
});

router.delete("/countries/:id", requireCsrf, async (req, res) => {
  await prisma.country.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ── Categories ──────────────────────────────────────────────────────────────

router.get("/categories", async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  res.json({ categories });
});

router.post("/categories", requireCsrf, async (req, res) => {
  const { slug, name, isActive = true, sortOrder = 0 } = req.body ?? {};
  if (!slug || !name) {
    return res.status(400).json({ error: "slug and name are required" });
  }
  const category = await prisma.category.create({
    data: { slug: slugify(String(slug)), name: String(name), isActive: !!isActive, sortOrder: Number(sortOrder) || 0 },
  });
  res.status(201).json({ category });
});

router.put("/categories/:id", requireCsrf, async (req, res) => {
  const { slug, name, isActive, sortOrder } = req.body ?? {};
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: {
      ...(slug !== undefined ? { slug: slugify(String(slug)) } : {}),
      ...(name !== undefined ? { name: String(name) } : {}),
      ...(isActive !== undefined ? { isActive: !!isActive } : {}),
      ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) || 0 } : {}),
    },
  });
  res.json({ category });
});

router.delete("/categories/:id", requireCsrf, async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ── Places ──────────────────────────────────────────────────────────────────

router.get("/places", async (req, res) => {
  const city = typeof req.query.city === "string" ? req.query.city.trim() : "";
  const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId.trim() : "";
  const countryId = typeof req.query.countryId === "string" ? req.query.countryId.trim() : "";
  const published = typeof req.query.published === "string" ? req.query.published : "";
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  const where: {
    city?: string;
    categoryId?: string;
    countryId?: string;
    isPublished?: boolean;
    OR?: Array<{ name?: { contains: string }; id?: { contains: string }; city?: { contains: string } }>;
  } = {};

  if (city) where.city = city;
  if (categoryId) where.categoryId = categoryId;
  if (countryId) where.countryId = countryId;
  if (published === "true") where.isPublished = true;
  if (published === "false") where.isPublished = false;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { id: { contains: q } },
      { city: { contains: q } },
    ];
  }

  const places = await prisma.place.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    include: { country: true, category: true, hiddenGem: true, translations: true },
    orderBy: [{ city: "asc" }, { name: "asc" }],
  });
  res.json({ places });
});

router.post("/places/bulk-delete", requireCsrf, async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String).filter(Boolean) : [];
  if (ids.length === 0) {
    return res.status(400).json({ error: "ids array is required" });
  }

  const result = await prisma.place.deleteMany({ where: { id: { in: ids } } });
  await invalidatePlaces();
  res.json({ deleted: result.count });
});

router.put("/places/bulk-update", requireCsrf, async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String).filter(Boolean) : [];
  const patch = req.body?.patch ?? {};

  if (ids.length === 0) {
    return res.status(400).json({ error: "ids array is required" });
  }

  const data: Record<string, unknown> = {};
  if (patch.city !== undefined) data.city = String(patch.city);
  if (patch.countryId !== undefined) data.countryId = String(patch.countryId);
  if (patch.categoryId !== undefined) data.categoryId = String(patch.categoryId);
  if (patch.isPublished !== undefined) data.isPublished = !!patch.isPublished;

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: "patch must include at least one field" });
  }

  const result = await prisma.place.updateMany({ where: { id: { in: ids } }, data });
  await invalidatePlaces();
  res.json({ updated: result.count });
});

router.get("/places/:id", async (req, res) => {
  const place = await prisma.place.findUnique({
    where: { id: req.params.id },
    include: { country: true, category: true, hiddenGem: true, translations: true },
  });
  if (!place) {
    return res.status(404).json({ error: "Place not found" });
  }
  res.json({ place });
});

router.post("/places", requireCsrf, async (req, res) => {
  const body = req.body ?? {};
  if (!body.id || !body.name || !body.city || !body.countryId || !body.categoryId) {
    return res.status(400).json({ error: "id, name, city, countryId, categoryId are required" });
  }

  const place = await prisma.place.create({
    data: {
      id: String(body.id),
      name: String(body.name),
      city: String(body.city),
      countryId: String(body.countryId),
      categoryId: String(body.categoryId),
      lat: Number(body.lat) || 0,
      lng: Number(body.lng) || 0,
      description: String(body.description ?? body.shortDescription ?? ""),
      shortDescription: String(body.shortDescription ?? ""),
      fullDescription: String(body.fullDescription ?? ""),
      localTips: String(body.localTips ?? ""),
      avgVisitTime: Number(body.avgVisitTime) || 60,
      averageVisitDuration: Number(body.averageVisitDuration) || 60,
      bestVisitTime: String(body.bestVisitTime ?? "Morning"),
      openingHours: String(body.openingHours ?? "09:00–18:00"),
      ticketPrice: String(body.ticketPrice ?? "Free"),
      indoor: !!body.indoor,
      outdoor: body.outdoor !== false,
      rainFriendly: body.rainFriendly !== false,
      photoScore: Number(body.photoScore) || 7,
      popularityScore: Number(body.popularityScore) || 7,
      experienceScore: Number(body.experienceScore) || 7,
      familyFriendly: body.familyFriendly !== false,
      accessibility: String(body.accessibility ?? "Partial — check local conditions"),
      tags: JSON.stringify(Array.isArray(body.tags) ? body.tags : []),
      isPublished: body.isPublished !== false,
    },
    include: { country: true, category: true, hiddenGem: true, translations: true },
  });

  await invalidatePlaces();
  res.status(201).json({ place });
});

router.put("/places/:id", requireCsrf, async (req, res) => {
  const body = req.body ?? {};
  const place = await prisma.place.update({
    where: { id: req.params.id },
    data: {
      ...(body.name !== undefined ? { name: String(body.name) } : {}),
      ...(body.city !== undefined ? { city: String(body.city) } : {}),
      ...(body.countryId !== undefined ? { countryId: String(body.countryId) } : {}),
      ...(body.categoryId !== undefined ? { categoryId: String(body.categoryId) } : {}),
      ...(body.lat !== undefined ? { lat: Number(body.lat) } : {}),
      ...(body.lng !== undefined ? { lng: Number(body.lng) } : {}),
      ...(body.description !== undefined ? { description: String(body.description) } : {}),
      ...(body.shortDescription !== undefined ? { shortDescription: String(body.shortDescription) } : {}),
      ...(body.fullDescription !== undefined ? { fullDescription: String(body.fullDescription) } : {}),
      ...(body.localTips !== undefined ? { localTips: String(body.localTips) } : {}),
      ...(body.avgVisitTime !== undefined ? { avgVisitTime: Number(body.avgVisitTime) } : {}),
      ...(body.averageVisitDuration !== undefined ? { averageVisitDuration: Number(body.averageVisitDuration) } : {}),
      ...(body.bestVisitTime !== undefined ? { bestVisitTime: String(body.bestVisitTime) } : {}),
      ...(body.openingHours !== undefined ? { openingHours: String(body.openingHours) } : {}),
      ...(body.ticketPrice !== undefined ? { ticketPrice: String(body.ticketPrice) } : {}),
      ...(body.indoor !== undefined ? { indoor: !!body.indoor } : {}),
      ...(body.outdoor !== undefined ? { outdoor: !!body.outdoor } : {}),
      ...(body.rainFriendly !== undefined ? { rainFriendly: !!body.rainFriendly } : {}),
      ...(body.photoScore !== undefined ? { photoScore: Number(body.photoScore) } : {}),
      ...(body.popularityScore !== undefined ? { popularityScore: Number(body.popularityScore) } : {}),
      ...(body.experienceScore !== undefined ? { experienceScore: Number(body.experienceScore) } : {}),
      ...(body.familyFriendly !== undefined ? { familyFriendly: !!body.familyFriendly } : {}),
      ...(body.accessibility !== undefined ? { accessibility: String(body.accessibility) } : {}),
      ...(body.tags !== undefined ? { tags: JSON.stringify(body.tags) } : {}),
      ...(body.isPublished !== undefined ? { isPublished: !!body.isPublished } : {}),
    },
    include: { country: true, category: true, hiddenGem: true, translations: true },
  });

  await invalidatePlaces();
  res.json({ place });
});

router.delete("/places/:id", requireCsrf, async (req, res) => {
  await prisma.place.delete({ where: { id: req.params.id } });
  await invalidatePlaces();
  res.json({ ok: true });
});

// ── Translations ────────────────────────────────────────────────────────────

router.get("/places/:placeId/translations", async (req, res) => {
  const translations = await prisma.placeTranslation.findMany({
    where: { placeId: req.params.placeId },
    orderBy: { locale: "asc" },
  });
  res.json({ translations });
});

router.put("/places/:placeId/translations/:locale", requireCsrf, async (req, res) => {
  const { placeId, locale } = req.params;
  const body = req.body ?? {};

  const translation = await prisma.placeTranslation.upsert({
    where: { placeId_locale: { placeId, locale } },
    update: {
      ...(body.name !== undefined ? { name: body.name ? String(body.name) : null } : {}),
      ...(body.shortDescription !== undefined ? { shortDescription: body.shortDescription ? String(body.shortDescription) : null } : {}),
      ...(body.fullDescription !== undefined ? { fullDescription: body.fullDescription ? String(body.fullDescription) : null } : {}),
      ...(body.localTips !== undefined ? { localTips: body.localTips ? String(body.localTips) : null } : {}),
      ...(body.storyContent !== undefined ? { storyContent: body.storyContent ? String(body.storyContent) : null } : {}),
    },
    create: {
      placeId,
      locale,
      name: body.name ? String(body.name) : null,
      shortDescription: body.shortDescription ? String(body.shortDescription) : null,
      fullDescription: body.fullDescription ? String(body.fullDescription) : null,
      localTips: body.localTips ? String(body.localTips) : null,
      storyContent: body.storyContent ? String(body.storyContent) : null,
    },
  });

  res.json({ translation });
});

router.delete("/places/:placeId/translations/:locale", requireCsrf, async (req, res) => {
  await prisma.placeTranslation.delete({
    where: { placeId_locale: { placeId: req.params.placeId, locale: req.params.locale } },
  });
  res.json({ ok: true });
});

// ── Story editor (convenience) ──────────────────────────────────────────────

router.put("/places/:placeId/story/:locale", requireCsrf, async (req, res) => {
  const { placeId, locale } = req.params;
  const { storyContent, fullDescription, localTips, shortDescription } = req.body ?? {};

  const translation = await prisma.placeTranslation.upsert({
    where: { placeId_locale: { placeId, locale } },
    update: {
      ...(storyContent !== undefined ? { storyContent: storyContent ? String(storyContent) : null } : {}),
      ...(fullDescription !== undefined ? { fullDescription: fullDescription ? String(fullDescription) : null } : {}),
      ...(localTips !== undefined ? { localTips: localTips ? String(localTips) : null } : {}),
      ...(shortDescription !== undefined ? { shortDescription: shortDescription ? String(shortDescription) : null } : {}),
    },
    create: {
      placeId,
      locale,
      storyContent: storyContent ? String(storyContent) : null,
      fullDescription: fullDescription ? String(fullDescription) : null,
      localTips: localTips ? String(localTips) : null,
      shortDescription: shortDescription ? String(shortDescription) : null,
    },
  });

  if (locale === "en" && (fullDescription !== undefined || localTips !== undefined || shortDescription !== undefined)) {
    await prisma.place.update({
      where: { id: placeId },
      data: {
        ...(fullDescription !== undefined ? { fullDescription: String(fullDescription) } : {}),
        ...(localTips !== undefined ? { localTips: String(localTips) } : {}),
        ...(shortDescription !== undefined ? { shortDescription: String(shortDescription), description: String(shortDescription) } : {}),
      },
    });
    await invalidatePlaces();
  }

  res.json({ translation });
});

// ── Hidden gems ─────────────────────────────────────────────────────────────

router.get("/hidden-gems", async (_req, res) => {
  const profiles = await prisma.hiddenGemProfile.findMany({
    include: { place: { include: { country: true, category: true } } },
    orderBy: { hiddenGemScore: "desc" },
  });
  res.json({ profiles });
});

router.put("/places/:placeId/hidden-gem", requireCsrf, async (req, res) => {
  const body = req.body ?? {};
  const profile = await prisma.hiddenGemProfile.upsert({
    where: { placeId: req.params.placeId },
    update: {
      ...(body.hiddenGemScore !== undefined ? { hiddenGemScore: Number(body.hiddenGemScore) } : {}),
      ...(body.touristScore !== undefined ? { touristScore: Number(body.touristScore) } : {}),
      ...(body.localFavoriteScore !== undefined ? { localFavoriteScore: Number(body.localFavoriteScore) } : {}),
      ...(body.isHiddenGem !== undefined ? { isHiddenGem: !!body.isHiddenGem } : {}),
      ...(body.editorNotes !== undefined ? { editorNotes: body.editorNotes ? String(body.editorNotes) : null } : {}),
    },
    create: {
      placeId: req.params.placeId,
      hiddenGemScore: Number(body.hiddenGemScore) || 5,
      touristScore: Number(body.touristScore) || 5,
      localFavoriteScore: Number(body.localFavoriteScore) || 5,
      isHiddenGem: !!body.isHiddenGem,
      editorNotes: body.editorNotes ? String(body.editorNotes) : null,
    },
    include: { place: true },
  });
  res.json({ profile });
});

// ── Route templates ─────────────────────────────────────────────────────────

router.get("/route-templates", async (_req, res) => {
  const templates = await prisma.routeTemplate.findMany({ orderBy: { updatedAt: "desc" } });
  res.json({
    templates: templates.map((t) => ({
      ...t,
      interests: parseJsonArray(t.interests),
      stopPlaceIds: parseJsonArray(t.stopPlaceIds),
    })),
  });
});

router.post("/route-templates", requireCsrf, async (req, res) => {
  const body = req.body ?? {};
  if (!body.name || !body.city) {
    return res.status(400).json({ error: "name and city are required" });
  }
  const slug = body.slug ? slugify(String(body.slug)) : slugify(String(body.name));
  const template = await prisma.routeTemplate.create({
    data: {
      name: String(body.name),
      slug,
      city: String(body.city),
      countryId: body.countryId ? String(body.countryId) : null,
      description: body.description ? String(body.description) : null,
      transport: String(body.transport ?? "walk"),
      timeLimit: String(body.timeLimit ?? "4h"),
      interests: JSON.stringify(body.interests ?? ["mixed"]),
      stopPlaceIds: JSON.stringify(body.stopPlaceIds ?? []),
      isPublished: !!body.isPublished,
    },
  });
  res.status(201).json({
    template: { ...template, interests: parseJsonArray(template.interests), stopPlaceIds: parseJsonArray(template.stopPlaceIds) },
  });
});

router.put("/route-templates/:id", requireCsrf, async (req, res) => {
  const body = req.body ?? {};
  const template = await prisma.routeTemplate.update({
    where: { id: req.params.id },
    data: {
      ...(body.name !== undefined ? { name: String(body.name) } : {}),
      ...(body.slug !== undefined ? { slug: slugify(String(body.slug)) } : {}),
      ...(body.city !== undefined ? { city: String(body.city) } : {}),
      ...(body.countryId !== undefined ? { countryId: body.countryId ? String(body.countryId) : null } : {}),
      ...(body.description !== undefined ? { description: body.description ? String(body.description) : null } : {}),
      ...(body.transport !== undefined ? { transport: String(body.transport) } : {}),
      ...(body.timeLimit !== undefined ? { timeLimit: String(body.timeLimit) } : {}),
      ...(body.interests !== undefined ? { interests: JSON.stringify(body.interests) } : {}),
      ...(body.stopPlaceIds !== undefined ? { stopPlaceIds: JSON.stringify(body.stopPlaceIds) } : {}),
      ...(body.isPublished !== undefined ? { isPublished: !!body.isPublished } : {}),
    },
  });
  res.json({
    template: { ...template, interests: parseJsonArray(template.interests), stopPlaceIds: parseJsonArray(template.stopPlaceIds) },
  });
});

router.delete("/route-templates/:id", requireCsrf, async (req, res) => {
  await prisma.routeTemplate.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ── Packages ────────────────────────────────────────────────────────────────

router.get("/packages", async (_req, res) => {
  const packages = await prisma.travelPackage.findMany({
    include: { country: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  res.json({
    packages: packages.map((p) => ({
      ...p,
      routeTemplateIds: parseJsonArray(p.routeTemplateIds),
      highlights: p.highlights ? parseJsonArray(p.highlights) : [],
    })),
  });
});

router.post("/packages", requireCsrf, async (req, res) => {
  const body = req.body ?? {};
  if (!body.name) {
    return res.status(400).json({ error: "name is required" });
  }
  const slug = body.slug ? slugify(String(body.slug)) : slugify(String(body.name));
  const pkg = await prisma.travelPackage.create({
    data: {
      name: String(body.name),
      slug,
      description: body.description ? String(body.description) : null,
      city: body.city ? String(body.city) : null,
      countryId: body.countryId ? String(body.countryId) : null,
      price: body.price !== undefined && body.price !== null ? Number(body.price) : null,
      currency: String(body.currency ?? "USD"),
      durationDays: Number(body.durationDays) || 1,
      routeTemplateIds: JSON.stringify(body.routeTemplateIds ?? []),
      highlights: body.highlights ? JSON.stringify(body.highlights) : null,
      isPublished: !!body.isPublished,
      sortOrder: Number(body.sortOrder) || 0,
    },
    include: { country: true },
  });
  res.status(201).json({
    package: { ...pkg, routeTemplateIds: parseJsonArray(pkg.routeTemplateIds), highlights: pkg.highlights ? parseJsonArray(pkg.highlights) : [] },
  });
});

router.put("/packages/:id", requireCsrf, async (req, res) => {
  const body = req.body ?? {};
  const pkg = await prisma.travelPackage.update({
    where: { id: req.params.id },
    data: {
      ...(body.name !== undefined ? { name: String(body.name) } : {}),
      ...(body.slug !== undefined ? { slug: slugify(String(body.slug)) } : {}),
      ...(body.description !== undefined ? { description: body.description ? String(body.description) : null } : {}),
      ...(body.city !== undefined ? { city: body.city ? String(body.city) : null } : {}),
      ...(body.countryId !== undefined ? { countryId: body.countryId ? String(body.countryId) : null } : {}),
      ...(body.price !== undefined ? { price: body.price !== null ? Number(body.price) : null } : {}),
      ...(body.currency !== undefined ? { currency: String(body.currency) } : {}),
      ...(body.durationDays !== undefined ? { durationDays: Number(body.durationDays) || 1 } : {}),
      ...(body.routeTemplateIds !== undefined ? { routeTemplateIds: JSON.stringify(body.routeTemplateIds) } : {}),
      ...(body.highlights !== undefined ? { highlights: body.highlights ? JSON.stringify(body.highlights) : null } : {}),
      ...(body.isPublished !== undefined ? { isPublished: !!body.isPublished } : {}),
      ...(body.sortOrder !== undefined ? { sortOrder: Number(body.sortOrder) || 0 } : {}),
    },
    include: { country: true },
  });
  res.json({
    package: { ...pkg, routeTemplateIds: parseJsonArray(pkg.routeTemplateIds), highlights: pkg.highlights ? parseJsonArray(pkg.highlights) : [] },
  });
});

router.delete("/packages/:id", requireCsrf, async (req, res) => {
  await prisma.travelPackage.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ── AI Planner ──────────────────────────────────────────────────────────────

router.get("/ai/settings", async (_req, res) => {
  const settings = await prisma.aiPlannerSettings.findUnique({ where: { id: "default" } });
  res.json({
    settings: settings ?? {
      id: "default",
      enabled: true,
      fallbackToGreedy: true,
      rotateModels: true,
      systemPrompt: null,
      varietyBoost: 0.9,
      preferredModelId: null,
    },
  });
});

router.put("/ai/settings", requireCsrf, async (req, res) => {
  const body = req.body ?? {};
  const settings = await prisma.aiPlannerSettings.upsert({
    where: { id: "default" },
    update: {
      ...(body.enabled !== undefined ? { enabled: !!body.enabled } : {}),
      ...(body.fallbackToGreedy !== undefined ? { fallbackToGreedy: !!body.fallbackToGreedy } : {}),
      ...(body.rotateModels !== undefined ? { rotateModels: !!body.rotateModels } : {}),
      ...(body.systemPrompt !== undefined ? { systemPrompt: body.systemPrompt ? String(body.systemPrompt) : null } : {}),
      ...(body.varietyBoost !== undefined ? { varietyBoost: Math.min(1, Math.max(0.5, Number(body.varietyBoost) || 0.9)) } : {}),
      ...(body.preferredModelId !== undefined ? { preferredModelId: body.preferredModelId ? String(body.preferredModelId) : null } : {}),
    },
    create: {
      id: "default",
      enabled: body.enabled !== undefined ? !!body.enabled : true,
      fallbackToGreedy: body.fallbackToGreedy !== undefined ? !!body.fallbackToGreedy : true,
      rotateModels: body.rotateModels !== undefined ? !!body.rotateModels : true,
      systemPrompt: body.systemPrompt ? String(body.systemPrompt) : null,
      varietyBoost: Number(body.varietyBoost) || 0.9,
      preferredModelId: body.preferredModelId ? String(body.preferredModelId) : null,
    },
  });
  res.json({ settings });
});

router.get("/ai/providers", async (_req, res) => {
  const providers = await prisma.aiProvider.findMany({
    include: { models: { orderBy: [{ sortOrder: "asc" }, { displayName: "asc" }] } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  res.json({
    providers: providers.map((p) => ({
      ...p,
      apiKeyMasked: maskApiKey(p.apiKey),
      apiKey: undefined,
      hasApiKey: !!p.apiKey?.trim(),
    })),
    catalog: AI_PROVIDER_CATALOG,
  });
});

router.put("/ai/providers/:id", requireCsrf, async (req, res) => {
  const body = req.body ?? {};
  const data: Record<string, unknown> = {};

  if (body.name !== undefined) data.name = String(body.name);
  if (body.isActive !== undefined) data.isActive = !!body.isActive;
  if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0;
  if (body.baseUrl !== undefined) data.baseUrl = body.baseUrl ? String(body.baseUrl) : null;
  if (body.apiKey !== undefined && String(body.apiKey).trim()) {
    data.apiKey = String(body.apiKey).trim();
  }

  const provider = await prisma.aiProvider.update({
    where: { id: req.params.id },
    data,
    include: { models: { orderBy: [{ sortOrder: "asc" }] } },
  });

  res.json({
    provider: {
      ...provider,
      apiKeyMasked: maskApiKey(provider.apiKey),
      apiKey: undefined,
      hasApiKey: !!provider.apiKey?.trim(),
    },
  });
});

router.put("/ai/models/:id", requireCsrf, async (req, res) => {
  const body = req.body ?? {};
  const data: Record<string, unknown> = {};

  if (body.displayName !== undefined) data.displayName = String(body.displayName);
  if (body.isActive !== undefined) data.isActive = !!body.isActive;
  if (body.isDefault !== undefined) data.isDefault = !!body.isDefault;
  if (body.temperature !== undefined) data.temperature = Math.min(1, Math.max(0, Number(body.temperature) || 0.9));
  if (body.maxTokens !== undefined) data.maxTokens = Math.max(256, Number(body.maxTokens) || 4096);
  if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0;

  if (body.isDefault === true) {
    const current = await prisma.aiModel.findUnique({ where: { id: req.params.id } });
    if (current) {
      await prisma.aiModel.updateMany({
        where: { providerId: current.providerId, isDefault: true },
        data: { isDefault: false },
      });
    }
  }

  const model = await prisma.aiModel.update({
    where: { id: req.params.id },
    data,
    include: { provider: true },
  });

  res.json({ model });
});

router.post("/ai/models", requireCsrf, async (req, res) => {
  const body = req.body ?? {};
  if (!body.providerId || !body.modelId || !body.displayName) {
    return res.status(400).json({ error: "providerId, modelId, and displayName are required" });
  }

  const model = await prisma.aiModel.create({
    data: {
      providerId: String(body.providerId),
      modelId: String(body.modelId),
      displayName: String(body.displayName),
      isActive: body.isActive !== undefined ? !!body.isActive : true,
      isDefault: !!body.isDefault,
      temperature: Number(body.temperature) || 0.9,
      maxTokens: Number(body.maxTokens) || 4096,
      sortOrder: Number(body.sortOrder) || 0,
    },
    include: { provider: true },
  });

  res.status(201).json({ model });
});

router.delete("/ai/models/:id", requireCsrf, async (req, res) => {
  await prisma.aiModel.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ── TripAdvisor Scraper ─────────────────────────────────────────────────────

router.post("/scraper/tripadvisor", requireCsrf, async (req, res) => {
  const body = req.body ?? {};
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url) {
    return res.status(400).json({ error: "url is required" });
  }

  try {
    const result = await scrapeTripAdvisor(url, {
      fetchDetails: body.fetchDetails !== false,
      maxItems: Number(body.maxItems) || 30,
    });
    res.json({
      ...result,
      items: result.items.map((item) => ({
        ...item,
        suggestedCategorySlug: suggestCategorySlug(item.category),
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scrape failed";
    return res.status(502).json({ error: message });
  }
});

router.post("/scraper/tripadvisor/import", requireCsrf, async (req, res) => {
  const body = req.body ?? {};
  const items = Array.isArray(body.items) ? body.items : [];
  const fields = new Set(
    (Array.isArray(body.fields) ? body.fields : ["name", "description", "category", "location", "photo"]) as ScraperField[]
  );

  if (items.length === 0) {
    return res.status(400).json({ error: "items array is required" });
  }

  const categories = await prisma.category.findMany();
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));
  const defaultCategoryId = categoryBySlug.get("culture") ?? categories[0]?.id;

  const created: string[] = [];
  const skipped: string[] = [];
  const errors: Array<{ id: string; error: string }> = [];

  for (const raw of items) {
    const id = String(raw.id ?? "");
    if (!id) continue;

    const existing = await prisma.place.findUnique({ where: { id } });
    if (existing) {
      skipped.push(id);
      continue;
    }

    const countryCode = String(raw.countryCode ?? "GE").toUpperCase();
    const country =
      (await prisma.country.findUnique({ where: { code: countryCode } })) ??
      (await prisma.country.findFirst({ where: { name: { contains: String(raw.country ?? "Georgia") } } }));

    if (!country) {
      errors.push({ id, error: `Country not found: ${countryCode}` });
      continue;
    }

    const slug = String(raw.categorySlug ?? suggestCategorySlug(String(raw.category ?? "")));
    const categoryId = categoryBySlug.get(slug) ?? defaultCategoryId;
    if (!categoryId) {
      errors.push({ id, error: "No categories in database" });
      continue;
    }

    const tags: string[] = ["tripadvisor", `ta:${raw.tripadvisorId ?? id}`];
    if (fields.has("photo") && raw.photoUrl) {
      tags.push(`photo:${raw.photoUrl}`);
    }

    try {
      await prisma.place.create({
        data: {
          id,
          name: fields.has("name") ? String(raw.name ?? "Untitled") : id,
          city: fields.has("location") ? String(raw.city ?? "Tbilisi") : "Tbilisi",
          countryId: country.id,
          categoryId,
          lat: fields.has("location") ? Number(raw.lat) || 0 : 0,
          lng: fields.has("location") ? Number(raw.lng) || 0 : 0,
          description: fields.has("description") ? String(raw.description ?? "") : "",
          shortDescription: fields.has("description") ? String(raw.description ?? "").slice(0, 280) : "",
          fullDescription: fields.has("description") ? String(raw.description ?? "") : "",
          popularityScore: raw.rating ? Math.round(Number(raw.rating) * 2) : 7,
          photoScore: raw.photoUrl ? 8 : 7,
          tags: JSON.stringify(tags),
          isPublished: false,
        },
      });
      created.push(id);
    } catch (err) {
      errors.push({ id, error: err instanceof Error ? err.message : "Create failed" });
    }
  }

  if (created.length > 0) {
    await invalidatePlaces();
  }

  res.json({ created, skipped, errors });
});


// ── Featured Destinations ───────────────────────────────────────────────────

router.get("/destinations", async (req, res) => {
  const destinations = await prisma.featuredDestination.findMany({
    orderBy: { sortOrder: "asc" },
  });
  res.json({ destinations });
});

router.post("/destinations", requireCsrf, async (req, res) => {
  const data = req.body;
  const destination = await prisma.featuredDestination.create({
    data: {
      title: data.title,
      subtitle: data.subtitle,
      imageUrl: data.imageUrl,
      price: data.price ? Number(data.price) : null,
      currency: data.currency || "USD",
      isTrending: !!data.isTrending,
      isPublished: !!data.isPublished,
      sortOrder: Number(data.sortOrder) || 0,
    },
  });
  res.json({ destination });
});

router.put("/destinations/:id", requireCsrf, async (req, res) => {
  const data = req.body;
  const destination = await prisma.featuredDestination.update({
    where: { id: req.params.id },
    data: {
      title: data.title,
      subtitle: data.subtitle,
      imageUrl: data.imageUrl,
      price: data.price ? Number(data.price) : null,
      currency: data.currency || "USD",
      isTrending: !!data.isTrending,
      isPublished: !!data.isPublished,
      sortOrder: Number(data.sortOrder) || 0,
    },
  });
  res.json({ destination });
});

router.delete("/destinations/:id", requireCsrf, async (req, res) => {
  await prisma.featuredDestination.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ── Blog Posts ──────────────────────────────────────────────────────────────

router.get("/blog", async (req, res) => {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json({ posts });
});

router.post("/blog", requireCsrf, async (req, res) => {
  const data = req.body;
  const post = await prisma.blogPost.create({
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      imageUrl: data.imageUrl,
      isPublished: !!data.isPublished,
    },
  });
  res.json({ post });
});

router.put("/blog/:id", requireCsrf, async (req, res) => {
  const data = req.body;
  const post = await prisma.blogPost.update({
    where: { id: req.params.id },
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      imageUrl: data.imageUrl,
      isPublished: !!data.isPublished,
    },
  });
  res.json({ post });
});

router.delete("/blog/:id", requireCsrf, async (req, res) => {
  await prisma.blogPost.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
export default router;
