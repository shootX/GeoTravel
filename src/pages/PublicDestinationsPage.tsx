import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import DestinationCard, { DestinationCardData } from "../components/DestinationCard";

export default function PublicDestinationsPage() {
  const [destinations, setDestinations] = useState<DestinationCardData[]>([]);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const res = await apiFetch("/api/public/destinations");
        if (res.ok) {
          const data = await res.json();
          setDestinations(data.destinations || []);
        }
      } catch (err) {
        console.error("Failed to fetch destinations", err);
      }
    };
    fetchDestinations();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">All Destinations</h1>
      <p className="text-gray-600 mb-12 max-w-2xl">
        Explore our complete list of handpicked destinations across Georgia.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {destinations.length > 0 ? (
          destinations.map((dest) => (
            <DestinationCard key={dest.id} destination={dest} tall={false} showSubtitle />
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-gray-500 text-lg">
            No destinations available at the moment.
          </div>
        )}
      </div>
    </div>
  );
}
