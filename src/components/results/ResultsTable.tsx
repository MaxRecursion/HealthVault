import { ChevronDown, ChevronRight, Search, SlidersHorizontal, ArrowDownUp } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { biomarkerCatalog, readBiomarker, reports } from "../../data/bloodReports";
import type { BiomarkerCategory, BiomarkerId, BiomarkerResult, RangeBand, ResultStatus } from "../../types/health";
import { formatValue } from "../../utils/formatters";
import { deriveStatus, getMatchedBand, statusLabel } from "../../utils/referenceRanges";
import { StatusBadge } from "../ui/StatusBadge";

type StatusFilter = "all" | ResultStatus;
type SortDirection = "asc" | "desc";

interface ResultsTableProps {
  selectedReportId: string;
}

function ReadingCell({ reading, selected }: { reading: BiomarkerResult; selected: boolean }) {
  const status = deriveStatus(reading.value, reading.referenceRange);
  const formattedValue = formatValue(reading.value, reading.precision);
  const accessibleStatus = statusLabel(status);
  return (
    <td
      className={`reading-cell reading-cell-${status} ${selected ? "reading-cell-selected" : ""}`}
      aria-label={`${accessibleStatus}: ${formattedValue}${reading.value === null ? "" : ` ${reading.unit}`}`}
      title={`${accessibleStatus}${reading.referenceRange ? ` · Lab range: ${reading.referenceRange.label}` : ""}`}
    >
      <span className={`reading-value ${status === "high" || status === "low" || status === "borderline" ? `reading-value-${status}` : ""}`}>
        {formattedValue}
      </span>
      {status === "high" || status === "low" || status === "borderline" ? (
        <span className={`cell-flag cell-flag-${status}`} aria-label={statusLabel(status)}>
          {status === "high" ? "H" : status === "low" ? "L" : "B"}
        </span>
      ) : null}
    </td>
  );
}

function ExpandedReading({ reading }: { reading: BiomarkerResult }) {
  const status = deriveStatus(reading.value, reading.referenceRange);
  return (
    <div className="expanded-reading">
      <span className="expanded-date">{reading.sourceLabel}</span>
      <strong>{formatValue(reading.value, reading.precision)} <small>{reading.unit}</small></strong>
      <span className="expanded-range"><b>Lab range</b> {reading.referenceRange?.label ?? "Not stated in this report"}</span>
      <span className="expanded-status">
        <b>Derived status</b> <StatusBadge status={status} />
      </span>
      <span className="expanded-status-note">
        Source status: {reading.reportedStatus ?? "Not separately stated"}
      </span>
    </div>
  );
}

interface NumericBand {
  lower?: number;
  upper?: number;
  status: RangeBand["status"];
}

function numericBands(reading: BiomarkerResult): NumericBand[] {
  const range = reading.referenceRange;
  if (!range) return [];
  if (range.bands?.length) {
    return range.bands.map(({ lower, upper, status }) => ({ lower, upper, status }));
  }
  if (range.lower === undefined && range.upper === undefined) return [];
  return [{ lower: range.lower, upper: range.upper, status: "normal" }];
}

