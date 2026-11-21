// cam - the desktop webcam, after mr.doob's Slit Scan
// (mrdoob.com/#/32/slit_scan). His trick: keep the last few seconds of camera
// frames, and draw every row of the picture from a slightly older one, so
// anything that moves smears down the screen through time.
//
// Here the frames live on the GPU in a ring buffer (a WebGL2 texture array),
// and a "time map" decides how far back each pixel looks: rows like the
// original, or rings, spirals, blocks, your own brightness... The CAM window
// is the picture; CAM SETTINGS is its own little window docked to its left,
// with the vibes, the time map, color, lens, and the inspiration.
//
// Loaded after main.js and built on its shell the same way radio.js is:
// buildWindowChrome for the title bars, showPopup for the fly-in, windowIcons
// for the taskbar. Nothing is sent anywhere - the camera goes straight to the
// GPU and back out to the screen, and snaps/clips save to your own computer.
(function() {
"use strict";

var INSPIRATION = {
    title: "Slit Scan",
    by: "mr.doob",
    url: "https://mrdoob.com/#/32/slit_scan",
    home: "https://mrdoob.com/"
};

var STORE_KEY = "mocial-cam-settings";
// Visitors get one button, RANDOMIZER. The full CAM SETTINGS window only
// opens with ?camsettings in the address.
var FULL = /[?&]camsettings\b/.test(location.search);
var OUT_W = 640, OUT_H = 480;          // what the picture is drawn at
// Capture size and how many frames the ring holds. Hi keeps fewer frames so
// the buffer stays under ~90MB of video memory.
var RESOLUTIONS = {
    lo:  { label: "LO-FI", w: 160, h: 120, frames: 240 },
    med: { label: "MED",   w: 320, h: 240, frames: 240 },
    hi:  { label: "HI",    w: 640, h: 480, frames: 72 }
};

// ===== What can be set =======================================================

// The time maps. White in the thumbnail is now, dark is the past.
var PATTERNS = [
    { id: "lines",   label: "rows",    hint: "Rows, like the original: the top is now, the bottom is a few seconds ago." },
    { id: "vee",     label: "fold",    hint: "Now in the middle, the past at both edges." },
    { id: "radial",  label: "rings",   hint: "Now in the center, rippling out into the past." },
    { id: "diamond", label: "diamond", hint: "Like rings, but square-cut." },
    { id: "clock",   label: "clock",   hint: "Time sweeps around like a clock hand." },
    { id: "spiral",  label: "spiral",  hint: "A spiral of moments winding into the middle." },
    { id: "waves",   label: "waves",   hint: "Rows that wave as they go." },
    { id: "blocks",  label: "blocks",  hint: "A grid where every square is a different moment." },
    { id: "liquid",  label: "liquid",  hint: "A slow swirl of melted time." },
    { id: "bright",  label: "bright",  hint: "Your own picture is the map: bright bits are now, dark bits lag behind." }
];

var COLORS = [
    { id: "normal",  label: "NORMAL" },
    { id: "mono",    label: "MONO" },
    { id: "thermal", label: "THERMAL" },
    { id: "neon",    label: "NEON" },
    { id: "invert",  label: "INVERT" },
    { id: "duo",     label: "DUO" },
    { id: "dither",  label: "1-BIT" }
];

var SLIDERS = {
    depth:   { label: "how far back", min: 0.02, max: 1, step: 0.01,
               hint: "How far into the past the picture reaches. Further means longer smears." },
    slices:  { label: "chunky slices", min: 0, max: 48, step: 1,
               hint: "Cut time into thick bands instead of a smooth smear. 0 is the finest." },
    angle:   { label: "angle", min: 0, max: 360, step: 1,
               hint: "Turns the time map. 90 makes rows into columns." },
    repeat:  { label: "repeat", min: 1, max: 8, step: 0.5,
               hint: "Tiles the time map, so the past comes back around more than once." },
    wobble:  { label: "wobble", min: 0, max: 1, step: 0.01,
               hint: "Bends the time map into a wobbly, liquid shape." },
    flow:    { label: "flow", min: -1, max: 1, step: 0.01,
               hint: "Sets the time map drifting, so the past rolls through the picture. Either way." },
    rgb:     { label: "rgb time split", min: 0, max: 1, step: 0.01,
               hint: "Red, green and blue each come from a different moment - colored ghosts." },
    tint:    { label: "time rainbow", min: 0, max: 1, step: 0.01,
               hint: "Colors every moment differently, so you can see the time map." },
    pixel:   { label: "pixels", min: 1, max: 24, step: 1,
               hint: "Chunky pixels, from crisp to Lego." },
    kaleido: { label: "kaleidoscope", min: 0, max: 12, step: 1,
               hint: "Folds the picture into mirrored slices. 0 is off." },
    stretch: { label: "slow time", min: 1, max: 8, step: 1,
               hint: "Keeps only every Nth frame, so the same buffer holds N times as much time." }
};

var TOGGLES = {
    smooth:  { label: "smooth blend", hint: "Blend between moments instead of hard steps." },
    reverse: { label: "flip now and past", hint: "Swap which parts are now and which are the past." },
    crt:     { label: "crt screen", hint: "Scanlines and a dark vignette, like an old monitor." },
    mirror:  { label: "selfie mirror", hint: "Flip the camera left to right, like a mirror." }
};

var DEFAULTS = {
    pattern: "lines", depth: 0.66, slices: 0, angle: 0, repeat: 1, wobble: 0, flow: 0,
    smooth: false, reverse: false, color: "normal", rgb: 0, tint: 0, crt: false,
    pixel: 1, kaleido: 0, stretch: 1, mirror: true, res: "med", cx: 0.5, cy: 0.5
};
// Settings a vibe doesn't touch - they're about your camera, not the look
var DEVICE_KEYS = ["mirror", "res"];

var VIBES = [
    { id: "classic", label: "CLASSIC", note: "mr.doob's original", set: {} },
    { id: "melt",    label: "MELT",    note: "smooth + wobbly", set: { smooth: true, depth: 1, wobble: 0.35 } },
    { id: "tunnel",  label: "TUNNEL",  note: "rings that flow", set: { pattern: "radial", repeat: 2, flow: 0.25, smooth: true, tint: 0.5 } },
    { id: "clock",   label: "CLOCK",   note: "time sweeps round", set: { pattern: "clock", smooth: true, depth: 1 } },
    { id: "vortex",  label: "VORTEX",  note: "spiral kaleido", set: { pattern: "spiral", smooth: true, kaleido: 6, depth: 0.8, flow: 0.15 } },
    { id: "ghost",   label: "GHOST",   note: "rgb time ghosts", set: { pattern: "bright", rgb: 0.6, smooth: true, depth: 0.8 } },
    { id: "glitch",  label: "GLITCH",  note: "blocky + neon", set: { pattern: "blocks", color: "neon", pixel: 4, slices: 6, flow: 0.4 } },
    { id: "heat",    label: "HEAT",    note: "thermal camera", set: { pattern: "radial", color: "thermal", crt: true, smooth: true, reverse: true } },
    { id: "liquid",  label: "LIQUID",  note: "melted swirl", set: { pattern: "liquid", smooth: true, depth: 1, flow: 0.1, tint: 0.3 } },
    { id: "onebit",  label: "1-BIT",   note: "mac classic waves", set: { pattern: "waves", color: "dither", slices: 12 } },
    { id: "prism",   label: "PRISM",   note: "diamond rainbow", set: { pattern: "diamond", kaleido: 8, tint: 0.7, smooth: true, repeat: 2 } },
    { id: "stretch", label: "S L O W", note: "8x slow fold", set: { pattern: "vee", stretch: 8, smooth: true, depth: 1, rgb: 0.25 } }
];

var settings = loadSettings();
var vibeName = "CLASSIC";

function loadSettings() {
    var s = {};
    Object.keys(DEFAULTS).forEach(function(k) { s[k] = DEFAULTS[k]; });
    try {
        var saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
        if (saved && typeof saved === "object") {
            Object.keys(DEFAULTS).forEach(function(k) {
                if (typeof saved[k] === typeof DEFAULTS[k]) s[k] = saved[k];
            });
        }
    } catch (e) {}
    if (!RESOLUTIONS[s.res]) s.res = DEFAULTS.res;
    return s;
}

var saveTimer = null;
function saveSettings() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function() {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(settings)); } catch (e) {}
    }, 300);
}

