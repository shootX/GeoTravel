import { useState, useEffect, FormEvent } from "react";
import { adminFetch } from "../api";

interface AdminDestination {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  price: number | null;
  currency: string;
  isTrending: boolean;
  sortOrder: number;
  isPublished: boolean;
}

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<AdminDestination[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<AdminDestination>>({});
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const res = await adminFetch("/destinations");
    const data = await res.json();
    setDestinations(data.destinations || []);
  };

  useEffect(() => {
    load();
  }, []);

  const selectDestination = (dest: AdminDestination) => {
    setSelectedId(dest.id);
    setForm(dest);
    setMessage(null);
  };

  const startNew = () => {
    setSelectedId("__new__");
    setForm({
      title: "",
      subtitle: "",
      imageUrl: "",
      currency: "USD",
      isTrending: false,
      isPublished: true,
      sortOrder: 0,
    });
    setMessage(null);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const isNew = selectedId === "__new__";
    const method = isNew ? "POST" : "PUT";
    const url = isNew ? "/destinations" : `/destinations/${selectedId}`;

    const res = await adminFetch(url, {
      method,
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      setMessage("Failed to save destination");
      return;
    }

    setMessage("Saved successfully");
    if (isNew) {
      const data = await res.json();
      setSelectedId(data.destination.id);
    }
    load();
  };

  const remove = async () => {
    if (!selectedId || selectedId === "__new__") return;
    if (!window.confirm("Are you sure you want to delete this destination?")) return;

    await adminFetch(`/destinations/${selectedId}`, { method: "DELETE" });
    setSelectedId(null);
    load();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Destinations</h1>
          <button
            onClick={startNew}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
          >
            + New
          </button>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          {destinations.map((dest) => (
            <button
              key={dest.id}
              onClick={() => selectDestination(dest)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 ${
                selectedId === dest.id ? "bg-blue-50" : ""
              }`}
            >
              {dest.imageUrl && (
                <img src={dest.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 truncate">{dest.title}</div>
                <div className="text-xs text-gray-500 truncate">{dest.subtitle || "No subtitle"}</div>
              </div>
            </button>
          ))}
          {destinations.length === 0 && (
            <div className="p-4 text-sm text-gray-500 text-center">No destinations found.</div>
          )}
        </div>
      </div>

      <div className="md:col-span-2">
        {selectedId ? (
          <form onSubmit={save} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h2 className="font-bold text-gray-900">
              {selectedId === "__new__" ? "New Destination" : "Edit Destination"}
            </h2>
            {message && <div className="text-sm text-blue-600 font-medium">{message}</div>}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                <input
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.title || ""}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subtitle</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.subtitle || ""}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Image URL</label>
              <input
                required
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.imageUrl || ""}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
              {form.imageUrl && (
                <img src={form.imageUrl} alt="Preview" className="mt-2 h-32 rounded-lg object-cover" />
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.price || ""}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.currency || "USD"}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sort Order</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.sortOrder || 0}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isTrending || false}
                  onChange={(e) => setForm({ ...form, isTrending: e.target.checked })}
                />
                Is Trending (🔥)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isPublished ?? true}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                />
                Published
              </label>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">
                Save Destination
              </button>
              {selectedId !== "__new__" && (
                <button
                  type="button"
                  onClick={remove}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-semibold"
                >
                  Delete
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
            Select a destination to edit or create a new one.
          </div>
        )}
      </div>
    </div>
  );
}
