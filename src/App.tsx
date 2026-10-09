import { Activity, Droplets, FlaskConical, Sparkles } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { biomarkerCatalog, reports } from "./data/bloodReports";
import { KeyObservations } from "./components/insights/KeyObservations";
import { AppHeader, type DashboardView } from "./components/layout/AppHeader";
import { KpiCard } from "./components/dashboard/KpiCard";
import { ReportSnapshot, compareReports } from "./components/dashboard/ReportSnapshot";
import { ReportTimeline } from "./components/dashboard/ReportTimeline";
import { AboutPanel } from "./components/reports/AboutPanel";
import { ReferenceDetails } from "./components/reports/ReferenceDetails";

const TrendAnalytics = lazy(() => import("./components/charts/TrendAnalytics").then((module) => ({ default: module.TrendAnalytics })));
const ResultsTable = lazy(() => import("./components/results/ResultsTable").then((module) => ({ default: module.ResultsTable })));

const kpiConfiguration = [
  {
    id: "hba1c",
    title: "HbA1c",
    interpretation: "Decreased from the previous report; latest value is within its printed interval.",
    tag: "IMPROVED",
    icon: Activity,
    tone: "green" as const,
    lowerIsFavorable: true,
  },
  {
    id: "triglycerides",
    title: "Triglycerides",
    interpretation: "Increased slightly since November; still above the latest report’s normal cutoff.",
    tag: "UP SLIGHTLY",
    icon: Droplets,
    tone: "amber" as const,
    lowerIsFavorable: true,
  },
  {
    id: "hdl",
    title: "HDL cholesterol",
    interpretation: "Improved slightly, while remaining below 40 mg/dL in the latest report.",
    tag: "UP SLIGHTLY",
    icon: Sparkles,
    tone: "blue" as const,
    lowerIsFavorable: false,
  },
  {
    id: "vitamin-b12",
    title: "Vitamin B12",
    interpretation: "Decreased since November; the latest result remains inside its printed interval.",
    tag: "DECREASED",
    icon: FlaskConical,
    tone: "violet" as const,
    lowerIsFavorable: false,
  },
] as const;

export default function App() {
  const [view, setView] = useState<DashboardView>("overview");
  const [selectedReportId, setSelectedReportId] = useState(reports.at(-1)!.id);
  const [isDark, setIsDark] = useState(false);
  const selectedReport = reports.find((report) => report.id === selectedReportId) ?? reports.at(-1)!;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const keyMetrics = useMemo(() => kpiConfiguration.map((config) => {
    const metric = biomarkerCatalog.find((item) => item.id === config.id)!;
    const { latest, previous } = compareReports(metric.id as typeof config.id);
    return { config, metric, latest, previous };
  }), []);

  function handleShowResults() {
    setView("results");
    window.requestAnimationFrame(() => document.getElementById("results-title")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div className="app-shell">
      <AppHeader
        view={view}
        onViewChange={setView}
        isDark={isDark}
        onToggleTheme={() => setIsDark((current) => !current)}
      />
      <main className="page-content">
          <div key={view} className="view-content">
            {view === "overview" && (
              <>
                <section className="page-intro">
                  <div>
                    <span className="eyebrow">PERSONAL HEALTH OVERVIEW</span>
                    <h1>Three reports. One clear view.</h1>
                    <p>Track measured changes and compare results with each report’s own reference ranges.</p>
                  </div>
                  <div className="report-date-badge">
                    <span>Latest collection</span>
                    <strong>9 October 2026</strong>
                  </div>
                </section>

                <section className="kpi-section" aria-labelledby="kpi-title">
                  <div className="section-heading-inline kpi-heading">
                    <div>
                      <div className="eyebrow">LATEST REPORT SNAPSHOT</div>
                      <h2 id="kpi-title">At a glance</h2>
                    </div>
                    <span className="compare-context">Compared with 16 Nov 2025</span>
                  </div>
                  <div className="kpi-grid">
                    {keyMetrics.map(({ config, metric, latest, previous }) => (
                      <KpiCard key={config.id} {...config} metric={metric} latest={latest} previous={previous} />
                    ))}
                  </div>
                </section>

                <div className="overview-report-layout">
                  <ReportTimeline reports={reports} selectedReportId={selectedReportId} onSelect={setSelectedReportId} />
                  <ReportSnapshot report={selectedReport} onShowResults={handleShowResults} />
                </div>

                <div className="overview-lower-grid">
                  <KeyObservations />
                  <aside className="compare-note surface-card">
                    <div className="compare-note-icon"><Activity size={17} /></div>
                    <div>
                      <span className="eyebrow">COMPARISON GUIDE</span>
                      <h2>Read the range alongside the result</h2>
                      <p>Reference intervals can vary between laboratories and report dates. The selected report controls the snapshot; the results table keeps all three dates visible.</p>
                      <button type="button" className="text-link" onClick={() => setView("results")}>Open complete results <span aria-hidden="true">→</span></button>
                    </div>
                  </aside>
                </div>

                <Suspense fallback={<div className="loading-card surface-card" role="status">Loading trend panels…</div>}>
                  <TrendAnalytics />
                </Suspense>
                <ReferenceDetails />
              </>
            )}

            {view === "trends" && (
              <>
                <section className="page-intro compact-intro">
                  <div>
                    <span className="eyebrow">TREND ANALYTICS</span>
                    <h1>Measured changes over time</h1>
                    <p>Every marker has an independent scale; unavailable values are left blank.</p>
                  </div>
                  <span className="report-date-badge"><span>Selected report</span><strong>{selectedReport.label}</strong></span>
                </section>
                <Suspense fallback={<div className="loading-card surface-card" role="status">Loading trend panels…</div>}>
                  <TrendAnalytics />
                </Suspense>
              </>
            )}

            {view === "results" && (
              <>
                <section className="page-intro compact-intro">
                  <div>
                    <span className="eyebrow">REPORT COMPARISON</span>
                    <h1>All measured results</h1>
                    <p>Search, filter, sort, and expand each biomarker for report-specific ranges.</p>
                  </div>
                  <span className="report-date-badge"><span>Selected report</span><strong>{selectedReport.label}</strong></span>
                </section>
                <Suspense fallback={<div className="loading-card surface-card" role="status">Loading results…</div>}>
                  <ResultsTable selectedReportId={selectedReportId} />
                </Suspense>
                <ReferenceDetails />
              </>
            )}
          </div>
        <AboutPanel />
        <footer className="app-footer">
          <span><span className="footer-mark"><Activity size={13} /></span> HealthTrack <i /> Personal Blood Report Analytics</span>
          <span>Data is bundled locally in this application</span>
        </footer>
      </main>
    </div>
  );
}

