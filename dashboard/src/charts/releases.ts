import type { Release } from "../types";

export function renderReleasesTimeline(
  container: HTMLElement,
  releases: Release[],
): void {
  const sorted = [...releases].sort(
    (a, b) =>
      new Date(a.published_at).getTime() - new Date(b.published_at).getTime(),
  );

  if (sorted.length === 0) {
    container.innerHTML = '<p class="timeline-empty">No releases found.</p>';
    return;
  }

  const timestamps = sorted.map((r) => new Date(r.published_at).getTime());
  const minT = timestamps[0];
  const maxT = timestamps[timestamps.length - 1];
  const span = maxT - minT;
  const PAD = 4;

  const track = document.createElement("div");
  track.className = "timeline-track";

  const line = document.createElement("div");
  line.className = "timeline-line";
  track.appendChild(line);

  sorted.forEach((release, i) => {
    const pct =
      span === 0
        ? 50
        : PAD + ((timestamps[i] - minT) / span) * (100 - 2 * PAD);

    const downloads = release.assets.reduce(
      (s, a) => s + a.download_count,
      0,
    );
    const dateStr = new Date(release.published_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });

    const point = document.createElement("div");
    point.className = `timeline-point ${i % 2 === 0 ? "timeline-point--above" : "timeline-point--below"}`;
    point.style.left = `${pct}%`;

    const dlText =
      downloads > 0
        ? `${downloads.toLocaleString()} downloads`
        : "No assets";

    point.innerHTML = `<div class="timeline-label"><span class="timeline-tag">${release.tag_name}</span><span class="timeline-date">${dateStr}</span><span class="timeline-dl">${dlText}</span></div><div class="timeline-dot"></div>`;

    track.appendChild(point);
  });

  container.innerHTML = "";
  container.appendChild(track);
}
