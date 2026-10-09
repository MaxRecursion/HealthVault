import { ArrowUpRight, FileText } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getReportResults, readBiomarker, reports } from "../../data/bloodReports";
import type { BiomarkerId, BloodReport } from "../../types/health";
import { formatValue } from "../../utils/formatters";
import { deriveStatus } from "../../utils/referenceRanges";
import { StatusBadge } from "../ui/StatusBadge";

interface ReportSnapshotProps {
  report: BloodReport;
  onShowResults: () => void;
}

const snapshotMarkers: BiomarkerId[] = [
  "hba1c",
  "fasting-glucose",
  "triglycerides",
  "hdl",
  "ldl",
  "creatinine",
  "uric-acid",
  "total-bilirubin",
  "tsh",
  "vitamin-b12",
  "vitamin-d",
];

export function ReportSnapshot({ report, onShowResults }: ReportSnapshotProps) {
  const reduceMotion = useReducedMotion();
  const results = getReportResults(report);
  const measuredCount = results.filter((reading) => reading.value !== null).length;
  const flaggedCount = results.filter((reading) => {
    const status = deriveStatus(reading.value, reading.referenceRange);
    return status === "high" || status === "low" || status === "borderline";
  }).length;

  return (
    <AnimatePresence mode="wait" initial={false}>
    <motion.section
      key={report.id}
      className="snapshot-card surface-card"
      aria-labelledby="snapshot-title"
      initial={reduceMotion ? false : { opacity: 0, y: 7 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
      transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="section-heading-inline snapshot-heading">
        <div>
          <div className="eyebrow"><FileText size={14} /> SELECTED REPORT</div>
          <h2 id="snapshot-title">{report.label}</h2>
          <p className="snapshot-lab">
            {report.laboratory}{report.processingLaboratory ? ` · processed by ${report.processingLaboratory}` : ""}
          </p>
        </div>
        <div className="snapshot-counts">
          <span><strong>{measuredCount}</strong> measured</span>
          <span><strong>{flaggedCount}</strong> flagged</span>
        </div>
      </div>
      <div className="snapshot-grid">
        {snapshotMarkers.map((id) => {
          const reading = readBiomarker(report, id);
          if (reading.value === null) return null;
          return (
            <div className="snapshot-metric" key={id}>
              <span>{reading.name}</span>
              <strong>{formatValue(reading.value, reading.precision)} <small>{reading.unit}</small></strong>
              <StatusBadge reading={reading} />
            </div>
          );
        })}
      </div>
      <div className="snapshot-footer">
        <span>Status is calculated against this report’s printed interval.</span>
        <button type="button" className="text-link" onClick={onShowResults}>
          View all results <ArrowUpRight size={14} />
        </button>
      </div>
    </motion.section>
    </AnimatePresence>
  );
}

export function compareReports(id: BiomarkerId) {
  return {
    latest: readBiomarker(reports.at(-1)!, id),
    previous: readBiomarker(reports.at(-2)!, id),
  };
}
