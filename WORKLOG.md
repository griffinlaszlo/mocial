# Worklog

Running record of work sessions on mocial. Newest first.

Note: this file is in a public repo. Never write the gate password here — see
the note in the README's Deploying section.

---

## 2026-08-23 — World clocks, taskbar fix, launch behind the gate

Shipped as `8a820f4`, `eb1b8e2`, `ea68d1a`.

### Fixed: the taskbar floated up the screen on a narrow window

Making the browser window small pulled the bottom bar up toward the middle of
the screen instead of leaving it at the bottom.

Cause: below 960px the stacked mobile layout drops the footer from
`position: fixed` to `static` (`main.css`), so it can't clip the lowest stacked
window. But `static` just means it flows after `<main>` — and with no windows
open `<main>` is only about 60px tall, so the bar landed near the top. Measured
at 630×777: footer top at 195px in a 777px viewport.

Fix: inside the same media query, `<body>` became a flex column and the footer
got `margin-top: auto`. The auto margin absorbs leftover space and holds the
bar at the bottom while the page is short, then collapses once stacked windows
outgrow the viewport — so the original phone behaviour is preserved.

Verified at 1280×800 (`fixed`, unchanged above the breakpoint), 630×700,
375×500, and 630×700 with a window open (footer trails content below the fold,
as intended).

### Added: 24-hour tray clock and the world-clock flyout

Tray clock is now military time. Clicking the tray opens a Win95-style flyout
rising out of the taskbar with US / UK / Germany times. See the README section
"The taskbar tray and world clocks" for how it's built.

Two rounds of feedback shaped it: it started as a draggable popup window before
being rebuilt as a tray flyout anchored to the bar, and the click target was
widened from just the digits to the whole sunken tray box.

Verified every region of the tray opens it — speaker icon, the gap, the digits,
all four edges of padding — at both 630px and 1100px wide, plus click-away,
Escape, and correct painting over an overlapping window.

### Branches unified

`main` and `popup-folder-system` had drifted apart — not a fork, though. The
history was one straight line, with `main` an ancestor of the feature branch
(18 commits behind, zero unique commits, no stashes). Fast-forwarded `main` up
and pushed; all refs now agree.

`popup-folder-system` stays the working branch so new commits don't publish
until they're merged deliberately.

### Launched behind the password gate

`REQUIRE_PASSWORD` flipped to `true` before fast-forwarding `main`, since
pushing `main` publishes mocial.org and the site is still being built. The gate
password was changed afterwards; the value lives in your password manager, not
here. Both changes verified against the live site, not just locally.

### Left undone

- HTTPS on the custom domain is broken (see README known issues) — needs the
  GitHub web UI.
- `88ecb200366538db336167e4ea4ebb6f.gif` and `Coeursica.mp3` sit untracked in
  the working tree, ~3.8MB, referenced by nothing. Left out of git deliberately.
- Dead code: `main.js` calls `openPopup()` three seconds after load, but its
  target `#popup` is inside a commented-out block in `index.html`, so it throws
  on every page load. Harmless but noisy in the console.
- The "Mobile is broken" entry under Known issues predates the two mobile
  treatments that fixed it, and now reads as stale.
