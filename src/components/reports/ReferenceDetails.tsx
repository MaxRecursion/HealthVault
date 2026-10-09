import { ChevronDown, Info } from "lucide-react";
import { biomarkerCatalog, readBiomarker, reports } from "../../data/bloodReports";

export function ReferenceDetails() {
  return (
    <details className="reference-details surface-card">
      <summary>
        <span className="reference-summary-icon"><Info size={16} /></span>
        <span className="reference-summary-copy">
          <strong>Report details & reference ranges</strong>
          <small>Collection dates, lab sources, units, and each report’s own intervals</small>
        </span>
        <ChevronDown className="reference-chevron" size={16} aria-hidden="true" />
      </summary>
      <div className="reference-body">
        <div className="report-source-grid">
          {reports.map((report) => (
            <article className="report-source-card" key={report.id}>
              <span className="source-date">{report.label}</span>
              <strong>{report.laboratory}</strong>
              <span>{report.processingLaboratory ? `Processed by ${report.processingLaboratory}` : "Processing laboratory not shown in the report extract"}</span>
              <small>Collection date as printed in the source report</small>
            </article>
          ))}
        </div>
        <div className="reference-note">
          Ranges are reproduced by report date. They can differ across laboratories and methods; the dashboard does not substitute a range from another report. A dash means no measurement was available for that date.
        </div>
        <div className="reference-table-scroll">
          <table className="reference-table">
            <caption className="sr-only">The result units and reference intervals printed for each biomarker in each report</caption>
            <thead>
              <tr>
                <th scope="col">Biomarker</th>
                {reports.map((report) => <th scope="col" key={report.id}>{report.shortLabel}</th>)}
              </tr>
            </thead>
            <tbody>
              {biomarkerCatalog.map((metric) => (
                <tr key={metric.id}>
                  <th scope="row">{metric.name}</th>
                  {reports.map((report) => {
                    const reading = readBiomarker(report, metric.id);
                    return (
                      <td key={report.id}>
                        {reading.value === null ? <span className="range-missing">Not measured</span> : (
                          <>
                            <span>{reading.referenceRange?.label ?? "No interval printed"}</span>
                            <small>Result unit: {reading.unit}</small>
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}
