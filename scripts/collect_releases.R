source(file.path("scripts", "helpers.R"))

cli_h1("Collecting release data for {OWNER}/{REPO}")

releases_raw <- safe_gh(
    "GET /repos/{owner}/{repo}/releases",
    owner = OWNER, repo = REPO,
    .limit = Inf
)

if (is.null(releases_raw)) {
    cli_alert_danger("Cannot access releases endpoint")
    cli_alert_success("Release collection complete (with errors)")
    quit(status = 0)
}

if (length(releases_raw) > 0) {
    releases <- lapply(releases_raw, function(rel) {
        assets <- lapply(rel$assets, function(a) {
            list(
                name           = a$name,
                download_count = a$download_count,
                size           = a$size
            )
        })

        list(
            tag_name     = rel$tag_name,
            name         = rel$name,
            published_at = rel$published_at,
            assets       = assets
        )
    })

    snapshot <- list(
        collected_at = format(Sys.time(), "%Y-%m-%dT%H:%M:%SZ", tz = "UTC"),
        releases     = releases
    )

    existing <- load_json(data_path("release_downloads.json"))
    updated  <- append_snapshot(existing, snapshot)
    save_json(updated, data_path("release_downloads.json"))

    cli_alert_info("Releases tracked: {length(releases)}")
} else {
    cli_alert_warning("No releases found")
}

cli_alert_success("Release collection complete")
