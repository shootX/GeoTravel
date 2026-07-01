import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";

interface RouteTemplate {
  id: string;
  name: string;
  slug: string;
  city: string;
  description: string | null;
  transport: string;
  timeLimit: string;
}

export default function PublicCustomRoutesPage() {
  const [routes, setRoutes] = useState<RouteTemplate[]>([]);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await apiFetch("/api/public/routes");
        if (res.ok) {
          const data = await res.json();
          setRoutes(data.routes || []);
        }
      } catch (err) {
        console.error("Failed to fetch routes", err);
      }
    };
    fetchRoutes();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Custom Routes</h1>
      <p className="text-gray-600 mb-12 max-w-2xl">
        Explore pre-planned routes crafted by our experts. Perfect for a quick city tour or a full day of exploration.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {routes.length > 0 ? (
          routes.map((route) => (
            <div key={route.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                  <span className="text-teal-600 text-lg">🗺️</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight">{route.name}</h3>
                  <p className="text-xs text-gray-500">{route.city}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-md capitalize">
                  {route.transport}
                </span>
                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-md">
                  {route.timeLimit}
                </span>
              </div>

              <p className="text-gray-600 text-sm line-clamp-3 mb-6 flex-1">
                {route.description || "A beautiful route through the city."}
              </p>

              <button className="w-full py-2.5 bg-[#0B4A46] hover:bg-[#083a37] text-white font-semibold rounded-xl transition-colors">
                Try this route
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-gray-500 text-lg">
            No custom routes available at the moment.
          </div>
        )}
      </div>
    </div>
  );
}
