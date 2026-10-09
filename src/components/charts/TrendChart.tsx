import { motion, useReducedMotion } from "framer-motion";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { readBiomarker, reports } from "../../data/bloodReports";
import type { BiomarkerId, BiomarkerResult } from "../../types/health";
import { formatAxisTick, formatValue } from "../../utils/formatters";
import { deriveStatus, statusLabel } from "../../utils/referenceRanges";
import { getTrendSummary } from "../../utils/trends";
import { StatusBadge } from "../ui/StatusBadge";

interface TrendChartProps {
  biomarkerId: BiomarkerId;
  index: number;
  note?: string;
}

interface ChartPoint {
  label: string;
  sourceDate: string;
  value: number | null;
  unit: string;
  rangeLabel: string;
  reading: BiomarkerResult;
}

interface TooltipPayloadItem {
  payload?: ChartPoint;
  value?: number | null;
}

interface TooltipContentProps {
  active?: boolean;
  payload?: readonly TooltipPayloadItem[];
}

function ReportTooltip({ active, payload }: TooltipContentProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  const status = deriveStatus(point.reading.value, point.reading.referenceRange);
  return (
    <div className="chart-tooltip">
      <span className="tooltip-date">{point.label}</span>
      <strong>{formatValue(point.value ?? null, point.reading.precision)} {point.unit}</strong>
      <span className="tooltip-range">Reference: {point.rangeLabel}</span>
      <span className={`tooltip-status tooltip-status-${status}`}>{statusLabel(status)}</span>
    </div>
  );
}

export function TrendChart({ biomarkerId, index, note }: TrendChartProps) {
  const reduceMotion = useReducedMotion();
  const summary = getTrendSummary(biomarkerId);
  const metric = summary.latest ?? readBiomarker(reports.at(-1)!, biomarkerId);
  const data: ChartPoint[] = reports.map((report) => {
    const reading = readBiomarker(report, biomarkerId);
    return {
      label: report.shortLabel,
      sourceDate: report.date,
      value: reading.value,
      unit: reading.unit,
      rangeLabel: reading.referenceRange?.label ?? "Not stated in this report",
      reading,
    };
  });

  return (
    <motion.article
      className="chart-card surface-card"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={{ duration: reduceMotion ? 0 : 0.24, delay: reduceMotion ? 0 : Math.min(index * 0.04, 0.2) }}
    >
      <div className="chart-card-heading">
        <div>
          <h3>{metric.name}</h3>
          <span className="chart-unit">{metric.unit}</span>
        </div>
        <div className="chart-latest">
          <strong>{formatValue(metric.value, metric.precision)}</strong>
          <StatusBadge reading={metric} />
        </div>
      </div>
      <div
        className="chart-plot"
        role="img"
        aria-label={`${metric.name} trend: ${data.map((point) => `${point.label} ${point.value === null ? "missing" : `${formatValue(point.value, metric.precision)} ${point.unit}`}`).join(", ")}`}
      >
        {summary.available.length === 0 ? (
          <div className="chart-empty">No measurements are available for these reports.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 5" vertical={false} className="chart-grid" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "var(--muted)" }}
                dy={7}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "var(--muted)" }}
                tickFormatter={formatAxisTick}
                width={42}
                domain={["dataMin - 1", "dataMax + 1"]}
              />
              <Tooltip
                content={(props) => <ReportTooltip active={props.active} payload={props.payload as readonly TooltipPayloadItem[] | undefined} />}
                cursor={{ stroke: "var(--line)", strokeDasharray: "4 4" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                name={metric.name}
                stroke="var(--chart-line)"
                strokeWidth={2.4}
                dot={{ r: 3.5, fill: "var(--chart-line)", stroke: "var(--surface-card)", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "var(--chart-line)", stroke: "var(--surface-card)", strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="chart-card-footer">
        <p>{summary.text}</p>
        {note && <p className="chart-note">{note}</p>}
      </div>
    </motion.article>
  );
}
