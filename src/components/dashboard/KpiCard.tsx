import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { readBiomarker, reports } from "../../data/bloodReports";
import { deriveStatus, statusLabel } from "../../utils/referenceRanges";
import { formatAbsoluteChange, formatValue } from "../../utils/formatters";
import type { BiomarkerDefinition, BiomarkerId, BiomarkerResult } from "../../types/health";
import { StatusBadge } from "../ui/StatusBadge";

interface KpiCardProps {
  title: string;
  metricId: BiomarkerId;
  metric: BiomarkerDefinition;
  latest: BiomarkerResult;
  previous: BiomarkerResult;
  interpretation: string;
  tag: string;
  icon: LucideIcon;
  tone: "green" | "amber" | "blue" | "violet";
  lowerIsFavorable?: boolean;
}

function MiniTrend({ metricId, tone }: { metricId: BiomarkerId; tone: KpiCardProps["tone"] }) {
  const values = reports.map((report) => readBiomarker(report, metricId).value);
  const measured = values.filter((value): value is number => value !== null);
  if (measured.length < 2) return null;

  const minimum = Math.min(...measured);
  const maximum = Math.max(...measured);
  const spread = maximum - minimum || 1;
  type Point = { x: number; y: number };
  const points: (Point | null)[] = values.map((value, index) => value === null ? null : ({
    x: (index / Math.max(values.length - 1, 1)) * 72 + 4,
    y: 24 - ((value - minimum) / spread) * 17,
  }));
  let drawing = false;
  const path = points.reduce<string>((result, point) => {
    if (point === null) {
      drawing = false;
      return result;
    }
    const command = `${drawing ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    drawing = true;
    return `${result} ${command}`.trim();
  }, "");
  const endPoint = [...points].reverse().find((point): point is Point => point !== null);

  return (
    <svg className={`kpi-sparkline kpi-sparkline-${tone}`} viewBox="0 0 80 28" aria-hidden="true">
      <path d={path} />
      {endPoint && <circle cx={endPoint.x} cy={endPoint.y} r="2.4" />}
    </svg>
  );
}

export function KpiCard({
  title,
  metricId,
  metric,
  latest,
  previous,
  interpretation,
  tag,
  icon: Icon,
  tone,
  lowerIsFavorable,
}: KpiCardProps) {
  const reduceMotion = useReducedMotion();
  const delta = latest.value !== null && previous.value !== null ? latest.value - previous.value : null;
  const status = deriveStatus(latest.value, latest.referenceRange);
  const IconTrend = delta === null || delta === 0 ? Minus : delta < 0 ? ArrowDownRight : ArrowUpRight;
  const movementTone = delta === null || delta === 0
    ? "movement-neutral"
    : (lowerIsFavorable ? delta < 0 : delta > 0) ? "movement-positive" : "movement-neutral";

  return (
    <motion.article
      className={`kpi-card kpi-card-${tone} surface-card`}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      transition={{ duration: reduceMotion ? 0 : 0.28, delay: reduceMotion ? 0 : 0.04 }}
    >
      <div className="kpi-card-top">
        <span className={`kpi-icon kpi-icon-${tone}`}><Icon size={17} strokeWidth={1.9} /></span>
        <MiniTrend metricId={metricId} tone={tone} />
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
    </motion.article>
  );
}
