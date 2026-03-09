source(file.path("scripts", "helpers.R"))

cli_h1("Collecting traffic data for {OWNER}/{REPO}")
had_errors <- FALSE


# --- Views -------------------------------------------------------------------

cli_h2("Page views")
views_raw <- safe_gh(
    "GET /repos/{owner}/{repo}/traffic/views",
    owner = OWNER, repo = REPO, per = "day"
)

if (!is.null(views_raw) && length(views_raw$views) > 0) {
    new_views <- do.call(rbind, lapply(views_raw$views, as.data.frame))
    existing  <- load_json(data_path("traffic_views.json"))
    merged    <- merge_by_key(existing, new_views, key = "timestamp")
    save_json(merged, data_path("traffic_views.json"))
    cli_alert_info("Total view records: {nrow(merged)}")
} else if (is.null(views_raw)) {
    cli_alert_warning("Skipping views (insufficient permissions)")
    had_errors <- TRUE
} else {
    cli_alert_warning("No view data returned")
}


# --- Clones ------------------------------------------------------------------

cli_h2("Clones")
clones_raw <- safe_gh(
    "GET /repos/{owner}/{repo}/traffic/clones",
    owner = OWNER, repo = REPO, per = "day"
)

if (!is.null(clones_raw) && length(clones_raw$clones) > 0) {
    new_clones <- do.call(rbind, lapply(clones_raw$clones, as.data.frame))
    existing   <- load_json(data_path("traffic_clones.json"))
    merged     <- merge_by_key(existing, new_clones, key = "timestamp")
    save_json(merged, data_path("traffic_clones.json"))
    cli_alert_info("Total clone records: {nrow(merged)}")
} else if (is.null(clones_raw)) {
    cli_alert_warning("Skipping clones (insufficient permissions)")
    had_errors <- TRUE
} else {
    cli_alert_warning("No clone data returned")
}


# --- Referrers ---------------------------------------------------------------

cli_h2("Top referrers")
referrers_raw <- safe_gh(
    "GET /repos/{owner}/{repo}/traffic/popular/referrers",
    owner = OWNER, repo = REPO
)

if (!is.null(referrers_raw)) {
    snapshot <- list(
        collected_at = format(Sys.time(), "%Y-%m-%dT%H:%M:%SZ", tz = "UTC"),
        entries = referrers_raw
    )
    existing <- load_json(data_path("traffic_referrers.json"))
    updated  <- append_snapshot(existing, snapshot)
    save_json(updated, data_path("traffic_referrers.json"))
} else {
    cli_alert_warning("Skipping referrers (insufficient permissions)")
    had_errors <- TRUE
}


# --- Popular paths -----------------------------------------------------------

cli_h2("Popular paths")
paths_raw <- safe_gh(
    "GET /repos/{owner}/{repo}/traffic/popular/paths",
    owner = OWNER, repo = REPO
)

if (!is.null(paths_raw)) {
    snapshot <- list(
        collected_at = format(Sys.time(), "%Y-%m-%dT%H:%M:%SZ", tz = "UTC"),
        entries = paths_raw
    )
    existing <- load_json(data_path("traffic_paths.json"))
    updated  <- append_snapshot(existing, snapshot)
    save_json(updated, data_path("traffic_paths.json"))
} else {
    cli_alert_warning("Skipping paths (insufficient permissions)")
    had_errors <- TRUE
}


if (had_errors) {
    cli_alert_warning("Some traffic endpoints were inaccessible. Traffic data requires a classic PAT with {.code repo} scope from an account with push access to {OWNER}/{REPO}.")
}

cli_alert_success("Traffic collection complete")
