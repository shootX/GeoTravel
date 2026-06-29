import { FormEvent, useEffect, useState } from "react";
import { adminFetch, AdminPlace } from "../api";

export default function StoryEditorPage() {
  const [places, setPlaces] = useState<AdminPlace[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [locale, setLocale] = useState("en");
  const [storyContent, setStoryContent] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [localTips, setLocalTips] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    adminFetch("/places").then(async (res) => {
      const data = (await res.json()) as { places: AdminPlace[] };
      setPlaces(data.places);
      if (data.places[0]) {
        setSelectedPlaceId(data.places[0].id);
        setFullDescription(data.places[0].fullDescription);
        setLocalTips(data.places[0].localTips);
      }
    });
  }, []);

  useEffect(() => {
    const place = places.find((p) => p.id === selectedPlaceId);
    if (!place) return;
    setFullDescription(place.fullDescription);
    setLocalTips(place.localTips);
    adminFetch(`/places/${selectedPlaceId}/translations`).then(async (res) => {
      const data = (await res.json()) as { translations: Array<{ locale: string; storyContent?: string | null; fullDescription?: string | null; localTips?: string | null }> };
      const tr = data.translations.find((t) => t.locale === locale);
      setStoryContent(tr?.storyContent ?? place.fullDescription);
      if (tr?.fullDescription) setFullDescription(tr.fullDescription);
      if (tr?.localTips) setLocalTips(tr.localTips);
    });
  }, [selectedPlaceId, locale, places]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const res = await adminFetch(`/places/${selectedPlaceId}/story/${locale}`, {
      method: "PUT",
      body: JSON.stringify({ storyContent, fullDescription, localTips }),
    });
    setMessage(res.ok ? "Story saved" : "Save failed");
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Story Editor</h1>
      <p className="text-sm text-gray-500 mb-6">Rich narrative content for Story Mode</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <select className="border rounded-lg px-3 py-2 text-sm" value={selectedPlaceId} onChange={(e) => setSelectedPlaceId(e.target.value)}>
          {places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm" value={locale} onChange={(e) => setLocale(e.target.value)}>
          <option value="en">English</option>
          <option value="ka">Georgian</option>
        </select>
      </div>
      <form onSubmit={save} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <textarea className="w-full border rounded-lg px-3 py-2 text-sm font-mono" rows={10} placeholder="Story content (Story Mode)" value={storyContent} onChange={(e) => setStoryContent(e.target.value)} />
        <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={4} placeholder="Full description" value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} />
        <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Local tips" value={localTips} onChange={(e) => setLocalTips(e.target.value)} />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Save Story</button>
      </form>
      {message && <div className="text-xs text-blue-600 mt-3">{message}</div>}
    </div>
  );
}
