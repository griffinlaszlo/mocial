#!/usr/bin/env python3
"""
mocial converter - the local service behind the "Convert" popup on the site.

mocial.org is a static site (GitHub Pages), so it can't run anything itself.
This is the piece that does the actual work: it wraps yt-dlp, and the popup in
index.html talks to it over localhost.

Install the two binaries it shells out to:

    brew install yt-dlp ffmpeg

Run it:

    python3 converter/server.py            # http://127.0.0.1:8770

Stdlib only - there is nothing to pip install.

ADDING A FORMAT
---------------
Everything format-specific lives in the FORMATS table below, and nothing else
in this file (or in main.js) knows that "mp3" exists. mp4 is already in there
as the second entry; a new one is a new Format(...) and no other edits. The
site builds its Format/Quality dropdowns from GET /api/formats at runtime, so
the frontend picks up a new format with no changes at all.

API
---
    GET    /api/health          is the service up, are yt-dlp/ffmpeg present
    GET    /api/formats         the FORMATS table, for building the dropdowns
    POST   /api/convert         {url, format, quality} -> {id}
    GET    /api/jobs/<id>       job state + progress, polled by the popup
    GET    /api/jobs/<id>/file  the finished file, as a download
    DELETE /api/jobs/<id>       cancel a running job / discard a finished one
"""

from __future__ import annotations

import json
import os
import re
import secrets
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import threading
import time
from datetime import datetime, timezone
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Callable, Optional
from urllib.parse import parse_qs, quote, urlparse

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

HOST = os.environ.get("MOCIAL_CONVERTER_HOST", "127.0.0.1")
PORT = int(os.environ.get("MOCIAL_CONVERTER_PORT", "8770"))

# Where finished files live until they're collected or expire. Per-job
# subdirectories, so two jobs can't collide on a filename.
WORK_ROOT = Path(os.environ.get(
    "MOCIAL_CONVERTER_DIR",
    Path(tempfile.gettempdir()) / "mocial-converter",
))

# The conversion log. Deliberately NOT under WORK_ROOT - that's a temp
# directory the janitor sweeps, and the whole point of the log is that it
# outlives the files. Sits next to this script instead.
#
# It records links and metadata only. No audio is kept here, and no IP
# addresses or user agents either: a list of what was converted is useful,
# a list of who converted what is a liability with no upside.
LOG_DB = Path(os.environ.get(
    "MOCIAL_CONVERTER_DB",
    Path(__file__).resolve().parent / "conversions.db",
))

# The FREE IDEAS notepad, written to a real file in the project root so it can
# be committed and published. Deliberately NOT in converter/ - that folder's
# database is gitignored, and this one is meant to be public: anyone opening
# mocial.org reads it as a static file.
#
# Only this server can write it, and this server only ever listens on
# localhost. That's the whole permission model - a visitor can't edit the
# notes because the thing that edits them isn't reachable from the internet,
# not because a flag says read-only.
NOTES_FILE = Path(os.environ.get(
    "MOCIAL_NOTES_FILE",
    Path(__file__).resolve().parent.parent / "ideas.txt",
))
MAX_NOTES_BYTES = 200 * 1024

# The ceiling on any request body. Has to comfortably clear MAX_NOTES_BYTES
# plus JSON escaping overhead - when this was the smaller of the two, an
# oversized note was discarded before the notes handler ever saw it.
MAX_BODY_BYTES = 4 * MAX_NOTES_BYTES

# yt-dlp is doing real network + CPU work, so a handful at once, not unbounded.
MAX_ACTIVE_JOBS = 2

# Finished jobs (and their files) are swept this long after they finish. Long
# enough that a slow click still gets the file, short enough that /tmp doesn't
# silently fill up with other people's music.
JOB_TTL_SECONDS = 30 * 60

# A guard against someone pasting an 8-hour livestream archive and pinning the
# machine. `<?` means "pass if the duration is unknown".
MAX_DURATION_SECONDS = 60 * 60

# yt-dlp gets killed if it produces no output at all for this long - a dead
# network otherwise leaves a job spinning forever.
STALL_TIMEOUT_SECONDS = 120

# How much of the progress bar the download owns. The remainder belongs to
# ffmpeg, which reports no percentage of its own - so rather than switch the
# popup to a second style of animation for that phase, the bar simply holds
# near the end until the file is written. One bar, one direction, start to
# finish.
DOWNLOAD_SHARE = 90.0
POSTPROCESS_PERCENT = 95.0

