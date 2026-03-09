import { Chart, registerables } from "chart.js";
import type { ReferrerEntry } from "../types";

Chart.register(...registerables);

export function renderReferrersChart(
  canvas: HTMLCanvasElement,
  entries: ReferrerEntry[],
): Chart {
  const sorted = [...entries].sort((a, b) => b.count - a.count);
  const labels = sorted.map((e) => e.referrer);
  const counts = sorted.map((e) => e.count);
  const uniques = sorted.map((e) => e.uniques);

  const style = getComputedStyle(document.documentElement);
  const accent = style.getPropertyValue("--color-accent").trim() || "#3b82f6";
  const secondary =
    style.getPropertyValue("--color-secondary").trim() || "#8b5cf6";

  return new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Total",
          data: counts,
          backgroundColor: accent + "cc",
          borderColor: accent,
          borderWidth: 1,
        },
        {
          label: "Unique",
          data: uniques,
          backgroundColor: secondary + "cc",
          borderColor: secondary,
          borderWidth: 1,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { precision: 0 },
        },
      },
    },
  });
}
