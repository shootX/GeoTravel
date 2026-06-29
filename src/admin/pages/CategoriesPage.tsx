import { FormEvent, useEffect, useState } from "react";
import { adminFetch, AdminCategory } from "../api";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [form, setForm] = useState({ slug: "", name: "", sortOrder: 0, isActive: true });
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const res = await adminFetch("/categories");
    const data = (await res.json()) as { categories: AdminCategory[] };
    setCategories(data.categories);
  };

  useEffect(() => { load(); }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const res = await adminFetch("/categories", { method: "POST", body: JSON.stringify(form) });
    if (!res.ok) {
      setMessage("Save failed");
      return;
    }
    setForm({ slug: "", name: "", sortOrder: 0, isActive: true });
    setMessage("Category created");
    await load();
  };

  const toggle = async (cat: AdminCategory) => {
    await adminFetch(`/categories/${cat.id}`, {
      method: "PUT",
      body: JSON.stringify({ isActive: !cat.isActive }),
    });
    await load();
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Categories</h1>
      <form onSubmit={save} className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-2 gap-3 mb-6">
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input type="number" className="border rounded-lg px-3 py-2 text-sm" placeholder="Sort order" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
        <button type="submit" className="bg-blue-600 text-white rounded-lg text-sm font-semibold">Add Category</button>
      </form>
      {message && <div className="text-xs text-blue-600 mb-4">{message}</div>}
      <div className="bg-white border border-gray-200 rounded-xl divide-y">
        {categories.map((cat) => (
          <div key={cat.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">{cat.name}</div>
              <div className="text-xs text-gray-500">{cat.slug}</div>
            </div>
            <button onClick={() => toggle(cat)} className={`text-xs font-semibold px-2 py-1 rounded ${cat.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {cat.isActive ? "Active" : "Inactive"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
