import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  Droplets,
  FlaskConical,
  HeartPulse,
  Leaf,
  ShieldPlus,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import type { BiomarkerCategory, BiomarkerId } from "../../types/health";
import { TrendChart } from "./TrendChart";

interface TrendGroup {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  charts: { id: BiomarkerId; note?: string }[];
}

const trendGroups: TrendGroup[] = [
  {
    id: "glucose",
    label: "Glucose",
    description: "Glycated hemoglobin and fasting glucose are kept on separate axes because their units differ.",
    icon: Activity,
    charts: [{ id: "hba1c" }, { id: "fasting-glucose" }],
  },
  {
    id: "lipids",
    label: "Lipids",
    description: "Each marker has its own scale; the panels share mg/dL units but not a common axis.",
    icon: Droplets,
    charts: [{ id: "triglycerides" }, { id: "hdl" }, { id: "ldl" }, { id: "total-cholesterol" }],
  },
  {
    id: "kidney",
    label: "Kidney & metabolic",
    description: "Creatinine, eGFR, and uric acid use separate axes and their source report units.",
    icon: ShieldPlus,
    charts: [
      { id: "uric-acid" },
      { id: "creatinine" },
      { id: "egfr", note: "May and November results print mL/min; their reference interval includes /1.73 m²." },
    ],
  },
  {
    id: "thyroid",
    label: "Thyroid",
    description: "Total T3, total T4, and TSH stay separate, with each report’s own reference interval.",
    icon: FlaskConical,
    charts: [{ id: "tsh" }, { id: "total-t3" }, { id: "total-t4" }],
  },
  {
    id: "blood-counts",
    label: "Blood counts",
    description: "Counts and indices are shown individually so the different units remain legible.",
    icon: HeartPulse,
    charts: [
      { id: "hemoglobin" },
      { id: "rbc-count" },
      { id: "wbc-count" },
      { id: "platelet-count" },
      { id: "mcv" },
    ],
  },
  {
    id: "liver",
    label: "Liver & proteins",
    description: "Bilirubin and enzymes use separate scales. Values and ranges remain tied to their original reports.",
    icon: Sparkles,
    charts: [
      { id: "total-bilirubin" },
      { id: "direct-bilirubin" },
      { id: "alt" },
      { id: "ast" },
      { id: "alp" },
      { id: "ggt" },
    ],
  },
  {
    id: "vitamins",
    label: "Vitamins",
    description: "B12 and D use different units and are plotted independently. Missing results remain gaps.",
    icon: Leaf,
    charts: [{ id: "vitamin-b12" }, { id: "vitamin-d" }],
  },
];

interface TrendAnalyticsProps {
  selectedCategory?: BiomarkerCategory;
}

const categoryToGroup: Partial<Record<BiomarkerCategory, string>> = {
  "Blood counts": "blood-counts",
  "Glucose metabolism": "glucose",
  Lipids: "lipids",
  "Kidney & metabolic": "kidney",
  "Liver & proteins": "liver",
  "Thyroid profile": "thyroid",
  Vitamins: "vitamins",
};

export function TrendAnalytics({ selectedCategory }: TrendAnalyticsProps) {
  const reduceMotion = useReducedMotion();
  const [activeGroupId, setActiveGroupId] = useState(() =>
    (selectedCategory && categoryToGroup[selectedCategory]) || trendGroups[0]!.id,
  );
  const activeGroup = trendGroups.find((group) => group.id === activeGroupId) ?? trendGroups[0]!;

  return (
    <section className="trend-section" aria-labelledby="trend-title">
      <div className="section-heading-row">
        <div>
          <div className="eyebrow">TREND ANALYTICS</div>
          <h2 id="trend-title">A clearer view over time</h2>
          <p className="section-description">Three measured dates, source-specific ranges, and no interpolated results.</p>
        </div>
        <span className="three-report-pill">3 reports <span aria-hidden="true">·</span> 29 May 2025 – 9 Oct 2026</span>
      </div>

      <div className="trend-tabs" role="tablist" aria-label="Choose a trend category">
        {trendGroups.map((group) => {
          const Icon = group.icon;
          const selected = group.id === activeGroupId;
          return (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`trend-tab ${selected ? "trend-tab-active" : ""}`}
              onClick={() => setActiveGroupId(group.id)}
            >
              {selected && (
                <motion.span
                  layoutId="trend-tab-indicator"
                  className="trend-tab-indicator"
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon size={15} /><span>{group.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeGroup.id}
          role="tabpanel"
          className="trend-group-panel"
          initial={reduceMotion ? false : { opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -3 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="trend-group-intro">
            <div>
              <h3>{activeGroup.label}</h3>
              <p>{activeGroup.description}</p>
            </div>
            <span>{activeGroup.charts.length} measures</span>
          </div>
          <div className="chart-grid">
            {activeGroup.charts.map((chart, index) => (
              <TrendChart key={chart.id} biomarkerId={chart.id} index={index} note={chart.note} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
