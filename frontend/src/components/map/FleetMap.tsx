import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LiveVehicleTelemetry, Warehouse, TrafficZone, RoutePoint } from '../../types';
import { Battery, Gauge, Navigation, Warehouse as WhIcon, Clock, AlertCircle } from 'lucide-react';

// Center of Hyderabad mobility network
const HYD_CENTER: [number, number] = [17.4000, 78.4300];

// Custom HTML DivIcon for Vehicles
function createVehicleIcon(status: string, heading: number = 0) {
  let color = '#10b981'; // green for AVAILABLE
  let pulse = false;

  if (status === 'IN_USE') {
    color = '#06b6d4'; // cyan
    pulse = true;
  } else if (status === 'MAINTENANCE' || status === 'DAMAGED') {
    color = '#f43f5e'; // rose
  } else if (status === 'RETURNING' || status === 'RETURNED' || status === 'CLEANING') {
    color = '#f59e0b'; // amber
  } else if (status === 'RESERVED') {
    color = '#8b5cf6'; // purple
  }

  const html = `
    <div style="
      position: relative;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: rotate(${heading}deg);
    ">
      ${pulse ? `<div style="position: absolute; inset: -4px; border-radius: 9999px; background-color: ${color}; opacity: 0.3; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
      <div style="
        width: 22px;
        height: 22px;
        border-radius: 9999px;
        background: #0f172a;
        border: 2.5px solid ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
      ">
        <div style="width: 7px; height: 7px; border-radius: 9999px; background: ${color};"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-vehicle-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// Custom DivIcon for Warehouse Hubs
function createWarehouseIcon(code: string, workload: number) {
  let badgeBg = '#10b981';
  if (workload > 80) badgeBg = '#f43f5e';
  else if (workload > 60) badgeBg = '#f59e0b';

  const html = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -100%);
    ">
      <div style="
        background: #0f172a;
        border: 2px solid #38bdf8;
        color: #fff;
        padding: 2px 6px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 700;
        font-family: monospace;
        display: flex;
        align-items: center;
        gap: 4px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.6);
        white-space: nowrap;
      ">
        <span>${code}</span>
        <span style="background: ${badgeBg}; color: #000; padding: 1px 4px; border-radius: 4px; font-size: 9px;">${Math.round(workload)}%</span>
      </div>
      <div style="
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 6px solid #38bdf8;
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-warehouse-marker',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

interface FleetMapProps {
  vehicles?: LiveVehicleTelemetry[];
  warehouses?: Warehouse[];
  trafficZones?: TrafficZone[];
  routeWaypoints?: RoutePoint[];
  selectedVehicle?: LiveVehicleTelemetry | null;
  onSelectVehicle?: (vehicle: LiveVehicleTelemetry) => void;
  onSelectWarehouse?: (warehouse: Warehouse) => void;
  showHeatmap?: boolean;
  center?: [number, number];
  zoom?: number;
  height?: string;
}

