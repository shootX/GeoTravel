import { FormEvent, useEffect, useState } from "react";
import { adminFetch, AdminPackage, AdminRouteTemplate } from "../api";

export default function PackagesPage() {
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [templates, setTemplates] = useState<AdminRouteTemplate[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    city: "",
    price: "",
    currency: "USD",
    durationDays: 1,
    routeTemplateIds: [] as string[],
    isPublished: false,
  });
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const [pRes, tRes] = await Promise.all([adminFetch("/packages"), adminFetch("/route-templates")]);
    const pData = (await pRes.json()) as { packages: AdminPackage[] };
    const tData = (await tRes.json()) as { templates: AdminRouteTemplate[] };
    setPackages(pData.packages);
    setTemplates(tData.templates);
  };

  useEffect(() => { load(); }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const res = await adminFetch("/packages", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        price: form.price ? Number(form.price) : null,
        highlights: [],
      }),
    });
    setMessage(res.ok ? "Package created" : "Save failed");
    if (res.ok) {
      setForm({ name: "", description: "", city: "", price: "", currency: "USD", durationDays: 1, routeTemplateIds: [], isPublished: false });
      await load();
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Package Builder</h1>
      <form onSubmit={save} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 mb-6">
        <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Package name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-3 gap-3">
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input type="number" className="border rounded-lg px-3 py-2 text-sm" placeholder="Days" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })} />
        </div>
        <div className="border rounded-lg p-3 max-h-32 overflow-y-auto space-y-1">
          <div className="text-xs font-semibold text-gray-500 mb-2">Route templates</div>
          {templates.map((t) => (
            <label key={t.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.routeTemplateIds.includes(t.id)}
                onChange={() =>
                  setForm((prev) => ({
                    ...prev,
                    routeTemplateIds: prev.routeTemplateIds.includes(t.id)
                      ? prev.routeTemplateIds.filter((id) => id !== t.id)
                      : [...prev.routeTemplateIds, t.id],
                  }))
                }
              />
              {t.name} ({t.city})
            </label>
          ))}
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Create Package</button>
      </form>
      {message && <div className="text-xs text-blue-600 mb-4">{message}</div>}
      <div className="bg-white border border-gray-200 rounded-xl divide-y">
        {packages.map((pkg) => (
          <div key={pkg.id} className="px-4 py-3">
            <div className="font-medium text-sm">{pkg.name}</div>
            <div className="text-xs text-gray-500">
              {pkg.durationDays}d · {pkg.routeTemplateIds.length} routes · {pkg.price ? `${pkg.price} ${pkg.currency}` : "No price"} · {pkg.isPublished ? "Published" : "Draft"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
