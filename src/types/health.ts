export type BiomarkerCategory =
  | "Blood counts"
  | "Glucose metabolism"
  | "Lipids"
  | "Kidney & metabolic"
  | "Liver & proteins"
  | "Thyroid profile"
  | "Vitamins"
  | "Other";

export type ResultStatus = "normal" | "low" | "high" | "borderline" | "missing" | "unclassified";

export type BiomarkerId =
  | "hemoglobin"
  | "rbc-count"
  | "hematocrit"
  | "mcv"
  | "mch"
  | "mchc"
  | "rdw-cv"
  | "rdw-sd"
  | "wbc-count"
  | "neutrophils"
  | "lymphocytes"
  | "eosinophils"
  | "monocytes"
  | "basophils"
  | "absolute-neutrophils"
  | "absolute-lymphocytes"
  | "absolute-monocytes"
  | "absolute-eosinophils"
  | "absolute-basophils"
  | "platelet-count"
  | "mpv"
  | "p-lcr"
  | "fasting-glucose"
  | "hba1c"
  | "estimated-average-glucose"
  | "total-cholesterol"
  | "triglycerides"
  | "hdl"
  | "ldl"
  | "vldl"
  | "non-hdl"
  | "total-cholesterol-hdl-ratio"
  | "ldl-hdl-ratio"
  | "hdl-ldl-ratio"
  | "creatinine"
  | "bun"
  | "bun-creatinine-ratio"
  | "urea-creatinine-ratio"
  | "uric-acid"
  | "egfr"
  | "esr"
  | "calcium"
  | "total-protein"
  | "albumin"
  | "globulin"
  | "albumin-globulin-ratio"
  | "total-bilirubin"
  | "direct-bilirubin"
  | "indirect-bilirubin"
  | "alt"
  | "ast"
  | "ast-alt-ratio"
  | "alp"
  | "ggt"
  | "tsh"
  | "total-t3"
  | "total-t4"
  | "vitamin-b12"
  | "vitamin-d"
  | "psa";

export interface RangeBand {
  label: string;
  status: Exclude<ResultStatus, "missing">;
  lower?: number;
  upper?: number;
  lowerInclusive?: boolean;
  upperInclusive?: boolean;
}

export interface ReferenceRange {
  label: string;
  lower?: number;
  upper?: number;
  lowerInclusive?: boolean;
  upperInclusive?: boolean;
  bands?: RangeBand[];
}

export interface BiomarkerDefinition {
  id: string;
  name: string;
  category: BiomarkerCategory;
  unit: string;
  precision: number;
}

export interface ReportMeasurement {
  value: number;
  unit: string;
  referenceRange: ReferenceRange | null;
  reportedStatus: string | null;
}

export interface BloodReport {
  id: string;
  date: string;
  label: string;
  shortLabel: string;
  laboratory: string;
  processingLaboratory: string | null;
  measurements: Partial<Record<BiomarkerId, ReportMeasurement>>;
}

export interface BiomarkerResult extends BiomarkerDefinition {
  value: number | null;
  sourceDate: string;
  sourceLabel: string;
  referenceRange: ReferenceRange | null;
  reportedStatus: string | null;
}

