import type { PathEntry } from "../types";

export function renderPaths(
  container: HTMLElement,
  entries: PathEntry[],
): void {
  const sorted = [...entries].sort((a, b) => b.count - a.count);
  const maxCount = sorted[0]?.count ?? 1;

  const rows = sorted
    .map((e) => {
      const pct = Math.round((e.count / maxCount) * 100);
      const shortPath = e.path.replace("/maize-genetics/rTASSEL", "") || "/";
      return `
      <tr>
        <td class="path-cell" title="${e.path}">
          <code>${shortPath}</code>
        </td>
        <td class="num-cell">${e.count}</td>
        <td class="num-cell">${e.uniques}</td>
        <td class="bar-cell">
          <div class="mini-bar" style="width: ${pct}%"></div>
        </td>
      </tr>`;
    })
    .join("");

  container.innerHTML = `
    <table class="paths-table">
      <thead>
        <tr>
          <th>Path</th>
          <th>Views</th>
          <th>Unique</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}
