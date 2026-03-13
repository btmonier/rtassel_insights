export interface RepoOverview {
  collected_at: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  subscribers_count: number;
  size: number;
}

export interface TrafficEntry {
  timestamp: string;
  count: number;
  uniques: number;
}

export interface ReferrerEntry {
  referrer: string;
  count: number;
  uniques: number;
}

export interface ReferrerSnapshot {
  collected_at: string;
  entries: ReferrerEntry[];
}

/** Columnar format: referrer names once, snapshots as [collected_at, [count,uniques][]]. */
export interface ReferrersColumnar {
  referrers: string[];
  snapshots: [string, [number, number][]][];
}

export interface PathEntry {
  path: string;
  title: string;
  count: number;
  uniques: number;
}

export interface PathSnapshot {
  collected_at: string;
  entries: PathEntry[];
}

export interface ReleaseAsset {
  name: string;
  download_count: number;
  size: number;
}

export interface Release {
  tag_name: string;
  name: string;
  published_at: string;
  html_url?: string;
  assets: ReleaseAsset[];
}

export type PeriodFilter =
  | "1w"
  | "2w"
  | "1m"
  | "6m"
  | "ytd"
  | "1y"
  | "5y"
  | "max";

export interface TrafficSummary {
  totalCount: number;
  totalUniques: number;
  avgCountPerMonth: number;
  avgUniquesPerMonth: number;
}
