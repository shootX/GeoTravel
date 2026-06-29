import { FormEvent, useEffect, useState } from "react";
import { adminFetch, AdminCountry } from "../api";

export default function CountriesPage() {
  const [countries, setCountries] = useState<AdminCountry[]>([]);
  const [form, setForm] = useState({ code: "", name: "", sortOrder: 0, isActive: true });
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const res = await adminFetch("/countries");
    const data = (await res.json()) as { countries: AdminCountry[] };
    setCountries(data.countries);
  };

  useEffect(() => { load(); }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const res = await adminFetch("/countries", { method: "POST", body: JSON.stringify(form) });
    if (!res.ok) {
      setMessage("Save failed");
      return;
    }
    setForm({ code: "", name: "", sortOrder: 0, isActive: true });
    setMessage("Country created");
    await load();
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Countries</h1>
      <form onSubmit={save} className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-2 gap-3 mb-6">
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Code (GE)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <button type="submit" className="bg-blue-600 text-white rounded-lg text-sm font-semibold col-span-2">Add Country</button>
      </form>
      {message && <div className="text-xs text-blue-600 mb-4">{message}</div>}
      <div className="bg-white border border-gray-200 rounded-xl divide-y">
        {countries.map((country) => (
          <div key={country.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">{country.name}</div>
              <div className="text-xs text-gray-500">{country.code}</div>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded ${country.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {country.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
