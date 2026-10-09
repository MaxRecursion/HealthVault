import type { RangeBand, ReferenceRange, ResultStatus } from "../types/health";

function matchesBand(value: number, band: RangeBand): boolean {
  const lowerMatch = band.lower === undefined
    || (band.lowerInclusive === false ? value > band.lower : value >= band.lower);
  const upperMatch = band.upper === undefined
    || (band.upperInclusive === false ? value < band.upper : value <= band.upper);
  return lowerMatch && upperMatch;
}

export function getMatchedBand(value: number, range: ReferenceRange | null): RangeBand | undefined {
  return range?.bands?.find((band) => matchesBand(value, band));
}

export function deriveStatus(value: number | null, range: ReferenceRange | null): ResultStatus {
  if (value === null) return "missing";
  if (!range) return "unclassified";
  if (range.bands) return getMatchedBand(value, range)?.status ?? "unclassified";

  if (range.lower === undefined && range.upper === undefined) return "unclassified";
  if (
    range.lower !== undefined
    && (range.lowerInclusive === false ? value <= range.lower : value < range.lower)
  ) return "low";
  if (
    range.upper !== undefined
    && (range.upperInclusive === false ? value >= range.upper : value > range.upper)
  ) return "high";
  return "normal";
}

export function statusLabel(status: ResultStatus): string {
  switch (status) {
    case "normal": return "Normal";
    case "low": return "Low";
    case "high": return "High";
    case "borderline": return "Borderline";
    case "missing": return "Missing";
    case "unclassified": return "Unclassified";
  }
}

export function statusTone(status: ResultStatus): string {
  switch (status) {
    case "normal": return "status-normal";
    case "low": return "status-low";
    case "high": return "status-high";
    case "borderline": return "status-borderline";
    case "missing": return "status-missing";
    case "unclassified": return "status-unclassified";
  }
}
