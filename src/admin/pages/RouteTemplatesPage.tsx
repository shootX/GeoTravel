import { FormEvent, useEffect, useState } from "react";
import { adminFetch, AdminPlace, AdminRouteTemplate } from "../api";

export default function RouteTemplatesPage() {
  const [templates, setTemplates] = useState<AdminRouteTemplate[]>([]);
  const [places, setPlaces] = useState<AdminPlace[]>([]);
  const [form, setForm] = useState({
    name: "",
    city: "Tbilisi",
    transport: "walk",
    timeLimit: "4h",
    stopPlaceIds: [] as string[],
    isPublished: false,
  });
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const [tRes, pRes] = await Promise.all([adminFetch("/route-templates"), adminFetch("/places")]);
    const tData = (await tRes.json()) as { templates: AdminRouteTemplate[] };
    const pData = (await pRes.json()) as { places: AdminPlace[] };
    setTemplates(tData.templates);
    setPlaces(pData.places.filter((p) => p.city === form.city));
  };

  useEffect(() => { load(); }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const res = await adminFetch("/route-templates", {
      method: "POST",
      body: JSON.stringify({ ...form, interests: ["mixed"] }),
    });
    setMessage(res.ok ? "Template created" : "Save failed");
    if (res.ok) {
      setForm({ name: "", city: "Tbilisi", transport: "walk", timeLimit: "4h", stopPlaceIds: [], isPublished: false });
      await load();
    }
  };

  const toggleStop = (id: string) => {
    setForm((prev) => ({
      ...prev,
      stopPlaceIds: prev.stopPlaceIds.includes(id)
        ? prev.stopPlaceIds.filter((s) => s !== id)
        : [...prev.stopPlaceIds, id],
    }));
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Route Templates</h1>
      <form onSubmit={save} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 mb-6">
        <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Template name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <div className="grid grid-cols-3 gap-3">
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value, stopPlaceIds: [] })} />
          <select className="border rounded-lg px-3 py-2 text-sm" value={form.transport} onChange={(e) => setForm({ ...form, transport: e.target.value })}>
            <option value="walk">Walk</option>
            <option value="car">Car</option>
            <option value="mixed">Mixed</option>
          </select>
          <select className="border rounded-lg px-3 py-2 text-sm" value={form.timeLimit} onChange={(e) => setForm({ ...form, timeLimit: e.target.value })}>
            <option value="2h">2h</option>
            <option value="4h">4h</option>
            <option value="6h">6h</option>
            <option value="1day">1 day</option>
          </select>
        </div>
        <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
          <div className="text-xs font-semibold text-gray-500 mb-2">Stops (in selection order)</div>
          {places.filter((p) => p.city === form.city).map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.stopPlaceIds.includes(p.id)} onChange={() => toggleStop(p.id)} />
              {p.name}
            </label>
          ))}
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Create Template</button>
      </form>
      {message && <div className="text-xs text-blue-600 mb-4">{message}</div>}
      <div className="bg-white border border-gray-200 rounded-xl divide-y">
        {templates.map((t) => (
          <div key={t.id} className="px-4 py-3">
            <div className="font-medium text-sm">{t.name}</div>
            <div className="text-xs text-gray-500">{t.city} · {t.timeLimit} · {t.stopPlaceIds.length} stops · {t.isPublished ? "Published" : "Draft"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
