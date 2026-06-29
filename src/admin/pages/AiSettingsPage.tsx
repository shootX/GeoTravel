import { FormEvent, useEffect, useState } from "react";
import { adminFetch } from "../api";

interface AiSettings {
  id: string;
  enabled: boolean;
  fallbackToGreedy: boolean;
  rotateModels: boolean;
  systemPrompt: string | null;
  varietyBoost: number;
  preferredModelId: string | null;
}

interface AiModel {
  id: string;
  providerId: string;
  modelId: string;
  displayName: string;
  isActive: boolean;
  isDefault: boolean;
  temperature: number;
  maxTokens: number;
  sortOrder: number;
}

interface AiProvider {
  id: string;
  slug: string;
  name: string;
  baseUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  apiKeyMasked: string;
  hasApiKey: boolean;
  models: AiModel[];
}

export default function AiSettingsPage() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [newModel, setNewModel] = useState({ providerId: "", modelId: "", displayName: "" });

  const load = async () => {
    try {
      const [settingsRes, providersRes] = await Promise.all([
        adminFetch("/ai/settings"),
        adminFetch("/ai/providers"),
      ]);

      const settingsType = settingsRes.headers.get("content-type") ?? "";
      if (!settingsRes.ok || !settingsType.includes("application/json")) {
        throw new Error(
          settingsRes.ok
            ? "AI API არასწორ პასუხს აბრუნებს — გადატვირთე სერვერი (npm run dev)"
            : `AI settings ვერ ჩაიტვირთა (${settingsRes.status})`
        );
      }

      const providersType = providersRes.headers.get("content-type") ?? "";
      if (!providersRes.ok || !providersType.includes("application/json")) {
        throw new Error(
          providersRes.ok
            ? "AI API არასწორ პასუხს აბრუნებს — გადატვირთე სერვერი (npm run dev)"
            : `AI providers ვერ ჩაიტვირთა (${providersRes.status})`
        );
      }

      const settingsData = (await settingsRes.json()) as { settings: AiSettings };
      const providersData = (await providersRes.json()) as { providers: AiProvider[] };
      setSettings(settingsData.settings);
      setProviders(providersData.providers);
      setMessage(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "ჩატვირთვის შეცდომა");
    }
  };

  useEffect(() => { load(); }, []);

  const saveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    const res = await adminFetch("/ai/settings", { method: "PUT", body: JSON.stringify(settings) });
    if (!res.ok) {
      setMessage("შენახვა ვერ მოხერხდა");
      return;
    }
    setMessage("პარამეტრები შენახულია");
    await load();
  };

  const saveProvider = async (provider: AiProvider) => {
    const body: Record<string, unknown> = {
      isActive: provider.isActive,
      baseUrl: provider.baseUrl,
    };
    if (apiKeys[provider.id]?.trim()) {
      body.apiKey = apiKeys[provider.id].trim();
    }
    await adminFetch(`/ai/providers/${provider.id}`, { method: "PUT", body: JSON.stringify(body) });
    setApiKeys((prev) => ({ ...prev, [provider.id]: "" }));
    setMessage(`${provider.name} განახლდა`);
    await load();
  };

  const updateModel = async (model: AiModel, patch: Partial<AiModel>) => {
    await adminFetch(`/ai/models/${model.id}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    await load();
  };

  const addModel = async (e: FormEvent) => {
    e.preventDefault();
    if (!newModel.providerId || !newModel.modelId || !newModel.displayName) return;
    await adminFetch("/ai/models", { method: "POST", body: JSON.stringify(newModel) });
    setNewModel({ providerId: "", modelId: "", displayName: "" });
    setMessage("მოდელი დაემატა");
    await load();
  };

  const allModels = providers.flatMap((p) =>
    p.models.map((m) => ({ ...m, providerName: p.name }))
  );

  if (!settings) {
    return (
      <div className="p-8 max-w-5xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">AI Route Planner</h1>
        {message ? (
          <div className="text-sm text-red-600 mt-4">{message}</div>
        ) : (
          <div className="text-sm text-gray-500 mt-4">იტვირთება...</div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">AI Route Planner</h1>
      <p className="text-sm text-gray-500 mb-6">მარშუტის დაგეგმვის AI მოდელების მართვა</p>

      {message && <div className="text-xs text-blue-600 mb-4">{message}</div>}

      <form onSubmit={saveSettings} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-800">ზოგადი პარამეტრები</h2>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settings.enabled} onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })} />
            AI დაგეგმვა ჩართული
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settings.fallbackToGreedy} onChange={(e) => setSettings({ ...settings, fallbackToGreedy: e.target.checked })} />
            Fallback ალგორითმზე
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settings.rotateModels} onChange={(e) => setSettings({ ...settings, rotateModels: e.target.checked })} />
            მოდელების როტაცია
          </label>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Variety (temperature) — {settings.varietyBoost}</label>
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.05"
              value={settings.varietyBoost}
              onChange={(e) => setSettings({ ...settings, varietyBoost: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">სასურველი მოდელი</label>
          <select
            className="border rounded-lg px-3 py-2 text-sm w-full"
            value={settings.preferredModelId ?? ""}
            onChange={(e) => setSettings({ ...settings, preferredModelId: e.target.value || null })}
          >
            <option value="">ავტომატური (როტაცია)</option>
            {allModels.filter((m) => m.isActive).map((m) => (
              <option key={m.id} value={m.id}>{m.providerName} — {m.displayName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">System Prompt</label>
          <textarea
            className="border rounded-lg px-3 py-2 text-sm w-full h-28"
            value={settings.systemPrompt ?? ""}
            onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value || null })}
            placeholder="AI-ს ინსტრუქცია მარშუტის დაგეგმვისთვის..."
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white rounded-lg text-sm font-semibold px-4 py-2">
          შენახვა
        </button>
      </form>

      <div className="space-y-4 mb-6">
        {providers.map((provider) => (
          <div key={provider.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold text-sm">{provider.name}</div>
                <div className="text-xs text-gray-500">{provider.slug} · API: {provider.hasApiKey ? provider.apiKeyMasked : "არ არის"}</div>
              </div>
              <button
                onClick={() => saveProvider({ ...provider, isActive: !provider.isActive })}
                className={`text-xs font-semibold px-2 py-1 rounded ${provider.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}
              >
                {provider.isActive ? "აქტიური" : "გამორთული"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <input
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="API Key"
                value={apiKeys[provider.id] ?? ""}
                onChange={(e) => setApiKeys({ ...apiKeys, [provider.id]: e.target.value })}
              />
              <input
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Base URL (optional)"
                value={provider.baseUrl ?? ""}
                onChange={(e) => {
                  const updated = providers.map((p) =>
                    p.id === provider.id ? { ...p, baseUrl: e.target.value || null } : p
                  );
                  setProviders(updated);
                }}
              />
            </div>
            <button
              onClick={() => saveProvider(provider)}
              className="text-xs font-semibold text-blue-600 mb-4"
            >
              პროვაიდერის შენახვა
            </button>

            <div className="divide-y border-t">
              {provider.models.map((model) => (
                <div key={model.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{model.displayName}</div>
                    <div className="text-xs text-gray-500">{model.modelId}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateModel(model, { isDefault: true })}
                      className={`text-[10px] font-semibold px-2 py-1 rounded ${model.isDefault ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      Default
                    </button>
                    <button
                      onClick={() => updateModel(model, { isActive: !model.isActive })}
                      className={`text-[10px] font-semibold px-2 py-1 rounded ${model.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {model.isActive ? "ON" : "OFF"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={addModel} className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-4 gap-3">
        <h2 className="col-span-4 text-sm font-bold text-gray-800">ახალი მოდელის დამატება</h2>
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={newModel.providerId}
          onChange={(e) => setNewModel({ ...newModel, providerId: e.target.value })}
          required
        >
          <option value="">პროვაიდერი</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="model-id" value={newModel.modelId} onChange={(e) => setNewModel({ ...newModel, modelId: e.target.value })} required />
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="სახელი" value={newModel.displayName} onChange={(e) => setNewModel({ ...newModel, displayName: e.target.value })} required />
        <button type="submit" className="bg-blue-600 text-white rounded-lg text-sm font-semibold">დამატება</button>
      </form>
    </div>
  );
}
