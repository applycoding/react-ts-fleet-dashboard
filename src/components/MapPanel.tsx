import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  Marker,
  Popup,
  Rectangle,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { kindLabel, statusLabel } from '../format';
import { preferenceFromMeta, readMetaContent, resolveScheme } from '../theme';
import type { FleetUnit, RestrictedZone } from '../types';
import { useSystemScheme } from '../useSystemScheme';

function useResolvedScheme(): 'light' | 'dark' {
  const system = useSystemScheme();
  const [meta, setMeta] = useState(readMetaContent);

  useEffect(() => {
    const element = document.querySelector('meta[name="color-scheme"]');
    if (!element) return;
    const observer = new MutationObserver(() => setMeta(readMetaContent()));
    observer.observe(element, { attributes: true, attributeFilter: ['content'] });
    return () => observer.disconnect();
  }, []);

  return resolveScheme(preferenceFromMeta(meta), system);
}

function pinIcon(unit: FleetUnit, selected: boolean): L.DivIcon {
  const selectedClass = selected ? ' is-selected' : '';
  return L.divIcon({
    className: 'pin-wrap',
    html: `<span class="pin pin--${unit.kind} pin--${unit.status}${selectedClass}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function FitOnce({ units }: { units: FleetUnit[] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current || units.length === 0) return;
    const bounds = L.latLngBounds(units.map((unit) => [unit.lat, unit.lng]));
    map.fitBounds(bounds.pad(0.18));
    fitted.current = true;
  }, [map, units]);

  return null;
}

function FollowSelection({ unit }: { unit: FleetUnit | null }) {
  const map = useMap();
  const skipInitial = useRef(true);
  const lastId = useRef<string | null>(null);

  useEffect(() => {
    if (!unit) return;
    if (skipInitial.current) {
      skipInitial.current = false;
      lastId.current = unit.id;
      return;
    }
    if (lastId.current === unit.id) return;
    lastId.current = unit.id;
    const target: L.LatLngExpression = [unit.lat, unit.lng];
    const zoom = Math.max(map.getZoom(), 13);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) map.setView(target, zoom);
    else map.flyTo(target, zoom, { duration: 0.55 });
  }, [map, unit]);

  return null;
}

const TILES = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
} as const;

export function MapPanel({
  units,
  zone,
  selectedId,
  onSelect,
}: {
  units: FleetUnit[];
  zone: RestrictedZone | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const scheme = useResolvedScheme();
  const selected = units.find((unit) => unit.id === selectedId) ?? null;

  return (
    <section aria-label="Live map" className="panel map">
      <header className="panel__head">
        <h2>Map</h2>
        <p className="panel__meta">
          Square ground · Circle drone · {zone?.name ?? 'Zone'} restricted
        </p>
      </header>
      <p className="sr-only">Simulated positions on an OpenStreetMap basemap.</p>
      <div className="map-frame">
        <MapContainer
          center={[37.77, -122.42]}
          zoom={12}
          scrollWheelZoom
          className="map-canvas"
        >
          <TileLayer
            key={scheme}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={TILES[scheme]}
            subdomains="abcd"
            maxZoom={20}
          />
          {zone ? (
            <Rectangle
              bounds={[
                [zone.south, zone.west],
                [zone.north, zone.east],
              ]}
              pathOptions={{
                color: '#e15a45',
                weight: 1.5,
                dashArray: '5 5',
                fillColor: '#e15a45',
                fillOpacity: 0.12,
              }}
            >
              <Tooltip sticky>{zone.name} · restricted airspace</Tooltip>
            </Rectangle>
          ) : null}
          <FitOnce units={units} />
          <FollowSelection unit={selected} />
          {units.map((unit) => (
            <Marker
              key={unit.id}
              position={[unit.lat, unit.lng]}
              icon={pinIcon(unit, unit.id === selectedId)}
              zIndexOffset={unit.id === selectedId ? 500 : 0}
              eventHandlers={{ click: () => onSelect(unit.id) }}
            >
              <Popup>
                <strong>{unit.callsign}</strong>
                <br />
                {kindLabel(unit.kind)} · {statusLabel(unit.status)}
                <br />
                {unit.speedKph} km/h · {unit.batteryPct}% battery
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </section>
  );
}