function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
}

// ===== The CAM window ========================================================

var win = el("div", "popup-window");
win.id = "cam-window";
win.appendChild(buildWindowChrome(win, "CAM"));
windowIcons["cam-window"] = "cam-icon.svg";

var body = el("div", "popup-inner-wrapper cam-inner");
body.innerHTML =
    '<div class="cam-stage">' +
        '<canvas class="cam-canvas" width="' + OUT_W + '" height="' + OUT_H + '" aria-label="Slit-scan camera picture"></canvas>' +
        '<div class="cam-splash">' +
            '<img class="cam-splash-icon" src="cam-icon.svg" alt="" draggable="false">' +
            '<div class="cam-splash-text">Say cheese... slowly.</div>' +
            '<button type="button" class="cam-btn cam-start">TURN ON CAMERA</button>' +
            '<div class="cam-splash-note">The picture never leaves your computer.</div>' +
        '</div>' +
        '<div class="cam-rec-badge" hidden><i></i><span>REC 0:00</span></div>' +
        '<div class="cam-flash"></div>' +
    '</div>' +
    '<div class="cam-bar">' +
        (FULL
            ? '<button type="button" class="cam-btn cam-tool" data-cam="settings" aria-pressed="true" title="Settings"><i class="cam-glyph cam-glyph-gear"></i>SETTINGS</button>'
            : '<button type="button" class="cam-btn cam-tool" data-cam="random" title="Roll the dice on every setting"><i class="cam-glyph cam-glyph-dice"></i>RANDOMIZER</button>') +
        '<button type="button" class="cam-btn cam-tool" data-cam="snap" title="Save a picture"><i class="cam-glyph cam-glyph-snap"></i>SNAP</button>' +
        '<button type="button" class="cam-btn cam-tool" data-cam="rec" aria-pressed="false" title="Record a clip"><i class="cam-glyph cam-glyph-rec"></i>REC</button>' +
        '<button type="button" class="cam-btn cam-tool" data-cam="freeze" aria-pressed="false" title="Freeze time"><i class="cam-glyph cam-glyph-freeze"></i>FREEZE</button>' +
    '</div>' +
    '<div class="cam-status"><span class="cam-status-vibe"></span><span class="cam-status-time"></span></div>';
win.appendChild(body);
document.body.insertBefore(win, document.querySelector("footer"));

var canvas = body.querySelector(".cam-canvas");
var stage = body.querySelector(".cam-stage");
var splash = body.querySelector(".cam-splash");
var splashText = body.querySelector(".cam-splash-text");
var splashNote = body.querySelector(".cam-splash-note");
var startBtn = body.querySelector(".cam-start");
var recBadge = body.querySelector(".cam-rec-badge");
var recBadgeText = recBadge.querySelector("span");
var flash = body.querySelector(".cam-flash");
var statusVibe = body.querySelector(".cam-status-vibe");
var statusTime = body.querySelector(".cam-status-time");
var toolBtns = {};
[].forEach.call(body.querySelectorAll("[data-cam]"), function(btn) {
    toolBtns[btn.getAttribute("data-cam")] = btn;
});

// ===== The CAM SETTINGS window ===============================================

var setWin = el("div", "popup-window");
setWin.id = "cam-settings-window";
setWin.appendChild(buildWindowChrome(setWin, "CAM SETTINGS"));
windowIcons["cam-settings-window"] = "settings-icon.png";
// A little tool window: minimise and close, no maximise
var setMax = setWin.querySelector('[data-win-action="max"]');
if (setMax) setMax.parentNode.removeChild(setMax);

var setBody = el("div", "popup-inner-wrapper cam-set-inner");
var tabRow = el("div", "cam-tabs");
tabRow.setAttribute("role", "tablist");
var sheet = el("div", "cam-sheet");
var hintBar = el("div", "cam-hint");
setBody.appendChild(tabRow);
setBody.appendChild(sheet);
setBody.appendChild(hintBar);
setWin.appendChild(setBody);
// Built either way (the controls keep the status line current), but only put
// on the page with ?camsettings
if (FULL) document.body.insertBefore(setWin, document.querySelector("footer"));

var DEFAULT_HINT = "Point at anything to see what it does.";
hintBar.textContent = DEFAULT_HINT;
function hintOn(node, text) {
    node.addEventListener("mouseenter", function() { hintBar.textContent = text; });
    node.addEventListener("focus", function() { hintBar.textContent = text; });
    node.addEventListener("mouseleave", function() { hintBar.textContent = DEFAULT_HINT; });
}

var TABS = [
    { id: "vibes", label: "Vibes" },
    { id: "time",  label: "Time" },
    { id: "color", label: "Color" },
    { id: "lens",  label: "Lens" },
    { id: "inspo", label: "Inspiration" }
];
var panes = {};
var tabBtns = {};
var currentTab = "vibes";

