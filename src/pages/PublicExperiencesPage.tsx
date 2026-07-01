import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";

interface TravelPackage {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  price: number | null;
  currency: string;
  durationDays: number;
}

export default function PublicExperiencesPage() {
  const [packages, setPackages] = useState<TravelPackage[]>([]);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await apiFetch("/api/public/packages");
        if (res.ok) {
          const data = await res.json();
          setPackages(data.packages || []);
        }
      } catch (err) {
        console.error("Failed to fetch packages", err);
      }
    };
    fetchPackages();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Curated Experiences</h1>
      <p className="text-gray-600 mb-12 max-w-2xl">
        Discover our handpicked travel packages designed to give you the best experiences without the hassle of planning.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {packages.length > 0 ? (
          packages.map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col">
              <div className="h-48 bg-teal-50 flex items-center justify-center">
                <span className="text-teal-200 text-4xl">🎒</span>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">{pkg.name}</h3>
                  {pkg.price && (
                    <span className="text-[#0B4A46] font-bold whitespace-nowrap ml-4">
                      {pkg.currency === "USD" ? "$" : pkg.currency}{pkg.price}
                    </span>
                  )}
                </div>
                <p className="text-xs text-teal-600 font-semibold mb-3 uppercase tracking-wider">
                  {pkg.durationDays} {pkg.durationDays === 1 ? "Day" : "Days"} {pkg.city ? `• ${pkg.city}` : ""}
                </p>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
                  {pkg.description || "An amazing travel experience awaits you."}
                </p>
                <button className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-[#0B4A46] font-semibold rounded-xl transition-colors">
                  View Details
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-gray-500 text-lg">
            No experiences available at the moment.
          </div>
        )}
      </div>
    </div>
  );
}
