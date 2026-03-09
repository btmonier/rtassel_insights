import type { TrafficSummary } from "../types";

interface StatCard {
  label: string;
  value: string;
  icon: string;
}

export function renderSummary(
  container: HTMLElement,
  views: TrafficSummary,
  clones: TrafficSummary,
): void {
  const stats: StatCard[] = [
    { label: "Total Views", value: views.totalCount.toLocaleString(), icon: "visibility" },
    { label: "Total Clones", value: clones.totalCount.toLocaleString(), icon: "content_copy" },
    { label: "Avg Views / Mo", value: views.avgCountPerMonth.toLocaleString(), icon: "trending_up" },
    { label: "Avg Clones / Mo", value: clones.avgCountPerMonth.toLocaleString(), icon: "trending_up" },
  ];

  container.innerHTML = stats
    .map(
      (s) => `
      <div class="summary-card">
        <span class="summary-icon material-symbols-outlined">${s.icon}</span>
        <div class="summary-text">
          <span class="summary-value">${s.value}</span>
          <span class="summary-label">${s.label}</span>
        </div>
      </div>`,
    )
    .join("");
}
