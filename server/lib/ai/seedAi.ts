import { prisma } from "../db";
import { AI_PROVIDER_CATALOG } from "./catalog";
import { ensureAiPlannerSettings } from "./config";

export async function seedAiDefaults(): Promise<void> {
  await ensureAiPlannerSettings();

  for (const providerDef of AI_PROVIDER_CATALOG) {
    const envKey = process.env[providerDef.envKey]?.trim() || null;

    const provider = await prisma.aiProvider.upsert({
      where: { slug: providerDef.slug },
      update: {
        name: providerDef.name,
        sortOrder: providerDef.sortOrder,
        baseUrl: providerDef.defaultBaseUrl ?? null,
        ...(envKey && !process.env.FORCE_DB_AI_KEYS ? {} : {}),
      },
      create: {
        slug: providerDef.slug,
        name: providerDef.name,
        sortOrder: providerDef.sortOrder,
        baseUrl: providerDef.defaultBaseUrl ?? null,
        apiKey: envKey,
        isActive: !!envKey,
      },
    });

    if (envKey && !provider.apiKey) {
      await prisma.aiProvider.update({
        where: { id: provider.id },
        data: { apiKey: envKey, isActive: true },
      });
    }

    for (const modelDef of providerDef.models) {
      if (modelDef.isDefault) {
        await prisma.aiModel.updateMany({
          where: { providerId: provider.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      await prisma.aiModel.upsert({
        where: {
          providerId_modelId: {
            providerId: provider.id,
            modelId: modelDef.modelId,
          },
        },
        update: {
          displayName: modelDef.displayName,
          sortOrder: modelDef.sortOrder,
          isDefault: !!modelDef.isDefault,
        },
        create: {
          providerId: provider.id,
          modelId: modelDef.modelId,
          displayName: modelDef.displayName,
          sortOrder: modelDef.sortOrder,
          isDefault: !!modelDef.isDefault,
          isActive: !!envKey,
          temperature: 0.9,
          maxTokens: 4096,
        },
      });
    }
  }
}
