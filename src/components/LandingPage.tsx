import { motion } from "motion/react";
import { Compass, ArrowRight, MapPin, Sparkles, Clock } from "lucide-react";

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="relative min-h-[85vh] flex flex-col items-center justify-center px-4 overflow-hidden select-none">
      {/* Ambient background decoration */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-3xl text-center z-10"
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-100/80 mb-8">
          <Sparkles className="w-4 h-4 text-sky-600 animate-pulse" />
          <span className="text-xs font-mono font-medium text-sky-700 tracking-wide uppercase">AI Travel Planner MVP</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl font-display font-semibold text-neutral-900 tracking-tight leading-[1.1] mb-6">
          What should I do <span className="text-sky-600 relative">today?</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-neutral-600 font-sans max-w-xl mx-auto leading-relaxed mb-10">
          Get a personalized, optimized travel itinerary in seconds. Designed for spontaneous explorers who want to decide less and see more.
        </p>

        {/* CTA Button */}
        <motion.button
          id="cta-start-planning"
          onClick={onStart}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-neutral-900 text-white font-sans font-medium text-base shadow-lg shadow-neutral-900/10 hover:bg-neutral-800 transition-colors cursor-pointer group"
        >
          Start Planning
          <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </motion.div>

      {/* Visual feature highlights below */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full mt-20 z-10 border-t border-neutral-100 pt-10"
      >
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left p-4">
          <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-sky-600" />
          </div>
          <h3 className="font-display font-medium text-neutral-800 mb-1">Time Optimized</h3>
          <p className="text-sm text-neutral-500 font-sans">Tell us how many hours you have, and we pack it perfectly.</p>
        </div>

        <div className="flex flex-col items-center sm:items-start text-center sm:text-left p-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
            <Compass className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="font-display font-medium text-neutral-800 mb-1">Zero Overwhelm</h3>
          <p className="text-sm text-neutral-500 font-sans">We give you exactly ONE optimized plan, not a list of 50 links.</p>
        </div>

        <div className="flex flex-col items-center sm:items-start text-center sm:text-left p-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mb-3">
            <MapPin className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="font-display font-medium text-neutral-800 mb-1">Offline-Ready Map</h3>
          <p className="text-sm text-neutral-500 font-sans">Clean, lightweight path indicators perfect for mobile viewing.</p>
        </div>
      </motion.div>
    </div>
  );
}
