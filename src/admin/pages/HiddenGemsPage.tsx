import { FormEvent, useEffect, useState } from "react";
import { adminFetch, AdminHiddenGem } from "../api";

export default function HiddenGemsPage() {
  const [profiles, setProfiles] = useState<AdminHiddenGem[]>([]);
  const [selected, setSelected] = useState<AdminHiddenGem | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const res = await adminFetch("/hidden-gems");
    const data = (await res.json()) as { profiles: AdminHiddenGem[] };
    setProfiles(data.profiles);
  };

  useEffect(() => { load(); }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const res = await adminFetch(`/places/${selected.placeId}/hidden-gem`, {
      method: "PUT",
      body: JSON.stringify(selected),
    });
    setMessage(res.ok ? "Hidden gem profile saved" : "Save failed");
    await load();
  };

  return (
    <div className="p-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Hidden Gems Editor</h1>
        <div className="bg-white border border-gray-200 rounded-xl divide-y max-h-[70vh] overflow-y-auto">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => setSelected({ ...profile })}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${selected?.id === profile.id ? "bg-blue-50" : ""}`}
            >
              <div className="font-medium text-sm">{profile.place?.name}</div>
              <div className="text-xs text-gray-500">
                Gem {profile.hiddenGemScore} · Tourist {profile.touristScore} · Local {profile.localFavoriteScore}
              </div>
            </button>
          ))}
        </div>
      </div>
      {selected && (
        <form onSubmit={save} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <h2 className="font-bold">{selected.place?.name}</h2>
          <label className="block text-xs text-gray-500">Hidden Gem Score (1-10)</label>
          <input type="number" min={1} max={10} className="w-full border rounded-lg px-3 py-2 text-sm" value={selected.hiddenGemScore} onChange={(e) => setSelected({ ...selected, hiddenGemScore: Number(e.target.value) })} />
          <label className="block text-xs text-gray-500">Tourist Score</label>
          <input type="number" min={1} max={10} className="w-full border rounded-lg px-3 py-2 text-sm" value={selected.touristScore} onChange={(e) => setSelected({ ...selected, touristScore: Number(e.target.value) })} />
          <label className="block text-xs text-gray-500">Local Favorite Score</label>
          <input type="number" min={1} max={10} className="w-full border rounded-lg px-3 py-2 text-sm" value={selected.localFavoriteScore} onChange={(e) => setSelected({ ...selected, localFavoriteScore: Number(e.target.value) })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selected.isHiddenGem} onChange={(e) => setSelected({ ...selected, isHiddenGem: e.target.checked })} />
            Mark as Hidden Gem
          </label>
          <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Editor notes" value={selected.editorNotes ?? ""} onChange={(e) => setSelected({ ...selected, editorNotes: e.target.value })} />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Save Profile</button>
          {message && <div className="text-xs text-blue-600">{message}</div>}
        </form>
      )}
    </div>
  );
}
