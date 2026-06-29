import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { generateProceduralPlan } from "./server/mockData";
import { TravelPreferences } from "./src/types";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini if key exists
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
    try {
      ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("Gemini AI Client successfully initialized.");
    } catch (err) {
      console.error("Failed to initialize Gemini Client:", err);
    }
  } else {
    console.warn("No valid GEMINI_API_KEY found in environment. Running in Demo / Fallback Mode.");
  }

  // AI Itinerary Planning endpoint
  app.post("/api/plan", async (req, res) => {
    const preferences = req.body as TravelPreferences;

    if (!preferences || !preferences.city) {
      return res.status(400).json({ error: "Missing required preferences (e.g. city)" });
    }

    const city = preferences.city.trim();
    const isDemoMode = !ai;

    if (isDemoMode) {
      // Offline/Demo Fallback mode
      console.log(`[Demo Mode] Generating fallback procedural plan for: ${city}`);
      const plan = generateProceduralPlan(preferences);
      return res.json({ plan, isDemoMode: true });
    }

    try {
      console.log(`[AI Mode] Contacting Gemini 3.5-flash to build plan for: ${city}`);
      
      const prompt = `
        You are an expert local guide and tourist trip optimizer.
        Generate a highly optimized, simple, tourist itinerary for a day trip in the city of "${city}".
        The traveler has exactly "${preferences.timeLimit}" of available time.
        Their preferred mode of transport is "${preferences.transport}".
        Their main interest categories are: ${preferences.interests.join(", ")}.

        Create a single, cohesive, sequential itinerary of stops. 
        - For 2h time limit: generate exactly 2-3 key stops that are physically close to each other.
        - For 4h time limit: generate 3-4 key stops in a clean sequence.
        - For 6h time limit: generate 4-5 key stops.
        - For 1 day time limit: generate 5-6 key stops with logical meal breaks.

        Make sure the latitude and longitude coordinates are highly realistic and accurate for the city of ${city} so that they can be plotted correctly on a local map. Find the coordinates for each stop and the overall city center.

        Avoid overwhelming choices and focus on high-fidelity, actionable plans that avoid wasting time traveling.
      `;

      const response = await ai!.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a smart travel assistant that decides the single best possible path for a tourist based on their time and category preferences. Avoid choices; provide exactly ONE highly-optimized, beautiful itinerary. Return coordinates for the city center and every stop.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              city: { type: Type.STRING },
              timeLimit: { type: Type.STRING },
              transport: { type: Type.STRING },
              interests: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              },
              title: { type: Type.STRING, description: "A catchy, short name for the itinerary, e.g. Old Quarter Explorer" },
              description: { type: Type.STRING, description: "A beautiful, 1-2 sentence description explaining the vibe of this specific path." },
              center: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
                description: "The [latitude, longitude] representing the general center point for all generated stops, to frame the map."
              },
              pins: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING, description: "Official place name" },
                    lat: { type: Type.NUMBER, description: "Precise latitude coordinates" },
                    lng: { type: Type.NUMBER, description: "Precise longitude coordinates" },
                    label: { type: Type.STRING, description: "Sequential number starting at '1', '2'..." },
                    timeSpent: { type: Type.STRING, description: "Recommended duration, e.g., '1.5 hours' or '45 mins'" },
                    description: { type: Type.STRING, description: "A one-sentence overview of what to do here." }
                  },
                  required: ["id", "name", "lat", "lng", "label", "timeSpent", "description"]
                }
              },
              itinerary: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.STRING, description: "Formatted starting time, e.g., '10:00' or '13:15' in sequence" },
                    placeName: { type: Type.STRING },
                    description: { type: Type.STRING, description: "Detailed 1-line description of the stop activity" },
                    timeSpent: { type: Type.STRING, description: "Estimated time spent" },
                    activityType: { type: Type.STRING, description: "Thematic category, must be one of: 'history', 'nature', 'food', 'mixed'" },
                    tips: { type: Type.STRING, description: "An optional pro-tip for the traveler visiting this stop" }
                  },
                  required: ["time", "placeName", "description", "timeSpent", "activityType"]
                }
              }
            },
            required: ["city", "timeLimit", "transport", "interests", "title", "description", "center", "pins", "itinerary"]
          }
        }
      });

      const jsonStr = response.text?.trim() || "{}";
      const plan = JSON.parse(jsonStr);

      return res.json({ plan, isDemoMode: false });
    } catch (err) {
      console.error("Gemini AI API execution failed, falling back to procedural plan:", err);
      // Fallback on error
      const fallbackPlan = generateProceduralPlan(preferences);
      return res.json({ plan: fallbackPlan, isDemoMode: true, error: "AI API error, used safe fallback mode." });
    }
  });

  // Handle Vite Asset Serving and Routing
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
