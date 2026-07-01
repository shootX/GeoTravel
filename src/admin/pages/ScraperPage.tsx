import { FormEvent, useState } from "react";
import { adminFetch } from "../api";

type ScraperField = "name" | "description" | "category" | "location" | "photo";

interface ScrapedItem {
  id: string;
  tripadvisorId: string;
  name: string;
  description: string;
  category: string;
  suggestedCategorySlug: string;
  location: string;
  city: string;
  country: string;
  lat: number | null;
  lng: number | null;
  photoUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  ranking: string | null;
  sourceUrl: string;
}

const DEFAULT_URL =
  "https://www.tripadvisor.com/Attractions-g294194-Activities-Georgia.html";

const FIELD_LABELS: Record<ScraperField, string> = {
  name: "დასახელება",
  description: "აღწერა",
  category: "კატეგორია",
  location: "ლოკაცია",
  photo: "ფოტო",
};

export default function ScraperPage() {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [fields, setFields] = useState<Set<ScraperField>>(
    new Set(["name", "description", "category", "location", "photo"])
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<ScrapedItem[]>([]);
  const [pageTitle, setPageTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const toggleField = (field: ScraperField) => {
    setFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  const toggleItem = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const scrape = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await adminFetch("/scraper/tripadvisor", {
        method: "POST",
        body: JSON.stringify({ url, fetchDetails: true, maxItems: 30 }),
      });
      const data = (await res.json()) as {
        error?: string;
        items?: ScrapedItem[];
        pageTitle?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Scrape failed");
      setItems(data.items ?? []);
      setPageTitle(data.pageTitle ?? null);
      setSelected(new Set((data.items ?? []).map((i) => i.id)));
      setMessage(`ნაპოვნია ${data.items?.length ?? 0} ადგილი`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "შეცდომა");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const importSelected = async () => {
    const toImport = items.filter((i) => selected.has(i.id));
    if (toImport.length === 0) {
      setMessage("აირჩიე მაინც ერთი ადგილი");
      return;
    }

    setImporting(true);
    setMessage(null);
    try {
      const res = await adminFetch("/scraper/tripadvisor/import", {
        method: "POST",
        body: JSON.stringify({
          fields: [...fields],
          items: toImport.map((item) => ({
            id: item.id,
            tripadvisorId: item.tripadvisorId,
            name: fields.has("name") ? item.name : item.id,
            description: fields.has("description") ? item.description : "",
            category: fields.has("category") ? item.category : "",
            categorySlug: fields.has("category") ? item.suggestedCategorySlug : "culture",
            city: fields.has("location") ? item.city : "Tbilisi",
            country: item.country,
            countryCode: item.country === "Georgia" ? "GE" : undefined,
            lat: fields.has("location") ? item.lat : 0,
            lng: fields.has("location") ? item.lng : 0,
            photoUrl: fields.has("photo") ? item.photoUrl : null,
            rating: item.rating,
          })),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        created?: string[];
        skipped?: string[];
        errors?: Array<{ id: string; error: string }>;
      };
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      const parts = [
        data.created?.length ? `შექმნილი: ${data.created.length}` : null,
        data.skipped?.length ? `გამოტოვებული: ${data.skipped.length}` : null,
        data.errors?.length ? `შეცდომა: ${data.errors.length}` : null,
      ].filter(Boolean);
      setMessage(parts.join(" · ") || "დასრულდა");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "იმპორტი ვერ მოხერხდა");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">TripAdvisor Scraper</h1>
      <p className="text-sm text-gray-500 mb-6">ლინკის ჩაგდება → ინფორმაციის ამოღება → იმპორტი Places-ში</p>

      <form onSubmit={scrape} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">TripAdvisor URL</label>
          <input
            className="border rounded-lg px-3 py-2 text-sm w-full"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.tripadvisor.com/Attractions-..."
            required
          />
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-2">რა ველები გამოვიტანოთ / იმპორტში ჩავრთოთ</div>
          <div className="flex flex-wrap gap-3">
            {(Object.keys(FIELD_LABELS) as ScraperField[]).map((field) => (
              <label key={field} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={fields.has(field)}
                  onChange={() => toggleField(field)}
                />
                {FIELD_LABELS[field]}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded-lg text-sm font-semibold px-4 py-2 disabled:opacity-60"
        >
          {loading ? "იტვირთება..." : "სკრაპინგი"}
        </button>
      </form>

      {message && <div className="text-sm text-blue-600 mb-4">{message}</div>}
      {pageTitle && <div className="text-xs text-gray-500 mb-4">{pageTitle}</div>}

      {items.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-800">{items.length} შედეგი</div>
            <button
              onClick={importSelected}
              disabled={importing || selected.size === 0}
              className="bg-green-600 text-white rounded-lg text-sm font-semibold px-4 py-2 disabled:opacity-60"
            >
              {importing ? "იმპორტი..." : `იმპორტი (${selected.size})`}
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected.has(item.id)}
                  onChange={() => toggleItem(item.id)}
                />
                {fields.has("photo") && item.photoUrl && (
                  <img
                    src={item.photoUrl}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg shrink-0 bg-gray-100"
                  />
                )}
                <div className="min-w-0 flex-1">
                  {fields.has("name") && (
                    <div className="font-semibold text-gray-900">{item.name}</div>
                  )}
                  <div className="text-xs text-gray-400 mb-2">{item.id}</div>
                  {fields.has("category") && (
                    <div className="text-xs text-gray-600 mb-1">
                      {item.category} → <span className="text-blue-600">{item.suggestedCategorySlug}</span>
                    </div>
                  )}
                  {fields.has("location") && (
                    <div className="text-xs text-gray-600 mb-1">
                      {item.location}
                      {item.lat != null && item.lng != null && (
                        <span className="text-gray-400"> ({item.lat.toFixed(4)}, {item.lng.toFixed(4)})</span>
                      )}
                    </div>
                  )}
                  {fields.has("description") && item.description && (
                    <p className="text-sm text-gray-700 mt-2 line-clamp-3">{item.description}</p>
                  )}
                  {item.rating != null && (
                    <div className="text-xs text-amber-600 mt-1">
                      ★ {item.rating} {item.reviewCount ? `(${item.reviewCount} reviews)` : ""}
                    </div>
                  )}
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-500 hover:underline mt-2 inline-block"
                  >
                    TripAdvisor →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
