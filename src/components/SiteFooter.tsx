import { Link } from "react-router-dom";
import { MapPin, Globe } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="bg-[#0B4A46] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-7 h-7" fill="currentColor" strokeWidth={1} />
            <span className="font-bold text-lg tracking-wide uppercase">GEOTRAVEL</span>
          </div>
          <p className="text-teal-100 text-sm leading-relaxed max-w-sm">
            Discover amazing places, unique experiences and create memories that last a lifetime.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Explore</h4>
          <ul className="space-y-2 text-sm text-teal-100">
            <li><Link to="/destinations" className="hover:text-white">Destinations</Link></li>
            <li><Link to="/experiences" className="hover:text-white">Experiences</Link></li>
            <li><Link to="/custom-routes" className="hover:text-white">Custom Routes</Link></li>
            <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-teal-100">
            <li><Link to="/about" className="hover:text-white">About Us</Link></li>
            <li><Link to="/" className="hover:text-white">Plan a Trip</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-teal-200">
        © {new Date().getFullYear()} GEOTRAVEL. All rights reserved.
      </div>
    </footer>
  );
}
