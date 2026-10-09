import { deriveStatus, statusLabel, statusTone } from "../../utils/referenceRanges";
import type { BiomarkerResult, ResultStatus } from "../../types/health";

interface StatusBadgeProps {
  reading?: BiomarkerResult;
  status?: ResultStatus;
  label?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ reading, status, label, size = "sm" }: StatusBadgeProps) {
  const resolvedStatus = status ?? (reading ? deriveStatus(reading.value, reading.referenceRange) : "unclassified");
  const text = label ?? statusLabel(resolvedStatus);
  return (
    <span className={`status-badge ${statusTone(resolvedStatus)} ${size === "md" ? "status-badge-md" : ""}`}>
      <span className="status-dot" aria-hidden="true" />
      {text}
    </span>
  );
}