TABS.forEach(function(tab) {
    var btn = el("button", "cam-tab", tab.label);
    btn.type = "button";
    btn.setAttribute("role", "tab");
    btn.addEventListener("click", function() { showTab(tab.id); });
    tabRow.appendChild(btn);
    tabBtns[tab.id] = btn;
    var pane = el("div", "cam-pane cam-pane-" + tab.id);
    pane.setAttribute("role", "tabpanel");
    sheet.appendChild(pane);
    panes[tab.id] = pane;
});

function showTab(id) {
    currentTab = id;
    TABS.forEach(function(tab) {
        var on = tab.id === id;
        tabBtns[tab.id].classList.toggle("on", on);
        tabBtns[tab.id].setAttribute("aria-selected", on ? "true" : "false");
        panes[tab.id].hidden = !on;
    });
}

function section(pane, title) {
    var box = el("fieldset", "cam-group");
    box.appendChild(el("legend", null, title));
    pane.appendChild(box);
    return box;
}

// Everything that shows a setting registers how to redraw itself, so a vibe
// or SURPRISE ME can change the lot and every control follows
var renderers = [];
function renderControls() {
    renderers.forEach(function(fn) { fn(); });
    statusVibe.textContent = "vibe: " + vibeName.toLowerCase();
}

function changed(name) {
    vibeName = name || "custom";
    saveSettings();
    renderControls();
}

// ----- Vibes -----
(function buildVibes() {
    var pane = panes.vibes;
    pane.appendChild(el("p", "cam-lede", "Pick a vibe, then make it yours in the other tabs."));
    var grid = el("div", "cam-vibes");
    VIBES.forEach(function(vibe) {
        var btn = el("button", "cam-btn cam-vibe");
        btn.type = "button";
        btn.appendChild(el("b", null, vibe.label));
        btn.appendChild(el("span", null, vibe.note));
        btn.addEventListener("click", function() { applyVibe(vibe); });
        hintOn(btn, vibe.label + ": " + vibe.note + ".");
        grid.appendChild(btn);
        renderers.push(function() { btn.classList.toggle("on", vibeName === vibe.label); });
    });
    pane.appendChild(grid);

    var row = el("div", "cam-vibe-actions");
    var surprise = el("button", "cam-btn cam-surprise", "SURPRISE ME");
    surprise.type = "button";
    surprise.addEventListener("click", surpriseMe);
    hintOn(surprise, "Rolls the dice on every setting. Keep pressing.");
    var reset = el("button", "cam-btn", "RESET");
    reset.type = "button";
    reset.addEventListener("click", function() { applyVibe(VIBES[0]); });
    hintOn(reset, "Back to mr.doob's original.");
    row.appendChild(surprise);
    row.appendChild(reset);
    pane.appendChild(row);
})();

function applyVibe(vibe) {
    Object.keys(DEFAULTS).forEach(function(k) {
        if (DEVICE_KEYS.indexOf(k) === -1) settings[k] = DEFAULTS[k];
    });
    Object.keys(vibe.set).forEach(function(k) { settings[k] = vibe.set[k]; });
    changed(vibe.label);
}

function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
function chance(p) { return Math.random() < p; }
function rand(a, b) { return a + Math.random() * (b - a); }

function surpriseMe() {
    settings.pattern = pick(PATTERNS).id;
    settings.depth = +rand(0.4, 1).toFixed(2);
    settings.smooth = chance(0.6);
    settings.slices = chance(0.25) ? Math.round(rand(4, 24)) : 0;
    settings.angle = chance(0.5) ? 0 : pick([45, 90, 135, 180, 270, Math.round(rand(0, 360))]);
    settings.repeat = chance(0.6) ? 1 : pick([1.5, 2, 3, 4]);
    settings.wobble = chance(0.5) ? 0 : +rand(0.1, 0.6).toFixed(2);
    settings.flow = chance(0.5) ? 0 : +rand(-0.5, 0.5).toFixed(2);
    settings.reverse = chance(0.3);
    settings.color = chance(0.45) ? "normal" : pick(COLORS).id;
    settings.rgb = chance(0.6) ? 0 : +rand(0.15, 0.8).toFixed(2);
    settings.tint = chance(0.6) ? 0 : +rand(0.2, 0.8).toFixed(2);
    settings.crt = chance(0.2);
    settings.pixel = chance(0.75) ? 1 : Math.round(rand(2, 10));
    settings.kaleido = chance(0.7) ? 0 : pick([3, 4, 6, 8]);
    settings.stretch = chance(0.8) ? 1 : pick([2, 3, 4]);
    changed("random");
}

// ----- Controls -----

function sliderReadout(id, v) {
    if (id === "depth") {
        var secs = v * buffer.frames * settings.stretch / Math.max(10, captureFps);
        return secs.toFixed(1) + "s";
    }
    if (id === "slices") return v === 0 ? "fine" : String(v);
    if (id === "angle") return Math.round(v) + "°";
    if (id === "kaleido") return v === 0 ? "off" : String(v);
    if (id === "pixel") return v === 1 ? "crisp" : v + "px";
    if (id === "stretch") return v + "x";
    if (id === "repeat") return v + "x";
    if (id === "flow") return v === 0 ? "still" : (v > 0 ? "+" : "") + Math.round(v * 100);
    return Math.round(v * 100) + "%";
}

function slider(parent, id) {
    var spec = SLIDERS[id];
    var row = el("label", "cam-slider");
    var top = el("span", "cam-slider-top");
    top.appendChild(el("span", "cam-slider-label", spec.label));
    var readout = el("span", "cam-slider-value");
    top.appendChild(readout);
    var input = el("input");
    input.type = "range";
    input.min = spec.min;
    input.max = spec.max;
    input.step = spec.step;
    input.addEventListener("input", function() {
        settings[id] = +input.value;
        readout.textContent = sliderReadout(id, settings[id]);
        changed();
    });
    // Double-click snaps back, like the radio's faders
    input.addEventListener("dblclick", function() {
        settings[id] = DEFAULTS[id];
        changed();
    });
    hintOn(row, spec.hint + " Double-click to reset.");
    row.appendChild(top);
    row.appendChild(input);
    parent.appendChild(row);
    renderers.push(function() {
        input.value = settings[id];
        readout.textContent = sliderReadout(id, settings[id]);
        input.style.setProperty("--fill", ((settings[id] - spec.min) / (spec.max - spec.min) * 100) + "%");
    });
}

function toggle(parent, id) {
    var spec = TOGGLES[id];
    var row = el("label", "cam-check");
    var input = el("input");
    input.type = "checkbox";
    input.addEventListener("change", function() {
        settings[id] = input.checked;
        changed(DEVICE_KEYS.indexOf(id) !== -1 ? vibeName : null);
    });
    row.appendChild(input);
    row.appendChild(el("span", "cam-check-box"));
    row.appendChild(el("span", null, spec.label));
    hintOn(row, spec.hint);
    parent.appendChild(row);
    renderers.push(function() { input.checked = !!settings[id]; });
}

