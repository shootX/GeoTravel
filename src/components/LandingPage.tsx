import { useState, FormEvent, useEffect } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { MapPin, Calendar, Users, Search, ShieldCheck, Map, Heart, Send, ChevronDown } from "lucide-react";
import { TravelPreferences } from "../types";
import { apiFetch } from "../lib/api";
import DestinationCard, { DestinationCardData } from "./DestinationCard";

interface LandingPageProps {
  onSearch: (preferences: TravelPreferences) => void;
}

export default function LandingPage({ onSearch }: LandingPageProps) {
  const [city, setCity] = useState("");
  const [interests, setInterests] = useState<string>("mixed");
  const [timeLimit, setTimeLimit] = useState<string>("1day");
  const [transport, setTransport] = useState<string>("mixed");
  const [destinations, setDestinations] = useState<DestinationCardData[]>([]);
  const [newsletterMsg, setNewsletterMsg] = useState<string | null>(null);

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

  const handleNewsletter = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = new FormData(form).get("email");
    if (typeof email !== "string" || !email.includes("@")) return;

    try {
      const res = await apiFetch("/api/public/newsletter", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setNewsletterMsg("Thanks for subscribing!");
        form.reset();
      }
    } catch {
      setNewsletterMsg("Something went wrong. Please try again.");
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    onSearch({
      city: city || "Tbilisi",
      timeLimit,
      transport: transport as any,
      interests: [interests],
    });
  };

  return (
    <div className="w-full flex flex-col items-center bg-white font-sans pb-20">
      {/* Hero Section */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-4">
        <div className="relative w-full h-[500px] md:h-[600px] rounded-3xl overflow-hidden">
          {/* Background Image */}
          <img 
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop" 
            alt="Mountains and lake" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          
          {/* Hero Content */}
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 lg:px-24">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-white text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] max-w-2xl"
            >
              Explore the world <br/>
              <span className="font-serif italic text-teal-300 font-normal">your way</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-white/90 text-lg md:text-xl mt-6 max-w-lg leading-relaxed"
            >
              Discover amazing places, unique experiences and create memories that last a lifetime.
            </motion.p>
          </div>

          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[94%] max-w-6xl px-2"
          >
            <form
              onSubmit={handleSearch}
              className="bg-white rounded-2xl md:rounded-full shadow-2xl p-3 md:px-2 md:py-2 grid grid-cols-1 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto] items-stretch md:items-center gap-2 md:gap-0 md:divide-x md:divide-gray-200"
            >
              <div className="flex items-center gap-2.5 px-3 md:px-4 py-2 md:py-3 min-w-0">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0 hidden sm:block" />
                <div className="flex flex-col min-w-0 flex-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none mb-1">Where to?</label>
                  <input
                    type="text"
                    placeholder="Tbilisi, Batumi..."
                    className="text-sm text-gray-800 outline-none placeholder:text-gray-400 w-full bg-transparent truncate"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-3 md:px-4 py-2 md:py-3 min-w-0 relative">
                <Map className="w-4 h-4 text-gray-400 shrink-0 hidden sm:block" />
                <div className="flex flex-col min-w-0 flex-1 pr-5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none mb-1">Travel Type</label>
                  <select
                    className="text-sm text-gray-800 outline-none w-full bg-transparent appearance-none cursor-pointer truncate"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                  >
                    <option value="mixed">Any type</option>
                    <option value="history">History & Culture</option>
                    <option value="nature">Nature & Outdoors</option>
                    <option value="food">Food & Wine</option>
                  </select>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 md:right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="flex items-center gap-2.5 px-3 md:px-4 py-2 md:py-3 min-w-0 relative">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0 hidden sm:block" />
                <div className="flex flex-col min-w-0 flex-1 pr-5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none mb-1">Duration</label>
                  <select
                    className="text-sm text-gray-800 outline-none w-full bg-transparent appearance-none cursor-pointer truncate"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value)}
                  >
                    <option value="1day">1 Day</option>
                    <option value="2h">2 Hours</option>
                    <option value="4h">4 Hours</option>
                    <option value="6h">6 Hours</option>
                  </select>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 md:right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="flex items-center gap-2.5 px-3 md:px-4 py-2 md:py-3 min-w-0 relative">
                <Users className="w-4 h-4 text-gray-400 shrink-0 hidden sm:block" />
                <div className="flex flex-col min-w-0 flex-1 pr-5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none mb-1">Transport</label>
                  <select
                    className="text-sm text-gray-800 outline-none w-full bg-transparent appearance-none cursor-pointer truncate"
                    value={transport}
                    onChange={(e) => setTransport(e.target.value)}
                  >
                    <option value="mixed">Any</option>
                    <option value="walk">Walking</option>
                    <option value="car">Car / Taxi</option>
                  </select>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 md:right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="px-2 py-1 md:py-0 md:pl-2 md:pr-2 flex items-center">
                <button
                  type="submit"
                  className="w-full md:w-auto whitespace-nowrap bg-[#0B4A46] hover:bg-[#083a37] text-white px-6 md:px-7 py-3 md:py-3.5 rounded-xl md:rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-colors shrink-0"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Spacer for the floating search bar */}
      <div className="h-28 md:h-20"></div>

      {/* Features Section */}
      <div className="w-full max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          
          <Link to="/destinations" className="flex items-start gap-4 px-4 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-[#0B4A46]" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Best Destinations</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Handpicked top places just for you</p>
            </div>
          </Link>

          <Link to="/custom-routes" className="flex items-start gap-4 px-4 pt-6 md:pt-0 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
              <Map className="w-6 h-6 text-[#0B4A46]" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Custom Routes</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Plan your perfect trip your way</p>
            </div>
          </Link>

          <Link to="/experiences" className="flex items-start gap-4 px-4 pt-6 md:pt-0 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6 text-[#0B4A46]" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Local Experiences</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Live like a local, feel the real culture</p>
            </div>
          </Link>

          <Link to="/about" className="flex items-start gap-4 px-4 pt-6 md:pt-0 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#0B4A46]" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Secure Booking</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Book with confidence and peace of mind</p>
            </div>
          </Link>

        </div>
      </div>

      {/* Popular Destinations */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Popular Destinations</h2>
          <Link to="/destinations" className="text-sm font-semibold text-[#0B4A46] hover:underline flex items-center gap-1">
            View all <span className="text-lg leading-none">&rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinations.length > 0 ? (
            destinations.slice(0, 4).map((dest) => (
              <DestinationCard key={dest.id} destination={dest} />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              Loading destinations...
            </div>
          )}
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="bg-[#0B4A46] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
            <svg width="300" height="300" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="#FFFFFF" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18,97.4,-2.2C98,13.6,93.2,29.7,83.9,43.4C74.6,57.1,60.8,68.4,45.4,75.4C30,82.4,13,85.1,-3.2,89.5C-19.4,93.9,-34.8,95.6,-48.5,89.7C-62.2,83.8,-74.2,70.3,-82.1,55C-90,39.7,-93.8,22.6,-93.6,6.1C-93.4,-10.4,-89.2,-26.3,-80.5,-39.9C-71.8,-53.5,-58.6,-64.8,-44.3,-71.8C-30,-78.8,-15,-81.5,0.5,-82.4C16,-83.3,30.6,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
            </svg>
          </div>

          <div className="flex items-center gap-6 z-10 w-full md:w-auto">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <Send className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Get travel inspiration and exclusive deals</h2>
              <p className="text-teal-100 text-sm">Subscribe to our newsletter and never miss an adventure.</p>
            </div>
          </div>

          <div className="w-full md:w-auto z-10">
            <form className="flex items-center bg-white rounded-full p-1.5 w-full md:w-96" onSubmit={handleNewsletter}>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 text-sm text-gray-800 outline-none bg-transparent"
                required
              />
              <button
                type="submit"
                className="bg-[#126A65] hover:bg-[#0e524e] text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-colors"
              >
                Subscribe
              </button>
            </form>
            {newsletterMsg && (
              <p className="text-teal-100 text-sm mt-2 text-center md:text-left">{newsletterMsg}</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
