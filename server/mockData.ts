import { GeneratedPlan, TravelPreferences, MapPin, ItineraryItem } from "../src/types";

// Base coordinates for some popular cities to make mock maps look highly realistic
export const CITY_COORDINATES: Record<string, [number, number]> = {
  tbilisi: [41.6938, 44.8015],
  paris: [48.8566, 2.3522],
  tokyo: [35.6762, 139.6503],
  rome: [41.9028, 12.4964],
  london: [51.5074, -0.1278],
  new_york: [40.7128, -74.0060],
};

// Hand-crafted high-fidelity itineraries for Tbilisi (default)
const TBILISI_PLANS: Record<string, Partial<GeneratedPlan>> = {
  "2h_history": {
    title: "Old Tbilisi Historic Sprint",
    description: "A fast-paced discovery of Tbilisi's ancient roots, traversing Narikala Fortress and sulfur bath districts.",
    center: [41.6900, 44.8080],
    pins: [
      { id: "p1", name: "Metekhi Church & Bridge", lat: 41.6902, lng: 44.8115, label: "1", timeSpent: "30m", description: "Perched on the cliff over the Mtkvari River, offering beautiful views." },
      { id: "p2", name: "Abanotubani Sulfur Baths", lat: 41.6882, lng: 44.8112, label: "2", timeSpent: "30m", description: "The ancient dome-shaped hot springs where Tbilisi was founded." },
      { id: "p3", name: "Narikala Cable Car & Fortress", lat: 41.6881, lng: 44.8085, label: "3", timeSpent: "1h", description: "Take the quick cable car up to the fortress for a stunning panorama." }
    ],
    itinerary: [
      { time: "10:00", placeName: "Metekhi Church & Bridge", description: "Marvel at the equestrian statue of King Vakhtang Gorgasali and take in the panoramic gorge.", timeSpent: "30 mins", activityType: "history" },
      { time: "10:30", placeName: "Abanotubani Sulfur Baths", description: "Walk through the brick dome roofs, breathe the historic sulfur air, and see the hidden Leghvtakhevi waterfall.", timeSpent: "30 mins", activityType: "history" },
      { time: "11:00", placeName: "Narikala Cable Car & Fortress", description: "Fly over the old town in a cable car to explore the 4th-century citadel and meet the Mother of Georgia statue.", timeSpent: "1 hour", activityType: "history", tips: "The cable car costs about 3 GEL and takes only 2 minutes." }
    ]
  },
  "4h_mixed": {
    title: "The Ultimate Tbilisi Fusion",
    description: "An optimal blend of Tbilisi's rich history, beautiful gardens, and modern architectural wonders.",
    center: [41.6950, 44.8050],
    pins: [
      { id: "p1", name: "Clock Tower of Gabriadze Theater", lat: 41.6958, lng: 44.8068, label: "1", timeSpent: "30m", description: "An whimsical, leaning clock tower hosting puppet shows." },
      { id: "p2", name: "Bridge of Peace & Rike Park", lat: 41.6974, lng: 44.8105, label: "2", timeSpent: "1h", description: "A futuristic glass pedestrian bridge connecting old and new." },
      { id: "p3", name: "Meidan Square & Sulfur District", lat: 41.6896, lng: 44.8101, label: "3", timeSpent: "1.5h", description: "The vibrant heart of Old Tbilisi with multi-ethnic heritage." },
      { id: "p4", name: "Narikala Scenic Ridge Walk", lat: 41.6875, lng: 44.8050, label: "4", timeSpent: "1h", description: "Walk the mountain ridge connecting Narikala and Mtatsminda." }
    ],
    itinerary: [
      { time: "14:00", placeName: "Gabriadze Clock Tower", description: "View the charming leaning tower and see the angel strike the bell. Grab a quick Georgian coffee nearby.", timeSpent: "30 mins", activityType: "history" },
      { time: "14:30", placeName: "Bridge of Peace & Rike Park", description: "Cross the ultra-modern glass canopy bridge and explore the futuristic park on the left bank.", timeSpent: "1 hour", activityType: "mixed" },
      { time: "15:30", placeName: "Meidan Square & Sulfur District", description: "Stroll down Shardeni street, check out traditional carpets, and see the brick sulfur baths.", timeSpent: "1.5 hours", activityType: "history" },
      { time: "17:00", placeName: "Narikala Ridge & Mother of Georgia", description: "Ride the cable car up to explore the fortress and walk the ridge trail for sunset photography.", timeSpent: "1 hour", activityType: "nature", tips: "Perfect lighting for photos is right before sunset!" }
    ]
  },
  "6h_food": {
    title: "Tbilisi Gourmet & Vintage Explorer",
    description: "Taste your way through Tbilisi's authentic bakeries, wine cellars, and trendy culinary spots.",
    center: [41.6980, 44.7990],
    pins: [
      { id: "p1", name: "Dezerter Bazar", lat: 41.7214, lng: 44.7932, label: "1", timeSpent: "1.5h", description: "Tbilisi's chaotic, sensory-rich open-air food market." },
      { id: "p2", name: "Shuchman Wine Bar & Old Cellar", lat: 41.6912, lng: 44.8090, label: "2", timeSpent: "1.5h", description: "A gorgeous brick cellar offering premium Qvevri wine tastings." },
      { id: "p3", name: "Sololaki Craft & Khinkali Crawl", lat: 41.6915, lng: 44.7980, label: "3", timeSpent: "2h", description: "Walk the majestic 19th-century halls and eat authentic hand-rolled dumplings." },
      { id: "p4", name: "Fabrika Creative Space", lat: 41.7095, lng: 44.8048, label: "4", timeSpent: "1h", description: "A converted Soviet sewing factory turned hipster courtyard with local treats." }
    ],
    itinerary: [
      { time: "11:00", placeName: "Dezerter Bazar", description: "Immerse in local sights and smells. Sample fresh churchkhela, walnuts, and local sulguni cheese.", timeSpent: "1.5 hours", activityType: "food" },
      { time: "12:30", placeName: "Fabrika Creative Space", description: "Visit the industrial-chic courtyard, explore local design shops, and have a craft soda or cold draft beer.", timeSpent: "1 hour", activityType: "mixed" },
      { time: "13:30", placeName: "Sololaki Khinkali Crawl", description: "Walk around historic Sololaki mansion entrances and stop at a traditional basement tavern for Khinkali.", timeSpent: "2 hours", activityType: "food", tips: "Remember: eat Khinkali with your hands, take a bite, drink the broth, then eat the rest!" },
      { time: "15:30", placeName: "Shuchman Wine Cellar", description: "Unwind in a 19th-century cellar. Learn about the 8,000-year Georgian winemaking tradition using clay jars (Qvevri).", timeSpent: "1.5 hours", activityType: "food" }
    ]
  },
  "1day_nature": {
    title: "Tbilisi Wilderness & Botanic Escape",
    description: "Discover the rugged ravines, botanical sanctuaries, and high mountain views inside the city center.",
    center: [41.6940, 44.8040],
    pins: [
      { id: "p1", name: "Mtatsminda Funicular & Park", lat: 41.6947, lng: 44.7905, label: "1", timeSpent: "2.5h", description: "Historic cliffside funicular railway leading to a mountain park." },
      { id: "p2", name: "National Botanical Garden", lat: 41.6850, lng: 44.8040, label: "2", timeSpent: "3h", description: "A massive, lush reserve with a hidden gorge and a 40m high waterfall." },
      { id: "p3", name: "Leghvtakhevi Canyon & Sulphur Gorge", lat: 41.6876, lng: 44.8102, label: "3", timeSpent: "1.5h", description: "A beautiful deep volcanic canyon in the heart of the old town." },
      { id: "p4", name: "Turtle Lake (Kus Tba) Ridge Walk", lat: 41.7005, lng: 44.7538, label: "4", timeSpent: "2h", description: "High altitude lake with panoramic pine forests." }
    ],
    itinerary: [
      { time: "09:30", placeName: "Mtatsminda Funicular & Park", description: "Take the steep vintage funicular train up the cliff. Walk the pine forests and enjoy views over the entire valley.", timeSpent: "2.5 hours", activityType: "nature" },
      { time: "12:00", placeName: "National Botanical Garden", description: "Enter from behind Narikala. Hike the cypress lanes, cross the historic bridge, and stand by the spectacular waterfall.", timeSpent: "3 hours", activityType: "nature" },
      { time: "15:00", placeName: "Leghvtakhevi Canyon & Gorge", description: "Hike the wooden boardwalk along the running stream inside a massive rock gorge that ends at the baths.", timeSpent: "1.5 hours", activityType: "nature" },
      { time: "16:30", placeName: "Turtle Lake Scenic Ridge", description: "Take the cable car from Vake Park to the serene mountain lake. Stroll around the water and hike the pine ridge.", timeSpent: "2 hours", activityType: "nature", tips: "Rent a small paddle boat or grab a cold beverage directly on the lake deck." }
    ]
  }
};

