import "./styles.css";
import pkg from "../package.json";
import { initTheme, addThemeChangeListener } from "./theme";
import type {
  RepoOverview,
  TrafficEntry,
  ReferrerSnapshot,
  ReferrersColumnar,
  ReferrerEntry,
  PathSnapshot,
  PathsColumnar,
  PathEntry,
  Release,
  PeriodFilter,
} from "./types";
import { renderHeader, renderKPIs } from "./components/header";
import { renderFooter } from "./components/footer";
import { renderSummary } from "./components/summary";
import {
  createTrafficSection,
  computeSummary,
  type TrafficSection,
} from "./charts/traffic";
import type { Chart } from "chart.js";
import { renderReferrersChart } from "./charts/referrers";
import { renderPaths } from "./components/paths";
import { renderReleasesTimeline } from "./charts/releases";

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

function getLatestReferrerEntries(
  data: ReferrerSnapshot[] | ReferrersColumnar,
): ReferrerEntry[] {
  if (Array.isArray(data) && data.length > 0) {
    const last = data[data.length - 1] as ReferrerSnapshot;
    if (last.entries) return last.entries;
  }
  if (
    data &&
    typeof data === "object" &&
    "referrers" in data &&
    "snapshots" in data &&
    Array.isArray((data as ReferrersColumnar).snapshots)
  ) {
    const col = data as ReferrersColumnar;
    if (col.snapshots.length === 0) return [];
    const [_, row] = col.snapshots[col.snapshots.length - 1];
    return col.referrers.map((referrer, i) => ({
      referrer,
      count: row[i]?.[0] ?? 0,
      uniques: row[i]?.[1] ?? 0,
    }));
  }
  return [];
}

function getLatestPathEntries(
  data: PathSnapshot[] | PathsColumnar,
): PathEntry[] {
  const withViews = (entries: PathEntry[]) =>
    entries.filter((e) => e.count > 0);

  if (Array.isArray(data) && data.length > 0) {
    const last = data[data.length - 1] as PathSnapshot;
    if (last.entries) return withViews(last.entries);
  }
  if (
    data &&
    typeof data === "object" &&
    "paths" in data &&
    "titles" in data &&
    "snapshots" in data &&
    Array.isArray((data as PathsColumnar).snapshots)
  ) {
    const col = data as PathsColumnar;
    if (col.snapshots.length === 0) return [];
    const [_, row] = col.snapshots[col.snapshots.length - 1];
    return withViews(
      col.paths.map((path, i) => ({
        path,
        title: col.titles[i] ?? "",
        count: row[i]?.[0] ?? 0,
        uniques: row[i]?.[1] ?? 0,
      })),
    );
  }
  return [];
}

function setupPeriodPills(
  containerId: string,
  section: TrafficSection,
): void {
  const container = document.getElementById(containerId);
  if (!container) return;

  const pills = container.querySelectorAll<HTMLButtonElement>(".period-pill");

  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      pills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      section.setPeriod(pill.dataset.period as PeriodFilter);
    });
  });
}

async function main(): Promise<void> {
  initTheme();

  const base = import.meta.env.BASE_URL;
  const version = (pkg as { version?: string }).version ?? "0.0.0";

  const [overview, views, clones, referrersData, pathsData, releases] =
    await Promise.all([
      fetchJSON<RepoOverview[]>(`${base}data/repo_overview.json`),
      fetchJSON<TrafficEntry[]>(`${base}data/traffic_views.json`),
      fetchJSON<TrafficEntry[]>(`${base}data/traffic_clones.json`),
      fetchJSON<ReferrerSnapshot[] | ReferrersColumnar>(`${base}data/traffic_referrers.json`),
      fetchJSON<PathSnapshot[] | PathsColumnar>(`${base}data/traffic_paths.json`),
      fetchJSON<Release[]>(`${base}data/release_downloads.json`),
    ]);

  const referrerEntries = getLatestReferrerEntries(referrersData);
  const pathEntries = getLatestPathEntries(pathsData);

  const headerEl = document.getElementById("dashboard-header");
  if (headerEl && overview.length > 0) {
    renderHeader(headerEl, overview[overview.length - 1]);
  }

  const footerEl = document.getElementById("dashboard-footer");
  if (footerEl && overview.length > 0) {
    renderFooter(footerEl, overview[overview.length - 1].collected_at, version);
  }

  const kpiEl = document.getElementById("kpi-stats");
  if (kpiEl && overview.length > 0) {
    renderKPIs(kpiEl, overview[overview.length - 1]);
  }

  const summaryEl = document.getElementById("summary-stats");
  if (summaryEl) {
    renderSummary(summaryEl, computeSummary(views), computeSummary(clones));
  }

  const viewsDailyCanvas = document.getElementById("views-daily-canvas") as HTMLCanvasElement | null;
  const viewsCumCanvas = document.getElementById("views-cumulative-canvas") as HTMLCanvasElement | null;
  let viewsSection: TrafficSection | null = null;
  let clonesSection: TrafficSection | null = null;
  if (viewsDailyCanvas && viewsCumCanvas) {
    viewsSection = createTrafficSection(viewsDailyCanvas, viewsCumCanvas, views, "Views");
    setupPeriodPills("views-pills", viewsSection);
  }

  const clonesDailyCanvas = document.getElementById("clones-daily-canvas") as HTMLCanvasElement | null;
  const clonesCumCanvas = document.getElementById("clones-cumulative-canvas") as HTMLCanvasElement | null;
  if (clonesDailyCanvas && clonesCumCanvas) {
    clonesSection = createTrafficSection(clonesDailyCanvas, clonesCumCanvas, clones, "Clones");
    setupPeriodPills("clones-pills", clonesSection);
  }

  const referrersCanvas = document.getElementById(
    "referrers-canvas",
  ) as HTMLCanvasElement | null;
  let referrersChart: Chart | null = null;
  if (referrersCanvas && referrerEntries.length > 0) {
    referrersChart = renderReferrersChart(referrersCanvas, referrerEntries);
  }

  addThemeChangeListener(() => {
    viewsSection?.refresh();
    clonesSection?.refresh();
    if (referrersChart && referrersCanvas && referrerEntries.length > 0) {
      referrersChart.destroy();
      referrersChart = renderReferrersChart(referrersCanvas, referrerEntries);
    }
  });

  const pathsContainer = document.getElementById("paths-container");
  if (pathsContainer && pathEntries.length > 0) {
    renderPaths(pathsContainer, pathEntries);
  }

  const releasesEl = document.getElementById("releases-timeline");
  if (releasesEl && releases.length > 0) {
    renderReleasesTimeline(releasesEl, releases);
  }
}

main().catch((err) => {
  console.error("Dashboard init failed:", err);
  document.body.innerHTML += `<div class="error-banner">Failed to load dashboard data. Check the console for details.</div>`;
});
