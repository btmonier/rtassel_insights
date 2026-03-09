source(file.path("scripts", "helpers.R"))

cli_h1("Collecting repository info for {OWNER}/{REPO}")


# --- Repository overview snapshot --------------------------------------------

cli_h2("Repository overview")
repo_meta <- gh("GET /repos/{owner}/{repo}", owner = OWNER, repo = REPO)

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


# --- Commit activity (last year, weekly) -------------------------------------

cli_h2("Commit activity")
commit_raw <- gh_get(
    "GET /repos/{owner}/{repo}/stats/commit_activity",
    owner = OWNER, repo = REPO
)

if (!is.null(commit_raw) && length(commit_raw) > 0) {
    new_activity <- do.call(rbind, lapply(commit_raw, function(w) {
        data.frame(
            week  = w$week,
            total = w$total,
            sun   = w$days[[1]], mon = w$days[[2]], tue = w$days[[3]],
            wed   = w$days[[4]], thu = w$days[[5]], fri = w$days[[6]],
            sat   = w$days[[7]],
            stringsAsFactors = FALSE
        )
    }))

    existing <- load_json(data_path("commit_activity.json"))
    merged   <- merge_by_key(existing, new_activity, key = "week")
    save_json(merged, data_path("commit_activity.json"))
    cli_alert_info("Total weekly commit records: {nrow(merged)}")
} else {
    cli_alert_warning("No commit activity data returned")
}


# --- Code frequency (weekly additions/deletions) ----------------------------

cli_h2("Code frequency")
freq_raw <- gh_get(
    "GET /repos/{owner}/{repo}/stats/code_frequency",
    owner = OWNER, repo = REPO
)

if (!is.null(freq_raw) && length(freq_raw) > 0) {
    new_freq <- do.call(rbind, lapply(freq_raw, function(row) {
        data.frame(
            week      = row[[1]],
            additions = row[[2]],
            deletions = row[[3]],
            stringsAsFactors = FALSE
        )
    }))

    existing <- load_json(data_path("code_frequency.json"))
    merged   <- merge_by_key(existing, new_freq, key = "week")
    save_json(merged, data_path("code_frequency.json"))
    cli_alert_info("Total code frequency records: {nrow(merged)}")
} else {
    cli_alert_warning("No code frequency data returned")
}


# --- Contributors ------------------------------------------------------------

cli_h2("Contributors")
contrib_raw <- gh_get(
    "GET /repos/{owner}/{repo}/stats/contributors",
    owner = OWNER, repo = REPO
)

if (!is.null(contrib_raw) && length(contrib_raw) > 0) {
    contributors <- lapply(contrib_raw, function(c) {
        list(login = c$author$login, total = c$total)
    })

    snapshot <- list(
        collected_at = format(Sys.time(), "%Y-%m-%dT%H:%M:%SZ", tz = "UTC"),
        contributors = contributors
    )
    existing <- load_json(data_path("contributors.json"))
    updated  <- append_snapshot(existing, snapshot)
    save_json(updated, data_path("contributors.json"))
    cli_alert_info("Contributors tracked: {length(contributors)}")
} else {
    cli_alert_warning("No contributor data returned")
}


cli_alert_success("Repository info collection complete")
