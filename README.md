# mocial

The landing page for [mocial.org](https://mocial.org) — a personal site built as a
fake late-90s desktop. Icons sit on a black "desktop," and clicking them opens
draggable windows with chrome-styled title bars.

No build step, no framework. Three files do the work:

| File | What's in it |
|---|---|
| `index.html` | Page structure. Every popup window is static markup that starts hidden; JS only shows/hides and positions them. |
| `main.css` | All styling. Per-window position blocks live near the bottom (`#files-window`, `#random-window`, …). |
| `main.js` | Everything behavioral. |

Dependencies are two CDN script tags: jQuery and jQuery UI (used only for
`.draggable()` on the popup windows).

## Running it locally

```bash
python3 -m http.server 8899
```

Then open `http://localhost:8899`. Use a server rather than opening
`index.html` directly — several windows embed PDFs in iframes, which browsers
block over `file://`.

`index.html` links its assets with cache-busting query strings
(`main.css?v=9`, `main.js?v=13`). Bump those when you change either file, or
you'll be staring at a stale copy wondering why nothing happened.

## Milestone 1 — what's built

### Windows

Each popup is a `.popup-window` div with a title bar carrying minimize
(`.iconize`), maximize (`.resize`), and close buttons. jQuery UI makes them
draggable; each new window needs a `$("#id").draggable()` call in `main.js`
and a position block in `main.css`.

Corner-resizing is deliberately off. The border and content visibly detached
from the resize handle mid-drag and it couldn't be verified live, so the
`.resizable()` call is commented out rather than left half-working.

### Fly-in / fly-out animation

Windows don't just appear — they fly out of whichever icon opened them, and
shrink back into it when dismissed.

- `flyPopupIn(popupEl, originEl)` — computes the center-to-center delta between
  window and icon, starts the window translated onto the icon at `scale(0.15)`
  and transparent, then animates to rest over 0.35s.
- `flyPopupOut(popupEl, originEl)` — the mirror. Same path, 0.3s, ease-*in* so
  it accelerates into the folder. Hides the element and clears inline styles
  when it lands, so the next open starts clean.
- `showPopup(id, originEl)` / `hidePopup(id, originEl)` — the wrappers to call.

Both honor the `POPUP_FLY_IN` flag, which the "Popup fly-in animation" setting
toggles. With it off, windows snap open and shut with no animation.

### Desktop folders

`desktopFolders` in `main.js` drives folder icons that open a window listing
their contents as more folder icons. Currently just `random`:

```js
random: {
    iconId: "files-icon-group",
    windowId: "random-window",
    gridId: "random-grid",
    spilled: false,
    items: [
        { name: "techcrunch", popup: "snapmap-wrapper", spill: true },
        …
    ]
}
```

Items marked `spill: true` also fly out on their own **the first time the
folder is ever opened** — the "here's everything at once" moment for a new
visitor. After that the folder only opens its own window, so someone coming
back gets the index instead of a screenful of windows, and opens what they
want from the grid. Clicking the desktop icon while the window is up pulls it
and everything it spilled back into the icon.

`renderDesktopFolder` and `toggleDesktopFolder` take a folder key and aren't
random-specific — other desktop folders can become entries in the same object.

### Now Playing

A separate, older system with the same shape: `filesData` describes a root
folder of subfolders, rendered by `renderFilesGrid`. Folders drill in one of
two ways depending on `FILES_TREATMENT`, switchable in settings:

- `"popup"` — opens a second window titled `NOW PLAYING: <FOLDER>`
- `"inline"` — replaces the grid in place, with a `tomato.gif` back button

Items can carry `openPopup` (opens one of the existing windows) or `url`
(opens a new tab).

### Dragging, and click-vs-drag

`makeElementDraggable(elementId, onClick, onDragEnd, onDragMove)` handles the
desktop icons. It distinguishes a click from a drag with a 3px threshold, so
you can reposition an icon without firing its click action. `onDragMove` gives
a live preview while dragging — used for the settings gesture below.

### The settings window

Hidden by default. To reveal it, **drag the `home` icon up into the header**:
the icon morphs into a gear and the header dims while it's overlapping, and
dropping it there opens settings and adds a permanent gear icon to the
desktop. Clicking `home` normally saves its position to `localStorage` and
reloads the page.

Settings covers pointer color, popup header colors (separately for light and
dark mode), footer shade, logo, header visibility, the Now Playing treatment,
which popups open on page load, the fly-in toggle, and icon stack layout
(right / left / top / bottom / random).

"Copy Layout" reads the current on-screen position of everything visible and
copies it to the clipboard as ready-to-paste CSS — the intended way to tune
window and icon positions by dragging rather than guessing pixel values.

### The taskbar tray and world clocks

The tray clock reads 24-hour (`16:37`). Clicking the tray opens a flyout of
world clocks — US, UK and Germany, in 12-hour with AM/PM — that rises *out of*
the taskbar rather than dropping from it. It's anchored `bottom: 100%` against
`.taskbar-tray`, so it tracks the bar with no JS positioning, whether the
footer is `fixed` (desktop) or `static` (the stacked mobile layout).

The whole sunken tray box is the button, speaker icon and padding included —
`.taskbar-tray` keeps only its border and `.tray-button` fills the interior.

Times come from `Intl.DateTimeFormat` with named IANA zones
(`America/Los_Angeles`, `Europe/London`, `Europe/Berlin`) rather than fixed
offsets, because the US and EU don't change DST on the same dates. Add a row by
extending `WORLD_CLOCKS` in `main.js` and adding markup in `index.html`; the
flags are inline SVG, so no new image files are needed.

It closes on click-away and Escape. The footer only takes a raised `z-index`
while the flyout is open (`body.clock-open`), so the normal stacking — windows
over the bar — is untouched the rest of the time.

### Odds and ends

- `moon` toggles dark mode and swaps its own icon between sun and moon.
- `dance` swaps a still for an animated gif and plays audio.
- The `mocial` title types itself in on load (`typeWriter`).

## Known issues

**Mobile is broken.** Under 960px, `main.css` forces
`.popup-window { position: inherit !important }`, so windows stack in document
flow instead of floating. Tapping `random` opens its window roughly 1,270px
below the icon you tapped — well off-screen, so the tap reads as doing
nothing. The absolutely-positioned desktop icons stay put and overlay the
stacked windows. This predates the folder work and affects Now Playing and
settings identically. Fixing it is the blocker before any real launch.

**The first-open spill resets on refresh.** `spilled` is an in-memory flag, so
a reload gives the same visitor the full spill again. Moving it to
`localStorage` (as the home icon position already does) would make it survive
across visits.

**Two controls over the same windows.** The "Popups on open" setting and the
random folder both decide when the same seven popups appear. They don't
conflict — the spill skips anything already visible — but it's worth
collapsing to one.

**The `college` icon has no click handler.** It drags but does nothing.

**HTTPS on the custom domain is broken.** `https://mocial.org` fails
certificate validation — only `http://` serves the site. DNS is correct (the
four GitHub Pages IPs), so it's the Pages TLS certificate for the custom
domain: re-provision by toggling the domain off and on in the repo's Pages
settings, then enable "Enforce HTTPS".

**The icon column overflows on a short viewport.** At around 375×500 the lower
desktop icons run past the bottom of the screen and sit behind the taskbar,
needing a scroll to reach.

## Deploying

GitHub Pages serves the `main` branch, and `CNAME` points it at mocial.org.
Merging to `main` and pushing puts changes live immediately — there is no
staging step. Work on a branch until you actually want it public.

The site is published, and `REQUIRE_PASSWORD` is `true`, so every visitor meets
the gate rather than the desktop. To change the password, open the console on
the site, run `hashPassword("the new one")`, and paste the result into
`SITE_PASSWORD_HASH` in `index.html`. Don't write the password itself into this
repo — it's public.

Remember the gate is a doorman, not a lock: the page is a static file, so its
full markup ships to every visitor whether or not they get past the dialog.
