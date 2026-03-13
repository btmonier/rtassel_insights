library(gh)
library(jsonlite)
library(cli)

OWNER    <- "maize-genetics"
REPO     <- "rTASSEL"
DATA_DIR <- file.path(getwd(), "data")


# --- File I/O ---------------------------------------------------------------

load_json <- function(path) {
    if (!file.exists(path)) return(NULL)
    fromJSON(path, simplifyDataFrame = TRUE)
}

save_json <- function(data, path) {
    if (!dir.exists(dirname(path))) dir.create(dirname(path), recursive = TRUE)
    writeLines(toJSON(data, pretty = TRUE, auto_unbox = TRUE), path)
    cli_alert_success("Saved {.path {path}}")
}

data_path <- function(filename) {
    file.path(DATA_DIR, filename)
}


# --- Merge utilities ---------------------------------------------------------

#' Merge two data frames by key, keeping the newest entry for duplicates.
#' New entries (keys not in existing) are appended.
merge_by_key <- function(existing, new_data, key) {
    if (is.null(existing) || nrow(existing) == 0) return(new_data)
    if (is.null(new_data)  || nrow(new_data) == 0)  return(existing)

    combined <- rbind(existing, new_data)
    combined <- combined[!duplicated(combined[[key]], fromLast = TRUE), ]
    combined <- combined[order(combined[[key]]), ]
    rownames(combined) <- NULL
    combined
}

load_snapshots <- function(path) {
    if (!file.exists(path)) return(list())
    fromJSON(path, simplifyDataFrame = FALSE)
}


# --- Referrers columnar format -------------------------------------------------

#' Load referrers data from JSON. Supports columnar format (referrers + snapshots)
#' and legacy format (array of { collected_at, entries }); legacy is converted
#' to columnar in memory.
load_referrers_columnar <- function(path) {
    if (!file.exists(path))
        return(list(referrers = character(0L), snapshots = list()))
    raw <- fromJSON(path, simplifyDataFrame = FALSE)
    if (length(raw) == 0L)
        return(list(referrers = character(0L), snapshots = list()))
    # Columnar: list with referrers and snapshots
    if (is.list(raw) && !is.null(raw$referrers) && !is.null(raw$snapshots))
        return(list(referrers = raw$referrers, snapshots = raw$snapshots))
    # Legacy: array of { collected_at, entries }
    first <- raw[[1L]]
    if (is.list(first) && !is.null(first$collected_at) && !is.null(first$entries)) {
        return(referrers_legacy_to_columnar(raw))
    }
    list(referrers = character(0L), snapshots = list())
}

#' Convert legacy snapshot array to columnar format.
referrers_legacy_to_columnar <- function(legacy) {
    all_refs <- character(0L)
    for (s in legacy)
        for (e in s$entries)
            all_refs <- c(all_refs, e$referrer)
    referrers <- unique(all_refs)
    snapshots <- list()
    for (s in legacy) {
        row <- vector("list", length(referrers))
        for (i in seq_along(referrers)) {
            hit <- NULL
            for (e in s$entries)
                if (identical(e$referrer, referrers[[i]])) { hit <- e; break }
            row[[i]] <- if (is.null(hit)) list(0L, 0L) else list(as.integer(hit$count), as.integer(hit$uniques))
        }
        snapshots <- c(snapshots, list(list(s$collected_at, row)))
    }
    list(referrers = referrers, snapshots = snapshots)
}

#' Save referrers in columnar format. Snapshot arrays are written on single lines.
save_referrers_columnar <- function(data, path) {
    if (!dir.exists(dirname(path))) dir.create(dirname(path), recursive = TRUE)
    refs_line <- toJSON(data$referrers, pretty = FALSE, auto_unbox = TRUE)
    snap_lines <- vapply(data$snapshots, function(s) toJSON(s, pretty = FALSE, auto_unbox = TRUE), character(1L))
    snap_block <- paste0("    ", snap_lines, c(rep(",", length(snap_lines) - 1L), ""))
    out <- c(
        "{",
        paste0('  "referrers": ', refs_line, ","),
        "  \"snapshots\": [",
        snap_block,
        "  ]",
        "}"
    )
    writeLines(out, path)
    cli_alert_success("Saved {.path {path}}")
}

#' Append one API-style snapshot to columnar data. If the new snapshot contains
#' referrers not in data$referrers, they are appended and existing snapshot
#' rows are padded with [0, 0] so all rows align.
append_snapshot_referrers <- function(existing, new_snapshot) {
    entries <- new_snapshot$entries
    if (length(entries) == 0L) {
        n <- length(existing$referrers)
        row <- if (n > 0L) rep(list(list(0L, 0L)), n) else list()
        return(list(
            referrers = existing$referrers,
            snapshots = c(existing$snapshots, list(list(new_snapshot$collected_at, row)))
        ))
    }
    new_refs <- vapply(entries, function(e) e$referrer, character(1L))
    referrers <- existing$referrers
    for (r in new_refs)
        if (!r %in% referrers) referrers <- c(referrers, r)
    n_new <- length(referrers) - length(existing$referrers)
    snapshots <- existing$snapshots
    if (n_new > 0L) {
        pad <- rep(list(list(0L, 0L)), n_new)
        snapshots <- lapply(snapshots, function(s) list(s[[1L]], c(s[[2L]], pad)))
    }
    row <- vector("list", length(referrers))
    for (i in seq_along(referrers)) {
        hit <- NULL
        for (e in entries)
            if (identical(e$referrer, referrers[[i]])) { hit <- e; break }
        row[[i]] <- if (is.null(hit)) list(0L, 0L) else list(as.integer(hit$count), as.integer(hit$uniques))
    }
    list(referrers = referrers, snapshots = c(snapshots, list(list(new_snapshot$collected_at, row))))
}

#' Load release list from release_downloads.json.
#' Supports legacy format (array of { collected_at, releases }) by using the
#' latest snapshot's releases; otherwise expects array of release entries.
load_release_list <- function(path) {
    if (!file.exists(path)) return(list())
    raw <- fromJSON(path, simplifyDataFrame = FALSE)
    if (length(raw) == 0) return(list())
    first <- raw[[1]]
    if (!is.null(first$collected_at) && !is.null(first$releases)) {
        raw <- raw[[length(raw)]][["releases"]]
    }
    if (is.null(raw)) list() else raw
}

#' Merge release lists by tag_name; new entries (from API) overwrite existing.
#' Returns a list of releases sorted by published_at ascending (oldest first).
merge_releases_by_tag <- function(existing, new_releases) {
    by_tag <- list()
    for (r in existing) by_tag[[r$tag_name]] <- r
    for (r in new_releases) by_tag[[r$tag_name]] <- r
    out <- unname(by_tag)
    dates <- vapply(out, function(r) r$published_at, character(1))
    out[order(dates)]
}


# --- GitHub API helpers ------------------------------------------------------

#' Safe wrapper around gh::gh() that catches HTTP errors and returns NULL
#' instead of stopping execution. Useful for endpoints that may return 403
#' (e.g. traffic data requires push access).
safe_gh <- function(endpoint, ...) {
    tryCatch(
        gh(endpoint, ...),
        http_error_403 = function(e) {
            cli_alert_danger("403 Forbidden: {conditionMessage(e)}")
            NULL
        },
        http_error_404 = function(e) {
            cli_alert_danger("404 Not Found: {conditionMessage(e)}")
            NULL
        },
        error = function(e) {
            cli_alert_danger("API error: {conditionMessage(e)}")
            NULL
        }
    )
}