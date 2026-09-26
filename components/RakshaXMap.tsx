'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import type * as LeafletType from 'leaflet';

export interface MapMarkerData {
  id: string;
  type: 'sos' | 'temp_report' | 'perm_report' | 'responder' | 'safety_point' | 'user';
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  status?: string;
  accuracy?: number;
  radiusMeters?: number;
  raw?: any;
}

export interface RakshaXMapProps {
  markers?: MapMarkerData[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  routePolyline?: Array<[number, number]>;
  showActiveSOS?: boolean;
  showTempReports?: boolean;
  showPermReports?: boolean;
  showResponders?: boolean;
  showSafetyPoints?: boolean;
  showCoverageCircles?: boolean;
  selectedMarkerId?: string | null;
  onMarkerClick?: (marker: MapMarkerData) => void;
  className?: string;
}

export default function RakshaXMap({
  markers = [],
  center = [26.9124, 75.7873],
  zoom = 13,
  height = '540px',
  routePolyline,
  showActiveSOS = true,
  showTempReports = true,
  showPermReports = true,
  showResponders = true,
  showSafetyPoints = true,
  showCoverageCircles = true,
  selectedMarkerId,
  onMarkerClick,
  className = '',
}: RakshaXMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletType.Map | null>(null);
  const layerGroupRef = useRef<LeafletType.LayerGroup | null>(null);
  const polylineRef = useRef<LeafletType.Polyline | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    let isCancelled = false;

    async function init() {
      if (!containerRef.current) return;
      const L = await import('leaflet');
      if (isCancelled || !containerRef.current) return;

      // Fix default Leaflet icon paths in Webpack/Next.js
      delete ((L.Icon.Default.prototype as any)._getIconUrl);
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current) {
        const map = L.map(containerRef.current, {
          center: center,
          zoom: zoom,
          zoomControl: false,
        });

        // Add real OpenStreetMap visual tiles (same as Flutter app)
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        const group = L.layerGroup().addTo(map);
        layerGroupRef.current = group;
        mapRef.current = map;
        setIsReady(true);
      }
    }

    init();

    return () => {
      isCancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, []);

  // Filter markers based on layer toggles
  const filteredMarkers = useMemo(() => {
    return markers.filter((m) => {
      if (m.type === 'sos' && !showActiveSOS) return false;
      if (m.type === 'temp_report' && !showTempReports) return false;
      if (m.type === 'perm_report' && !showPermReports) return false;
      if (m.type === 'responder' && !showResponders) return false;
      if (m.type === 'safety_point' && !showSafetyPoints) return false;
      return true;
    });
  }, [
    markers,
    showActiveSOS,
    showTempReports,
    showPermReports,
    showResponders,
    showSafetyPoints,
  ]);

