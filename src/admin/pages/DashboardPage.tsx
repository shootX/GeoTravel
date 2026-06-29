import { useEffect, useState } from "react";
import { adminFetch, AdminStats } from "../api";

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch("/stats")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load stats");
        const data = (await res.json()) as AdminStats;
        setStats(data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, []);

  const cards = stats
    ? [
        { label: "Places", value: stats.places },
        { label: "Categories", value: stats.categories },
        { label: "Countries", value: stats.countries },
        { label: "Translations", value: stats.translations },
        { label: "Hidden Gems", value: stats.hiddenGems },
        { label: "Route Templates", value: stats.templates },
        { label: "Packages", value: stats.packages },
      ]
    : [];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-8">GeoTravel content management overview</p>

      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="text-xs font-medium text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