function rangeDistanceLabel(reading: BiomarkerResult): string {
  if (reading.value === null) return "No result in this report";
  const range = reading.referenceRange;
  const segments = numericBands(reading);
  if (!range || segments.length === 0) return "No numeric bounds printed";

  const band = range.bands?.length ? getMatchedBand(reading.value, range) : undefined;
  const segment = band ?? segments[0];
  if (!segment) return "No numeric bounds printed";
  const status = deriveStatus(reading.value, range);

  const boundaries = Array.from(new Set(segments.flatMap(({ lower, upper }) => [lower, upper])
    .filter((bound): bound is number => bound !== undefined && Number.isFinite(bound))));
  const formatDistance = (distance: number) => `${formatValue(distance, reading.precision)} ${reading.unit}`;
  const percentFrom = (distance: number, boundary: number) => boundary === 0
    ? ""
    : ` (${formatValue((distance / Math.abs(boundary)) * 100, 1)}% of boundary)`;

  if (range.bands?.length && !band) {
    const nearest = boundaries
      .map((boundary) => ({ boundary, distance: Math.abs(reading.value! - boundary) }))
      .sort((left, right) => left.distance - right.distance)[0];
    return nearest
      ? `${formatDistance(nearest.distance)} to nearest printed category boundary`
      : "No numeric bounds printed";
  }

  if (band) {
    const category = `In ${band.label} category`;
    if (band.lower !== undefined && band.upper !== undefined) {
      const distance = Math.min(Math.abs(reading.value - band.lower), Math.abs(band.upper - reading.value));
      const width = Math.abs(band.upper - band.lower);
      return `${category} · ${formatDistance(distance)} from edge (${formatValue(width === 0 ? 0 : (distance / width) * 100, 0)}% of span)`;
    }
    if (band.upper !== undefined) {
      const distance = Math.abs(band.upper - reading.value);
      return `${category} · ${formatDistance(distance)} below ${formatValue(band.upper, reading.precision)}${percentFrom(distance, band.upper)}`;
    }
    if (band.lower !== undefined) {
      const distance = Math.abs(reading.value - band.lower);
      return `${category} · ${formatDistance(distance)} above ${formatValue(band.lower, reading.precision)}${percentFrom(distance, band.lower)}`;
    }
  }

  if (status === "low" && segment.lower !== undefined) {
    const distance = segment.lower - reading.value;
    return `${formatDistance(distance)} below lower limit ${formatValue(segment.lower, reading.precision)}${percentFrom(distance, segment.lower)}`;
  }
  if (status === "high" && segment.upper !== undefined) {
    const distance = reading.value - segment.upper;
    return `${formatDistance(distance)} above upper limit ${formatValue(segment.upper, reading.precision)}${percentFrom(distance, segment.upper)}`;
  }
  if (segment.lower !== undefined && reading.value < segment.lower) {
    const distance = segment.lower - reading.value;
    return `${formatDistance(distance)} below lower limit ${formatValue(segment.lower, reading.precision)}${percentFrom(distance, segment.lower)}`;
  }
  if (segment.upper !== undefined && reading.value > segment.upper) {
    const distance = reading.value - segment.upper;
    return `${formatDistance(distance)} above upper limit ${formatValue(segment.upper, reading.precision)}${percentFrom(distance, segment.upper)}`;
  }

  const edges = [segment.lower, segment.upper]
    .filter((bound): bound is number => bound !== undefined && Number.isFinite(bound));
  if (edges.length === 2) {
    const distance = Math.min(...edges.map((edge) => Math.abs(reading.value! - edge)));
    const intervalWidth = Math.abs(edges[1]! - edges[0]!);
    const percentOfInterval = intervalWidth === 0 ? 0 : (distance / intervalWidth) * 100;
    return `Within range · ${formatDistance(distance)} from edge (${formatValue(percentOfInterval, 0)}% of span)`;
  }
  if (segment.upper !== undefined) {
    const distance = Math.abs(segment.upper - reading.value);
    const relation = reading.value <= segment.upper ? "below" : "above";
    return `Within limit · ${formatDistance(distance)} ${relation} ${formatValue(segment.upper, reading.precision)}${percentFrom(distance, segment.upper)}`;
  }
  if (segment.lower !== undefined) {
    const distance = Math.abs(reading.value - segment.lower);
    const relation = reading.value >= segment.lower ? "above" : "below";
    return `Within limit · ${formatDistance(distance)} ${relation} ${formatValue(segment.lower, reading.precision)}${percentFrom(distance, segment.lower)}`;
  }
  return "No numeric bounds printed";
}

