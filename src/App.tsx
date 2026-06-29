import { useState, useEffect } from "react";
import { TravelPreferences, TravelPlan } from "./types";
import LandingPage from "./components/LandingPage";
import InputScreen from "./components/InputScreen";
import LoadingScreen from "./components/LoadingScreen";
import ResultsPage from "./components/ResultsPage";
import AuthModal from "./components/AuthModal";
import { useAuth } from "./context/AuthContext";
import { apiFetch } from "./lib/api";
import { Compass, ArrowLeft, LogIn, LogOut } from "lucide-react";

export default function App() {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const [step, setStep] = useState<"landing" | "input" | "loading" | "results">("landing");
  const [authOpen, setAuthOpen] = useState(false);
  const [preferences, setPreferences] = useState<TravelPreferences>({
    city: "Tbilisi",
    timeLimit: "4h",
    transport: "walk",
    interests: ["mixed"],
  });
  const [generatedPlan, setGeneratedPlan] = useState<TravelPlan | null>(null);
  const [history, setHistory] = useState<TravelPlan[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "success") {
      refreshUser();
    }
    if (params.get("auth_error")) {
      setAuthOpen(true);
    }
  }, [refreshUser]);

  useEffect(() => {
    if (!user) return;
    try {
      const cached = localStorage.getItem(`travel_planner_history_${user.id}`);
      if (cached) {
        setHistory(JSON.parse(cached));
      }
    } catch (e) {
      console.warn("Failed to load history:", e);
    }
  }, [user]);

  const handlePreferencesSubmit = async (prefs: TravelPreferences) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }

    setPreferences(prefs);
    setStep("loading");

    try {
      const response = await apiFetch("/api/plan", {
        method: "POST",
        body: JSON.stringify(prefs),
      });

      if (response.status === 401) {
        setStep("input");
        setAuthOpen(true);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to call travel planner endpoint");
      }

      const plan: TravelPlan = await response.json();
      setGeneratedPlan(plan);
      setStep("results");

      const updatedHistory = [plan, ...history.slice(0, 4)];
      setHistory(updatedHistory);
      localStorage.setItem(`travel_planner_history_${user.id}`, JSON.stringify(updatedHistory));
    } catch (err) {
      console.error("Plan generation failed:", err);
      setStep("input");
    }
  };

  const handleRegenerate = () => {
    handlePreferencesSubmit(preferences);
  };

  const handleStart = () => {
    setStep("input");
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-800">
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

        <div className="flex items-center gap-4">
          {step === "results" && generatedPlan && (
            <div className="hidden md:flex items-center bg-gray-50 rounded-full px-4 py-1.5 border border-gray-200">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mr-2">Plan For:</span>
              <span className="text-xs font-semibold text-gray-700">{generatedPlan.city}</span>
              <div className="w-px h-3 bg-gray-300 mx-2" />
              <span className="text-xs font-semibold text-gray-700 uppercase">{preferences.timeLimit}</span>
              <div className="w-px h-3 bg-gray-300 mx-2" />
              <span className="text-xs font-semibold text-gray-700 capitalize">{preferences.transport}</span>
            </div>
          )}

          {!authLoading && (
            user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full border border-gray-200" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                      {(user.name || user.email)[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-medium text-gray-700 max-w-[120px] truncate">
                    {user.name || user.email}
                  </span>
                </div>
                <button
                  onClick={() => logout()}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )
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

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {step === "landing" && <LandingPage onStart={handleStart} />}

        {step === "input" && (
          <InputScreen onSubmit={handlePreferencesSubmit} initialPreferences={preferences} />
        )}

        {step === "loading" && <LoadingScreen />}

        {step === "results" && generatedPlan && (
          <ResultsPage
            plan={generatedPlan}
            onChangePreferences={() => setStep("input")}
            onRegenerate={handleRegenerate}
          />
        )}
      </main>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
