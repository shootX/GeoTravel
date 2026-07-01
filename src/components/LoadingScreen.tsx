import { motion } from "motion/react";
import { Sparkles, MapPin, Loader2 } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-12 select-none relative">
      {/* Background soft glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-teal-100 rounded-full blur-3xl opacity-30 pointer-events-none" />

      <div className="max-w-md w-full bg-white border border-gray-100 shadow-xl rounded-2xl p-8 text-center relative z-10 flex flex-col items-center">
        {/* Animated Map Route Indicator */}
        <div className="w-32 h-32 relative mb-8 flex items-center justify-center bg-gray-55 rounded-2xl border border-dashed border-gray-200 p-2 overflow-hidden">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            {/* Dots Grid */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="5" cy="5" r="1" fill="#cbd5e1" opacity="0.6" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />

            {/* Simulated route path */}
            <motion.path
              d="M 20,80 Q 40,30 80,20"
              fill="none"
              stroke="#0B4A46"
              strokeWidth="2"
              strokeDasharray="6,4"
              initial={{ strokeDashoffset: 40 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ repeat: Infinity, ease: "linear", duration: 2 }}
            />
          </svg>

          {/* Pin 1 (Start) */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], opacity: 1 }}
            transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
            className="absolute bottom-4 left-4"
          >
            <div className="w-6 h-6 rounded-full bg-teal-100 border border-teal-500 flex items-center justify-center shadow-md">
              <MapPin className="w-3.5 h-3.5 text-[#0B4A46]" />
            </div>
          </motion.div>

          {/* Pin 2 (End) */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], opacity: 1 }}
            transition={{ repeat: Infinity, duration: 2, repeatType: "reverse", delay: 0.5 }}
            className="absolute top-4 right-4"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </motion.div>

          {/* Spinner element */}
          <div className="z-10 bg-white/95 backdrop-blur-sm p-3 rounded-full shadow-lg border border-gray-100">
            <Loader2 className="w-8 h-8 text-[#0B4A46] animate-spin" />
          </div>
        </div>

        {/* Text Details */}
        <h3 className="text-xl font-display font-semibold text-gray-900 mb-2">
          Building your perfect day...
        </h3>
        <p className="text-sm text-gray-500 font-sans leading-relaxed max-w-xs">
          Optimizing physical paths, estimating spent times, and selecting key venues.
        </p>

        {/* Progress simulator */}
        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-6">
          <motion.div
            className="bg-[#0B4A46] h-full rounded-full"
            initial={{ width: "10%" }}
            animate={{ width: "95%" }}
            transition={{ duration: 3.5, ease: "easeInOut" }}
          />
        </div>
        <span className="text-[10px] font-mono text-gray-400 mt-2 block uppercase tracking-wider">
          Connecting to Local Guides
        </span>
      </div>
    </div>
  );
}