function MiniTrendCell({
  metricName,
  readings,
  selectedReportId,
}: {
  metricName: string;
  readings: BiomarkerResult[];
  selectedReportId: string;
}) {
  const plotTop = 5;
  const plotBottom = 34;
  const pointX = [20, 78, 136];
  const selectedIndex = reports.findIndex((report) => report.id === selectedReportId);
  const selectedReading = readings[selectedIndex] ?? readings.at(-1)!;
  const segments = readings.map(numericBands);
  const domainValues = [
    ...readings.flatMap((reading) => reading.value === null ? [] : [reading.value]),
    ...segments.flatMap((items) => items.flatMap(({ lower, upper }) => [lower, upper])
      .filter((bound): bound is number => bound !== undefined && Number.isFinite(bound))),
  ];
  const positiveValues = domainValues.filter((value) => value > 0);
  const smallestPositive = positiveValues.length ? Math.min(...positiveValues) : 1;
  const largestPositive = positiveValues.length ? Math.max(...positiveValues) : 10;
  const domainMin = smallestPositive / 1.7;
  const domainMax = Math.max(largestPositive * 1.7, domainMin * 10);
  const logMin = Math.log(domainMin);
  const logSpan = Math.log(domainMax) - logMin;
  const yFor = (value: number | undefined) => {
    if (value === undefined) return plotBottom;
    if (value <= 0) return plotBottom;
    const fraction = Math.min(1, Math.max(0, (Math.log(value) - logMin) / logSpan));
    return plotBottom - fraction * (plotBottom - plotTop);
  };
  const summary = rangeDistanceLabel(selectedReading);
  const accessibleReadings = readings.map((reading) => {
    const status = statusLabel(deriveStatus(reading.value, reading.referenceRange));
    const value = reading.value === null ? "no measured value" : `${formatValue(reading.value, reading.precision)} ${reading.unit}`;
    return `${reading.sourceLabel}: ${value}; ${status}; printed range ${reading.referenceRange?.label ?? "not stated"}`;
  }).join(". ");
  const shortDate = (label: string) => label.split(" ")[0] ?? label;

  return (
    <td className="mini-trend-cell">
      <div className="mini-trend-wrap">
        <svg
          className="mini-range-plot"
          viewBox="0 0 156 51"
          role="img"
          aria-label={`${metricName} logarithmic trend and reference bands. ${accessibleReadings}. Selected result position: ${summary}. Zero values are shown at the bottom of the log scale.`}
        >
          <title>{`${metricName}: three dated values with each report’s numeric reference interval`}</title>
          {pointX.map((x, index) => (
            <g key={`range-${readings[index]?.sourceDate ?? index}`}>
              {index === selectedIndex ? <rect className="mini-selected-column" x={x - 13} y={plotTop - 2} width="26" height={plotBottom - plotTop + 4} rx="5" /> : null}
              <line className="mini-date-guide" x1={x} x2={x} y1={plotTop} y2={plotBottom} />
              {segments[index]?.map((segment, bandIndex) => {
                const top = segment.upper === undefined ? plotTop : yFor(segment.upper);
                const bottom = segment.lower === undefined ? plotBottom : yFor(segment.lower);
                const rectTop = Math.min(top, bottom);
                const rectHeight = Math.max(1.5, Math.abs(bottom - top));
                return (
                  <g className={`mini-range-zone mini-range-zone-${segment.status}`} key={`band-${bandIndex}`}>
                    <rect x={x - 6} y={rectTop} width="12" height={rectHeight} rx="2.5" />
                    {segment.upper !== undefined ? <line x1={x - 8} x2={x + 8} y1={top} y2={top} /> : null}
                    {segment.lower !== undefined ? <line x1={x - 8} x2={x + 8} y1={bottom} y2={bottom} /> : null}
                  </g>
                );
              })}
            </g>
          ))}
          <line className="mini-axis-line" x1="8" x2="148" y1={plotBottom} y2={plotBottom} />
          {readings.slice(0, -1).map((reading, index) => {
            const next = readings[index + 1];
            if (reading.value === null || next?.value === null || !next) return null;
            return (
              <line
                className="mini-trend-line"
                key={`trend-${reading.sourceDate}-${next.sourceDate}`}
                x1={pointX[index]}
                y1={yFor(reading.value)}
                x2={pointX[index + 1]}
                y2={yFor(next.value)}
              />
            );
          })}
          {readings.map((reading, index) => {
            if (reading.value === null) return null;
            const status = deriveStatus(reading.value, reading.referenceRange);
            const selected = index === selectedIndex;
            return (
              <circle
                className={`mini-value-dot mini-value-dot-${status} ${selected ? "mini-value-dot-selected" : ""}`}
                key={`value-${reading.sourceDate}`}
                cx={pointX[index]}
                cy={yFor(reading.value)}
                r={selected ? 3.5 : 2.4}
              >
                <title>{`${reading.sourceLabel}: ${formatValue(reading.value, reading.precision)} ${reading.unit}; ${statusLabel(status)}; range ${reading.referenceRange?.label ?? "not stated"}`}</title>
              </circle>
            );
          })}
          {readings.map((reading, index) => (
            <text className={`mini-date-label ${index === selectedIndex ? "mini-date-label-selected" : ""}`} key={`date-${reading.sourceDate}`} x={pointX[index]} y="48" textAnchor="middle">
              {shortDate(reading.sourceLabel)}
            </text>
          ))}
        </svg>
        <span className={`mini-range-distance mini-range-distance-${deriveStatus(selectedReading.value, selectedReading.referenceRange)}`} title={summary}>{summary}</span>
      </div>
    </td>
  );
}