# The site is the only intended caller. An allowlist rather than "*" because
# this process can reach the network and write files, and any page you have
# open would otherwise be able to drive it.
ALLOWED_ORIGINS = {
    "https://mocial.org",
    "https://www.mocial.org",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:5500",   # VS Code Live Server
    "http://127.0.0.1:5500",
    "null",                    # index.html opened straight off disk (file://)
}

# yt-dlp will happily fetch from a thousand sites, including plain file paths
# and internal hosts. This service only ever needs YouTube, so it only gets
# YouTube - that keeps a stray request to this port from turning the box into
# a general-purpose fetcher.
ALLOWED_HOSTS = {
    "youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com",
    "youtu.be", "www.youtu.be",
    "youtube-nocookie.com", "www.youtube-nocookie.com",
}


# ---------------------------------------------------------------------------
# Formats
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Format:
    key: str
    label: str
    ext: str
    mime: str
    # (value, label) pairs, offered in the popup's Quality dropdown
    qualities: tuple
    default_quality: str
    needs_ffmpeg: bool
    # How many separate downloads yt-dlp is expected to make. Audio is one
    # stream; mp4 above 720p is video + audio downloaded separately and then
    # merged, which is two. Only used to keep the progress bar honest - see
    # Job.note_download_start.
    streams: int
    # quality value -> the yt-dlp flags that produce it
    build_args: Callable[[str], list]


def _mp3_args(_quality: str) -> list:
    # No quality knob on purpose. YouTube's best audio for a given video tops
    # out around 130 kbps (checked: 130k AAC / 107k Opus), so no MP3 setting
    # can add information the source never carried - a 320 kbps encode is just
    # a larger file of the same music, and a 128 kbps one adds transcoding
    # loss on top of audio that is already lossy. Offering the choice invites
    # a mistake in both directions.
    #
    # --audio-quality 0 is LAME's best VBR (~V0). Transparent from a source
    # this size, and smaller than 320 CBR.
    return [
        "-f", "bestaudio/best",
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "0",
        # Title/artist/date into the ID3 tags, so the file arrives labelled.
        # Deliberately not --embed-thumbnail: it needs a working image stream
        # and fails the whole job on videos that don't have one.
        "--embed-metadata",
    ]


def _mp4_args(_quality: str) -> list:
    # No resolution knob either: MP4 takes the best available, the same way
    # MP3 takes the best audio.
    #
    # "Best" is bounded by the codec preference below rather than being
    # literally the largest thing YouTube holds. Asking plainly for best gets
    # AV1 video and Opus audio - legal inside an .mp4 and playable in almost
    # nothing Apple ships; QuickTime, iMovie and Photos all refuse them. So
    # each rung asks for H.264 (avc1) + AAC (mp4a) first.
    #
    # That has a useful side effect: YouTube's H.264 tops out at 1080p, so
    # "best" lands there rather than pulling a multi-hundred-megabyte 4K file
    # for a clip. Only a video with no H.264 at all falls through to whatever
    # exists.
    selector = (
        "bv*[vcodec^=avc1]+ba[acodec^=mp4a]/"   # H.264 + AAC, the safe pair
        "b[vcodec^=avc1]/"                      # pre-muxed H.264
        "bv*+ba/"                               # anything, merged
        "b"                                     # anything at all
    )

    return [
        "-f", selector,
        "--merge-output-format", "mp4",
        "--embed-metadata",
    ]


FORMATS = {
    "mp3": Format(
        key="mp3",
        label="MP3 (audio)",
        ext="mp3",
        mime="audio/mpeg",
        # Empty: the popup hides the Quality dropdown for formats that offer
        # no meaningful choice. See _mp3_args.
        qualities=(),
        default_quality="",
        needs_ffmpeg=True,
        streams=1,
        build_args=_mp3_args,
    ),
    "mp4": Format(
        key="mp4",
        label="MP4 (video)",
        ext="mp4",
        mime="video/mp4",
        # Empty, like mp3's: no choice to offer, so the popup renders MP4 as a
        # plain button with no flyout. See _mp4_args.
        qualities=(),
        default_quality="",
        needs_ffmpeg=True,
        streams=2,
        build_args=_mp4_args,
    ),
}

DEFAULT_FORMAT = "mp3"


# ---------------------------------------------------------------------------
# yt-dlp plumbing
# ---------------------------------------------------------------------------