function chips(parent, key, list, hintFor) {
    var row = el("div", "cam-chips");
    list.forEach(function(item) {
        var btn = el("button", "cam-btn cam-chip", item.label);
        btn.type = "button";
        btn.addEventListener("click", function() {
            settings[key] = item.id;
            changed(DEVICE_KEYS.indexOf(key) !== -1 ? vibeName : null);
        });
        if (hintFor) hintOn(btn, hintFor(item));
        row.appendChild(btn);
        renderers.push(function() {
            btn.classList.toggle("on", settings[key] === item.id);
            btn.setAttribute("aria-pressed", settings[key] === item.id ? "true" : "false");
        });
    });
    parent.appendChild(row);
}

// ----- Time -----
(function buildTime() {
    var pane = panes.time;
    var mapBox = section(pane, "time map");
    var grid = el("div", "cam-patterns");
    PATTERNS.forEach(function(pat) {
        var btn = el("button", "cam-pattern");
        btn.type = "button";
        var thumb = el("canvas");
        thumb.width = 48;
        thumb.height = 36;
        drawThumb(thumb, pat.id);
        btn.appendChild(thumb);
        btn.appendChild(el("span", null, pat.label));
        btn.addEventListener("click", function() {
            settings.pattern = pat.id;
            changed();
        });
        hintOn(btn, pat.hint);
        grid.appendChild(btn);
        renderers.push(function() {
            btn.classList.toggle("on", settings.pattern === pat.id);
            btn.setAttribute("aria-pressed", settings.pattern === pat.id ? "true" : "false");
        });
    });
    mapBox.appendChild(grid);
    mapBox.appendChild(el("p", "cam-legend", "white is now, dark is the past. Drag on the picture to move the middle."));

    var shapeBox = section(pane, "shape it");
    slider(shapeBox, "depth");
    slider(shapeBox, "slices");
    slider(shapeBox, "angle");
    slider(shapeBox, "repeat");
    slider(shapeBox, "wobble");
    slider(shapeBox, "flow");
    var checks = el("div", "cam-checks");
    toggle(checks, "smooth");
    toggle(checks, "reverse");
    shapeBox.appendChild(checks);
})();

// ----- Color -----
(function buildColor() {
    var pane = panes.color;
    var modeBox = section(pane, "film");
    var COLOR_HINTS = {
        normal: "Just you, through time.",
        mono: "Black and white.",
        thermal: "A heat camera: dark is cold, bright is hot.",
        neon: "Posterized and turned way up.",
        invert: "A negative.",
        duo: "Two-tone, purple and pink.",
        dither: "1-bit dots, like an old Mac screen."
    };
    chips(modeBox, "color", COLORS, function(c) { return COLOR_HINTS[c.id]; });
    var fxBox = section(pane, "time color");
    slider(fxBox, "rgb");
    slider(fxBox, "tint");
    var checks = el("div", "cam-checks");
    toggle(checks, "crt");
    fxBox.appendChild(checks);
})();

// ----- Lens -----
var cameraSelect = null;
(function buildLens() {
    var pane = panes.lens;
    var lensBox = section(pane, "lens");
    slider(lensBox, "pixel");
    slider(lensBox, "kaleido");
    slider(lensBox, "stretch");
    var checks = el("div", "cam-checks");
    toggle(checks, "mirror");
    lensBox.appendChild(checks);

    var camBox = section(pane, "camera");
    var resLabel = el("div", "cam-field-label", "quality");
    camBox.appendChild(resLabel);
    chips(camBox, "res", Object.keys(RESOLUTIONS).map(function(k) {
        return { id: k, label: RESOLUTIONS[k].label };
    }), function(r) {
        return r.id === "hi" ? "Sharpest, but holds less time." :
               r.id === "lo" ? "Crunchy and fast." : "The sweet spot.";
    });
    var camRow = el("label", "cam-select-row");
    camRow.appendChild(el("span", "cam-field-label", "which camera"));
    cameraSelect = el("select", "cam-select");
    cameraSelect.appendChild(new Option("default camera", ""));
    cameraSelect.addEventListener("change", function() {
        if (stream) startCamera();
    });
    hintOn(camRow, "If you have more than one camera, pick it here.");
    camRow.appendChild(cameraSelect);
    camBox.appendChild(camRow);
})();

// ----- Inspiration -----
(function buildInspo() {
    var pane = panes.inspo;
    var card = el("div", "cam-inspo");
    card.innerHTML =
        '<div class="cam-inspo-kicker">INSPIRED BY</div>' +
        '<div class="cam-inspo-title"></div>' +
        '<div class="cam-inspo-by"></div>' +
        '<p class="cam-inspo-text">Every row of the picture is a moment a little further back than the one above it, so anything that moves gets smeared through time. ' +
        'This cam is built on that one trick - then lets you bend the time map into rings, spirals, blocks and whatever else.</p>';
    card.querySelector(".cam-inspo-title").textContent = INSPIRATION.title;
    card.querySelector(".cam-inspo-by").textContent = "by " + INSPIRATION.by;
    var links = el("div", "cam-inspo-links");
    var see = el("a", "cam-btn cam-inspo-link", "SEE THE ORIGINAL");
    see.href = INSPIRATION.url;
    see.target = "_blank";
    see.rel = "noopener";
    hintOn(see, "Opens mr.doob's Slit Scan in a new tab.");
    var more = el("a", "cam-btn cam-inspo-link", "MORE MR.DOOB");
    more.href = INSPIRATION.home;
    more.target = "_blank";
    more.rel = "noopener";
    hintOn(more, "mrdoob.com - years of experiments like this one.");
    links.appendChild(see);
    links.appendChild(more);
    card.appendChild(links);
    pane.appendChild(card);
    pane.appendChild(el("p", "cam-legend", "mr.doob also made Clouds - it's on the desktop too."));
})();

showTab(currentTab);

// ===== The time maps, drawn small for the pattern buttons ====================
// The same maths as the shader's delayMap, so a thumbnail is what you'll get.

