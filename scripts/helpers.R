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

#' Append a snapshot to an existing list of snapshots.
append_snapshot <- function(existing, snapshot) {
    if (is.null(existing)) return(list(snapshot))
    c(existing, list(snapshot))
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