# yt-dlp's own progress line is meant for humans and changes between versions.
# --progress-template lets us ask for exactly the fields we want, prefixed so
# they're trivially separable from the rest of its chatter on the same stream.
PROGRESS_PREFIX = "@@PROG@@"
PROGRESS_TEMPLATE = (
    "download:" + PROGRESS_PREFIX +
    "%(progress.downloaded_bytes)s|%(progress.total_bytes)s|"
    "%(progress.total_bytes_estimate)s|%(progress.eta)s|%(progress.speed)s"
)

DESTINATION_RE = re.compile(r"^\[download\]\s+Destination:\s+(.*)$")
ALREADY_RE = re.compile(r"^\[download\]\s+(.*) has already been downloaded")

# Lines that mean the download is done and ffmpeg is now chewing on the file.
# ffmpeg reports no percentage of its own, which is why DOWNLOAD_SHARE holds
# back a slice of the bar for this phase instead of the popup switching to a
# different animation for it.
POSTPROCESS_MARKERS = (
    "[ExtractAudio]", "[Merger]", "[VideoConvertor]", "[Metadata]",
    "[FixupM4a]", "[FixupM3u8]", "[EmbedThumbnail]", "[EmbedSubtitle]",
)

# yt-dlp's leftovers, not the thing we asked it for
INTERMEDIATE_SUFFIXES = (".part", ".ytdl", ".temp", ".tmp")


def which(binary: str) -> Optional[str]:
    return shutil.which(binary)


def tool_version(binary: str) -> Optional[str]:
    path = which(binary)
    if not path:
        return None
    try:
        out = subprocess.run(
            [path, "--version"], capture_output=True, text=True, timeout=10,
        )
        return (out.stdout or out.stderr).strip().splitlines()[0][:80]
    except Exception:
        return "unknown"


def validate_url(raw: str) -> str:
    """Return the URL to hand to yt-dlp, or raise ValueError with a reason."""
    raw = (raw or "").strip()
    if not raw:
        raise ValueError("Paste a YouTube link first.")
    if len(raw) > 2000:
        raise ValueError("That link is too long to be real.")
    # A leading dash would be read as a flag rather than a URL. argv is passed
    # as a list and terminated with "--" below, so this is belt and braces.
    if raw.startswith("-"):
        raise ValueError("That doesn't look like a link.")

    parsed = urlparse(raw)
    if parsed.scheme not in ("http", "https"):
        raise ValueError("Links have to start with http:// or https://.")

    host = (parsed.hostname or "").lower()
    if host not in ALLOWED_HOSTS:
        raise ValueError("Only YouTube links work here.")

    return raw


# ---------------------------------------------------------------------------
# Jobs
# ---------------------------------------------------------------------------

@dataclass
class Job:
    id: str
    url: str
    fmt: Format
    quality: str
    directory: Path

    state: str = "queued"          # queued|downloading|converting|done|error|cancelled
    percent: float = 0.0           # 0-100, already normalised across streams
    title: Optional[str] = None
    eta: Optional[int] = None
    speed: Optional[float] = None
    downloaded: Optional[int] = None
    total: Optional[int] = None

    filename: Optional[str] = None
    size: Optional[int] = None
    error: Optional[str] = None

    created_at: float = field(default_factory=time.time)
    finished_at: Optional[float] = None

    # Internals
    proc: Optional[subprocess.Popen] = None
    cancelled: bool = False
    stream_index: int = 0
    tail: list = field(default_factory=list)   # last few output lines, for errors
    lock: threading.Lock = field(default_factory=threading.Lock)

    @property
    def path(self) -> Optional[Path]:
        return self.directory / self.filename if self.filename else None

    def note_download_start(self, dest: str) -> None:
        """A new file started downloading.

        For mp4 yt-dlp downloads video and audio as separate files, so the raw
        percentage runs 0-100 twice. Counting the streams lets the popup show
        one bar that only ever moves forwards.
        """
        self.stream_index += 1
        stem = Path(dest).stem
        # yt-dlp appends the format id to per-stream files (Song.f251.webm)
        stem = re.sub(r"\.f\d+$", "", stem)
        if stem and (self.title is None or self.stream_index == 1):
            self.title = stem

    def note_progress(self, downloaded, total, estimate, eta, speed) -> None:
        total = total if total is not None else estimate
        self.downloaded = downloaded
        self.total = total
        self.eta = eta
        self.speed = speed

        fraction = (downloaded / total) if (downloaded and total) else 0.0
        fraction = min(max(fraction, 0.0), 1.0)

        # Streams already finished + how far into the current one we are. The
        # denominator takes the larger of "what we expected" and "what we've
        # actually seen", so a guess that's too low self-corrects rather than
        # letting the bar shoot past 100.
        index = max(self.stream_index, 1)
        expected = max(self.fmt.streams, index)
        # Scaled into the download's share of the bar rather than the whole of
        # it. ffmpeg still has to run after the bytes land, and a bar that
        # reads 100% while the job is visibly still going is worse than one
        # that saves a little room for the part that's left.
        self.percent = ((index - 1) + fraction) / expected * DOWNLOAD_SHARE
        self.state = "downloading"

    def to_dict(self) -> dict:
        with self.lock:
            return {
                "id": self.id,
                "state": self.state,
                "format": self.fmt.key,
                "quality": self.quality,
                "percent": round(self.percent, 1),
                "title": self.title,
                "eta": self.eta,
                "speed": self.speed,
                "downloaded": self.downloaded,
                "total": self.total,
                "filename": self.filename,
                "size": self.size,
                "error": self.error,
                "download_url": ("/api/jobs/%s/file" % self.id) if self.state == "done" else None,
            }


