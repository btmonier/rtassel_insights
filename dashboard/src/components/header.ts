import type { RepoOverview } from "../types";
import { getTheme, setTheme } from "../theme";

const REPO_URL = "https://github.com/maize-genetics/rTASSEL";

interface KPI {
  label: string;
  value: number;
  icon: string;
}

export function renderKPIs(container: HTMLElement, overview: RepoOverview): void {
  const kpis: KPI[] = [
    { label: "Stars", value: overview.stargazers_count, icon: "star" },
    { label: "Forks", value: overview.forks_count, icon: "call_split" },
    { label: "Open Issues", value: overview.open_issues_count, icon: "error_outline" },
    { label: "Watchers", value: overview.subscribers_count, icon: "visibility" },
  ];

  container.innerHTML = kpis
    .map(
      (k) => `
      <div class="kpi-card">
        <span class="kpi-icon material-symbols-outlined">${k.icon}</span>
        <div class="kpi-text">
          <span class="kpi-value">${k.value.toLocaleString()}</span>
          <span class="kpi-label">${k.label}</span>
        </div>
      </div>`,
    )
    .join("");
}

export function renderHeader(container: HTMLElement, overview: RepoOverview): void {
  const isDark = getTheme() === "dark";

  const themeSliderHTML = `
    <div class="theme-slider-wrap" title="${isDark ? "Switch to light mode" : "Switch to dark mode"}">
      <span class="theme-slider-icon material-symbols-outlined">light_mode</span>
      <button type="button" class="theme-slider" role="switch" aria-checked="${isDark}" aria-label="Toggle dark mode">
        <span class="theme-slider-thumb"></span>
      </button>
      <span class="theme-slider-icon material-symbols-outlined">dark_mode</span>
    </div>
  `;

  container.innerHTML = `
    <div class="header-inner">
      <div class="header-title">
        <h1><a href="${REPO_URL}" target="_blank" rel="noopener">rTASSEL</a> Insights</h1>
      </div>
      ${themeSliderHTML}
    </div>
  `;

  const sliderRoot = container;
  const slider = sliderRoot.querySelector<HTMLButtonElement>(".theme-slider");
  const sliderWrap = sliderRoot.querySelector<HTMLElement>(".theme-slider-wrap");
  if (slider && sliderWrap) {
    slider.addEventListener("click", () => {
      const next = getTheme() === "dark" ? "light" : "dark";
      setTheme(next);
      slider.setAttribute("aria-checked", String(next === "dark"));
      sliderWrap.classList.toggle("is-dark", next === "dark");
      sliderWrap.title = next === "dark" ? "Switch to light mode" : "Switch to dark mode";
    });
    sliderWrap.classList.toggle("is-dark", isDark);
  }
}
