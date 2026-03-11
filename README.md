# rTASSEL Insights

A GitHub Insights dashboard for the 
[maize-genetics/rTASSEL](https://github.com/maize-genetics/rTASSEL) repository. 
Collects and stores traffic data (views, clones, referrers, popular paths), release 
downloads, and repo stats via the GitHub API, then visualizes everything in an 
interactive web dashboard.

Data collection runs daily via GitHub Actions and the dashboard is deployed to GitHub 
Pages.

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Data collection | R, `gh`, `jsonlite` |
| Dashboard | TypeScript, Vite, Chart.js, date-fns |
| Environment | Pixi (global control), npm (dashboard) |
| CI/CD | GitHub Actions, GitHub Pages |

## Getting Started

### Prerequisites

- [Pixi](https://pixi.sh)
- [Node.js](https://nodejs.org)
- A GitHub PAT with repo traffic access

### Collect Data

```bash
pixi install
pixi run collect-all
```

### Run the Dashboard

```bash
pixi run dev-dashboard
```


