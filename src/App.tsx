import { useState, useEffect } from "react";
import { TravelPreferences, GeneratedPlan } from "./types";
import LandingPage from "./components/LandingPage";
import InputScreen from "./components/InputScreen";
import LoadingScreen from "./components/LoadingScreen";
import ResultsPage from "./components/ResultsPage";
import { generateProceduralPlan } from "../server/mockData";
import { Compass, RefreshCw, Sparkles, MapPin, ArrowLeft } from "lucide-react";

export default function App() {
  const [step, setStep] = useState<"landing" | "input" | "loading" | "results">("landing");
  const [preferences, setPreferences] = useState<TravelPreferences>({
    city: "Tbilisi",
    timeLimit: "4h",
    transport: "walk",
    interests: ["mixed"],
  });
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [history, setHistory] = useState<GeneratedPlan[]>([]);

  // Load offline cached history if any
  useEffect(() => {
    try {
      const cached = localStorage.getItem("travel_planner_history");
      if (cached) {
        setHistory(JSON.parse(cached));
      }
    } catch (e) {
      console.warn("Failed to load local storage history:", e);
    }
  }, []);

  const handlePreferencesSubmit = async (prefs: TravelPreferences) => {
    setPreferences(prefs);
    setStep("loading");

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prefs),
      });

      if (!response.ok) {
        throw new Error("Failed to call travel planner endpoint");
      }

      const data = await response.json();
      setGeneratedPlan(data.plan);
      setIsDemoMode(data.isDemoMode || false);
      setStep("results");

      // Save to local offline cache
      const updatedHistory = [data.plan, ...history.slice(0, 4)];
      setHistory(updatedHistory);
      localStorage.setItem("travel_planner_history", JSON.stringify(updatedHistory));
    } catch (err) {
      console.error("Plan generation failed, using local backup system:", err);
      // Fallback procedural planning locally so it works even offline
      const localPlan = generateProceduralPlan(prefs);
      setGeneratedPlan(localPlan);
      setIsDemoMode(true);
      setStep("results");
    }
  };

  const handleRegenerate = () => {
    // Generate a new fresh path for the current selected city/preferences
    handlePreferencesSubmit(preferences);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-800">
      {/* Dynamic Navigation Header based on Geometric Balance Design */}
      <header className="h-16 px-4 md:px-8 flex items-center justify-between bg-white border-b border-gray-100 shadow-sm z-30 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setStep("landing")}
            className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
          >
            <Compass className="w-5 h-5 text-white" />
          </button>
          <div>
            <span className="font-display font-bold text-lg md:text-xl tracking-tight text-gray-900 block">
              VoyaAI
            </span>
          </div>
        </div>

        {/* Dynamic Context Header Widgets */}
        <div className="flex items-center gap-4">
          {step === "results" && generatedPlan && (
            <div className="hidden md:flex items-center bg-gray-50 rounded-full px-4 py-1.5 border border-gray-200">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mr-2">Plan For:</span>
              <span className="text-xs font-semibold text-gray-700">{generatedPlan.city}</span>
              <div className="w-px h-3 bg-gray-300 mx-2" />
              <span className="text-xs font-semibold text-gray-700 uppercase">{generatedPlan.timeLimit}</span>
              <div className="w-px h-3 bg-gray-300 mx-2" />
              <span className="text-xs font-semibold text-gray-700 capitalize">{generatedPlan.transport}</span>
            </div>
          )}

          {step !== "landing" && (
            <button
              id="header-nav-back"
              onClick={() => {
                if (step === "results") setStep("input");
                else if (step === "input") setStep("landing");
                else if (step === "loading") setStep("input");
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              {step === "results" ? "Edit Preferences" : "Back"}
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center">
        {step === "landing" && (
          <LandingPage onStart={() => setStep("input")} />
        )}

        {step === "input" && (
          <InputScreen 
            onSubmit={handlePreferencesSubmit} 
            initialPreferences={preferences} 
          />
        )}

        {step === "loading" && (
          <LoadingScreen />
        )}

        {step === "results" && generatedPlan && (
          <ResultsPage 
            plan={generatedPlan}
            isDemoMode={isDemoMode}
            onChangePreferences={() => setStep("input")}
            onRegenerate={handleRegenerate}
          />
        )}
      </main>
    </div>
  );
}
