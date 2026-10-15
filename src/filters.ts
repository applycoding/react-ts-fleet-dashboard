import type { FleetUnit, UnitKind, UnitStatus } from './types';

export interface FleetFilters {
  search: string;
  kind: 'all' | UnitKind;
  status: 'all' | UnitStatus;
}

export function filterUnits(units: FleetUnit[], filters: FleetFilters): FleetUnit[] {
  const query = filters.search.trim().toLowerCase();
  return units.filter((unit) => {
    if (filters.kind !== 'all' && unit.kind !== filters.kind) return false;
    if (filters.status !== 'all' && unit.status !== filters.status) return false;
    if (!query) return true;
    return (
      unit.callsign.toLowerCase().includes(query) ||
      unit.routeName.toLowerCase().includes(query) ||
      unit.payload.toLowerCase().includes(query)
    );
  });
}

function statusRank(status: UnitStatus): number {
  switch (status) {
    case 'alert':
      return 0;
    case 'charging':
      return 1;
    case 'idle':
      return 2;
    case 'enroute':
      return 3;
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

export function sortUnits(units: FleetUnit[]): FleetUnit[] {
  return [...units].sort((a, b) => {
    const byStatus = statusRank(a.status) - statusRank(b.status);
    if (byStatus !== 0) return byStatus;
    if (a.batteryPct !== b.batteryPct) return a.batteryPct - b.batteryPct;
    return a.callsign.localeCompare(b.callsign);
  });
}

export function filtersAreActive(filters: FleetFilters): boolean {
  return filters.search.trim() !== '' || filters.kind !== 'all' || filters.status !== 'all';
}
