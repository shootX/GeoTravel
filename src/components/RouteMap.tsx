import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxWorker from "mapbox-gl/dist/mapbox-gl-csp-worker?worker";
import { TravelPlan } from "../types";

mapboxgl.workerClass = MapboxWorker;

interface RouteMapProps {
  plan: TravelPlan;
  selectedStopIndex: number;
  onStopSelect: (index: number) => void;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim();

function createMarkerElement(index: number, isActive: boolean): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "route-map-marker";
  el.innerHTML = `<span>${index + 1}</span>`;
  el.style.cssText = `
    width: ${isActive ? "36px" : "32px"};
    height: ${isActive ? "36px" : "32px"};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: ui-monospace, monospace;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    border: ${isActive ? "none" : "1px solid #E5E7EB"};
    background: ${isActive ? "#0B4A46" : "#FFFFFF"};
    color: ${isActive ? "#FFFFFF" : "#374151"};
    box-shadow: ${isActive ? "0 4px 14px rgba(11,74,70,0.35)" : "0 2px 8px rgba(0,0,0,0.12)"};
    transition: all 0.2s ease;
  `;
  return el;
}

export default function RouteMap({ plan, selectedStopIndex, onStopSelect }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const onStopSelectRef = useRef(onStopSelect);

  onStopSelectRef.current = onStopSelect;

  const syncMarkers = useCallback((map: mapboxgl.Map, activeIndex: number) => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    plan.stops.forEach((stop, index) => {
      const el = createMarkerElement(index, activeIndex === index);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onStopSelectRef.current(index);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([stop.lng, stop.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [plan.stops]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !MAPBOX_TOKEN || plan.stops.length === 0) {
      return;
    }

    let map: mapboxgl.Map | null = null;
    let cancelled = false;

    const initMap = () => {
      if (cancelled || map || container.clientWidth === 0 || container.clientHeight === 0) {
        return;
      }

      mapboxgl.accessToken = MAPBOX_TOKEN;

      map = new mapboxgl.Map({
        container,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [plan.center.lng, plan.center.lat],
        zoom: 13,
        attributionControl: false,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

      map.on("load", () => {
        if (!map) return;

        map.resize();

        const coordinates = plan.stops.map((stop) => [stop.lng, stop.lat] as [number, number]);

        if (coordinates.length > 1) {
          map.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates },
            },
          });

          map.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#0B4A46",
              "line-width": 4,
              "line-opacity": 0.85,
              "line-dasharray": [2, 1],
            },
          });
        }

        const bounds = new mapboxgl.LngLatBounds();
        coordinates.forEach((coord) => bounds.extend(coord));
        map.fitBounds(bounds, {
          padding: { top: 80, bottom: 140, left: 60, right: 60 },
          maxZoom: 15,
        });

        syncMarkers(map, 0);
      });

      mapRef.current = map;
    };

    initMap();

    const resizeObserver = new ResizeObserver(() => {
      if (map) {
        map.resize();
      } else {
        initMap();
      }
    });

    resizeObserver.observe(container);

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map?.remove();
      mapRef.current = null;
    };
  }, [plan, syncMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || plan.stops.length === 0) {
      return;
    }

    if (map.isStyleLoaded()) {
      syncMarkers(map, selectedStopIndex);
    } else {
      map.once("load", () => syncMarkers(map, selectedStopIndex));
    }
  }, [selectedStopIndex, syncMarkers, plan.stops]);

  useEffect(() => {
    const map = mapRef.current;
    const stop = plan.stops[selectedStopIndex];
    if (!map || !stop || !map.isStyleLoaded()) {
      return;
    }

    map.flyTo({
      center: [stop.lng, stop.lat],
      zoom: Math.max(map.getZoom(), 14),
      duration: 800,
      essential: true,
    });
  }, [selectedStopIndex, plan.stops]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#E5E9F0]">
        <div className="text-center px-6">
          <p className="text-sm font-semibold text-gray-700">Mapbox key საჭიროა</p>
          <p className="text-xs text-gray-500 mt-1">
            დაამატე <code className="font-mono bg-white px-1.5 py-0.5 rounded">VITE_MAPBOX_ACCESS_TOKEN</code> .env ფაილში
          </p>
        </div>
      </div>
    );
  }

  if (plan.stops.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#E5E9F0]">
        <p className="text-sm text-gray-500">მარშრუტის გაჩერებები არ მოიძებნა</p>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
}
