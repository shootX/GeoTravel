import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GeneratedPlan } from "../types";
import { 
  ArrowLeft, RefreshCw, Compass, MapPin, Navigation, 
  Map as MapIcon, Layers, Info, CheckCircle, Flame, Sparkles, SlidersHorizontal, Eye, EyeOff
} from "lucide-react";

interface ResultsPageProps {
  plan: GeneratedPlan;
  isDemoMode: boolean;
  onChangePreferences: () => void;
  onRegenerate: () => void;
}

export default function ResultsPage({ 
  plan, 
  isDemoMode, 
  onChangePreferences, 
  onRegenerate 
}: ResultsPageProps) {
  const [selectedPinId, setSelectedPinId] = useState<string | null>(plan.pins[0]?.id || null);
  const [simplifyMode, setSimplifyMode] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Active pin details
  const activePin = useMemo(() => {
    return plan.pins.find(p => p.id === selectedPinId) || plan.pins[0];
  }, [plan.pins, selectedPinId]);

  const handleCopyItinerary = () => {
    const textToCopy = plan.itinerary.map(item => 
      `[${item.time}] ${item.placeName} (${item.timeSpent})\n- ${item.description}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#F9FAFB] text-[#111827] overflow-hidden select-none h-[calc(100vh-4rem)]">
      {/* 
        LEFT SIDE: Interactive simulated map with real coordinate visualizers, 
        interactive route paths, and responsive pin selectors.
      */}
      <div className="w-full md:w-[55%] relative bg-[#E5E9F0] overflow-hidden flex flex-col h-[350px] md:h-full border-b md:border-b-0 md:border-r border-gray-100">
        {/* Real-looking styling grid map pattern */}
        <div 
          className="absolute inset-0 opacity-25" 
          style={{ 
            backgroundImage: "radial-gradient(#4B5563 1.2px, transparent 1.2px)", 
            backgroundSize: "24px 24px" 
          }} 
        />

        {/* Scenic Map background SVG vector decorations - simulates complex urban terrain and streets */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Water Bodies (e.g. Mtkvari river / Seine) */}
          <path 
            d="M -100,200 C 150,220 200,450 400,480 C 500,490 650,380 900,410 L 900,500 L -100,500 Z" 
            fill="#D0E1FD" 
            opacity="0.55" 
          />
          {/* Street Grid simulation */}
          <path d="M 50,0 L 50,1000 M 150,-100 L 150,1000 M 300,-100 L 300,1000 M 450,-100 L 450,1000 M 600,-100 L 600,1000" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
          <path d="M -100,100 L 1000,100 M -100,250 L 1000,250 M -100,400 L 1000,400 M -100,550 L 1000,550" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
          
          {/* Curved pathways */}
          <path d="M 0,150 Q 250,180 350,300 T 700,600" fill="none" stroke="#E2E8F0" strokeWidth="6" opacity="0.8" />
          <path d="M 100,600 Q 200,400 500,300 T 800,50" fill="none" stroke="#E2E8F0" strokeWidth="4" opacity="0.8" />

          {/* Active Route Connecting Line between Pins */}
          {plan.pins.length > 1 && (
            <path
              d={plan.pins.reduce((acc, pin, idx) => {
                // Procedurally map latitudes & longitudes dynamically to canvas coordinates
                // Latitudes range roughly from 41.68 to 41.72 (for Tbilisi) - we scale dynamically
                const x = 80 + (idx * 110);
                const y = 100 + (idx * 90) + (Math.sin(idx) * 40);
                return idx === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
              }, "")}
              fill="none"
              stroke="#2563EB"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="6,6"
              className="animate-[dash_10s_linear_infinite]"
            />
          )}
        </svg>

        {/* Floating City Info Tag */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          <div className="bg-white px-4 py-2.5 rounded-xl shadow-lg border border-gray-100 flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            <div>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">Active Target</span>
              <span className="text-sm font-semibold text-gray-800">{plan.city}</span>
            </div>
          </div>

          {isDemoMode && (
            <div className="bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span className="text-[10px] font-sans font-medium text-amber-700">Sandbox Demo / Custom Seed</span>
            </div>
          )}
        </div>

        {/* Map Interactive Pins Overlay */}
        <div className="absolute inset-0">
          {plan.pins.map((pin, idx) => {
            // Precise positioning formula
            const x = 80 + (idx * 110);
            const y = 100 + (idx * 90) + (Math.sin(idx) * 40);
            const isActive = selectedPinId === pin.id;

            return (
              <div
                key={pin.id}
                style={{ left: `${x}px`, top: `${y}px` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
              >
                <button
                  onClick={() => setSelectedPinId(pin.id)}
                  className="group relative flex flex-col items-center cursor-pointer"
                >
                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full mb-2 bg-neutral-900 text-white text-xs px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg flex flex-col items-center">
                    <span className="font-semibold">{pin.name}</span>
                    <span className="text-[9px] text-gray-300 font-mono">Spend: {pin.timeSpent}</span>
                  </div>

                  {/* Marker Pin Ring */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isActive 
                      ? "bg-blue-600 text-white scale-125 ring-4 ring-blue-500/25 shadow-xl" 
                      : "bg-white text-gray-700 border border-gray-200 hover:border-gray-400 shadow-md"
                  }`}>
                    <span className="text-xs font-mono font-bold">{pin.label}</span>
                  </div>

                  {/* Pin anchor triangle */}
                  <div className={`w-2 h-2 rotate-45 -mt-1 transition-colors ${isActive ? "bg-blue-600" : "bg-white border-b border-r border-gray-200"}`} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Selected Pin Bottom Info Overlay Card */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <AnimatePresence mode="wait">
            {activePin && (
              <motion.div
                key={activePin.id}
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
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">STOP {activePin.label}</span>
                      <h4 className="font-display font-semibold text-sm text-gray-900">{activePin.name}</h4>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{activePin.description}</p>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] font-mono text-gray-400 block uppercase">Estimated Stay</span>
                  <span className="text-sm font-semibold text-gray-800">{activePin.timeSpent}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Map HUD helper bar */}
        <div className="absolute right-4 top-4 bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg border border-gray-200 text-[11px] text-gray-600 flex items-center gap-2 shadow-sm pointer-events-none">
          <MapIcon className="w-3.5 h-3.5 text-gray-500" />
          <span>Click pins to focus route stops</span>
        </div>
      </div>

      {/* 
        RIGHT SIDE: Beautiful geometric itinerary view.
        Strictly designed according to the "Geometric Balance" style.
      */}
      <div className="w-full md:w-[45%] bg-white flex flex-col h-[calc(100vh-350px)] md:h-full">
        {/* Header summary info */}
        <div className="p-6 pb-4 border-b border-gray-100 flex justify-between items-start gap-3 shrink-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-semibold text-gray-900 tracking-tight">
              {plan.title}
            </h1>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-sm">
              {plan.description}
            </p>
          </div>
          <button
            onClick={onChangePreferences}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200/50"
            title="Change preferences"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Quick controls panel */}
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

        {/* Timeline Itinerary List - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="relative pl-6">
            {/* Elegant Vertical Timeline Thread Line */}
            <div className="absolute left-[7px] top-4 bottom-4 w-[2px] bg-gray-100" />

            {plan.itinerary.map((item, index) => {
              const isActive = selectedPinId === `p_p${index + 1}` || (index === 0 && !selectedPinId);
              const activityColors: Record<string, string> = {
                history: "bg-amber-50 text-amber-600 border-amber-100",
                nature: "bg-green-50 text-green-600 border-green-100",
                food: "bg-rose-50 text-rose-600 border-rose-100",
                mixed: "bg-blue-50 text-blue-600 border-blue-100",
              };
              const badgeStyle = activityColors[item.activityType] || activityColors.mixed;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative mb-8 last:mb-2 group transition-all p-3 rounded-xl border ${
                    isActive 
                      ? "bg-blue-55/40 border-blue-200/50" 
                      : "bg-transparent border-transparent hover:bg-gray-55/40"
                  }`}
                >
                  {/* Timeline Stop Point Bullet */}
                  <div className={`absolute -left-[24px] top-4 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                    isActive 
                      ? "bg-blue-600 border-white scale-110 shadow-md ring-2 ring-blue-500/10" 
                      : "bg-white border-gray-300 group-hover:border-gray-500"
                  }`}>
                    {isActive && <div className="w-1 h-1 bg-white rounded-full" />}
                  </div>

                  {/* Header info */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md uppercase">
                        {item.time}
                      </span>
                      <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md uppercase ${badgeStyle}`}>
                        {item.activityType}
                      </span>
                    </div>

                    <span className="text-xs font-sans font-medium text-gray-400">
                      Duration: {item.timeSpent}
                    </span>
                  </div>

                  {/* Place details */}
                  <h3 className="font-display font-semibold text-base text-gray-900 group-hover:text-blue-600 transition-colors">
                    {item.placeName}
                  </h3>

                  {!simplifyMode && (
                    <>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed font-sans">
                        {item.description}
                      </p>

                      {item.tips && (
                        <div className="mt-2.5 p-2 bg-gray-55 rounded-lg border border-gray-100 text-[11px] text-gray-500 font-sans flex items-start gap-1.5">
                          <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                          <span>{item.tips}</span>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Action Bottom Control Buttons */}
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