// Controller to smoothly pan map when center changes
function MapRecenter({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom(), { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

export const FleetMap: React.FC<FleetMapProps> = ({
  vehicles = [],
  warehouses = [],
  trafficZones = [],
  routeWaypoints = [],
  selectedVehicle,
  onSelectVehicle,
  onSelectWarehouse,
  showHeatmap = false,
  center = HYD_CENTER,
  zoom = 12,
  height = '100%',
}) => {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full dark-tiles z-0"
      >
        <MapRecenter center={center} zoom={zoom} />

        {/* CartoDB Dark Matter tiles (free, reliable OpenStreetMap style) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* Traffic Zones Overlay Circles */}
        {trafficZones.map((zone) => {
          let color = '#10b981'; // Free
          let fillOpacity = 0.12;

          if (zone.congestion_level === 'SEVERE') {
            color = '#f43f5e';
            fillOpacity = 0.28;
          } else if (zone.congestion_level === 'HEAVY') {
            color = '#f97316';
            fillOpacity = 0.22;
          } else if (zone.congestion_level === 'MODERATE') {
            color = '#f59e0b';
            fillOpacity = 0.16;
          }

          return (
            <Circle
              key={zone.id}
              center={[zone.center_lat, zone.center_lng]}
              radius={zone.radius_km * 1000}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity,
                weight: 1.5,
                dashArray: '4, 6',
              }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <div className="font-bold text-white mb-1">{zone.name}</div>
                  <div className="flex items-center justify-between text-slate-300 gap-4">
                    <span>Speed: <b className="text-white">{zone.current_speed_avg} km/h</b></span>
                    <span>Density: <b className="text-white">{zone.vehicle_density} vehicles</b></span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-amber-400 font-semibold">
                    Status: {zone.congestion_level}
                  </div>
                </div>
              </Popup>
            </Circle>
          );
        })}

        {/* Optional Heatmap Hotspots if enabled */}
        {showHeatmap &&
          trafficZones.map((z) => (
            <Circle
              key={`heat-${z.id}`}
              center={[z.center_lat, z.center_lng]}
              radius={z.radius_km * 600}
              pathOptions={{
                color: 'transparent',
                fillColor: z.congestion_level === 'SEVERE' ? '#f43f5e' : '#f59e0b',
                fillOpacity: 0.35,
              }}
            />
          ))}

        {/* Route Polyline if provided */}
        {routeWaypoints.length > 1 && (
          <Polyline
            positions={routeWaypoints.map((pt) => [pt.lat, pt.lng])}
            pathOptions={{
              color: '#38bdf8',
              weight: 5,
              opacity: 0.9,
              dashArray: '2, 8',
            }}
          />
        )}

        {/* Warehouse Hub Markers */}
        {warehouses.map((wh) => (
          <Marker
            key={`wh-${wh.id}`}
            position={[wh.latitude, wh.longitude]}
            icon={createWarehouseIcon(wh.code, wh.workload_score)}
            eventHandlers={{
              click: () => onSelectWarehouse && onSelectWarehouse(wh),
            }}
          >
            <Popup>
              <div className="p-1 text-xs space-y-1">
                <div className="font-bold text-white text-sm">{wh.name}</div>
                <div className="text-slate-400 text-[11px]">{wh.address}</div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[11px]">
                  <div>Workload: <b className="text-emerald-400">{wh.workload_score}%</b></div>
                  <div>Vehicles: <b className="text-white">{wh.current_vehicle_count} / {wh.capacity}</b></div>
                  <div>Pending Dispatches: <b className="text-amber-400">{wh.pending_dispatches}</b></div>
                  <div>Pending Returns: <b className="text-cyan-400">{wh.pending_returns}</b></div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Vehicle Markers */}
        {vehicles.map((v) => (
          <Marker
            key={`veh-${v.vehicle_id}`}
            position={[v.latitude, v.longitude]}
            icon={createVehicleIcon(v.status, v.heading)}
            eventHandlers={{
              click: () => onSelectVehicle && onSelectVehicle(v),
            }}
          >
            <Popup>
              <div className="p-1 text-xs space-y-1.5 min-w-[200px]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{v.registration_number}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-800 text-emerald-400">
                    {v.status}
                  </span>
                </div>
                <div className="text-slate-300 font-medium">{v.brand} {v.model} ({v.vehicle_type})</div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1">
                    <Gauge className="h-3 w-3 text-cyan-400" />
                    <span>{v.speed} km/h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Battery className="h-3 w-3 text-emerald-400" />
                    <span>{v.battery}%</span>
                  </div>
                </div>
                {v.customer_name && (
                  <div className="pt-1 border-t border-slate-800 text-[11px]">
                    <span className="text-slate-400">Customer: </span>
                    <span className="text-white font-medium">{v.customer_name}</span>
                  </div>
                )}
                {v.destination && (
                  <div className="text-[11px] text-slate-300 flex items-center gap-1">
                    <Navigation className="h-3 w-3 text-amber-400" />
                    <span>Destination: {v.destination} (ETA {v.eta_minutes || 20}m)</span>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 left-4 z-10 glass-panel p-2.5 rounded-xl text-[11px] text-slate-300 shadow-xl hidden sm:flex flex-col gap-1.5">
        <div className="font-semibold text-white uppercase tracking-wider text-[10px] border-b border-slate-800 pb-1">
          Telemetry Legend
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span>Available Vehicle</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Active Trip (In Use)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span>Returning / Cleaning</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          <span>Maintenance / Repair</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
          <span className="h-2 w-2 rounded-sm border border-cyan-400 bg-slate-900" />
          <span>Warehouse Depot</span>
        </div>
      </div>
    </div>
  );
};
