# HealthTrack

Personal blood report analytics for the three collection dates **29 May 2025**, **16 November 2025**, and **9 October 2026**. This is an informational dashboard, not a diagnostic or treatment application.

## Privacy before hosting

The report values are embedded in the static app bundle. Anyone who can access the deployed files can inspect those values. GitHub says Pages sites are publicly available on the internet even when their source repository is private, subject to the account or organization plan. Do not push or deploy this dataset unless you intend to make these health results public. [GitHub Pages visibility guidance](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)

The app does not use analytics, tracking, cloud storage, or external health APIs. It has no real patient name, sample number, or laboratory identifier.

## Local development

Requirements: Node.js 24 and npm.

```sh
npm ci
npm run dev
```

To make a production build:

```sh
npm run build
```

To preview a build locally:

```sh
VITE_BASE_PATH=/ npm run build
npm run preview
```

## Reports and verified data

All chart and table values live in `src/data/bloodReports.ts`. Every reading keeps its source date, displayed unit, printed reference text, and any explicitly reported status. If the report does not provide a usable interval, the dashboard shows the result as unclassified. A missing result is displayed as a dash and is never changed to zero.

The PDF source reports confirm several additions and corrections to the starter values:

- May 2025 eGFR is present in the report (117.63 mL/min; the printed interval includes `/1.73 m²`).
- Vitamin D was measured in May 2025 (18.14 ng/mL) and November 2025 (15.9 ng/mL).
- November 2025 total cholesterol is 170 mg/dL.
- October 2026 ALT, GGT, and ALP are 28 U/L, 31 U/L, and 107 U/L.

Ranges remain specific to each report date and laboratory. The November total bilirubin page does not print an adult interval, so its status is unclassified. Other attached records from July 2024 are outside the requested three-report comparison and are not included.

## GitHub Pages setup

1. Push this project to the `main` branch of the `HealthVault` repository.
2. In the repository, open **Settings → Pages** and select **GitHub Actions** as the build and deployment source.
3. The workflow in `.github/workflows/deploy.yml` builds on pushes to `main` and can also be started from the **Actions** tab with **Run workflow**.
4. Confirm the Pages workflow completes successfully before treating the site as deployed.

For the `HealthVault` repository, Vite uses `/HealthVault/` as the production base path in GitHub Actions. If the repository has a different name or a custom base path, set `VITE_BASE_PATH` (for example, `/your-repository/`) in the build environment.

## Stack

React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React, and Framer Motion. The dashboard uses native accessible controls and reusable local components; no server or remote health-data service is required.
