const DASHBOARD_SOURCE_URL = "https://github.com/btmonier/rtassel_insights";

export function renderFooter(
  container: HTMLElement,
  collectedAt: string,
  version: string,
): void {
  const collected = new Date(collectedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  container.innerHTML = `
    <div class="footer-inner">
      <p class="footer-text">Last updated: <code>${collected}</code></p>
      <div class="footer-right">
        <code>v${version}</code>
        <a href="${DASHBOARD_SOURCE_URL}" target="_blank" rel="noopener noreferrer" class="footer-link" title="View source code">
          <span class="mdi mdi-github"></span>
        </a>
      </div>
    </div>
  `;
}
