import { Chart, registerables } from "chart.js";
import type { TrafficEntry, PeriodFilter, TrafficSummary } from "../types";

Chart.register(...registerables);

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getColors(): { accent: string; secondary: string } {
  const style = getComputedStyle(document.documentElement);
  return {
    accent: style.getPropertyValue("--color-accent").trim() || "#3b82f6",
    secondary: style.getPropertyValue("--color-secondary").trim() || "#8b5cf6",
  };
}

function periodCutoff(period: PeriodFilter): Date | null {
  if (period === "max") return null;

  const now = new Date();

  if (period === "ytd") return new Date(now.getFullYear(), 0, 1);

  const days: Record<string, number> = {
    "1w": 7,
    "2w": 14,
    "1m": 30,
    "6m": 182,
    "1y": 365,
    "5y": 1826,
  };
  const d = days[period];
  if (d === undefined) return null;

  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - d);
  return cutoff;
}

function filterByPeriod(
  data: TrafficEntry[],
  period: PeriodFilter,
): TrafficEntry[] {
  const cutoff = periodCutoff(period);
  if (!cutoff) return data;

  return data.filter((d) => new Date(d.timestamp) >= cutoff);
}

function cumulativeSum(values: number[]): number[] {
  const result: number[] = [];
  let sum = 0;
  for (const v of values) {
    sum += v;
    result.push(sum);
  }
  return result;
}

function buildChart(
  canvas: HTMLCanvasElement,
  labels: string[],
  dataset1: number[],
  dataset2: number[],
  label1: string,
  label2: string,
  fill: boolean,
): Chart {
  const { accent, secondary } = getColors();

  return new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: label1,
          data: dataset1,
          borderColor: accent,
          backgroundColor: accent + "22",
          fill,
          tension: 0.3,
          pointRadius: 3,
        },
        {
          label: label2,
          data: dataset2,
          borderColor: secondary,
          backgroundColor: secondary + "22",
          fill,
          tension: 0.3,
          pointRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "top" },
        tooltip: { mode: "index", intersect: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
        },
      },
    },
  });
}


export function computeSummary(data: TrafficEntry[]): TrafficSummary {
  let totalCount = 0;
  let totalUniques = 0;
  const monthBuckets = new Map<string, { count: number; uniques: number }>();

  for (const entry of data) {
    totalCount += entry.count;
    totalUniques += entry.uniques;

    const d = new Date(entry.timestamp);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = monthBuckets.get(key) ?? { count: 0, uniques: 0 };
    bucket.count += entry.count;
    bucket.uniques += entry.uniques;
    monthBuckets.set(key, bucket);
  }

  const numMonths = Math.max(monthBuckets.size, 1);

  return {
    totalCount,
    totalUniques,
    avgCountPerMonth: Math.round(totalCount / numMonths),
    avgUniquesPerMonth: Math.round(totalUniques / numMonths),
  };
}

export interface TrafficSection {
  setPeriod(period: PeriodFilter): void;
}

export function createTrafficSection(
  dailyCanvas: HTMLCanvasElement,
  cumulativeCanvas: HTMLCanvasElement,
  allData: TrafficEntry[],
  label: string,
): TrafficSection {
  const sorted = [...allData].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  let dailyChart: Chart | null = null;
  let cumulativeChart: Chart | null = null;

  function render(period: PeriodFilter): void {
    const filtered = filterByPeriod(sorted, period);
    const labels = filtered.map((d) => formatDate(d.timestamp));
    const counts = filtered.map((d) => d.count);
    const uniques = filtered.map((d) => d.uniques);
    const cumCounts = cumulativeSum(counts);
    const cumUniques = cumulativeSum(uniques);

    if (dailyChart) dailyChart.destroy();
    if (cumulativeChart) cumulativeChart.destroy();

    dailyChart = buildChart(
      dailyCanvas,
      labels,
      counts,
      uniques,
      `${label} (total)`,
      `${label} (unique)`,
      true,
    );

    cumulativeChart = buildChart(
      cumulativeCanvas,
      labels,
      cumCounts,
      cumUniques,
      `Cumulative ${label.toLowerCase()} (total)`,
      `Cumulative ${label.toLowerCase()} (unique)`,
      false,
    );
  }

  render("1w");

  return {
    setPeriod(period: PeriodFilter) {
      render(period);
    },
  };
}
