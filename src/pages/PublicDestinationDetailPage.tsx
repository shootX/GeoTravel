import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { formatPrice } from "../lib/format";
import SiteFooter from "../components/SiteFooter";

interface Destination {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  price: number | null;
  currency: string;
  isTrending: boolean;
}

export default function PublicDestinationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/public/destinations/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setDestination(data.destination);
      })
      .catch(() => setError("Destination not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24 text-gray-500">Loading...</div>
    );
  }

  if (error || !destination) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-gray-500">{error || "Not found"}</p>
        <Link to="/destinations" className="text-[#0B4A46] font-medium hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to destinations
        </Link>
      </div>
    );
  }

  const priceLabel = formatPrice(destination.price, destination.currency);

  return (
    <>
      <div className="flex-1 w-full">
        <div className="relative h-[40vh] min-h-[280px] max-h-[480px]">
          <img src={destination.imageUrl} alt={destination.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 max-w-4xl">
            {destination.isTrending && (
              <span className="inline-block bg-white/90 text-xs font-bold px-3 py-1 rounded-full mb-3">🔥 Trending</span>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-white">{destination.title}</h1>
            {destination.subtitle && (
              <p className="text-white/90 mt-2 text-lg">{destination.subtitle}</p>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
          <Link to="/destinations" className="text-sm text-[#0B4A46] font-medium hover:underline flex items-center gap-2 mb-8">
            <ArrowLeft className="w-4 h-4" /> All destinations
          </Link>

          {priceLabel && (
            <p className="text-2xl font-bold text-[#0B4A46] mb-6">{priceLabel}</p>
          )}

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 leading-relaxed text-lg">
              {destination.subtitle || `Explore ${destination.title} with GEOTRAVEL — curated routes, local experiences, and unforgettable views across Georgia.`}
            </p>
          </div>

          <div className="mt-10">
            <Link
              to="/"
              className="inline-flex items-center bg-[#0B4A46] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#083a37] transition-colors"
            >
              Plan your trip
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
