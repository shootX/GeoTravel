import { FormEvent, useEffect, useState } from "react";
import { adminFetch, AdminCategory, AdminCountry, AdminPlace } from "../api";

function parseTags(raw: string): string {
  try {
    return JSON.parse(raw).join(", ");
  } catch {
    return "";
  }
}

export default function PlacesPage() {
  const [places, setPlaces] = useState<AdminPlace[]>([]);
  const [countries, setCountries] = useState<AdminCountry[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<AdminPlace>>({});
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const [pRes, cRes, catRes] = await Promise.all([
      adminFetch("/places"),
      adminFetch("/countries"),
      adminFetch("/categories"),
    ]);
    const pData = (await pRes.json()) as { places: AdminPlace[] };
    const cData = (await cRes.json()) as { countries: AdminCountry[] };
    const catData = (await catRes.json()) as { categories: AdminCategory[] };
    setPlaces(pData.places);
    setCountries(cData.countries);
    setCategories(catData.categories);
  };

  useEffect(() => {
    load();
  }, []);

  const selectPlace = (place: AdminPlace) => {
    setSelectedId(place.id);
    setForm(place);
    setMessage(null);
  };

  const startNew = () => {
    setSelectedId("__new__");
    setForm({
      id: "",
      name: "",
      city: "Tbilisi",
      countryId: countries[0]?.id,
      categoryId: categories[0]?.id,
      lat: 0,
      lng: 0,
      shortDescription: "",
      fullDescription: "",
      localTips: "",
      bestVisitTime: "Morning",
      popularityScore: 7,
      photoScore: 7,
      isPublished: true,
      tags: "[]",
    });
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const isNew = selectedId === "__new__";
    const tagsArray = String(form.tags ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const body = { ...form, tags: tagsArray };
    const res = await adminFetch(isNew ? "/places" : `/places/${selectedId}`, {
      method: isNew ? "POST" : "PUT",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(data.error || "Save failed");
      return;
    }

    setMessage("Saved");
    await load();
  };

  return (
    <div className="p-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Places</h1>
          <button onClick={startNew} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg">
            + New Place
          </button>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-100">
            {places.map((place) => (
              <button
                key={place.id}
                onClick={() => selectPlace(place)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${selectedId === place.id ? "bg-blue-50" : ""}`}
              >
                <div className="font-medium text-sm text-gray-900">{place.name}</div>
                <div className="text-xs text-gray-500">{place.city} · {place.category?.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        {selectedId ? (
          <form onSubmit={save} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <h2 className="font-bold text-gray-900">{selectedId === "__new__" ? "New Place" : "Edit Place"}</h2>
            {message && <div className="text-xs text-blue-600">{message}</div>}
            {selectedId === "__new__" && (
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="ID (e.g. tb-99)"
                value={form.id ?? ""}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                required
              />
            )}
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Name" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="City" value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            <div className="grid grid-cols-2 gap-3">
              <select className="border rounded-lg px-3 py-2 text-sm" value={form.countryId ?? ""} onChange={(e) => setForm({ ...form, countryId: e.target.value })}>
                {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="border rounded-lg px-3 py-2 text-sm" value={form.categoryId ?? ""} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" step="any" className="border rounded-lg px-3 py-2 text-sm" placeholder="Lat" value={form.lat ?? 0} onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })} />
              <input type="number" step="any" className="border rounded-lg px-3 py-2 text-sm" placeholder="Lng" value={form.lng ?? 0} onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })} />
            </div>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Short description" value={form.shortDescription ?? ""} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={4} placeholder="Full description" value={form.fullDescription ?? ""} onChange={(e) => setForm({ ...form, fullDescription: e.target.value })} />
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Local tips" value={form.localTips ?? ""} onChange={(e) => setForm({ ...form, localTips: e.target.value })} />
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Best visit time" value={form.bestVisitTime ?? ""} onChange={(e) => setForm({ ...form, bestVisitTime: e.target.value })} />
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Tags (comma separated)" value={typeof form.tags === "string" ? parseTags(form.tags) : ""} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
              Published
            </label>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Save Place</button>
          </form>
        ) : (
          <div className="text-sm text-gray-500">Select a place to edit</div>
        )}
      </div>
    </div>
  );
}
