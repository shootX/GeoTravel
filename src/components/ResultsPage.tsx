import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TravelPlan } from "../types";
import {
  RefreshCw, Navigation,
  Map as MapIcon, Info, CheckCircle, SlidersHorizontal, Eye, EyeOff
} from "lucide-react";
import RouteMap from "./RouteMap";

interface ResultsPageProps {
  plan: TravelPlan;
  onChangePreferences: () => void;
  onRegenerate: () => void;
}

function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = minutes / 60;
    return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
  }
  return `${minutes}m`;
}

export default function ResultsPage({
  plan,
  onChangePreferences,
  onRegenerate,
}: ResultsPageProps) {
  const [selectedStopIndex, setSelectedStopIndex] = useState<number>(0);
  const [simplifyMode, setSimplifyMode] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const activeStop = useMemo(() => {
    return plan.stops[selectedStopIndex] ?? plan.stops[0];
  }, [plan.stops, selectedStopIndex]);

  const handleCopyItinerary = () => {
    const textToCopy = plan.stops
      .map(
        (stop) =>
          `[${stop.startTime}] ${stop.name} (${formatDuration(stop.duration)})\n- ${stop.description}`
      )
      .join("\n\n");

    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#F9FAFB] text-[#111827] overflow-hidden select-none min-h-0 h-[calc(100vh-4rem)]">
      <div className="w-full md:w-[55%] relative overflow-hidden flex flex-col min-h-[350px] h-[350px] md:h-auto md:flex-1 md:min-h-0 border-b md:border-b-0 md:border-r border-gray-100">
        <div className="absolute inset-0 z-0">
          <RouteMap
            plan={plan}
            selectedStopIndex={selectedStopIndex}
            onStopSelect={setSelectedStopIndex}
          />
        </div>

        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
          <div className="bg-white px-4 py-2.5 rounded-xl shadow-lg border border-gray-100 flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            <div>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">Active Target</span>
              <span className="text-sm font-semibold text-gray-800">{plan.city}</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
          <AnimatePresence mode="wait">
            {activeStop && (
              <motion.div
                key={selectedStopIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <Navigation className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        STOP {selectedStopIndex + 1}
                      </span>
                      <h4 className="font-display font-semibold text-sm text-gray-900">{activeStop.name}</h4>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{activeStop.description}</p>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] font-mono text-gray-400 block uppercase">Estimated Stay</span>
                  <span className="text-sm font-semibold text-gray-800">{formatDuration(activeStop.duration)}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="absolute right-4 top-4 bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg border border-gray-200 text-[11px] text-gray-600 flex items-center gap-2 shadow-sm pointer-events-none">
          <MapIcon className="w-3.5 h-3.5 text-gray-500" />
          <span>Click pins to focus route stops</span>
        </div>
      </div>

      <div className="w-full md:w-[45%] bg-white flex flex-col h-[calc(100vh-350px)] md:h-full">
        <div className="p-6 pb-4 border-b border-gray-100 flex justify-between items-start gap-3 shrink-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-semibold text-gray-900 tracking-tight">
              {plan.title}
            </h1>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-sm">{plan.routeSummary}</p>
          </div>
          <button
            onClick={onChangePreferences}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200/50"
            title="Change preferences"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-2 bg-gray-55/60 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Layout:</span>
            <button
              id="btn-simplify-plan"
              onClick={() => setSimplifyMode(!simplifyMode)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-sans font-medium transition-all cursor-pointer ${
                simplifyMode
                  ? "bg-blue-50 text-blue-600 border border-blue-100"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {simplifyMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {simplifyMode ? "Detailed Plan" : "Simplify Plan"}
            </button>
          </div>

          <button
            onClick={handleCopyItinerary}
            className="text-[11px] font-sans font-medium text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1"
          >
            {isCopied ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <Info className="w-3 h-3" />}
            {isCopied ? "Copied!" : "Copy plan text"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="relative pl-6">
            <div className="absolute left-[7px] top-4 bottom-4 w-[2px] bg-gray-100" />

            {plan.stops.map((stop, index) => {
              const isActive = selectedStopIndex === index;
              const activityColors: Record<string, string> = {
                history: "bg-amber-50 text-amber-600 border-amber-100",
                nature: "bg-green-50 text-green-600 border-green-100",
                food: "bg-rose-50 text-rose-600 border-rose-100",
                culture: "bg-purple-50 text-purple-600 border-purple-100",
                viewpoint: "bg-sky-50 text-sky-600 border-sky-100",
                mixed: "bg-blue-50 text-blue-600 border-blue-100",
              };
              const badgeStyle = activityColors[stop.category] || activityColors.mixed;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedStopIndex(index)}
                  className={`relative mb-8 last:mb-2 group transition-all p-3 rounded-xl border cursor-pointer ${
                    isActive
                      ? "bg-blue-55/40 border-blue-200/50"
                      : "bg-transparent border-transparent hover:bg-gray-55/40"
                  }`}
                >
                  <div
                    className={`absolute -left-[24px] top-4 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                      isActive
                        ? "bg-blue-600 border-white scale-110 shadow-md ring-2 ring-blue-500/10"
                        : "bg-white border-gray-300 group-hover:border-gray-500"
                    }`}
                  >
                    {isActive && <div className="w-1 h-1 bg-white rounded-full" />}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md uppercase">
                        {stop.startTime}
                      </span>
                      <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md uppercase ${badgeStyle}`}>
                        {stop.category}
                      </span>
                    </div>

                    <span className="text-xs font-sans font-medium text-gray-400">
                      Duration: {formatDuration(stop.duration)}
                    </span>
                  </div>

                  <h3 className="font-display font-semibold text-base text-gray-900 group-hover:text-blue-600 transition-colors">
                    {stop.name}
                  </h3>

                  {!simplifyMode && (
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed font-sans">{stop.description}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-gray-55 border-t border-gray-100 grid grid-cols-2 gap-3 shrink-0">
          <button
            id="btn-regenerate-plan"
            onClick={onRegenerate}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-200 hover:border-gray-300 rounded-xl font-sans font-medium text-xs md:text-sm text-gray-700 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
            Regenerate Plan
          </button>

          <button
            onClick={onChangePreferences}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-sans font-semibold text-xs md:text-sm transition-all shadow-md shadow-blue-100 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Change Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
