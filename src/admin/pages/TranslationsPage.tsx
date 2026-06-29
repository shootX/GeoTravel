import { FormEvent, useEffect, useState } from "react";
import { adminFetch, AdminPlace, AdminTranslation } from "../api";

export default function TranslationsPage() {
  const [places, setPlaces] = useState<AdminPlace[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [locale, setLocale] = useState("ka");
  const [translations, setTranslations] = useState<AdminTranslation[]>([]);
  const [form, setForm] = useState({ name: "", shortDescription: "", fullDescription: "", localTips: "" });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    adminFetch("/places").then(async (res) => {
      const data = (await res.json()) as { places: AdminPlace[] };
      setPlaces(data.places);
      if (data.places[0]) setSelectedPlaceId(data.places[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedPlaceId) return;
    adminFetch(`/places/${selectedPlaceId}/translations`).then(async (res) => {
      const data = (await res.json()) as { translations: AdminTranslation[] };
      setTranslations(data.translations);
      const existing = data.translations.find((t) => t.locale === locale);
      setForm({
        name: existing?.name ?? "",
        shortDescription: existing?.shortDescription ?? "",
        fullDescription: existing?.fullDescription ?? "",
        localTips: existing?.localTips ?? "",
      });
    });
  }, [selectedPlaceId, locale]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const res = await adminFetch(`/places/${selectedPlaceId}/translations/${locale}`, {
      method: "PUT",
      body: JSON.stringify(form),
    });
    setMessage(res.ok ? "Translation saved" : "Save failed");
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Translation Management</h1>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <select className="border rounded-lg px-3 py-2 text-sm" value={selectedPlaceId} onChange={(e) => setSelectedPlaceId(e.target.value)}>
          {places.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.city})</option>)}
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm" value={locale} onChange={(e) => setLocale(e.target.value)}>
          <option value="en">English</option>
          <option value="ka">Georgian</option>
          <option value="fr">French</option>
          <option value="de">German</option>
        </select>
      </div>
      <form onSubmit={save} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Translated name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Short description" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
        <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={4} placeholder="Full description" value={form.fullDescription} onChange={(e) => setForm({ ...form, fullDescription: e.target.value })} />
        <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Local tips" value={form.localTips} onChange={(e) => setForm({ ...form, localTips: e.target.value })} />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Save Translation</button>
      </form>
      {message && <div className="text-xs text-blue-600 mt-3">{message}</div>}
      <div className="mt-6 text-xs text-gray-500">Existing locales: {translations.map((t) => t.locale).join(", ") || "none"}</div>
    </div>
  );
}