  // Update Markers, Circles and Polylines on state change
  useEffect(() => {
    if (!isReady || !mapRef.current || !layerGroupRef.current) return;

    let isCancelled = false;

    async function updateLayers() {
      const L = await import('leaflet');
      if (isCancelled || !layerGroupRef.current || !mapRef.current) return;

      const group = layerGroupRef.current;
      group.clearLayers();

      filteredMarkers.forEach((m) => {
        let pinBg = '#3b82f6';
        let pinIcon = '📍';
        let pulseClass = '';

        switch (m.type) {
          case 'sos':
            pinBg = '#ef4444'; // Red
            pinIcon = '🚨';
            pulseClass = 'animate-ping';
            break;
          case 'temp_report':
            pinBg = '#f97316'; // Orange
            pinIcon = '⚠️';
            break;
          case 'perm_report':
            pinBg = '#eab308'; // Yellow
            pinIcon = '🚧';
            break;
          case 'responder':
            pinBg = '#10b981'; // Emerald
            pinIcon = '🛡️';
            break;
          case 'safety_point':
            pinBg = '#2563eb'; // Blue
            pinIcon = '🏥';
            break;
          case 'user':
            pinBg = '#0284c7';
            pinIcon = '👤';
            pulseClass = 'animate-pulse';
            break;
        }

        // Custom HTML Marker matching RakshaX theme
        const iconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group" style="transform: translate(-50%, -50%);">
            ${
              pulseClass
                ? `<span class="absolute h-9 w-9 rounded-full opacity-60 ${pulseClass}" style="background-color: ${pinBg};"></span>`
                : ''
            }
            <div style="background-color: ${pinBg}; box-shadow: 0 4px 14px rgba(0,0,0,0.5); border: 2.5px solid #ffffff;"
                 class="relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white transition-transform group-hover:scale-110">
              <span>${pinIcon}</span>
            </div>
          </div>
        `;

        const divIcon = L.divIcon({
          html: iconHtml,
          className: 'rakshax-custom-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([m.lat, m.lng], { icon: divIcon });

        // Popup details card
        const popupContent = `
          <div style="font-family: inherit; min-width: 190px; color: #0f172a; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-weight: 800; font-size: 13px; color: #0f172a;">${m.title}</span>
              ${
                m.status
                  ? `<span style="background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase;">${m.status}</span>`
                  : ''
              }
            </div>
            ${
              m.subtitle
                ? `<div style="font-size: 11px; color: #475569; margin-bottom: 6px;">${m.subtitle}</div>`
                : ''
            }
            <div style="font-family: monospace; font-size: 10px; color: #64748b;">
              ${m.lat.toFixed(5)}, ${m.lng.toFixed(5)}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { offset: [0, -10] });

        marker.on('click', () => {
          if (onMarkerClick) {
            onMarkerClick(m);
          }
        });

        group.addLayer(marker);

        // Accuracy circle for SOS/User
        if ((m.type === 'sos' || m.type === 'user') && m.accuracy && m.accuracy > 5) {
          const accCircle = L.circle([m.lat, m.lng], {
            radius: m.accuracy,
            color: '#ef4444',
            weight: 1,
            fillColor: '#ef4444',
            fillOpacity: 0.12,
          });
          group.addLayer(accCircle);
        }

        // Response-radius circle for Responders (PRD Section 7)
        if (m.type === 'responder' && showCoverageCircles && m.radiusMeters && m.radiusMeters > 0) {
          const covCircle = L.circle([m.lat, m.lng], {
            radius: m.radiusMeters,
            color: '#10b981',
            weight: 1.5,
            dashArray: '4, 4',
            fillColor: '#10b981',
            fillOpacity: 0.1,
          });
          group.addLayer(covCircle);
        }
      });

      // Route rendering (Polylines)
      if (routePolyline && routePolyline.length > 1) {
        if (polylineRef.current) {
          mapRef.current.removeLayer(polylineRef.current);
        }
        const polyline = L.polyline(routePolyline, {
          color: '#2563eb',
          weight: 4,
          opacity: 0.8,
          dashArray: '6, 8',
        }).addTo(mapRef.current);
        polylineRef.current = polyline;
      }
    }

    updateLayers();

    return () => {
      isCancelled = true;
    };
  }, [
    isReady,
    filteredMarkers,
    routePolyline,
    showCoverageCircles,
    onMarkerClick,
  ]);

  // Handle selectedMarkerId focus
  useEffect(() => {
    if (!isReady || !mapRef.current || !selectedMarkerId) return;
    const found = markers.find((m) => m.id === selectedMarkerId);
    if (found) {
      mapRef.current.flyTo([found.lat, found.lng], 15, { duration: 1.2 });
    }
  }, [isReady, selectedMarkerId, markers]);

  const handleRecenter = () => {
    if (!mapRef.current) return;
    if (filteredMarkers.length > 0) {
      import('leaflet').then((L) => {
        const bounds = L.latLngBounds(filteredMarkers.map((m) => [m.lat, m.lng]));
        mapRef.current?.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      });
    } else {
      mapRef.current.setView(center, zoom);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-[#070D19] shadow-2xl ${className}`}>
      {/* Real Map Container */}
      <div
        ref={containerRef}
        style={{ height, width: '100%' }}
        className="z-0"
      />

      {/* Floating Recenter & Telemetry Overlay */}
      <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-center justify-between text-xs z-[400]">
        <div className="pointer-events-auto flex items-center gap-2 rounded-lg bg-slate-900/90 px-3 py-1.5 border border-slate-700/80 text-slate-200 backdrop-blur shadow-md">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">Live GIS • OpenStreetMap Real Tiles</span>
        </div>

        <button
          onClick={handleRecenter}
          className="pointer-events-auto rounded-lg bg-slate-900/90 px-3 py-1.5 border border-slate-700/80 text-xs font-bold text-blue-400 hover:text-blue-300 hover:bg-slate-800 backdrop-blur shadow-md transition"
        >
          🎯 Recenter All ({filteredMarkers.length})
        </button>
      </div>
    </div>
  );
}
