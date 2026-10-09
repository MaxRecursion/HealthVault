import { ArrowDown, ArrowUp, CircleAlert, Info, MoveRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { readBiomarker, reports } from "../../data/bloodReports";
import { formatValue } from "../../utils/formatters";

function value(reportIndex: number, id: Parameters<typeof readBiomarker>[1]): number | null {
  return readBiomarker(reports[reportIndex]!, id).value;
}

function difference(later: number | null, earlier: number | null): number | null {
  return later === null || earlier === null ? null : later - earlier;
}

function absoluteDifferenceText(later: number | null, earlier: number | null, precision: number): string {
  const change = difference(later, earlier);
  return change === null ? "—" : formatValue(Math.abs(change), precision);
}

export function KeyObservations() {
  const reduceMotion = useReducedMotion();
  const may = reports[0]!;
  const november = reports[1]!;
  const october = reports[2]!;
  const hba1cMay = value(0, "hba1c");
  const hba1cLatest = value(2, "hba1c");
  const tgMay = value(0, "triglycerides");
  const tgNovember = value(1, "triglycerides");
  const tgLatest = value(2, "triglycerides");
  const hdlLatest = readBiomarker(october, "hdl");
  const ldlNovember = value(1, "ldl");
  const ldlLatest = value(2, "ldl");
  const b12November = value(1, "vitamin-b12");
  const b12Latest = readBiomarker(october, "vitamin-b12");
  const uricNovember = value(1, "uric-acid");
  const uricLatest = value(2, "uric-acid");
  const totalBilirubin = readBiomarker(october, "total-bilirubin");
  const directBilirubin = readBiomarker(october, "direct-bilirubin");
  const hdlAllBelowCutoff = reports.every((report) => {
    const reading = readBiomarker(report, "hdl");
    return reading.value !== null && reading.value < 40;
  });

  const observations = [
    {
      icon: ArrowDown,
      tone: "observation-green",
      title: "HbA1c decreased",
      detail: `From ${formatValue(hba1cMay, 1)}% in ${may.shortLabel} to ${formatValue(hba1cLatest, 1)}% in ${october.shortLabel} (−${absoluteDifferenceText(hba1cLatest, hba1cMay, 1)} percentage points).`,
    },
    {
      icon: ArrowUp,
      tone: "observation-amber",
      title: "Triglycerides: lower than May, higher than November",
      detail: `${formatValue(tgMay, 0)} → ${formatValue(tgLatest, 0)} mg/dL across the full period; up ${formatValue(difference(tgLatest, tgNovember), 0)} mg/dL since ${november.shortLabel}.`,
    },
    {
      icon: CircleAlert,
      tone: "observation-amber",
      title: hdlAllBelowCutoff ? "HDL remained below 40 mg/dL" : "HDL changed across reports",
      detail: `Latest: ${formatValue(hdlLatest.value, 1)} mg/dL. The latest report labels values below 40 mg/dL as low.`,
    },
    {
      icon: ArrowDown,
      tone: "observation-green",
      title: "LDL decreased since November",
      detail: `${formatValue(ldlNovember, 2)} → ${formatValue(ldlLatest, 2)} mg/dL; October’s result is within that report’s <100 mg/dL category.`,
    },
    {
      icon: ArrowDown,
      tone: "observation-blue",
      title: "Vitamin B12 decreased",
      detail: `${formatValue(b12November, 0)} → ${formatValue(b12Latest.value, 0)} pg/mL. The October result is within its printed 197–771 pg/mL interval.`,
    },
    {
      icon: ArrowDown,
      tone: "observation-green",
      title: "Uric acid decreased since November",
      detail: `${formatValue(uricNovember, 1)} → ${formatValue(uricLatest, 1)} mg/dL; October’s result is at the upper end of its printed interval (3.4–7.0).`,
    },
    {
      icon: CircleAlert,
      tone: "observation-red",
      title: "Bilirubin values are above October’s printed intervals",
      detail: `Total ${formatValue(totalBilirubin.value, 2)} mg/dL (0–1.2); direct ${formatValue(directBilirubin.value, 2)} mg/dL (≤0.30).`,
    },
    {
      icon: MoveRight,
      tone: "observation-blue",
      title: "Thyroid results use total hormone tests",
      detail: "The reports measure total T3, total T4, and TSH. Compare each with its own report range; total T4 is not free T4.",
    },
  ];

  return (
    <section className="observations-card surface-card" aria-labelledby="observations-title">
      <div className="section-heading-inline">
        <div>
          <div className="eyebrow"><Info size={14} /> DATA-LED SUMMARY</div>
          <h2 id="observations-title">Key observations</h2>
        </div>
        <span className="observation-tag">Observations, not diagnoses</span>
      </div>
      <motion.div
        className="observations-list"
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.045 } } }}
      >
        {observations.map(({ icon: Icon, tone, title, detail }) => (
          <motion.article
            className="observation-item"
            key={title}
            variants={{
              hidden: { opacity: 0, y: 7 },
              visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.22 } },
            }}
          >
            <span className={`observation-icon ${tone}`}><Icon size={15} /></span>
            <div>
              <h3>{title}</h3>
              <p>{detail}</p>
            </div>
          </motion.article>
        ))}
      </motion.div>
      <p className="observation-footnote">Comparisons describe reported values only; they do not identify causes or recommend treatment.</p>
    </section>
  );
}
