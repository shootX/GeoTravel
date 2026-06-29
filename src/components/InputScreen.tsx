import { useState, FormEvent } from "react";
import { motion } from "motion/react";
import { TravelPreferences } from "../types";
import { MapPin, Clock, Footprints, Car, Layers, Compass, Landmark, TreePine, Utensils, Sparkles } from "lucide-react";

interface InputScreenProps {
  onSubmit: (preferences: TravelPreferences) => void;
  initialPreferences?: TravelPreferences;
}

export default function InputScreen({ onSubmit, initialPreferences }: InputScreenProps) {
  const [city, setCity] = useState(initialPreferences?.city || "Tbilisi");
  const [timeLimit, setTimeLimit] = useState<string>(initialPreferences?.timeLimit || "4h");
  const [transport, setTransport] = useState<'walk' | 'car' | 'mixed'>(initialPreferences?.transport || "walk");
  const [interests, setInterests] = useState<string[]>(initialPreferences?.interests || ["mixed"]);

  // Quick select cities
  const POPULAR_CITIES = ["Tbilisi", "Paris", "Rome", "Tokyo", "New York"];

  const handleInterestToggle = (category: string) => {
    if (category === "mixed") {
      setInterests(["mixed"]);
      return;
    }

    let updated = [...interests].filter(item => item !== "mixed");
    if (updated.includes(category)) {
      updated = updated.filter(item => item !== category);
      // Fallback if none selected
      if (updated.length === 0) {
        updated = ["mixed"];
      }
    } else {
      updated.push(category);
    }
    setInterests(updated);
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;
    onSubmit({
      city: city.trim(),
      timeLimit,
      transport,
      interests,
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 select-none">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl border border-neutral-100 shadow-xl shadow-neutral-100/50 p-6 md:p-8"
      >
        {/* Title & Concierge Icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
            <Compass className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-xl text-neutral-900">Plan Your Day</h2>
            <p className="text-sm text-neutral-500 font-sans">Our smart travel guide optimizes your time perfectly.</p>
          </div>
        </div>

        {/* Live Sentence Preview (The Smart Assistant Touch) */}
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100/80 mb-8 text-neutral-700 font-sans leading-relaxed text-sm md:text-base">
          <span className="text-neutral-400 text-xs font-mono block mb-1 uppercase tracking-wider">Plan Preview</span>
          I want to explore <span className="text-sky-600 font-semibold underline decoration-2 underline-offset-4 decoration-sky-300">{city || "anywhere"}</span> in{" "}
          <span className="text-sky-600 font-semibold underline decoration-2 underline-offset-4 decoration-sky-300">
            {timeLimit === "2h" ? "2 hours" : timeLimit === "4h" ? "4 hours" : timeLimit === "6h" ? "6 hours" : "1 full day"}
          </span>{" "}
          by{" "}
          <span className="text-sky-600 font-semibold underline decoration-2 underline-offset-4 decoration-sky-300">
            {transport === "walk" ? "walking" : transport === "car" ? "car/taxi" : "mixed transport"}
          </span>
          , focusing on{" "}
          <span className="text-sky-600 font-semibold underline decoration-2 underline-offset-4 decoration-sky-300">
            {interests.join(" & ")}
          </span>
          .
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* City Input */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2 font-display">Where are you exploring?</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                id="input-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city (e.g. Tbilisi, Paris...)"
                className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl font-sans text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all shadow-inner text-sm md:text-base"
                required
              />
            </div>
            {/* Quick city suggestions */}
            <div className="flex flex-wrap gap-2 mt-2">
              {POPULAR_CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCity(c)}
                  className={`px-3 py-1 rounded-full text-xs font-sans transition-all border ${
                    city.toLowerCase() === c.toLowerCase()
                      ? "bg-sky-50 border-sky-200 text-sky-700 font-medium"
                      : "bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2 font-display">How much time do you have?</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { value: "2h", label: "2 Hours", desc: "Quick Sprint" },
                { value: "4h", label: "4 Hours", desc: "Half Day" },
                { value: "6h", label: "6 Hours", desc: "Deep Dive" },
                { value: "1day", label: "1 Day", desc: "Full Day" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTimeLimit(opt.value)}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                    timeLimit === opt.value
                      ? "bg-sky-55 border-sky-500 text-sky-700 ring-2 ring-sky-500/10"
                      : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100/50"
                  }`}
                >
                  <Clock className={`w-4 h-4 ${timeLimit === opt.value ? "text-sky-600" : "text-neutral-400"}`} />
                  <span className="font-sans font-semibold text-sm">{opt.label}</span>
                  <span className="text-[10px] text-neutral-400 font-sans">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Transport Selector */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2 font-display">How will you move around?</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "walk", label: "Walk", icon: Footprints, desc: "On Foot" },
                { value: "car", label: "Car", icon: Car, desc: "Cab / Taxi" },
                { value: "mixed", label: "Mixed", icon: Layers, desc: "Multi-transit" },
              ].map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTransport(opt.value as any)}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      transport === opt.value
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/10"
                        : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100/50"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${transport === opt.value ? "text-emerald-600" : "text-neutral-400"}`} />
                    <span className="font-sans font-medium text-xs md:text-sm">{opt.label}</span>
                    <span className="text-[10px] text-neutral-400 font-sans hidden sm:block">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interest Selector */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2 font-display">What are you interested in?</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "history", label: "History", icon: Landmark, color: "text-amber-600 bg-amber-50 border-amber-200" },
                { value: "nature", label: "Nature", icon: TreePine, color: "text-green-600 bg-green-50 border-green-200" },
                { value: "food", label: "Food & Wine", icon: Utensils, color: "text-rose-600 bg-rose-50 border-rose-200" },
                { value: "mixed", label: "Mixed (Best of All)", icon: Sparkles, color: "text-purple-600 bg-purple-50 border-purple-200" },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = interests.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleInterestToggle(opt.value)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      isSelected
                        ? `border-neutral-800 bg-neutral-900 text-white shadow-md shadow-neutral-900/10`
                        : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100/50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? "bg-neutral-800" : opt.color.split(" ")[1]}`}>
                      <Icon className={`w-4 h-4 ${isSelected ? "text-white" : opt.color.split(" ")[0]}`} />
                    </div>
                    <div>
                      <span className="font-sans font-medium text-xs md:text-sm block">{opt.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            id="btn-generate-plan"
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 mt-4 bg-neutral-900 hover:bg-neutral-800 text-white font-sans font-semibold text-base rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-neutral-900/10 cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-sky-400" />
            Generate My Plan
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