export function ResultsTable({ selectedReportId }: ResultsTableProps) {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | BiomarkerCategory>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<BiomarkerId | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [sortByValue, setSortByValue] = useState(false);
  const [sortReportId, setSortReportId] = useState(reports.at(-1)!.id);
  const selectedReport = reports.find((report) => report.id === selectedReportId) ?? reports.at(-1)!;
  const sortReport = reports.find((report) => report.id === sortReportId) ?? selectedReport;
  const categories = Array.from(new Set(biomarkerCatalog.map((metric) => metric.category)));

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filtered = biomarkerCatalog.filter((metric) => {
      const current = readBiomarker(selectedReport, metric.id);
      const status = deriveStatus(current.value, current.referenceRange);
      return metric.name.toLocaleLowerCase().includes(normalizedQuery)
        && (category === "all" || metric.category === category)
        && (statusFilter === "all" || status === statusFilter);
    });

    return filtered.sort((left, right) => {
      const order = sortDirection === "asc" ? 1 : -1;
      if (sortByValue) {
        const leftValue = readBiomarker(sortReport, left.id).value;
        const rightValue = readBiomarker(sortReport, right.id).value;
        if (leftValue === null && rightValue !== null) return 1;
        if (rightValue === null && leftValue !== null) return -1;
        return ((leftValue ?? 0) - (rightValue ?? 0)) * order;
      }
      return left.name.localeCompare(right.name) * order;
    });
  }, [category, query, selectedReport, sortByValue, sortDirection, sortReport, statusFilter]);

  function toggleNameSort() {
    if (sortByValue) {
      setSortByValue(false);
      setSortDirection("asc");
    } else {
      setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
    }
  }

  function toggleValueSort(reportId: string) {
    if (!sortByValue || sortReportId !== reportId) {
      setSortByValue(true);
      setSortReportId(reportId);
      setSortDirection("desc");
    } else {
      setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
    }
  }

  return (
    <section className="results-section" aria-labelledby="results-title">
      <div className="section-heading-row">
        <div>
          <div className="eyebrow">COMPLETE RESULTS</div>
          <h2 id="results-title">Biomarker results</h2>
          <p className="section-description">Compare the reports and each lab’s own bounds. Mini charts use a logarithmic value scale; expand a row for exact ranges.</p>
        </div>
        <span className="results-count">{rows.length} of {biomarkerCatalog.length} markers</span>
      </div>

      <div className="results-toolbar">
        <label className="search-field">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Search biomarkers</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search biomarkers"
            aria-label="Search biomarkers"
          />
        </label>
        <label className="select-field">
          <SlidersHorizontal size={15} aria-hidden="true" />
          <span className="sr-only">Filter by category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value as "all" | BiomarkerCategory)} aria-label="Filter by category">
            <option value="all">All categories</option>
            {categories.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <ChevronDown size={14} aria-hidden="true" />
        </label>
        <label className="select-field">
          <span className="sr-only">Filter by selected report status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} aria-label={`Filter by status in ${selectedReport.shortLabel}`}>
            <option value="all">All statuses</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
            <option value="high">High</option>
            <option value="borderline">Borderline</option>
            <option value="missing">Missing</option>
            <option value="unclassified">Unclassified</option>
          </select>
          <ChevronDown size={14} aria-hidden="true" />
        </label>
        <span className="filter-context">Status uses {selectedReport.shortLabel}</span>
      </div>

      <div className="results-heatmap-legend" aria-label="Results table color key">
        <span className="heatmap-legend-intro">Cell tint follows that report’s range:</span>
        <span><i className="heatmap-swatch heatmap-swatch-normal" />Within range</span>
        <span><i className="heatmap-swatch heatmap-swatch-borderline" />Low / borderline</span>
        <span><i className="heatmap-swatch heatmap-swatch-high" />High</span>
        <span><i className="heatmap-swatch heatmap-swatch-neutral" />Missing / unclassified</span>
      </div>
      <p className="mini-trend-key"><span className="mini-key-dot" /> Value <span className="mini-key-band" /> Report’s printed band <span className="mini-key-selected" /> Selected report · Log scale; zero sits at the chart floor</p>

      <div className="table-scroll surface-card">
        <table className="results-table">
          <caption className="sr-only">Biomarker values, references, and trends across May 2025, November 2025, and October 2026</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky-column biomarker-column">
                <button type="button" className="sort-button" onClick={toggleNameSort} aria-label="Sort by biomarker">
                  Biomarker <ArrowDownUp size={13} />
                </button>
              </th>
              {reports.map((report) => (
                <th scope="col" key={report.id} className={report.id === selectedReportId ? "selected-report-column" : ""}>
                  <button type="button" className="sort-button value-sort" onClick={() => toggleValueSort(report.id)} aria-label={`Sort by value in ${report.shortLabel}`}>
                    {report.shortLabel}{report.id === selectedReportId ? <span className="selected-dot" aria-hidden="true" /> : null}
                  </button>
                </th>
              ))}
              <th scope="col" className="mini-trend-heading">Trend &amp; bounds <small>log scale</small></th>
              <th scope="col">Selected range</th>
              <th scope="col">Selected status</th>
              <th scope="col">Trend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((metric) => {
              const selected = readBiomarker(selectedReport, metric.id);
              const expanded = expandedId === metric.id;
              const readings = reports.map((report) => readBiomarker(report, metric.id));
              const first = readings.find((reading) => reading.value !== null);
              const latest = [...readings].reverse().find((reading) => reading.value !== null);
              const delta = first?.value !== null && first?.value !== undefined && latest?.value !== null && latest?.value !== undefined
                ? latest.value - first.value
                : null;
              return (
                <FragmentRows key={metric.id}>
                  <tr className={`result-row ${expanded ? "result-row-expanded" : ""}`}>
                    <th scope="row" className="sticky-column biomarker-column">
                      <button
                        type="button"
                        className="expand-marker"
                        onClick={() => setExpandedId(expanded ? null : metric.id)}
                        aria-expanded={expanded}
                        aria-label={`${expanded ? "Collapse" : "Expand"} ${metric.name} reference details`}
                      >
                        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span>
                          <strong>{metric.name}</strong>
                          <small>{metric.category} · {metric.unit}</small>
                        </span>
                      </button>
                    </th>
                    {readings.map((reading) => (
                      <ReadingCell key={reading.sourceDate} reading={reading} selected={reading.sourceDate === selectedReport.date} />
                    ))}
                    <MiniTrendCell metricName={metric.name} readings={readings} selectedReportId={selectedReportId} />
                    <td className="range-cell">{selected.referenceRange?.label ?? "Not stated"}</td>
                    <td><StatusBadge reading={selected} /></td>
                    <td className="trend-cell">
                      {delta === null ? "—" : delta === 0 ? "No change" : `${delta > 0 ? "↑" : "↓"} ${formatValue(Math.abs(delta), metric.precision)}`}
                    </td>
                  </tr>
                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.tr
                        key={`${metric.id}-details`}
                        className="expanded-row"
                        initial={reduceMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.16 }}
                      >
                        <td colSpan={8}>
                          <motion.div
                            className="expanded-readings-shell"
                            initial={reduceMotion ? false : { opacity: 0, y: -3 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduceMotion ? undefined : { opacity: 0, y: -2 }}
                            transition={{ duration: reduceMotion ? 0 : 0.14, ease: [0.22, 1, 0.36, 1] }}
                            style={{ overflow: "hidden" }}
                          >
                            <div className="expanded-readings">
                              {readings.map((reading) => <ExpandedReading key={reading.sourceDate} reading={reading} />)}
                            </div>
                          </motion.div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </FragmentRows>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-table-cell">
                  <Search size={20} />
                  <strong>No biomarkers match these filters.</strong>
                  <span>Try another name, category, or status.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="table-footnote">
        <span><b>H</b> above the report’s printed interval</span>
        <span><b>L</b> below the report’s printed interval</span>
        <span>— no measured result in that report</span>
      </div>
    </section>
  );
}

function FragmentRows({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