function thumbDelay(id, u, v, t) {
    var px = (u - 0.5) * (4 / 3), py = v - 0.5;
    var d;
    switch (id) {
        case "lines":   d = 0.5 - py; break;
        case "vee":     d = Math.abs(py) * 2; break;
        case "radial":  d = Math.sqrt(px * px + py * py) * 1.2; break;
        case "diamond": d = (Math.abs(px) + Math.abs(py)) * 1.0; break;
        case "clock":   d = Math.atan2(py, px) / 6.2832 + 0.5; break;
        case "spiral":  d = Math.atan2(py, px) / 6.2832 + 0.5 + Math.sqrt(px * px + py * py) * 2; d -= Math.floor(d); break;
        case "waves":   d = 0.5 - py + 0.12 * Math.sin(px * 18); break;
        case "blocks":
            var h = Math.sin(Math.floor(u * 8) * 127.1 + Math.floor(v * 6) * 311.7) * 43758.5453;
            d = h - Math.floor(h); break;
        case "liquid":
            d = 0.5 + 0.25 * (Math.sin(px * 5 + Math.sin(py * 4 + t)) + Math.sin(py * 6 + Math.sin(px * 3 - t * 0.8))); break;
        case "bright":
            // stand-in for a face: a bright blob in a darker room
            var fx = px / 0.32, fy = (py + 0.04) / 0.4;
            d = Math.min(1, Math.sqrt(fx * fx + fy * fy)) * 0.8 + 0.1; break;
        default: d = 0;
    }
    return Math.max(0, Math.min(1, d));
}

function drawThumb(c, id) {
    var ctx = c.getContext("2d");
    var img = ctx.createImageData(c.width, c.height);
    for (var y = 0; y < c.height; y++) {
        for (var x = 0; x < c.width; x++) {
            // canvas rows run top-down, the maps bottom-up
            var d = thumbDelay(id, (x + 0.5) / c.width, 1 - (y + 0.5) / c.height, 0);
            var g = Math.round(255 * (1 - d) * 0.92 + 10);
            var i = (y * c.width + x) * 4;
            img.data[i] = g;
            img.data[i + 1] = g;
            img.data[i + 2] = Math.min(255, g + 18);
            img.data[i + 3] = 255;
        }
    }
    ctx.putImageData(img, 0, 0);
}

// ===== WebGL =================================================================

var gl = null;
var progCapture = null, progShow = null;
var videoTex = null, fbo = null, quad = null;
var buffer = { tex: null, w: 0, h: 0, frames: RESOLUTIONS[settings.res].frames, head: 0, res: null };
var uShow = {}, uCap = {};

var VERT =
    "#version 300 es\n" +
    "in vec2 pos; out vec2 vUv;\n" +
    "void main() { vUv = pos * 0.5 + 0.5; gl_Position = vec4(pos, 0.0, 1.0); }";

// Copies a camera frame into one layer of the ring, cropped to 4:3. Video
// textures are top-down, so it's flipped here once and the layers are the
// right way up from then on.
var FRAG_CAPTURE =
    "#version 300 es\n" +
    "precision highp float;\n" +
    "uniform sampler2D video; uniform vec2 scale; uniform vec2 offset; uniform float mirror;\n" +
    "in vec2 vUv; out vec4 o;\n" +
    "void main() {\n" +
    "  vec2 uv = vUv;\n" +
    "  if (mirror > 0.5) uv.x = 1.0 - uv.x;\n" +
    "  uv.y = 1.0 - uv.y;\n" +
    "  o = vec4(texture(video, offset + uv * scale).rgb, 1.0);\n" +
    "}";

// The picture. delayMap says how far back each pixel looks, from 0 (now) to
// 1 (the far end of how-far-back); the frame that far back is sampled there.
var FRAG_SHOW = [
    "#version 300 es",
    "precision highp float;",
    "precision highp sampler2DArray;",
    "uniform sampler2DArray frames;",
    "uniform float head, count, depth, time;",
    "uniform int pattern, colorMode;",
    "uniform float angle, repeatN, wobble, flow, slices, smoothT, reverseT;",
    "uniform float rgbSplit, tint, pixel, kaleido, crt;",
    "uniform vec2 center, outRes;",
    "in vec2 vUv; out vec4 o;",
    "const float ASPECT = 4.0 / 3.0;",
    "const float TAU = 6.2831853;",
    "",
    "float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
    "float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }",
    "",
    "vec3 frameAt(vec2 uv, float f) {",
    "  f = clamp(f, 0.0, count - 2.0);",
    "  float f0 = floor(f);",
    "  vec3 a = texture(frames, vec3(uv, mod(head - f0 + count, count))).rgb;",
    "  if (smoothT > 0.5) {",
    "    vec3 b = texture(frames, vec3(uv, mod(head - f0 - 1.0 + count, count))).rgb;",
    "    a = mix(a, b, fract(f));",
    "  }",
    "  return a;",
    "}",
    "",
    "float delayMap(vec2 uv) {",
    "  vec2 p = uv - center; p.x *= ASPECT;",
    "  float ca = cos(angle), sa = sin(angle);",
    "  p = vec2(ca * p.x - sa * p.y, sa * p.x + ca * p.y);",
    "  if (wobble > 0.0) {",
    "    p += wobble * 0.18 * vec2(sin(p.y * 9.0 + time * 1.7), sin(p.x * 8.0 + time * 2.1));",
    "  }",
    "  float r = length(p);",
    "  float d;",
    "  if (pattern == 0) d = 0.5 - p.y;",
    "  else if (pattern == 1) d = abs(p.y) * 2.0;",
    "  else if (pattern == 2) d = r * 1.2;",
    "  else if (pattern == 3) d = abs(p.x) + abs(p.y);",
    "  else if (pattern == 4) d = atan(p.y, p.x) / TAU + 0.5;",
    "  else if (pattern == 5) d = fract(atan(p.y, p.x) / TAU + 0.5 + r * 2.0);",
    "  else if (pattern == 6) d = 0.5 - p.y + 0.12 * sin(p.x * 18.0 + time * 2.0);",
    "  else if (pattern == 7) d = hash(floor(uv * vec2(8.0, 6.0)));",
    "  else if (pattern == 8) d = 0.5 + 0.25 * (sin(p.x * 5.0 + sin(p.y * 4.0 + time)) + sin(p.y * 6.0 + sin(p.x * 3.0 - time * 0.8)));",
    "  else d = 1.0 - luma(texture(frames, vec3(uv, head)).rgb);",
    "  d = d * repeatN + time * flow;",
    "  d = (repeatN > 1.01 || abs(flow) > 0.0001) ? fract(d) : clamp(d, 0.0, 1.0);",
    "  if (reverseT > 0.5) d = 1.0 - d;",
    "  if (slices > 0.5) d = floor(d * slices) / slices;",
    "  return d;",
    "}",
    "",
    "vec3 thermal(float t) {",
    "  vec3 c = mix(vec3(0.0, 0.0, 0.1), vec3(0.2, 0.0, 0.8), smoothstep(0.0, 0.25, t));",
    "  c = mix(c, vec3(0.9, 0.0, 0.6), smoothstep(0.25, 0.5, t));",
    "  c = mix(c, vec3(1.0, 0.5, 0.0), smoothstep(0.5, 0.75, t));",
    "  return mix(c, vec3(1.0, 1.0, 0.7), smoothstep(0.75, 1.0, t));",
    "}",
    "",
    "float bayer(vec2 p) {",
    "  vec2 q = mod(floor(p), 4.0);",
    "  int i = int(q.x) + int(q.y) * 4;",
    "  int m[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);",
    "  return (float(m[i]) + 0.5) / 16.0;",
    "}",
    "",
    "void main() {",
    "  vec2 uv = vUv;",
    "  if (pixel > 1.0) uv = (floor(uv * outRes / pixel) + 0.5) * pixel / outRes;",
    "  if (kaleido > 0.5) {",
    "    vec2 q = uv - center; q.x *= ASPECT;",
    "    float seg = TAU / kaleido;",
    "    float a = mod(atan(q.y, q.x), seg);",
    "    a = abs(a - seg * 0.5);",
    "    q = vec2(cos(a), sin(a)) * length(q);",
    "    q.x /= ASPECT;",
    "    uv = center + q;",
    "    uv = abs(uv); uv = 1.0 - abs(1.0 - mod(uv, 2.0));",
    "  }",
    "  float d = delayMap(uv);",
    "  float f = d * depth;",
    "  vec3 c;",
    "  if (rgbSplit > 0.001) {",
    "    float s = rgbSplit * depth * 0.5;",
    "    c = vec3(frameAt(uv, f).r, frameAt(uv, f + s).g, frameAt(uv, f + s * 2.0).b);",
    "  } else {",
    "    c = frameAt(uv, f);",
    "  }",
    "  if (tint > 0.001) {",
    "    vec3 rainbow = 0.5 + 0.5 * cos(TAU * (d + vec3(0.0, 0.33, 0.67)));",
    "    c = mix(c, luma(c) * rainbow * 1.7 + c * 0.15, tint);",
    "  }",
    "  float l = luma(c);",
    "  if (colorMode == 1) c = vec3(l);",
    "  else if (colorMode == 2) c = thermal(l);",
    "  else if (colorMode == 3) { c = floor(c * 4.0 + 0.5) / 4.0; c = clamp(mix(vec3(luma(c)), c, 2.2) * 1.15, 0.0, 1.0); }",
    "  else if (colorMode == 4) c = 1.0 - c;",
    "  else if (colorMode == 5) c = mix(vec3(0.12, 0.04, 0.38), vec3(1.0, 0.45, 0.78), smoothstep(0.08, 0.92, l));",
    "  else if (colorMode == 6) c = vec3(step(bayer(gl_FragCoord.xy / max(pixel * 0.5, 1.0)), l));",
    "  if (crt > 0.5) {",
    "    c *= 0.82 + 0.18 * sin(gl_FragCoord.y * 3.14159);",
    "    vec2 v = vUv - 0.5;",
    "    c *= 1.0 - dot(v, v) * 1.4;",
    "    c = pow(c, vec3(0.9)) * 1.08;",
    "  }",
    "  o = vec4(clamp(c, 0.0, 1.0), 1.0);",
    "}"
].join("\n");

