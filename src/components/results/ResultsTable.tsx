import { ChevronDown, ChevronRight, Search, SlidersHorizontal, ArrowDownUp } from "lucide-react";
import { useMemo, useState } from "react";
import { biomarkerCatalog, readBiomarker, reports } from "../../data/bloodReports";
import type { BiomarkerCategory, BiomarkerId, BiomarkerResult, ResultStatus } from "../../types/health";
import { formatValue } from "../../utils/formatters";
import { deriveStatus, statusLabel } from "../../utils/referenceRanges";
import { StatusBadge } from "../ui/StatusBadge";

type StatusFilter = "all" | ResultStatus;
type SortDirection = "asc" | "desc";

interface ResultsTableProps {
  selectedReportId: string;
}

function ReadingCell({ reading }: { reading: BiomarkerResult }) {
  const status = deriveStatus(reading.value, reading.referenceRange);
  return (
    <td className="reading-cell">
      <span className={`reading-value ${status === "high" || status === "low" || status === "borderline" ? `reading-value-${status}` : ""}`}>
        {formatValue(reading.value, reading.precision)}
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

export function ResultsTable({ selectedReportId }: ResultsTableProps) {
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
          <p className="section-description">Compare all three reports. Expand a row to see each source range.</p>
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
                      <ReadingCell key={reading.sourceDate} reading={reading} />
                    ))}
                    <td className="range-cell">{selected.referenceRange?.label ?? "Not stated"}</td>
                    <td><StatusBadge reading={selected} /></td>
                    <td className="trend-cell">
                      {delta === null ? "—" : delta === 0 ? "No change" : `${delta > 0 ? "↑" : "↓"} ${formatValue(Math.abs(delta), metric.precision)}`}
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="expanded-row">
                      <td colSpan={7}>
                        <div className="expanded-readings">
                          {readings.map((reading) => <ExpandedReading key={reading.sourceDate} reading={reading} />)}
                        </div>
                      </td>
                    </tr>
                  )}
                </FragmentRows>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-table-cell">
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
