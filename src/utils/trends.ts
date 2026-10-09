import { readBiomarker, reports } from "../data/bloodReports";
import type { BiomarkerId, BiomarkerResult } from "../types/health";
import { formatValue } from "./formatters";

export interface TrendSummary {
  available: BiomarkerResult[];
  first: BiomarkerResult | undefined;
  latest: BiomarkerResult | undefined;
  previous: BiomarkerResult | undefined;
  totalChange: number | null;
  recentChange: number | null;
  text: string;
}

export function getTrendSummary(id: BiomarkerId): TrendSummary {
  const available = reports
    .map((report) => readBiomarker(report, id))
    .filter((reading) => reading.value !== null);
  const first = available[0];
  const latest = available.at(-1);
  const previous = available.length > 1 ? available[available.length - 2] : undefined;
  const totalChange = first?.value !== null && first?.value !== undefined && latest?.value !== null && latest?.value !== undefined
    ? latest.value - first.value
    : null;
  const recentChange = previous?.value !== null && previous?.value !== undefined && latest?.value !== null && latest?.value !== undefined
    ? latest.value - previous.value
    : null;

  let text: string;
  if (available.length < 2 || !first || !latest || totalChange === null) {
    text = `Measured in ${available.length} ${available.length === 1 ? "report" : "reports"}.`;
  } else {
    text = `${first.sourceLabel} to ${latest.sourceLabel}: ${totalChange > 0 ? "up" : totalChange < 0 ? "down" : "unchanged"} ${formatValue(Math.abs(totalChange), latest.precision)} ${latest.unit}.`;
    if (previous && recentChange !== null && available.length > 2) {
      text += ` Since ${previous.sourceLabel}: ${recentChange > 0 ? "up" : recentChange < 0 ? "down" : "unchanged"} ${formatValue(Math.abs(recentChange), latest.precision)} ${latest.unit}.`;
    }
  }

  return { available, first, latest, previous, totalChange, recentChange, text };
}