function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(sh));
    }
    return sh;
}

function program(fragSrc) {
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fragSrc));
    gl.bindAttribLocation(p, 0, "pos");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
}

function initGL() {
    if (gl) return true;
    try {
        gl = canvas.getContext("webgl2", { alpha: false, antialias: false, preserveDrawingBuffer: false });
        if (!gl) return false;
        progCapture = program(FRAG_CAPTURE);
        progShow = program(FRAG_SHOW);
    } catch (e) {
        if (window.console) console.warn("cam:", e);
        gl = null;
        return false;
    }
    ["video", "scale", "offset", "mirror"].forEach(function(n) {
        uCap[n] = gl.getUniformLocation(progCapture, n);
    });
    ["frames", "head", "count", "depth", "time", "pattern", "colorMode", "angle", "repeatN",
     "wobble", "flow", "slices", "smoothT", "reverseT", "rgbSplit", "tint", "pixel",
     "kaleido", "crt", "center", "outRes"].forEach(function(n) {
        uShow[n] = gl.getUniformLocation(progShow, n);
    });

    // One big triangle that covers the screen
    quad = gl.createVertexArray();
    gl.bindVertexArray(quad);
    var vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    videoTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, videoTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    fbo = gl.createFramebuffer();
    return true;
}

// (Re)builds the ring for the chosen quality, starting it black - the picture
// fills in from the top as the past arrives, like the original
function ensureBuffer() {
    var res = RESOLUTIONS[settings.res];
    if (buffer.tex && buffer.res === settings.res) return;
    if (buffer.tex) gl.deleteTexture(buffer.tex);
    var maxLayers = gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS) || 256;
    buffer.w = res.w;
    buffer.h = res.h;
    buffer.frames = Math.min(res.frames, maxLayers);
    buffer.res = settings.res;
    buffer.head = 0;
    buffer.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, buffer.tex);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, buffer.w, buffer.h, buffer.frames);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.clearColor(0, 0, 0, 1);
    for (var i = 0; i < buffer.frames; i++) {
        gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, buffer.tex, 0, i);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    renderControls();   // how-far-back reads in seconds, which just changed
}

function captureFrame() {
    var vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) return;
    gl.bindTexture(gl.TEXTURE_2D, videoTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

    buffer.head = (buffer.head + 1) % buffer.frames;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, buffer.tex, 0, buffer.head);
    gl.viewport(0, 0, buffer.w, buffer.h);
    gl.useProgram(progCapture);
    // Crop the camera to 4:3 from the middle, whatever shape it really is
    var va = vw / vh, ta = 4 / 3;
    var sx = 1, sy = 1;
    if (va > ta) sx = ta / va; else sy = va / ta;
    gl.uniform2f(uCap.scale, sx, sy);
    gl.uniform2f(uCap.offset, (1 - sx) / 2, (1 - sy) / 2);
    gl.uniform1f(uCap.mirror, settings.mirror ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, videoTex);
    gl.uniform1i(uCap.video, 0);
    gl.bindVertexArray(quad);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

var PATTERN_INDEX = {};
PATTERNS.forEach(function(p, i) { PATTERN_INDEX[p.id] = i; });
var COLOR_INDEX = {};
COLORS.forEach(function(c, i) { COLOR_INDEX[c.id] = i; });

