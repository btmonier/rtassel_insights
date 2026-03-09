source(file.path("scripts", "helpers.R"))

cli_h1("Collecting repository info for {OWNER}/{REPO}")


# --- Repository overview snapshot --------------------------------------------

cli_h2("Repository overview")
repo_meta <- safe_gh("GET /repos/{owner}/{repo}", owner = OWNER, repo = REPO)

if (is.null(repo_meta)) {
    cli_abort("Cannot access repository metadata -- check your GITHUB_TOKEN")
}

snapshot <- data.frame(
    collected_at      = format(Sys.time(), "%Y-%m-%dT%H:%M:%SZ", tz = "UTC"),
    stargazers_count  = repo_meta$stargazers_count,
    forks_count       = repo_meta$forks_count,
    open_issues_count = repo_meta$open_issues_count,
    subscribers_count = repo_meta$subscribers_count,
    size              = repo_meta$size,
    stringsAsFactors  = FALSE
)

existing <- load_json(data_path("repo_overview.json"))
merged   <- if (is.null(existing)) snapshot else rbind(existing, snapshot)
save_json(merged, data_path("repo_overview.json"))
cli_alert_info(
    "Stars: {snapshot$stargazers_count} | Forks: {snapshot$forks_count} | Issues: {snapshot$open_issues_count}"
)


cli_alert_success("Repository info collection complete")
