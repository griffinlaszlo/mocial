# mocial converter

The service behind the **Convert YouTube** popup on the site.

mocial.org is a static site — GitHub Pages serves files, it doesn't run code —
so the conversion can't happen "on the site" in the literal sense. This is the
piece that does the work, running on your own machine. The popup talks to it
over localhost.

## Setup

```bash
brew install yt-dlp ffmpeg
```

That's the whole dependency list. `server.py` is stdlib-only — nothing to pip
install, no virtualenv.

## Running

```bash
python3 converter/server.py
```

It listens on `http://127.0.0.1:8770` and prints which of `yt-dlp` / `ffmpeg`
it found. Leave it running in a terminal while you use the site.

To keep the files somewhere other than `/tmp`, or to move the port:

```bash
MOCIAL_CONVERTER_PORT=9000 MOCIAL_CONVERTER_DIR=~/Music/mocial python3 converter/server.py
```

If you move the port, tell the site where to look — from the browser console:

```js
localStorage.setItem("mocial-converter-api", "http://127.0.0.1:9000")
```

## Adding a format

Everything format-specific lives in the `FORMATS` table at the top of
`server.py`. Nothing else in the file — and nothing at all in `main.js` —
knows that "mp3" exists.

`mp4` is already in the table as the second entry. A new format is one more
`Format(...)`:

```python
"wav": Format(
    key="wav", label="WAV (lossless)", ext="wav", mime="audio/wav",
    qualities=(("0", "Best"),), default_quality="0",
    needs_ffmpeg=True, streams=1,
    build_args=lambda q: ["-f", "bestaudio/best", "-x", "--audio-format", "wav"],
),
```

The site builds its **Format** and **Quality** dropdowns from
`GET /api/formats` at page load, so a format added here appears in the popup
with no frontend change. Restart the server, reload the page.

`streams` is the only non-obvious field: it's how many separate downloads
yt-dlp is expected to make, so the progress bar can show one number instead of
running 0–100 twice. Audio is `1`. Video above 720p is video + audio fetched
separately and merged, so `2`. Guessing low is safe — the bar corrects itself.

## API

| | |
|---|---|
| `GET /api/health` | is it up, are yt-dlp/ffmpeg present |
| `GET /api/formats` | the `FORMATS` table, for the dropdowns |
| `POST /api/convert` | `{url, format, quality}` → `{id}` |
| `GET /api/jobs/<id>` | state + progress, polled twice a second |
| `GET /api/jobs/<id>/file` | the finished file, as a download |
| `DELETE /api/jobs/<id>` | cancel a running job |

## Notes on the shape of this

A few defaults are deliberate, and worth knowing before this goes anywhere
beyond your own machine:

- **It binds to 127.0.0.1.** Nothing outside your machine can reach it.
- **It only accepts YouTube URLs.** yt-dlp will fetch from a thousand sites
  and from local paths; an allowlist keeps a stray request to this port from
  turning the box into a general-purpose fetcher.
- **CORS is an allowlist**, not `*` — see `ALLOWED_ORIGINS`. Any page you had
  open could otherwise drive this thing.
- **Files are swept after 30 minutes**, and jobs are capped at 2 at a time and
  1 hour of video.

One thing to weigh before putting this on a public host: YouTube's Terms of
Service prohibit downloading content without permission, and public
stream-ripping sites have historically drawn legal action from rightsholders —
that's a real difference in exposure between a tool on your own machine and a
service at mocial.org. The defaults here point at the first one.