function drawPicture(t) {
    gl.viewport(0, 0, OUT_W, OUT_H);
    gl.useProgram(progShow);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, buffer.tex);
    gl.uniform1i(uShow.frames, 0);
    gl.uniform1f(uShow.head, buffer.head);
    gl.uniform1f(uShow.count, buffer.frames);
    gl.uniform1f(uShow.depth, Math.max(1, settings.depth * (buffer.frames - 2)));
    gl.uniform1f(uShow.time, t);
    gl.uniform1i(uShow.pattern, PATTERN_INDEX[settings.pattern] || 0);
    gl.uniform1i(uShow.colorMode, COLOR_INDEX[settings.color] || 0);
    gl.uniform1f(uShow.angle, settings.angle * Math.PI / 180);
    gl.uniform1f(uShow.repeatN, settings.repeat);
    gl.uniform1f(uShow.wobble, settings.wobble);
    gl.uniform1f(uShow.flow, settings.flow);
    gl.uniform1f(uShow.slices, settings.slices);
    gl.uniform1f(uShow.smoothT, settings.smooth ? 1 : 0);
    gl.uniform1f(uShow.reverseT, settings.reverse ? 1 : 0);
    gl.uniform1f(uShow.rgbSplit, settings.rgb);
    gl.uniform1f(uShow.tint, settings.tint);
    gl.uniform1f(uShow.pixel, settings.pixel);
    gl.uniform1f(uShow.kaleido, settings.kaleido);
    gl.uniform1f(uShow.crt, settings.crt ? 1 : 0);
    gl.uniform2f(uShow.center, settings.cx, settings.cy);
    gl.uniform2f(uShow.outRes, OUT_W, OUT_H);
    gl.bindVertexArray(quad);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// ===== The camera ============================================================

var video = document.createElement("video");
video.setAttribute("playsinline", "");
video.muted = true;
var stream = null;
var running = false;
var frozen = false;
var newFrame = false;
var tick = 0;
var captureFps = 30;
var fpsCount = 0, fpsSince = 0;
var snapWanted = false;

function setSplash(text, note, button) {
    splash.hidden = false;
    splashText.textContent = text;
    splashNote.textContent = note || "";
    startBtn.hidden = !button;
    if (button) startBtn.textContent = button;
}

function stopCamera() {
    running = false;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    if (stream) stream.getTracks().forEach(function(track) { track.stop(); });
    stream = null;
    video.srcObject = null;
    // Give back the ring's video memory; it's rebuilt (black) next time
    if (gl && buffer.tex) {
        gl.deleteTexture(buffer.tex);
        buffer.tex = null;
        buffer.res = null;
    }
}

function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setSplash("This browser can't share a camera.", "Try Chrome, Safari or Firefox.", null);
        return;
    }
    if (!initGL()) {
        setSplash("This computer can't draw the effect.", "It needs WebGL2, which this browser doesn't have turned on.", null);
        return;
    }
    if (stream) stream.getTracks().forEach(function(track) { track.stop(); });
    stream = null;
    setSplash("Waiting for the camera...", "Your browser will ask first - say Allow.", null);
    var video_ = { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" };
    if (cameraSelect && cameraSelect.value) video_ = { deviceId: { exact: cameraSelect.value }, width: { ideal: 1280 }, height: { ideal: 720 } };
    navigator.mediaDevices.getUserMedia({ video: video_, audio: false }).then(function(s) {
        // Closed while the browser was asking: let the camera go again
        if ($(win).is(":hidden")) {
            s.getTracks().forEach(function(track) { track.stop(); });
            return;
        }
        stream = s;
        video.srcObject = s;
        return video.play().then(function() {
            splash.hidden = true;
            ensureBuffer();
            listCameras();
            if (!running) {
                running = true;
                fpsSince = performance.now();
                requestAnimationFrame(loop);
            }
            watchFrames();
        });
    }).catch(function(err) {
        var denied = err && (err.name === "NotAllowedError" || err.name === "SecurityError");
        var missing = err && (err.name === "NotFoundError" || err.name === "OverconstrainedError");
        if (denied) setSplash("The camera's switched off for this site.", "Allow it from the camera icon in your address bar, then try again.", "TRY AGAIN");
        else if (missing) setSplash("No camera found.", "Plug one in and try again.", "TRY AGAIN");
        else setSplash("The camera wouldn't start.", "It might be busy in another app.", "TRY AGAIN");
    });
}

// Mark when the camera has a new frame, so the ring only fills with real
// moments rather than the same frame twice at 60fps
function watchFrames() {
    if (!video.requestVideoFrameCallback) return;
    video.requestVideoFrameCallback(function onFrame() {
        newFrame = true;
        if (stream) video.requestVideoFrameCallback(onFrame);
    });
}

