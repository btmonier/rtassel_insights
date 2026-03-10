import type { Release } from "../types";

const PX_PER_YEAR = 200;
const PAD_PX = 50;
const DOT_SIZE = 14;
const DOT_RADIUS = DOT_SIZE / 2;
const BASE_STEM = 14;
const TIER_STEP = 24;
const LABEL_GAP = 2;
const LABEL_HEIGHT_EST = 28;
const TRACK_VERTICAL_PAD = 12;
const LABEL_SPACING = 8;
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

interface PointInfo {
  release: Release;
  xPx: number;
  above: boolean;
  labelWidth: number;
  tier: number;
}

function estimateLabelWidth(tag: string): number {
  return Math.max(tag.length * 7.5 + 12, 55);
}

function assignTiers(points: PointInfo[]): void {
  const sorted = [...points].sort((a, b) => a.xPx - b.xPx);
  for (let i = 0; i < sorted.length; i++) {
    let tier = 0;
    let placed = false;
    while (!placed) {
      let overlaps = false;
      for (let j = 0; j < i; j++) {
        if (sorted[j].tier !== tier) continue;
        const minDist =
          (sorted[i].labelWidth + sorted[j].labelWidth) / 2 + LABEL_SPACING;
        if (Math.abs(sorted[i].xPx - sorted[j].xPx) < minDist) {
          overlaps = true;
          break;
        }
      }
      if (overlaps) {
        tier++;
      } else {
        sorted[i].tier = tier;
        placed = true;
      }
    }
  }
}

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
  const spanYears = span / MS_PER_YEAR;
  const containerWidth = container.clientWidth || 800;
  const trackWidth = Math.max(
    containerWidth,
    PAD_PX * 2 + spanYears * PX_PER_YEAR,
  );

  function tToPx(t: number): number {
    if (span === 0) return trackWidth / 2;
    return PAD_PX + ((maxT - t) / span) * (trackWidth - 2 * PAD_PX);
  }

  const points: PointInfo[] = sorted.map((release, i) => ({
    release,
    xPx: tToPx(timestamps[i]),
    above: i % 2 === 0,
    labelWidth: estimateLabelWidth(release.tag_name),
    tier: 0,
  }));

  const abovePoints = points.filter((p) => p.above);
  const belowPoints = points.filter((p) => !p.above);
  assignTiers(abovePoints);
  assignTiers(belowPoints);

  const maxAboveTier = abovePoints.reduce((m, p) => Math.max(m, p.tier), 0);
  const maxBelowTier = belowPoints.reduce((m, p) => Math.max(m, p.tier), 0);

  const maxStemAbove = BASE_STEM + maxAboveTier * TIER_STEP;
  const maxStemBelow = BASE_STEM + maxBelowTier * TIER_STEP;
  const halfAbove =
    DOT_RADIUS + maxStemAbove + LABEL_GAP + LABEL_HEIGHT_EST + TRACK_VERTICAL_PAD;
  const halfBelow =
    DOT_RADIUS + maxStemBelow + LABEL_GAP + LABEL_HEIGHT_EST + TRACK_VERTICAL_PAD;
  const trackHeight = halfAbove + halfBelow;
  const centerY = halfAbove;

  const scroll = document.createElement("div");
  scroll.className = "timeline-scroll";

  const track = document.createElement("div");
  track.className = "timeline-track";
  track.style.width = `${trackWidth}px`;
  track.style.height = `${trackHeight}px`;

  const line = document.createElement("div");
  line.className = "timeline-line";
  line.style.top = `${centerY}px`;
  track.appendChild(line);

  if (span > 0) {
    const firstYear = new Date(minT).getFullYear();
    const lastYear = new Date(maxT).getFullYear() + 1;
    for (let y = firstYear; y <= lastYear; y++) {
      const jan1 = new Date(y, 0, 1).getTime();
      const xPx = tToPx(jan1);
      if (xPx < 0 || xPx > trackWidth) continue;

      const marker = document.createElement("div");
      marker.className = "timeline-year-marker";
      marker.style.left = `${xPx}px`;
      marker.style.top = `${centerY - 10}px`;
      marker.style.height = "20px";

      const label = document.createElement("span");
      label.className = "timeline-year-label";
      label.textContent = String(y);
      marker.appendChild(label);

      track.appendChild(marker);
    }
  }

  for (const pt of points) {
    const stemHeight = BASE_STEM + pt.tier * TIER_STEP;
    const downloads = pt.release.assets.reduce(
      (s, a) => s + a.download_count,
      0,
    );
    const dateStr = new Date(pt.release.published_at).toLocaleDateString(
      "en-US",
      { year: "numeric", month: "short" },
    );
    const dlText =
      downloads > 0
        ? `${downloads.toLocaleString()} downloads`
        : "No assets";

    const point = document.createElement("div");
    point.className = `timeline-point ${pt.above ? "timeline-point--above" : "timeline-point--below"}`;
    point.style.left = `${pt.xPx}px`;
    point.style.top = `${centerY}px`;

    const labelEl = document.createElement("div");
    labelEl.className = "timeline-label";
    if (pt.above) {
      labelEl.style.bottom = `calc(100% + ${stemHeight + LABEL_GAP}px)`;
    } else {
      labelEl.style.top = `calc(100% + ${stemHeight + LABEL_GAP}px)`;
    }
    labelEl.innerHTML =
      `<span class="timeline-tag">${pt.release.tag_name}</span>` +
      `<span class="timeline-date">${dateStr}</span>` +
      `<span class="timeline-dl">${dlText}</span>`;

    const stem = document.createElement("div");
    stem.className = "timeline-stem";
    stem.style.height = `${stemHeight}px`;

    const dot = document.createElement("div");
    dot.className = "timeline-dot";

    point.appendChild(labelEl);
    point.appendChild(stem);
    point.appendChild(dot);
    track.appendChild(point);
  }

  scroll.appendChild(track);
  container.innerHTML = "";
  container.appendChild(scroll);
}