// Generates custom procedural itinerary for any other city/interest on the fly
export function generateProceduralPlan(prefs: TravelPreferences): GeneratedPlan {
  const cityNorm = prefs.city.trim().toLowerCase();
  
  // Clean prefix if any
  let normalizedKey = "4h_mixed";
  if (prefs.timeLimit === "2h") normalizedKey = "2h_history";
  else if (prefs.timeLimit === "4h") normalizedKey = "4h_mixed";
  else if (prefs.timeLimit === "6h") normalizedKey = "6h_food";
  else if (prefs.timeLimit === "1day") normalizedKey = "1day_nature";

  // Check if we have hand-crafted Tbilisi plan and the user searched for Tbilisi
  if (cityNorm === "tbilisi" || cityNorm.includes("tbilis")) {
    const plan = TBILISI_PLANS[normalizedKey];
    if (plan) {
      return {
        city: "Tbilisi",
        timeLimit: prefs.timeLimit,
        transport: prefs.transport,
        interests: prefs.interests,
        title: plan.title!,
        description: plan.description!,
        pins: plan.pins!,
        itinerary: plan.itinerary!,
        center: plan.center!
      };
    }
  }

  // Fallback coords or slight randomization around capital city default centers
  const baseCoords = CITY_COORDINATES[cityNorm] || CITY_COORDINATES[Object.keys(CITY_COORDINATES).find(k => cityNorm.includes(k)) || ""] || [41.7151, 44.8271];
  const latCenter = baseCoords[0];
  const lngCenter = baseCoords[1];

  // Procedural names generator based on selected interests
  const interestsJoined = prefs.interests.length > 0 ? prefs.interests.join(" & ") : "mixed";
  const capitalCity = prefs.city.charAt(0).toUpperCase() + prefs.city.slice(1);
  
  const title = `Optimized ${capitalCity} ${interestsJoined.charAt(0).toUpperCase() + interestsJoined.slice(1)} Explorer`;
  const description = `A custom-tailored, ${prefs.timeLimit} optimized itinerary for tourists looking to maximize their time in ${capitalCity} using ${prefs.transport} transport.`;

  // Generate 3 to 5 realistic locations based on the time limit
  const stopsCount = prefs.timeLimit === "2h" ? 2 : prefs.timeLimit === "4h" ? 3 : prefs.timeLimit === "6h" ? 4 : 5;
  
  const activityPool: Record<string, { name: string; desc: string; type: string; duration: string }[]> = {
    history: [
      { name: "Old Quarter Heritage Square", desc: "The ancient medieval center, showcasing authentic local architectures and historic monuments.", type: "history", duration: "1h" },
      { name: "National Citadel & Overlook", desc: "A majestic cliffside fortification offering scenic views of the skyline and ancient ruins.", type: "history", duration: "1.5h" },
      { name: "Cathedral of Sacred Relics", desc: "An outstanding landmark of religious history with stunning mosaic interiors.", type: "history", duration: "45m" },
      { name: "Vintage Passage & Clock Tower", desc: "A beautifully preserved neoclassical walkway home to artisan workshops.", type: "history", duration: "30m" },
    ],
    nature: [
      { name: "Grand Botanical Garden & Gorge", desc: "Lush paths, blooming native flora, and a peaceful running brook hidden in the valley.", type: "nature", duration: "2h" },
      { name: "Riverfront Scenic Promenade", desc: "A serene, tree-lined walking trail along the river perfect for fresh air and photos.", type: "nature", duration: "1h" },
      { name: "Sunset Hill Scenic Overlook", desc: "A local hilltop oasis providing panoramic vistas of the entire metropolitan basin.", type: "nature", duration: "1.5h" },
      { name: "Central Forest Sanctuary", desc: "A dense canopy of centuries-old pines with tranquil footpaths.", type: "nature", duration: "1.5h" },
    ],
    food: [
      { name: "Central Gastronomy Hall", desc: "A bustling market with local vendors serving hot cheese bread, spices, and fresh organic products.", type: "food", duration: "1.5h" },
      { name: "Historic Brick Wine Cellar", desc: "Deep underground cellar demonstrating traditional fermentation and barrel aging techniques.", type: "food", duration: "1h" },
      { name: "Traditional Dumpling Tavern", desc: "Highly rated local spot specializing in hand-rolled dumplings and traditional regional plates.", type: "food", duration: "1.5h" },
      { name: "Artisan Coffee & Pastry Yard", desc: "A cozy secret courtyard serving organic hand-brewed coffee and sweet delicacies.", type: "food", duration: "45m" },
    ],
    mixed: [
      { name: "Modernist Arch & Creative Court", desc: "A creative industrial workspace packed with modern art galleries, galleries, and cafes.", type: "mixed", duration: "1.5h" },
      { name: "Symphonic Amphitheater Park", desc: "A modern park featuring futuristic glass structures and responsive wave walkways.", type: "mixed", duration: "1h" },
      { name: "Flea Market of Curiosities", desc: "An open-air bazaar filled with old relics, stamps, local jewelry, and vintage clothing.", type: "mixed", duration: "1.5h" },
    ]
  };

  const selectedCategory = prefs.interests.includes("mixed") ? "mixed" : prefs.interests[0] || "mixed";
  const pool = activityPool[selectedCategory] || activityPool["mixed"];

  const pins: MapPin[] = [];
  const itinerary: ItineraryItem[] = [];
  
  // Starting time
  let currentHour = 10;
  let currentMinute = 0;

  for (let i = 0; i < stopsCount; i++) {
    const actIndex = i % pool.length;
    const activity = pool[actIndex];
    const id = `p_p${i+1}`;
    
    // Slight coordinates deviation so it forms a gorgeous path
    const offsetLat = (Math.sin(i * 1.5) * 0.006) - 0.002;
    const offsetLng = (Math.cos(i * 1.5) * 0.006) + 0.002;
    
    const pinLat = latCenter + offsetLat;
    const pinLng = lngCenter + offsetLng;

    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    pins.push({
      id,
      name: `${capitalCity} ${activity.name}`,
      lat: pinLat,
      lng: pinLng,
      label: (i + 1).toString(),
      timeSpent: activity.duration,
      description: activity.desc
    });

    itinerary.push({
      time: timeString,
      placeName: `${capitalCity} ${activity.name}`,
      description: activity.desc,
      timeSpent: activity.duration,
      activityType: activity.type,
      tips: `Highly recommended for travellers using ${prefs.transport} travel!`
    });

    // Increment time
    let durationHours = 1;
    let durationMins = 0;
    if (activity.duration.includes("h")) {
      durationHours = parseFloat(activity.duration);
    } else if (activity.duration.includes("m")) {
      durationMins = parseInt(activity.duration);
    }

    currentHour += Math.floor(durationHours);
    currentMinute += durationMins + Math.round((durationHours % 1) * 60);
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }

  return {
    city: capitalCity,
    timeLimit: prefs.timeLimit,
    transport: prefs.transport,
    interests: prefs.interests,
    title,
    description,
    pins,
    itinerary,
    center: baseCoords
  };
}
