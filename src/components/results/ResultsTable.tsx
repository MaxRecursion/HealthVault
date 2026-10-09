import { ChevronDown, ChevronRight, Search, SlidersHorizontal, ArrowDownUp } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { biomarkerCatalog, readBiomarker, reports } from "../../data/bloodReports";
import type { BiomarkerCategory, BiomarkerId, BiomarkerResult, RangeBand, ReferenceRange, ResultStatus } from "../../types/health";
import { formatValue } from "../../utils/formatters";
import { deriveStatus, statusLabel } from "../../utils/referenceRanges";
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

function numericBands(range: ReferenceRange | null): NumericBand[] {
  if (!range) return [];
  if (range.bands?.length) {
    return range.bands.map(({ lower, upper, status }) => ({ lower, upper, status }));
  }
  if (range.lower === undefined && range.upper === undefined) return [];
  return [{ lower: range.lower, upper: range.upper, status: "normal" }];
}

function selectedRangeBand(range: ReferenceRange, value: number | null): NumericBand | null {
  const bands = numericBands(range);
  if (!bands.length) return null;
  const normalBands = bands.filter((band) => band.status === "normal");
  const candidates = normalBands.length ? normalBands : bands;
  const matchesValue = (band: NumericBand) => value !== null
    && (band.lower === undefined || value >= band.lower)
    && (band.upper === undefined || value <= band.upper);
  const distanceToBand = (band: NumericBand) => {
    if (value === null) return 0;
    if (band.lower !== undefined && value < band.lower) return band.lower - value;
    if (band.upper !== undefined && value > band.upper) return value - band.upper;
    return 0;
  };
  const sorted = [...candidates].sort((left, right) => (left.lower ?? -Infinity) - (right.lower ?? -Infinity));
  if (!normalBands.length) {
    return sorted.find(matchesValue) ?? [...sorted].sort((left, right) => distanceToBand(left) - distanceToBand(right))[0] ?? null;
  }
  const merged = sorted.reduce<NumericBand[]>((result, band) => {
    const previous = result.at(-1);
    if (!previous) {
      result.push({ ...band });
    } else if (previous.upper === undefined) {
      previous.upper = undefined;
    } else if (band.lower === undefined || band.lower <= previous.upper) {
      previous.upper = band.upper === undefined ? undefined : Math.max(previous.upper, band.upper);
    } else {
      result.push({ ...band });
    }
    return result;
  }, []);
  return merged.find(matchesValue) ?? [...merged].sort((left, right) => distanceToBand(left) - distanceToBand(right))[0] ?? null;
}

function RangePositionCell({ metricName, reading }: { metricName: string; reading: BiomarkerResult }) {
  const range = reading.referenceRange;
  const band = range ? selectedRangeBand(range, reading.value) : null;
  if (!band) {
    const note = reading.value === null
      ? `${metricName}: no measured value or numeric reference interval in ${reading.sourceLabel}`
      : `${metricName}: ${formatValue(reading.value, reading.precision)} ${reading.unit}; no numeric reference interval in ${reading.sourceLabel}`;
    return <td className="range-position-cell"><span className="range-position-unavailable" title={note} aria-label={note}>—</span></td>;
  }

  const xStart = 6;
  const xEnd = 126;
  const positive = [band.lower, band.upper, reading.value]
    .filter((value): value is number => value !== undefined && value !== null && value > 0 && Number.isFinite(value));
  const logValues = positive.map(Math.log);
  let minLog = logValues.length ? Math.min(...logValues) : Math.log(1);
  let maxLog = logValues.length ? Math.max(...logValues) : Math.log(10);
  if (maxLog - minLog < 0.2) {
    minLog -= 0.6;
    maxLog += 0.6;
  } else {
    minLog -= 0.22;
    maxLog += 0.22;
  }
  const xFor = (value: number) => {
    if (value <= 0) return xStart;
    const fraction = Math.min(1, Math.max(0, (Math.log(value) - minLog) / (maxLog - minLog)));
    return xStart + fraction * (xEnd - xStart);
  };
  const lineStart = band.lower === undefined ? xStart : xFor(band.lower);
  const lineEnd = band.upper === undefined ? xEnd : xFor(band.upper);
  const status = deriveStatus(reading.value, range);
  const valueText = reading.value === null ? "no measured value" : `${formatValue(reading.value, reading.precision)} ${reading.unit}`;
  const rangeText = range?.label ?? "not stated";
  const description = `${metricName}, ${reading.sourceLabel}: ${valueText}; ${statusLabel(status)}; lab reference range ${rangeText}. The horizontal interval uses a logarithmic value scale.`;

  return (
    <td className="range-position-cell">
      <svg className="range-position-plot" viewBox="0 0 132 16" role="img" aria-label={description}>
        <title>{description}</title>
        <line className="range-position-line" x1={lineStart} x2={Math.max(lineStart, lineEnd)} y1="8" y2="8" />
        {reading.value !== null ? (
          <circle className={`range-position-dot range-position-dot-${status}`} cx={xFor(reading.value)} cy="8" r="2.8">
            <title>{`${formatValue(reading.value, reading.precision)} ${reading.unit} · ${statusLabel(status)}`}</title>
          </circle>
        ) : null}
      </svg>
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
          <p className="section-description">Compare all three reports. Expand a row to see each report’s exact range.</p>
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
              <th scope="col" className="range-position-heading">Range</th>
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
                    <RangePositionCell metricName={metric.name} reading={selected} />
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