JOBS: dict[str, Job] = {}
JOBS_LOCK = threading.Lock()


def active_job_count() -> int:
    with JOBS_LOCK:
        return sum(1 for j in JOBS.values()
                   if j.state in ("queued", "downloading", "converting"))


def build_command(job: Job) -> list:
    # Truncation belongs on the title, not on the path. --trim-filenames
    # measures the whole thing, and on macOS gettempdir() is already ~85
    # characters of /var/folders/... before the title starts - which chopped
    # every filename to about 35 characters. `.120B` bounds the title field
    # itself, in bytes, so it stays clear of the 255-byte filesystem limit
    # however long the working directory happens to be.
    output_template = str(job.directory / "%(title).120B.%(ext)s")
    return [
        which("yt-dlp"),
        # Don't let a personal ~/.config/yt-dlp/config change what this
        # service does out from under it.
        "--ignore-config",
        "--no-playlist",
        "--no-colors",
        "--newline",
        "--progress",
        "--progress-template", PROGRESS_TEMPLATE,
        "--match-filter", "!is_live & duration<?%d" % MAX_DURATION_SECONDS,
        "--retries", "3",
        "--no-overwrites",
        "-o", output_template,
        *job.fmt.build_args(job.quality),
        "--",                      # nothing after this is read as a flag
        job.url,
    ]


def find_output_file(job: Job) -> Optional[Path]:
    """The finished file, picked out of whatever yt-dlp left in the job dir."""
    candidates = [
        p for p in job.directory.iterdir()
        if p.is_file() and not p.name.startswith(".")
        and not p.name.endswith(INTERMEDIATE_SUFFIXES)
    ]
    if not candidates:
        return None
    # Prefer the extension we asked for; otherwise the biggest thing there.
    wanted = [p for p in candidates if p.suffix.lower() == "." + job.fmt.ext]
    pool = wanted or candidates
    return max(pool, key=lambda p: p.stat().st_size)


# ---------------------------------------------------------------------------
# Conversion log
# ---------------------------------------------------------------------------
#
# One row per finished conversion: what link, what format, whether it worked.
# The audio itself is never kept here - the files still sweep out of the temp
# directory on the usual 30 minute timer, and nothing about this log changes
# that.
#
# What is deliberately absent is as much a decision as what's present. No IP
# addresses, no user agents, no session ids. "What has this thing converted"
# is a useful list to have; "who converted what" is a record worth
# subpoenaing, and there's no feature here that needs it.

LOG_LOCK = threading.Lock()

LOG_SCHEMA = """
CREATE TABLE IF NOT EXISTS conversions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id     TEXT,
    url          TEXT    NOT NULL,
    title        TEXT,
    format       TEXT    NOT NULL,
    quality      TEXT,
    size_bytes   INTEGER,
    state        TEXT    NOT NULL,
    error        TEXT,
    started_at   TEXT    NOT NULL,
    finished_at  TEXT
);
CREATE INDEX IF NOT EXISTS conversions_recent ON conversions(id DESC);
CREATE INDEX IF NOT EXISTS conversions_video  ON conversions(video_id);
"""


def log_connect() -> sqlite3.Connection:
    db = sqlite3.connect(LOG_DB, timeout=5)
    db.row_factory = sqlite3.Row
    return db


def init_log() -> None:
    db = log_connect()
    try:
        db.executescript(LOG_SCHEMA)
        db.commit()
    finally:
        db.close()


