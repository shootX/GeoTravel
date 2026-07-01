import { useState, useEffect } from "react";
import { TravelPreferences, TravelPlan } from "./types";
import LandingPage from "./components/LandingPage";
import LoadingScreen from "./components/LoadingScreen";
import ResultsPage from "./components/ResultsPage";
import AuthModal from "./components/AuthModal";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import { useAuth } from "./context/AuthContext";
import { apiFetch } from "./lib/api";
import { Routes, Route, useNavigate } from "react-router-dom";

import PublicDestinationsPage from "./pages/PublicDestinationsPage";
import PublicDestinationDetailPage from "./pages/PublicDestinationDetailPage";
import PublicBlogPage from "./pages/PublicBlogPage";
import PublicBlogPostPage from "./pages/PublicBlogPostPage";
import PublicAboutPage from "./pages/PublicAboutPage";
import PublicExperiencesPage from "./pages/PublicExperiencesPage";
import PublicCustomRoutesPage from "./pages/PublicCustomRoutesPage";

const PLAN_STATE_KEY = "geotravel_plan_state";

export default function App() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"landing" | "loading" | "results">("landing");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [planError, setPlanError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<TravelPreferences>({
    city: "Tbilisi",
    timeLimit: "4h",
    transport: "walk",
    interests: ["mixed"],
  });
  const [generatedPlan, setGeneratedPlan] = useState<TravelPlan | null>(null);
  const [history, setHistory] = useState<TravelPlan[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PLAN_STATE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          step?: typeof step;
          plan?: TravelPlan;
          prefs?: TravelPreferences;
        };
        if (saved.step) setStep(saved.step);
        if (saved.plan) setGeneratedPlan(saved.plan);
        if (saved.prefs) setPreferences(saved.prefs);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(
      PLAN_STATE_KEY,
      JSON.stringify({ step, plan: generatedPlan, prefs: preferences })
    );
  }, [step, generatedPlan, preferences]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "success") {
      refreshUser();
    }
    if (params.get("auth_error")) {
      setAuthMode("login");
      setAuthOpen(true);
    }
  }, [refreshUser]);

  useEffect(() => {
    if (!user) return;
    try {
      const cached = localStorage.getItem(`travel_planner_history_${user.id}`);
      if (cached) setHistory(JSON.parse(cached));
    } catch (e) {
      console.warn("Failed to load history:", e);
    }
  }, [user]);

  const openLogin = () => {
    setAuthMode("login");
    setAuthOpen(true);
  };

  const openSignUp = () => {
    setAuthMode("register");
    setAuthOpen(true);
  };

  const handlePreferencesSubmit = async (prefs: TravelPreferences) => {
    if (!user) {
      setAuthMode("login");
      setAuthOpen(true);
      return;
    }

    setPreferences(prefs);
    setPlanError(null);
    setStep("loading");
    navigate("/");

    try {
      const response = await apiFetch("/api/plan", {
        method: "POST",
        body: JSON.stringify(prefs),
      });

      if (response.status === 401) {
        setStep("landing");
        setAuthMode("login");
        setAuthOpen(true);
        return;
      }

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Plan generation failed. Please try again.");
      }

      const plan: TravelPlan = await response.json();
      setGeneratedPlan(plan);
      setStep("results");

      const updatedHistory = [plan, ...history.slice(0, 4)];
      setHistory(updatedHistory);
      localStorage.setItem(`travel_planner_history_${user.id}`, JSON.stringify(updatedHistory));
    } catch (err) {
      console.error("Plan generation failed:", err);
      setStep("landing");
      setPlanError(err instanceof Error ? err.message : "Plan generation failed");
    }
  };

  const handleRegenerate = () => {
    handlePreferencesSubmit(preferences);
  };

  const resetToLanding = () => {
    setStep("landing");
    setPlanError(null);
  };

  return (
    <div className="min-h-screen bg-white text-[#111827] flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      <SiteHeader
        onLogin={openLogin}
        onSignUp={openSignUp}
        onLogoClick={resetToLanding}
      />

      <main className="flex-1 flex flex-col min-h-0 w-full">
        <Routes>
          <Route
            path="/"
            element={
              <>
                {step === "landing" && (
                  <>
                    {planError && (
                      <div className="max-w-3xl mx-auto px-4 pt-4 w-full">
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                          {planError}
                        </div>
                      </div>
                    )}
                    <LandingPage onSearch={handlePreferencesSubmit} />
                    <SiteFooter />
                  </>
                )}
                {step === "loading" && <LoadingScreen />}
                {step === "results" && generatedPlan && (
                  <ResultsPage
                    plan={generatedPlan}
                    onChangePreferences={() => setStep("landing")}
                    onRegenerate={handleRegenerate}
                  />
                )}
              </>
            }
          />
          <Route
            path="/destinations"
            element={
              <>
                <PublicDestinationsPage />
                <SiteFooter />
              </>
            }
          />
          <Route path="/destinations/:id" element={<PublicDestinationDetailPage />} />
          <Route
            path="/experiences"
            element={
              <>
                <PublicExperiencesPage />
                <SiteFooter />
              </>
            }
          />
          <Route
            path="/custom-routes"
            element={
              <>
                <PublicCustomRoutesPage />
                <SiteFooter />
              </>
            }
          />
          <Route
            path="/blog"
            element={
              <>
                <PublicBlogPage />
                <SiteFooter />
              </>
            }
          />
          <Route path="/blog/:slug" element={<PublicBlogPostPage />} />
          <Route
            path="/about"
            element={
              <>
                <PublicAboutPage />
                <SiteFooter />
              </>
            }
          />
        </Routes>
      </main>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}
