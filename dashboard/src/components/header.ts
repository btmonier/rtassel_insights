import type { RepoOverview } from "../types";

const REPO_URL = "https://github.com/maize-genetics/rTASSEL";

interface KPI {
  label: string;
  value: number;
  icon: string;
}

export function renderHeader(
  container: HTMLElement,
  overview: RepoOverview,
): void {
  const kpis: KPI[] = [
    { label: "Stars", value: overview.stargazers_count, icon: "star" },
    { label: "Forks", value: overview.forks_count, icon: "call_split" },
    { label: "Open Issues", value: overview.open_issues_count, icon: "error_outline" },
    { label: "Watchers", value: overview.subscribers_count, icon: "visibility" },
  ];

  const collected = new Date(overview.collected_at).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "short", day: "numeric" },
  );

  container.innerHTML = `
    <div class="header-inner">
      <div class="header-title">
        <h1><a href="${REPO_URL}" target="_blank" rel="noopener">rTASSEL</a> Insights</h1>
        <p class="subtitle">GitHub analytics for <code>maize-genetics/rTASSEL</code></p>
        <p class="subtitle">Last updated: <code>${collected}</code></p>
      </div>
      <div class="kpi-row">
        ${kpis.map((k) => `
          <div class="kpi-card">
            <span class="kpi-icon material-symbols-outlined">${k.icon}</span>
            <span class="kpi-value">${k.value.toLocaleString()}</span>
            <span class="kpi-label">${k.label}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}
