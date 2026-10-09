import { CircleAlert, CircleCheck, CircleHelp, Info, ShieldAlert } from "lucide-react";

export function AboutPanel() {
  return (
    <section className="about-section" aria-labelledby="about-title">
      <div className="about-heading">
        <div className="eyebrow"><Info size={14} /> ABOUT THESE RESULTS</div>
        <h2 id="about-title">How to read this dashboard</h2>
        <p>Statuses compare a result with the reference interval printed on that same report.</p>
      </div>
      <div className="about-content surface-card">
        <div className="status-legend">
          <div><span className="legend-icon legend-normal"><CircleCheck size={15} /></span><span><b>Normal</b><small>Within the report’s stated interval</small></span></div>
          <div><span className="legend-icon legend-low"><CircleAlert size={15} /></span><span><b>Low</b><small>Below the report’s stated interval</small></span></div>
          <div><span className="legend-icon legend-high"><CircleAlert size={15} /></span><span><b>High</b><small>Above the report’s stated interval</small></span></div>
          <div><span className="legend-icon legend-borderline"><CircleAlert size={15} /></span><span><b>Borderline</b><small>Report explicitly labels a borderline category</small></span></div>
          <div><span className="legend-icon legend-missing"><CircleHelp size={15} /></span><span><b>Missing</b><small>No result in that report; never treated as zero</small></span></div>
          <div><span className="legend-icon legend-unclassified"><Info size={15} /></span><span><b>Unclassified</b><small>No usable interval or category in the report</small></span></div>
        </div>
        <div className="about-disclaimer">
          <p>For informational purposes only. This dashboard does not replace medical advice.</p>
          <p>Changes show comparisons only. They do not establish a cause, diagnosis, or treatment recommendation.</p>
        </div>
      </div>
      <div className="privacy-callout">
        <ShieldAlert size={16} />
        <p><strong>Public page</strong> — Report values are included in this app and visible to anyone who can open the page. The dashboard does not send them to an external data service.</p>
      </div>
    </section>
  );
}
