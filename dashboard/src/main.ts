import "./styles.css";
import type {
  RepoOverview,
  TrafficEntry,
  ReferrerSnapshot,
  PathSnapshot,
  ReleaseSnapshot,
  PeriodFilter,
} from "./types";
import { renderHeader } from "./components/header";
import { renderSummary } from "./components/summary";
import {
  createTrafficSection,
  computeSummary,
  type TrafficSection,
} from "./charts/traffic";
import { renderReferrersChart } from "./charts/referrers";
import { renderPaths } from "./components/paths";
import { renderReleasesTimeline } from "./charts/releases";

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json() as Promise<T>;
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
  const base = import.meta.env.BASE_URL;

  const [overview, views, clones, referrers, paths, releases] =
    await Promise.all([
      fetchJSON<RepoOverview[]>(`${base}data/repo_overview.json`),
      fetchJSON<TrafficEntry[]>(`${base}data/traffic_views.json`),
      fetchJSON<TrafficEntry[]>(`${base}data/traffic_clones.json`),
      fetchJSON<ReferrerSnapshot[]>(`${base}data/traffic_referrers.json`),
      fetchJSON<PathSnapshot[]>(`${base}data/traffic_paths.json`),
      fetchJSON<ReleaseSnapshot[]>(`${base}data/release_downloads.json`),
    ]);

  const headerEl = document.getElementById("dashboard-header");
  if (headerEl && overview.length > 0) {
    renderHeader(headerEl, overview[overview.length - 1]);
  }

  const summaryEl = document.getElementById("summary-stats");
  if (summaryEl) {
    renderSummary(summaryEl, computeSummary(views), computeSummary(clones));
  }

  const viewsDailyCanvas = document.getElementById("views-daily-canvas") as HTMLCanvasElement | null;
  const viewsCumCanvas = document.getElementById("views-cumulative-canvas") as HTMLCanvasElement | null;
  if (viewsDailyCanvas && viewsCumCanvas) {
    const viewsSection = createTrafficSection(viewsDailyCanvas, viewsCumCanvas, views, "Views");
    setupPeriodPills("views-pills", viewsSection);
  }

  const clonesDailyCanvas = document.getElementById("clones-daily-canvas") as HTMLCanvasElement | null;
  const clonesCumCanvas = document.getElementById("clones-cumulative-canvas") as HTMLCanvasElement | null;
  if (clonesDailyCanvas && clonesCumCanvas) {
    const clonesSection = createTrafficSection(clonesDailyCanvas, clonesCumCanvas, clones, "Clones");
    setupPeriodPills("clones-pills", clonesSection);
  }

  const referrersCanvas = document.getElementById(
    "referrers-canvas",
  ) as HTMLCanvasElement | null;
  if (referrersCanvas && referrers.length > 0) {
    renderReferrersChart(
      referrersCanvas,
      referrers[referrers.length - 1].entries,
    );
  }

  const pathsContainer = document.getElementById("paths-container");
  if (pathsContainer && paths.length > 0) {
    renderPaths(pathsContainer, paths[paths.length - 1].entries);
  }

  const releasesEl = document.getElementById("releases-timeline");
  if (releasesEl && releases.length > 0) {
    renderReleasesTimeline(releasesEl, releases[releases.length - 1].releases);
  }
}

main().catch((err) => {
  console.error("Dashboard init failed:", err);
  document.body.innerHTML += `<div class="error-banner">Failed to load dashboard data. Check the console for details.</div>`;
});
