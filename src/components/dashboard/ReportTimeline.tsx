import { CalendarDays, Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { BloodReport } from "../../types/health";

interface ReportTimelineProps {
  reports: BloodReport[];
  selectedReportId: string;
  onSelect: (reportId: string) => void;
}

export function ReportTimeline({ reports, selectedReportId, onSelect }: ReportTimelineProps) {
  const reduceMotion = useReducedMotion();
  return (
    <section className="timeline-card surface-card" aria-labelledby="timeline-title">
      <div className="section-heading-inline">
        <div>
          <div className="eyebrow"><CalendarDays size={14} /> REPORT TIMELINE</div>
          <h2 id="timeline-title">Compare your reports</h2>
        </div>
        <p className="section-side-note">Select a date to inspect that report’s ranges and statuses.</p>
      </div>
      <div className="timeline-options" role="group" aria-label="Select a blood report date">
        <span className="timeline-rail" aria-hidden="true" />
        {reports.map((report, index) => {
          const selected = report.id === selectedReportId;
          return (
            <button
              key={report.id}
              type="button"
              className={`timeline-option ${selected ? "timeline-option-selected" : ""}`}
              onClick={() => onSelect(report.id)}
              aria-pressed={selected}
            >
              <span className="timeline-node" aria-hidden="true">
                {selected && (
                  <motion.span
                    layoutId="report-timeline-selection"
                    className="timeline-node-active"
                    transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 460, damping: 34 }}
                  />
                )}
                <span className="timeline-node-label">{selected ? <Check size={12} /> : index + 1}</span>
              </span>
              <span className="timeline-option-label">{report.shortLabel}</span>
              <span className="timeline-option-date">{report.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
