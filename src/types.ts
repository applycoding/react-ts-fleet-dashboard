export type UnitKind = 'ground' | 'drone';

export type UnitStatus = 'enroute' | 'idle' | 'charging' | 'alert';

export type Severity = 'warning' | 'critical';

export type AlertCode = 'low-battery' | 'restricted-zone' | 'link-degraded';

export type UnitBehavior = 'patrol' | 'idle' | 'charging' | 'degraded';

export type DataMode = 'detecting' | 'live' | 'browser';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface FleetUnit {
  id: string;
  callsign: string;
  kind: UnitKind;
  status: UnitStatus;
  lat: number;
  lng: number;
  heading: number;
  speedKph: number;
  batteryPct: number;
  altitudeM: number;
  payload: string;
  routeName: string;
  desk: string;
  link: 'nominal' | 'degraded';
  updatedAt: number;
}

export interface Alert {
  id: string;
  unitId: string;
  callsign: string;
  severity: Severity;
  code: AlertCode;
  message: string;
  at: number;
}

export interface RestrictedZone {
  name: string;
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface TelemetrySample {
  t: number;
  speedKph: number;
  batteryPct: number;
  altitudeM: number;
}

export interface FleetSnapshot {
  units: FleetUnit[];
  alerts: Alert[];
  serverTime: number;
  zone: RestrictedZone;
}

export interface UnitBlueprint {
  id: string;
  callsign: string;
  kind: UnitKind;
  payload: string;
  routeName: string;
  desk: string;
  behavior: UnitBehavior;
  cruiseKph: number;
  phaseMs: number;
  batteryPeriodMs: number;
  altitudeBase: number;
  altitudeAmp: number;
  route: LatLng[];
}
