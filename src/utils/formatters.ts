import type { BiomarkerDefinition, BiomarkerResult } from "../types/health";

const numericFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export function formatValue(value: number | null, precision = 1): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  }).format(value);
}

export function formatReading(reading: BiomarkerResult): string {
  return reading.value === null ? "—" : `${formatValue(reading.value, reading.precision)} ${reading.unit}`;
}

export function formatAbsoluteChange(
  change: number | null,
  metric: BiomarkerDefinition,
): string {
  if (change === null || !Number.isFinite(change)) return "No comparison";
  const rounded = Number(change.toFixed(metric.precision));
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  const suffix = metric.id === "hba1c" ? " pp" : ` ${metric.unit}`;
  return `${sign}${formatValue(Math.abs(rounded), metric.precision)}${suffix}`;
}

export function formatAxisTick(value: number): string {
  return numericFormatter.format(value);
}

export function formatDateLabel(date: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" })
    .format(new Date(`${date}T12:00:00`));
}