def iso(stamp: Optional[float]) -> Optional[str]:
    if not stamp:
        return None
    return datetime.fromtimestamp(stamp, timezone.utc).isoformat(timespec="seconds")


def video_id_from(url: str) -> Optional[str]:
    """The v= parameter, or the path for a youtu.be short link."""
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    if host.endswith("youtu.be"):
        return parsed.path.lstrip("/").split("/")[0] or None
    found = parse_qs(parsed.query).get("v")
    return found[0] if found else None


def record_conversion(job: Job) -> None:
    """Best effort by design: a log that can't be written is never a reason to
    fail a conversion the user is already holding."""
    try:
        with LOG_LOCK:
            db = log_connect()
            try:
                db.execute(
                    "INSERT INTO conversions (video_id, url, title, format, "
                    "quality, size_bytes, state, error, started_at, finished_at) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (
                        video_id_from(job.url), job.url, job.title, job.fmt.key,
                        job.quality or None, job.size, job.state, job.error,
                        iso(job.created_at), iso(job.finished_at),
                    ),
                )
                db.commit()
            finally:
                db.close()
    except sqlite3.Error as exc:
        sys.stderr.write("  couldn't write to the log: %s\n" % exc)


def read_log(limit: int = 100) -> dict:
    db = log_connect()
    try:
        rows = db.execute(
            "SELECT * FROM conversions ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        total = db.execute("SELECT COUNT(*) FROM conversions").fetchone()[0]
        distinct = db.execute(
            "SELECT COUNT(DISTINCT video_id) FROM conversions "
            "WHERE video_id IS NOT NULL"
        ).fetchone()[0]
    finally:
        db.close()
    return {
        "conversions": [dict(row) for row in rows],
        "total": total,
        "distinct_videos": distinct,
    }


# ---------------------------------------------------------------------------
# Notes
# ---------------------------------------------------------------------------

NOTES_LOCK = threading.Lock()


def read_notes() -> dict:
    try:
        text = NOTES_FILE.read_text(encoding="utf-8")
        stamp = iso(NOTES_FILE.stat().st_mtime)
    except FileNotFoundError:
        text, stamp = "", None
    except OSError as exc:
        raise ValueError("Couldn't read the notes file: %s" % exc)
    return {"text": text, "updated_at": stamp, "path": str(NOTES_FILE)}


def write_notes(text: str) -> dict:
    if not isinstance(text, str):
        raise ValueError("Notes have to be text.")
    encoded = text.encode("utf-8")
    if len(encoded) > MAX_NOTES_BYTES:
        raise ValueError(
            "That's longer than the %dKB the notepad holds." % (MAX_NOTES_BYTES // 1024)
        )

    with NOTES_LOCK:
        # Write beside the target and rename over it. A rename is atomic, so a
        # crash or a full disk mid-write leaves the previous notes intact
        # rather than a half-written file - which for the only copy of
        # something you typed is worth the extra two lines.
        NOTES_FILE.parent.mkdir(parents=True, exist_ok=True)
        temp = NOTES_FILE.with_suffix(NOTES_FILE.suffix + ".tmp")
        try:
            temp.write_bytes(encoded)
            os.replace(temp, NOTES_FILE)
        except OSError as exc:
            temp.unlink(missing_ok=True)
            raise ValueError("Couldn't save the notes: %s" % exc)

    return {"saved": True, "bytes": len(encoded), "updated_at": iso(time.time())}


def run_job(job: Job) -> None:
    command = build_command(job)
    last_output = time.time()

    try:
        job.proc = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            cwd=str(job.directory),
        )
    except OSError as exc:
        with job.lock:
            job.state = "error"
            job.error = "Couldn't start yt-dlp: %s" % exc
            job.finished_at = time.time()
        return

    # A watchdog rather than a timeout on the whole job: a big 1080p file can
    # legitimately take a long time, but it should never go quiet for minutes.
    def watchdog():
        while job.proc and job.proc.poll() is None:
            if time.time() - last_output > STALL_TIMEOUT_SECONDS:
                job.proc.kill()
                with job.lock:
                    if not job.cancelled:
                        job.error = "The download stalled and was stopped."
                return
            time.sleep(5)

    threading.Thread(target=watchdog, daemon=True).start()

    for raw in job.proc.stdout:
        last_output = time.time()
        line = raw.rstrip("\n")
        if not line:
            continue

        if line.startswith(PROGRESS_PREFIX):
            parts = line[len(PROGRESS_PREFIX):].split("|")
            if len(parts) == 5:
                nums = [_num(p) for p in parts]
                with job.lock:
                    if not job.cancelled:
                        job.note_progress(*nums)
            continue

        # Keep a short tail so a failure can say what actually went wrong
        # rather than just "it didn't work".
        job.tail.append(line)
        if len(job.tail) > 40:
            job.tail.pop(0)

        match = DESTINATION_RE.match(line) or ALREADY_RE.match(line)
        if match:
            with job.lock:
                job.note_download_start(match.group(1))
            continue

        if line.startswith(POSTPROCESS_MARKERS):
            with job.lock:
                if job.state != "cancelled":
                    job.state = "converting"
                    # Near the end, not at it - the file isn't written yet
                    job.percent = POSTPROCESS_PERCENT
            continue

    code = job.proc.wait()

    with job.lock:
        if job.cancelled:
            job.state = "cancelled"
            job.finished_at = time.time()
            return

    produced = find_output_file(job)

    with job.lock:
        if produced:
            job.filename = produced.name
            job.size = produced.stat().st_size
            job.title = job.title or produced.stem
            job.state = "done"
            job.percent = 100.0
        else:
            job.state = "error"
            job.error = job.error or explain_failure(job, code)
        job.finished_at = time.time()

    # After the state is settled, so the row reflects what actually happened.
    # Cancelled jobs never reach here - a link someone thought better of isn't
    # something this needs to remember.
    record_conversion(job)

    if not produced:
        cleanup_job_dir(job)


def _num(value: str):
    """yt-dlp writes "NA" for fields it doesn't have yet."""
    value = value.strip()
    if not value or value == "NA" or value == "None":
        return None
    try:
        return int(value)
    except ValueError:
        try:
            return float(value)
        except ValueError:
            return None


def explain_failure(job: Job, code: int) -> str:
    """Turn yt-dlp's output into something worth showing in a dialog."""
    blob = "\n".join(job.tail)

    if "does not pass filter" in blob or "skipping" in blob.lower():
        if "is_live" in blob or "live" in blob.lower():
            return "That's a livestream - only finished videos can be converted."
        return "That video is longer than the %d minute limit." % (MAX_DURATION_SECONDS // 60)
    if "Private video" in blob:
        return "That video is private."
    if "Video unavailable" in blob or "is not available" in blob:
        return "That video isn't available."
    if "members-only" in blob.lower() or "Join this channel" in blob:
        return "That video is members-only."
    if "Sign in to confirm" in blob or "age" in blob.lower() and "restricted" in blob.lower():
        return "That video is age-restricted and can't be fetched."
    if "ffmpeg" in blob.lower() and "not found" in blob.lower():
        return "ffmpeg isn't installed - run: brew install ffmpeg"
    if "Unable to download webpage" in blob or "Temporary failure" in blob:
        return "Couldn't reach YouTube. Check your connection."

    # Last resort: yt-dlp's own last ERROR line, which is usually readable.
    for line in reversed(job.tail):
        if line.startswith("ERROR:"):
            return line[len("ERROR:"):].strip()[:300]
    return "Conversion failed (yt-dlp exited with code %s)." % code


def cleanup_job_dir(job: Job) -> None:
    shutil.rmtree(job.directory, ignore_errors=True)


def janitor() -> None:
    """Sweep finished jobs and their files once they've aged out."""
    while True:
        time.sleep(60)
        now = time.time()
        with JOBS_LOCK:
            expired = [
                job for job in JOBS.values()
                if job.finished_at and now - job.finished_at > JOB_TTL_SECONDS
            ]
            for job in expired:
                JOBS.pop(job.id, None)
        for job in expired:
            cleanup_job_dir(job)


# ---------------------------------------------------------------------------
# HTTP
# ---------------------------------------------------------------------------

class Handler(BaseHTTPRequestHandler):
    server_version = "mocial-converter"
    protocol_version = "HTTP/1.1"

    def handle_one_request(self):
        # A handler instance is created per CONNECTION, not per request, and
        # keep-alive runs several requests through the same object. Without
        # this reset the body cache leaks forward: the browser's GET
        # /api/formats marks the body as read, and the POST that follows on
        # the same connection then reads the GET's empty cache instead of its
        # own JSON. curl never caught it - it opens a fresh connection each
        # time, so every request got a clean instance.
        self._body_done = False
        self._body_cache = {}
        super().handle_one_request()

    # ---- helpers ----------------------------------------------------------

    def _cors(self) -> None:
        origin = self.headers.get("Origin")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "600")

    def _json(self, payload: dict, status: int = 200) -> None:
        # Connections are keep-alive, so anything left unread in the socket is
        # taken as the start of the next request - which surfaces as a
        # baffling 400 on a request nobody made, and then a dead connection.
        # Rejecting a POST early (bad URL, missing yt-dlp) is exactly the case
        # that leaves a body behind, so every response drains first.
        self._read_body()

        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _error(self, message: str, status: int = 400) -> None:
        self._json({"error": message}, status)

    def _read_body(self) -> dict:
        """Parse the JSON request body. Safe to call repeatedly - the socket
        is only ever read once, and later calls get the cached result.

        Sets self._body_error when the body could not be read as JSON. That
        distinction matters: returning a bare {} for an unreadable body makes
        it indistinguishable from a body that legitimately said nothing, and a
        handler doing payload.get("text", "") then treats "your request was too
        big to read" as "set the text to empty" - which is how an oversized
        PUT silently erased the notes file it was meant to be refusing.
        """
        if getattr(self, "_body_done", False):
            return self._body_cache
        self._body_done = True
        self._body_cache = {}
        self._body_error = None

        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            return self._body_cache

        if length > MAX_BODY_BYTES:
            # Don't read it, and don't try to keep the connection: the unread
            # bytes would be parsed as the next request line.
            self._body_error = "That request is too large."
            self.close_connection = True
            return self._body_cache

        raw = self.rfile.read(length)
        try:
            parsed = json.loads(raw.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            self._body_error = "That request wasn't valid JSON."
            return self._body_cache

        if not isinstance(parsed, dict):
            self._body_error = "That request wasn't a JSON object."
            return self._body_cache

        self._body_cache = parsed
        return self._body_cache

    def log_message(self, fmt, *args):  # quieter than the default
        sys.stderr.write("  %s\n" % (fmt % args))

    # ---- routes -----------------------------------------------------------

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path.rstrip("/") or "/"

        if path == "/api/health":
            return self._json({
                "ok": True,
                "ytdlp": tool_version("yt-dlp"),
                "ffmpeg": tool_version("ffmpeg"),
                "active": active_job_count(),
            })

        if path == "/api/notes":
            try:
                return self._json(read_notes())
            except ValueError as exc:
                return self._error(str(exc), 500)

        if path == "/api/log":
            asked = parse_qs(urlparse(self.path).query).get("limit", ["100"])[0]
            try:
                limit = max(1, min(int(asked), 1000))
            except ValueError:
                limit = 100
            return self._json(read_log(limit))

        if path == "/api/formats":
            return self._json({
                "default": DEFAULT_FORMAT,
                "formats": [
                    {
                        "key": f.key,
                        "label": f.label,
                        "ext": f.ext,
                        "qualities": [{"value": v, "label": l} for v, l in f.qualities],
                        "default_quality": f.default_quality,
                    }
                    for f in FORMATS.values()
                ],
            })

        parts = path.strip("/").split("/")
        # /api/jobs/<id> and /api/jobs/<id>/file
        if len(parts) >= 3 and parts[0] == "api" and parts[1] == "jobs":
            job = JOBS.get(parts[2])
            if not job:
                return self._error("No such job.", 404)
            if len(parts) == 3:
                return self._json(job.to_dict())
            if len(parts) == 4 and parts[3] == "file":
                return self._send_file(job)

        return self._error("Not found.", 404)

    def do_POST(self):
        if urlparse(self.path).path.rstrip("/") != "/api/convert":
            return self._error("Not found.", 404)

        payload = self._read_body()

        # What they typed first, what the machine is missing second: a bad
        # link is worth saying even when yt-dlp is absent, and it saves a
        # second round trip through the dialog.
        try:
            url = validate_url(payload.get("url", ""))
        except ValueError as exc:
            return self._error(str(exc))

        fmt = FORMATS.get(payload.get("format") or DEFAULT_FORMAT)
        if not fmt:
            return self._error("Unknown format.")

        if not which("yt-dlp"):
            return self._error(
                "yt-dlp isn't installed on the converter machine. "
                "Run: brew install yt-dlp", 503,
            )

        if fmt.needs_ffmpeg and not which("ffmpeg"):
            return self._error(
                "ffmpeg isn't installed on the converter machine. "
                "Run: brew install ffmpeg", 503,
            )

        quality = payload.get("quality") or fmt.default_quality
        if quality not in [v for v, _ in fmt.qualities]:
            quality = fmt.default_quality

        if active_job_count() >= MAX_ACTIVE_JOBS:
            return self._error("The converter is busy. Try again in a moment.", 429)

        # Unguessable, because the file endpoint is keyed on it alone.
        job_id = secrets.token_urlsafe(12)
        directory = WORK_ROOT / job_id
        directory.mkdir(parents=True, exist_ok=True)

        job = Job(id=job_id, url=url, fmt=fmt, quality=quality, directory=directory)
        with JOBS_LOCK:
            JOBS[job_id] = job

        threading.Thread(target=run_job, args=(job,), daemon=True).start()
        return self._json(job.to_dict(), 202)

    def do_PUT(self):
        if urlparse(self.path).path.rstrip("/") != "/api/notes":
            return self._error("Not found.", 404)

        payload = self._read_body()
        if getattr(self, "_body_error", None):
            return self._error(self._body_error, 413)

        # Absent key is a malformed request, not an instruction to blank the
        # file. Clearing the notes is still possible - it just has to be said
        # out loud, as {"text": ""}.
        if "text" not in payload:
            return self._error("No text in that request.")

        try:
            return self._json(write_notes(payload["text"]))
        except ValueError as exc:
            return self._error(str(exc))

    def do_DELETE(self):
        parts = urlparse(self.path).path.strip("/").split("/")
        if len(parts) != 3 or parts[0] != "api" or parts[1] != "jobs":
            return self._error("Not found.", 404)

        job = JOBS.get(parts[2])
        if not job:
            return self._error("No such job.", 404)

        with job.lock:
            job.cancelled = True
            if job.state in ("queued", "downloading", "converting"):
                job.state = "cancelled"
        if job.proc and job.proc.poll() is None:
            job.proc.terminate()

        with JOBS_LOCK:
            JOBS.pop(job.id, None)
        cleanup_job_dir(job)
        return self._json({"cancelled": True})

    # ---- file download ----------------------------------------------------

    def _send_file(self, job: Job):
        if job.state != "done" or not job.path:
            return self._error("That file isn't ready.", 409)

        path = job.path.resolve()
        # The name came from a video title, so confirm it really did land
        # inside the job's own directory before opening it.
        try:
            path.relative_to(job.directory.resolve())
        except ValueError:
            return self._error("That file isn't available.", 403)
        if not path.is_file():
            return self._error("That file has expired.", 410)

        size = path.stat().st_size
        # Non-ASCII titles are common; filename* carries the real one and
        # plain filename= is the fallback for anything that can't read it.
        pretty = "%s.%s" % (job.title or "mocial", job.fmt.ext)
        ascii_name = re.sub(r'[^A-Za-z0-9._ -]', "_", pretty) or "download.%s" % job.fmt.ext

        self.send_response(200)
        self.send_header("Content-Type", job.fmt.mime)
        self.send_header("Content-Length", str(size))
        self.send_header(
            "Content-Disposition",
            "attachment; filename=\"%s\"; filename*=UTF-8''%s" % (
                ascii_name, quote(pretty, safe=""),
            ),
        )
        self.send_header("Cache-Control", "no-store")
        self._cors()
        self.end_headers()

        try:
            with path.open("rb") as handle:
                shutil.copyfileobj(handle, self.wfile, 64 * 1024)
        except (BrokenPipeError, ConnectionResetError):
            # Cancelling a download in the browser is normal, not an error
            # worth a traceback on the terminal.
            pass


def main() -> None:
    WORK_ROOT.mkdir(parents=True, exist_ok=True)
    init_log()
    threading.Thread(target=janitor, daemon=True).start()

    missing = [b for b in ("yt-dlp", "ffmpeg") if not which(b)]

    print("mocial converter  ->  http://%s:%d" % (HOST, PORT))
    print("  files:   %s" % WORK_ROOT)
    print("  log:     %s" % LOG_DB)
    print("  yt-dlp:  %s" % (tool_version("yt-dlp") or "NOT INSTALLED"))
    print("  ffmpeg:  %s" % (tool_version("ffmpeg") or "NOT INSTALLED"))
    if missing:
        print("\n  Install what's missing first:  brew install %s\n" % " ".join(missing))

    server = ThreadingHTTPServer((HOST, PORT), Handler)
    server.daemon_threads = True
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
        server.server_close()


if __name__ == "__main__":
    main()
