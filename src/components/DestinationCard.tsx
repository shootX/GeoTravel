import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { formatPrice } from "../lib/format";

export interface DestinationCardData {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  price?: number | null;
  currency?: string;
  isTrending?: boolean;
}

interface DestinationCardProps {
  destination: DestinationCardData;
  tall?: boolean;
  showSubtitle?: boolean;
}

export default function DestinationCard({ destination, tall = true, showSubtitle = false }: DestinationCardProps) {
  const [liked, setLiked] = useState(false);
  const priceLabel = formatPrice(destination.price, destination.currency);
  const height = tall ? "h-72" : "h-80";

  return (
    <Link
      to={`/destinations/${destination.id}`}
      className={`group relative ${height} rounded-2xl overflow-hidden block`}
    >
      <img
        src={destination.imageUrl}
        alt={destination.title}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      {destination.isTrending && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5">
          <span className="text-orange-500 text-xs">🔥</span>
          <span className="text-xs font-bold text-gray-900">Trending</span>
        </div>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setLiked((v) => !v);
        }}
        className={`absolute top-4 right-4 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-colors ${
          liked ? "bg-red-500 text-white" : "bg-white/20 text-white hover:bg-white/40"
        }`}
      >
        <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
      </button>
      <div className="absolute bottom-4 left-4 right-4">
        <h3 className="text-white font-bold text-xl mb-1">{destination.title}</h3>
        {showSubtitle && destination.subtitle && (
          <p className="text-white/90 text-sm mb-1">{destination.subtitle}</p>
        )}
        {priceLabel && (
          <p className="text-teal-300 text-sm font-medium">{priceLabel}</p>
        )}
      </div>
    </Link>
  );
}
