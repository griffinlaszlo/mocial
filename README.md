# mocial

The landing page for [mocial.org](https://mocial.org) — a personal site built as a
fake late-90s desktop. Icons sit on a black "desktop," and clicking them opens
draggable windows with chrome-styled title bars.

No build step, no framework. Three files do the work:

| File | What's in it |
|---|---|
| `index.html` | Page structure. Every popup window is static markup that starts hidden; JS only shows/hides and positions them. |
| `main.css` | All styling. Per-window position blocks live near the bottom (`#files-window`, `#college-window`, …). |
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

The title-bar buttons are `<button>`s with a `data-win-action` of `min`,
`max` or `close`, and one listener in `main.js` handles them for every
window. Use the same markup in new windows instead of an inline `onclick`
(`buildWindowChrome` already does). Maximize fills the screen above the
taskbar, and so does double-clicking a title bar. A maximized window can't
be dragged until it's restored.

Whichever window is opened, clicked, focused or picked from the taskbar comes
to the front (`bringToFront`). This includes clicks inside a window's iframe.
The front window's taskbar button shows as pressed. Clicking a buried
window's taskbar button raises it, and clicking the front one minimizes it.
A window that would open off-screen is moved into view (`keepOnScreen`).

Keyboard: Tab reaches the desktop icons, folder entries and title-bar
buttons, and Enter or Space opens or presses them. Folder entries get this
from `makeFileItemFocusable`. Windows themselves can't be moved with the
keyboard yet.

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
their contents as more folder icons - `college` and the `arcade`.
`renderDesktopFolder` and `toggleDesktopFolder` take a folder key, so a new
folder is just a new entry in the same object.

### mocial fm

The desktop radio, in `radio.js` (loaded after `main.js`, built on its window
shell). A simplified Win95 mixer: a navy LCD showing the station, song and
time over a live spectrum analyser; station buttons with red LEDs, plus
shuffle; previous / play / next and a seek bar; and four faders - volume,
bass, treble and pan - wired through Web Audio, so they really change the
sound. Double-click a fader to reset it. Closing the window stops the music;
minimising keeps it playing.

The stations are `STATIONS` at the top of `radio.js`: Where's West? (the seven
previews that came with mini mocial, in `arcade/games/mocial/songs/`), plus
WARMLECHE, katseye, migos, Neil Young and Yeat - the tracks the arcade's games
use, in `arcade/songs/`. A new station is a new entry; its LED button joins the
row under the LCD.

### not-a-virus.exe

Where the random folder used to be (it keeps the `files-icon*` ids so the
stack-layout setting still finds it). Opening it throws every window that was
in the folder - techcrunch, patent, application, ww, warmleche,
undertheghost, dsresearch, listed in `NOT_A_VIRUS_POPUPS` - across the screen
at once, scattered, like a virus took over. Once they're out, mocial
AntiVirus turns up with a `REMOVE ALL THREATS` button that pulls them all
back into the icon; Escape does the same, even mid-storm. Each window goes
back to its usual spot afterwards. It's the same joke as griffinland's
not-a-virus.exe.

### The arcade

The `arcade` icon (a joystick, `arcade-icon.png`, drawn for the site) opens a
folder of 13 mini games and music experiences brought over from the Bond
project (`~/Desktop/bond/dist/games`). They're listed in `arcadeGames` in
`main.js`, and `buildGameWindows` gives each one its own window with an
iframe, sized to that game's shape. One of them is **mini mocial**
(`arcade/games/mocial/`), a pocket-sized mocial from Bond with its own
Where's West? CD player, film roll, dino, notes and dance.

`arcade/` copies the layout of Bond's `public/` folder — `games/`, `songs/`,
`vinyl/`, `f/` — because Shiloh's Play Pen, YEAT.EXE, the vinyl rooms and the
visualizer load songs and art from `../../`. Keeping that layout
meant none of the games had to be moved or re-pathed. Only the songs those games actually
use came over (5 artists, ~160MB), not Bond's whole 539MB `songs/` folder.

- A game's iframe only gets its `src` while its window is showing, and is
  blanked when the window hides, so closing a game stops its music.
  Minimising leaves it playing.
- Each entry's `size` is the frame the game is drawn at, measured per game
  so nothing is letterboxed or cropped: square for the circular visualizers,
  3:4 for the photo scenes, and exactly 2x the 216px-tall canvas for the two
  pixel-art games. `.game-window` in `main.css` shrinks a window, keeping that
  ratio, when the screen is too small for it.
- The visualizer (`maker/visualizer.html`) is a Bond template that builds
  itself from the query string. It's filled in with WARMLECHE's art and
  "Rainb0wbridge" (`ARCADE_MAKER`), and its iframe carries the `live` class,
  without which it renders as a static thumbnail.
- The sound toggles in Wave to Come, HOWL!, Kitty Clouds and both Pressure
  visualizers are redrawn as a Win95 button with the tray's pixel speaker
  (`arcade/games/win95-speaker.js`, which each of those pages loads). Each
  game still owns its mute state, click area and M key; the shared file only
  draws the button. The edits in the games are marked `mocial:`.
- YEAT.EXE's player was moved up from 104px to 12px from the top - the gap
  was room for Bond's status bar.
- Game pages load with `?v=ARCADE_VERSION`. Bump it in `main.js` after
  editing anything under `arcade/games`, or browsers keep the old copy.
- An entry's `icon` replaces the joystick in the folder, title bar and
  taskbar; every game has one, each made from that game's own art. The
  surfer and monkey are pixel sprites; the rest are painted art or photos,
  named `arcade-art-*.png` so `main.css` scales them smoothly instead of
  pixelated. The Christmas vinyl room's is the vinyl room's with a Santa hat
  and snow drawn on.
- To add a game, drop it under `arcade/games/` and add a line to
  `arcadeGames` with its `size`.

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
flow instead of floating. Tapping a folder opens its window roughly 1,270px
below the icon you tapped — well off-screen, so the tap reads as doing
nothing. The absolutely-positioned desktop icons stay put and overlay the
stacked windows. This predates the folder work and affects Now Playing and
settings identically. Fixing it is the blocker before any real launch.

**Now Playing's `virality` folder only links to the TikTok account.** The
five `tiktok1`–`tiktok5` placeholders did nothing, so they were replaced by
one `@griffinlaszlo` link until the real videos are picked. `png` is empty
and says so.

**The shop empties the cart as soon as the order email opens.** Cancelling
the email loses the order. Left for when merch is actually set up.

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
