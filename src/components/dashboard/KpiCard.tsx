import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { deriveStatus, statusLabel } from "../../utils/referenceRanges";
import { formatAbsoluteChange, formatValue } from "../../utils/formatters";
import type { BiomarkerDefinition, BiomarkerResult } from "../../types/health";
import { StatusBadge } from "../ui/StatusBadge";

interface KpiCardProps {
  title: string;
  metric: BiomarkerDefinition;
  latest: BiomarkerResult;
  previous: BiomarkerResult;
  interpretation: string;
  tag: string;
  icon: LucideIcon;
  tone: "green" | "amber" | "blue" | "violet";
  lowerIsFavorable?: boolean;
}

export function KpiCard({
  title,
  metric,
  latest,
  previous,
  interpretation,
  tag,
  icon: Icon,
  tone,
  lowerIsFavorable,
}: KpiCardProps) {
  const delta = latest.value !== null && previous.value !== null ? latest.value - previous.value : null;
  const status = deriveStatus(latest.value, latest.referenceRange);
  const IconTrend = delta === null || delta === 0 ? Minus : delta < 0 ? ArrowDownRight : ArrowUpRight;
  const movementTone = delta === null || delta === 0
    ? "movement-neutral"
    : (lowerIsFavorable ? delta < 0 : delta > 0) ? "movement-positive" : "movement-neutral";

  return (
    <article className="kpi-card surface-card">
      <div className="kpi-card-top">
        <span className={`kpi-icon kpi-icon-${tone}`}><Icon size={17} strokeWidth={1.9} /></span>
        <span className="kpi-tag">{tag}</span>
      </div>
      <div className="kpi-title-row">
        <h3>{title}</h3>
        <StatusBadge status={status} label={status === "unclassified" ? "No range" : statusLabel(status)} />
      </div>
      <div className="kpi-value-row">
        <strong>{formatValue(latest.value, metric.precision)}</strong>
        <span>{latest.unit}</span>
      </div>
      <div className="kpi-compare-row">
        <span>Previous <b>{formatValue(previous.value, metric.precision)} {previous.unit}</b></span>
        <span className={`movement ${movementTone}`}>
          <IconTrend size={14} />
          {formatAbsoluteChange(delta, metric)}
        </span>
      </div>
      <p className="kpi-interpretation">{interpretation}</p>
    </article>
  );
}
