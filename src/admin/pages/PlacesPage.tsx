import { FormEvent, useEffect, useState } from "react";
import { adminFetch, AdminCategory, AdminCountry, AdminPlace } from "../api";

function parseTags(raw: string): string {
  try {
    return JSON.parse(raw).join(", ");
  } catch {
    return "";
  }
}

interface PlaceFilters {
  q: string;
  city: string;
  categoryId: string;
  countryId: string;
  published: "" | "true" | "false";
}

const EMPTY_FILTERS: PlaceFilters = {
  q: "",
  city: "",
  categoryId: "",
  countryId: "",
  published: "",
};

function buildPlacesQuery(filters: PlaceFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.city) params.set("city", filters.city);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.countryId) params.set("countryId", filters.countryId);
  if (filters.published) params.set("published", filters.published);
  const query = params.toString();
  return query ? `/places?${query}` : "/places";
}

export default function PlacesPage() {
  const [places, setPlaces] = useState<AdminPlace[]>([]);
  const [countries, setCountries] = useState<AdminCountry[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [filters, setFilters] = useState<PlaceFilters>(EMPTY_FILTERS);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkPatch, setBulkPatch] = useState({
    city: "",
    countryId: "",
    categoryId: "",
    isPublished: "" as "" | "true" | "false",
  });
  const [form, setForm] = useState<Partial<AdminPlace>>({});
  const [message, setMessage] = useState<string | null>(null);

  const allVisibleChecked = places.length > 0 && places.every((p) => checkedIds.has(p.id));

  const loadMeta = async () => {
    const [cRes, catRes, pRes] = await Promise.all([
      adminFetch("/countries"),
      adminFetch("/categories"),
      adminFetch("/places"),
    ]);
    const cData = (await cRes.json()) as { countries: AdminCountry[] };
    const catData = (await catRes.json()) as { categories: AdminCategory[] };
    const pData = (await pRes.json()) as { places: AdminPlace[] };
    setCountries(cData.countries);
    setCategories(catData.categories);
    setCityOptions([...new Set(pData.places.map((p) => p.city).filter(Boolean))].sort());
  };

  const loadPlaces = async (activeFilters: PlaceFilters = filters) => {
    const pRes = await adminFetch(buildPlacesQuery(activeFilters));
    const pData = (await pRes.json()) as { places: AdminPlace[] };
    setPlaces(pData.places);
  };

  const load = async () => {
    await Promise.all([loadMeta(), loadPlaces()]);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPlaces(filters);
    }, 250);
    return () => clearTimeout(timer);
  }, [filters]);

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const hasActiveFilters =
    filters.q || filters.city || filters.categoryId || filters.countryId || filters.published;

  const selectPlace = (place: AdminPlace) => {
    setSelectedId(place.id);
    setBulkEditOpen(false);
    setForm(place);
    setMessage(null);
  };

  const toggleChecked = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allVisibleChecked) {
      setCheckedIds(new Set());
      return;
    }
    setCheckedIds(new Set(places.map((p) => p.id)));
  };

  const openBulkEdit = () => {
    if (checkedIds.size === 0) return;
    if (checkedIds.size === 1) {
      const place = places.find((p) => checkedIds.has(p.id));
      if (place) selectPlace(place);
      return;
    }
    setSelectedId(null);
    setBulkEditOpen(true);
    setBulkPatch({ city: "", countryId: "", categoryId: "", isPublished: "" });
    setMessage(null);
  };

  const bulkDelete = async () => {
    const ids = [...checkedIds];
    if (ids.length === 0) return;
    if (!window.confirm(`წავშალოთ ${ids.length} ადგილი?`)) return;

    const res = await adminFetch("/places/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(data.error || "წაშლა ვერ მოხერხდა");
      return;
    }

    setCheckedIds(new Set());
    if (selectedId && ids.includes(selectedId)) {
      setSelectedId(null);
      setBulkEditOpen(false);
    }
    setMessage(`წაიშალა ${ids.length} ადგილი`);
    await load();
  };

  const applyBulkEdit = async (e: FormEvent) => {
    e.preventDefault();
    const ids = [...checkedIds];
    if (ids.length === 0) return;

    const patch: Record<string, unknown> = {};
    if (bulkPatch.city.trim()) patch.city = bulkPatch.city.trim();
    if (bulkPatch.countryId) patch.countryId = bulkPatch.countryId;
    if (bulkPatch.categoryId) patch.categoryId = bulkPatch.categoryId;
    if (bulkPatch.isPublished) patch.isPublished = bulkPatch.isPublished === "true";

    if (Object.keys(patch).length === 0) {
      setMessage("აირჩიე მაინც ერთი ველი განახლებისთვის");
      return;
    }

    const res = await adminFetch("/places/bulk-update", {
      method: "PUT",
      body: JSON.stringify({ ids, patch }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(data.error || "განახლება ვერ მოხერხდა");
      return;
    }

    const data = (await res.json()) as { updated?: number };
    setMessage(`განახლდა ${data.updated ?? ids.length} ადგილი`);
    setBulkEditOpen(false);
    await load();
  };

  const bulkSetPublished = async (isPublished: boolean) => {
    const ids = [...checkedIds];
    if (ids.length === 0) return;

    const res = await adminFetch("/places/bulk-update", {
      method: "PUT",
      body: JSON.stringify({ ids, patch: { isPublished } }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(data.error || "სტატუსის შეცვლა ვერ მოხერხდა");
      return;
    }

    const data = (await res.json()) as { updated?: number };
    setMessage(
      isPublished
        ? `გამოქვეყნდა ${data.updated ?? ids.length} ადგილი`
        : `დაუმალა ${data.updated ?? ids.length} ადგილი`
    );
    await load();
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

        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="ძებნა (სახელი, ID, ქალაქი)"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              className="border rounded-lg px-3 py-2 text-sm"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            >
              <option value="">ყველა ქალაქი</option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <select
              className="border rounded-lg px-3 py-2 text-sm"
              value={filters.categoryId}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            >
              <option value="">ყველა კატეგორია</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className="border rounded-lg px-3 py-2 text-sm"
              value={filters.countryId}
              onChange={(e) => setFilters({ ...filters, countryId: e.target.value })}
            >
              <option value="">ყველა ქვეყანა</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className="border rounded-lg px-3 py-2 text-sm"
              value={filters.published}
              onChange={(e) => setFilters({ ...filters, published: e.target.value as PlaceFilters["published"] })}
            >
              <option value="">ყველა სტატუსი</option>
              <option value="true">Published</option>
              <option value="false">Draft</option>
            </select>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{places.length} შედეგი</span>
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="text-blue-600 font-semibold">
                ფილტრის გასუფთავება
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between gap-2 bg-gray-50">
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={allVisibleChecked} onChange={toggleSelectAll} />
              ყველას მონიშვნა
            </label>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => bulkSetPublished(true)}
                disabled={checkedIds.size === 0}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-green-50 text-green-700 disabled:opacity-40"
              >
                Public
              </button>
              <button
                type="button"
                onClick={() => bulkSetPublished(false)}
                disabled={checkedIds.size === 0}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 disabled:opacity-40"
              >
                Unpublic
              </button>
              <button
                type="button"
                onClick={openBulkEdit}
                disabled={checkedIds.size === 0}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 disabled:opacity-40"
              >
                რედაქტირება ({checkedIds.size})
              </button>
              <button
                type="button"
                onClick={bulkDelete}
                disabled={checkedIds.size === 0}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-50 text-red-700 disabled:opacity-40"
              >
                წაშლა ({checkedIds.size})
              </button>
            </div>
          </div>
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-100">
            {places.length === 0 ? (
              <div className="px-4 py-8 text-sm text-gray-500 text-center">შედეგი არ მოიძებნა</div>
            ) : (
              places.map((place) => (
              <div
                key={place.id}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 ${selectedId === place.id ? "bg-blue-50" : ""}`}
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={checkedIds.has(place.id)}
                  onChange={() => toggleChecked(place.id)}
                />
                <button
                  type="button"
                  onClick={() => selectPlace(place)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="font-medium text-sm text-gray-900">{place.name}</div>
                  <div className="text-xs text-gray-500">
                    {place.city} · {place.category?.name}
                    {!place.isPublished && <span className="ml-2 text-amber-600">Draft</span>}
                  </div>
                </button>
              </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div>
        {bulkEditOpen ? (
          <form onSubmit={applyBulkEdit} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <h2 className="font-bold text-gray-900">მასობრივი რედაქტირება ({checkedIds.size})</h2>
            {message && <div className="text-xs text-blue-600">{message}</div>}
            <p className="text-xs text-gray-500">შეავსე მხოლოდ ის ველები, რაც გინდა შეიცვალოს ყველა მონიშნულზე.</p>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="ქალაქი (არასავალდებულო)"
              value={bulkPatch.city}
              onChange={(e) => setBulkPatch({ ...bulkPatch, city: e.target.value })}
            />
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={bulkPatch.countryId}
              onChange={(e) => setBulkPatch({ ...bulkPatch, countryId: e.target.value })}
            >
              <option value="">— ქვეყანა უცვლელი —</option>
              {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={bulkPatch.categoryId}
              onChange={(e) => setBulkPatch({ ...bulkPatch, categoryId: e.target.value })}
            >
              <option value="">— კატეგორია უცვლელი —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={bulkPatch.isPublished}
              onChange={(e) => setBulkPatch({ ...bulkPatch, isPublished: e.target.value as typeof bulkPatch.isPublished })}
            >
              <option value="">— სტატუსი უცვლელი —</option>
              <option value="true">Published</option>
              <option value="false">Draft</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">
                გამოყენება
              </button>
              <button
                type="button"
                onClick={() => setBulkEditOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold"
              >
                გაუქმება
              </button>
            </div>
          </form>
        ) : selectedId ? (
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