function listCameras() {
    if (!navigator.mediaDevices.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then(function(devices) {
        var cams = devices.filter(function(d) { return d.kind === "videoinput"; });
        var current = stream && stream.getVideoTracks()[0] && stream.getVideoTracks()[0].getSettings().deviceId;
        cameraSelect.innerHTML = "";
        cams.forEach(function(d, i) {
            cameraSelect.appendChild(new Option(d.label || "camera " + (i + 1), d.deviceId));
        });
        if (!cams.length) cameraSelect.appendChild(new Option("default camera", ""));
        if (current) cameraSelect.value = current;
        cameraSelect.disabled = cams.length < 2;
    }).catch(function() {});
}

startBtn.addEventListener("click", startCamera);

function loop(now) {
    if (!running) return;
    requestAnimationFrame(loop);
    if (win.classList.contains("iconize")) return;
    if (buffer.res !== settings.res) ensureBuffer();

    var hasRvfc = !!video.requestVideoFrameCallback;
    if (!frozen && video.readyState >= 2 && (newFrame || !hasRvfc)) {
        newFrame = false;
        tick++;
        if (tick % settings.stretch === 0) {
            captureFrame();
            fpsCount++;
        }
    }
    // How many moments a second actually arrive, so how-far-back can read
    // in seconds. Measured, not assumed - cameras vary from 15 to 60.
    if (now - fpsSince > 1000) {
        var measured = fpsCount * 1000 / (now - fpsSince) * settings.stretch;
        if (!frozen && measured > 5) captureFps = captureFps * 0.5 + measured * 0.5;
        fpsCount = 0;
        fpsSince = now;
        statusTime.textContent = frozen ? "time frozen" : "holding " + (buffer.frames * settings.stretch / captureFps).toFixed(1) + "s";
        if (currentTab === "time") renderControls();
    }

    drawPicture(now / 1000);
    if (snapWanted) {
        snapWanted = false;
        // Still the frame just drawn - the canvas isn't cleared until it's shown
        canvas.toBlob(function(blob) { if (blob) saveFile(blob, "mocial-cam-" + stamp() + ".png"); }, "image/png");
    }
}

// ===== Snap, rec, freeze =====================================================

function stamp() {
    var d = new Date();
    function two(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + two(d.getMonth() + 1) + two(d.getDate()) + "-" + two(d.getHours()) + two(d.getMinutes()) + two(d.getSeconds());
}

function saveFile(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 4000);
}

function snap() {
    if (!running) return;
    snapWanted = true;
    flash.classList.remove("go");
    void flash.offsetWidth;
    flash.classList.add("go");
}

var recorder = null, recChunks = [], recStart = 0, recTimer = null;
function recType() {
    if (!window.MediaRecorder) return null;
    var types = ["video/mp4;codecs=avc1", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
    for (var i = 0; i < types.length; i++) {
        if (MediaRecorder.isTypeSupported(types[i])) return types[i];
    }
    return "";
}

function toggleRec() {
    if (recorder && recorder.state !== "inactive") {
        recorder.stop();
        return;
    }
    var type = recType();
    if (!running || type === null || !canvas.captureStream) {
        statusTime.textContent = running ? "this browser can't record" : "turn the camera on first";
        return;
    }
    recChunks = [];
    try {
        recorder = new MediaRecorder(canvas.captureStream(30), type ? { mimeType: type, videoBitsPerSecond: 6000000 } : undefined);
    } catch (e) {
        statusTime.textContent = "this browser can't record";
        return;
    }
    recorder.ondataavailable = function(e) { if (e.data && e.data.size) recChunks.push(e.data); };
    recorder.onstop = function() {
        clearInterval(recTimer);
        recBadge.hidden = true;
        toolBtns.rec.setAttribute("aria-pressed", "false");
        toolBtns.rec.classList.remove("on");
        var mime = recorder.mimeType || type || "video/webm";
        if (recChunks.length) {
            saveFile(new Blob(recChunks, { type: mime }), "mocial-cam-" + stamp() + (mime.indexOf("mp4") !== -1 ? ".mp4" : ".webm"));
        }
    };
    recorder.start(250);
    recStart = Date.now();
    recBadge.hidden = false;
    recBadgeText.textContent = "REC 0:00";
    toolBtns.rec.setAttribute("aria-pressed", "true");
    toolBtns.rec.classList.add("on");
    recTimer = setInterval(function() {
        var s = Math.floor((Date.now() - recStart) / 1000);
        recBadgeText.textContent = "REC " + Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
    }, 250);
}

function toggleFreeze() {
    frozen = !frozen;
    toolBtns.freeze.setAttribute("aria-pressed", frozen ? "true" : "false");
    toolBtns.freeze.classList.toggle("on", frozen);
    stage.classList.toggle("is-frozen", frozen);
    statusTime.textContent = frozen ? "time frozen" : "";
}

toolBtns.snap.addEventListener("click", snap);
toolBtns.rec.addEventListener("click", toggleRec);
toolBtns.freeze.addEventListener("click", toggleFreeze);
if (FULL) {
    toolBtns.settings.addEventListener("click", function() {
        if (!$(setWin).is(":hidden")) {
            hidePopup("cam-settings-window", toolBtns.settings);
        } else {
            openSettings();
        }
    });
} else {
    toolBtns.random.addEventListener("click", surpriseMe);
}

// Keyboard, while the CAM window has focus: space freezes, S snaps, R records
win.tabIndex = -1;
win.addEventListener("keydown", function(e) {
    if (e.target.closest && e.target.closest("button, input, select")) return;
    var k = e.key.toLowerCase();
    if (k === " ") toggleFreeze();
    else if (k === "s") snap();
    else if (k === "r") toggleRec();
    else return;
    e.preventDefault();
});

// Drag on the picture to move the middle of the time map; double-click puts
// it back
function centerFrom(e) {
    var r = canvas.getBoundingClientRect();
    // object-fit: contain letterboxes the picture when maximised
    var scale = Math.min(r.width / OUT_W, r.height / OUT_H);
    var w = OUT_W * scale, h = OUT_H * scale;
    var x = (e.clientX - r.left - (r.width - w) / 2) / w;
    var y = (e.clientY - r.top - (r.height - h) / 2) / h;
    settings.cx = Math.max(0, Math.min(1, x));
    settings.cy = Math.max(0, Math.min(1, 1 - y));
    saveSettings();
}
canvas.addEventListener("pointerdown", function(e) {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    centerFrom(e);
    canvas.addEventListener("pointermove", centerFrom);
});
canvas.addEventListener("pointerup", function() {
    canvas.removeEventListener("pointermove", centerFrom);
});
canvas.addEventListener("dblclick", function() {
    settings.cx = DEFAULTS.cx;
    settings.cy = DEFAULTS.cy;
    saveSettings();
});

// ===== Opening, closing, and keeping settings docked =========================

var GAP = 10;
var docked = true;

// Settings sits just left of the camera, tops level. If there isn't room on
// the left, the camera slides right to make it.
function dockSettings() {
    if (isMobileLayout()) return;
    var sw = setWin.offsetWidth || 330;
    var left = win.offsetLeft - sw - GAP;
    var minLeft = window.scrollX + 8;
    if (left < minLeft) {
        win.style.left = (win.offsetLeft + (minLeft - left)) + "px";
        left = minLeft;
    }
    setWin.style.left = left + "px";
    setWin.style.top = win.offsetTop + "px";
    docked = true;
}

function openSettings() {
    if (!FULL) return;
    showPopup("cam-settings-window", toolBtns.settings);
    // showPopup may have pulled it on screen somewhere else first
    dockSettings();
    toolBtns.settings.setAttribute("aria-pressed", "true");
    toolBtns.settings.classList.add("on");
}

$(win).draggable({
    handle: ".windows-header-wrapper",
    drag: function(e, ui) {
        if (!docked || isMobileLayout() || $(setWin).is(":hidden")) return;
        setWin.style.left = (ui.position.left - (setWin.offsetWidth || 330) - GAP) + "px";
        setWin.style.top = ui.position.top + "px";
    }
});
$(setWin).draggable({
    handle: ".windows-header-wrapper",
    start: function() { docked = false; }
});

// Closing the camera lets it go (the light goes off) and takes settings with
// it. Minimising leaves it on, like the radio keeps playing.
new MutationObserver(function() {
    if (win.getClientRects().length === 0) {
        if (stream || running) stopCamera();
        if (!$(setWin).is(":hidden")) $(setWin).hide();
    }
}).observe(win, { attributes: true, attributeFilter: ["style"] });

if (FULL) new MutationObserver(function() {
    var open = setWin.getClientRects().length > 0;
    toolBtns.settings.setAttribute("aria-pressed", open ? "true" : "false");
    toolBtns.settings.classList.toggle("on", open);
}).observe(setWin, { attributes: true, attributeFilter: ["style"] });

makeElementDraggable("cam-icon-group", function() {
    var origin = document.getElementById("cam-icon-group");
    if (!$(win).is(":hidden")) {
        hidePopup("cam-settings-window", origin);
        hidePopup("cam-window", origin);
        return;
    }
    showPopup("cam-window", origin);
    openSettings();
    // The icon click is the "yes, use my camera" - so ask straight away
    startCamera();
});

renderControls();

})();
