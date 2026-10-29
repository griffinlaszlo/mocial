// mocial fm - the desktop radio. A small Win95-style mixer: a blue LCD with
// the song and a live spectrum, station buttons with LEDs, transport, and
// four faders (volume, bass, treble, pan) that really shape the sound.
//
// Loaded after main.js and built on its shell: buildWindowChrome for the
// title bar, showPopup for the fly-in, windowIcons for the taskbar. The window
// is built as the script runs, before main.js's $(document).ready starts
// watching .popup-window elements, so the taskbar already tracks it.
(function() {
"use strict";

// The stations. Songs are files already on the site: the Where's West?
// previews that came over with mini mocial, and the tracks the arcade's games
// use (arcade/songs/, titles as in arcade/songs/songs.js). Add a station by
// adding an entry; `short` is its button label if the full one is too long.
var STATIONS = [
    { id: "ww", label: "WHERE'S WEST?", short: "WW?", songs: [
        ["Wave to Come", "arcade/games/mocial/songs/wave-to-come.mp3"],
        ["CLOUDS", "arcade/games/mocial/songs/clouds.mp3"],
        ["Cast Out a Line", "arcade/games/mocial/songs/cast-out-a-line.mp3"],
        ["FREE", "arcade/games/mocial/songs/free.mp3"],
        ["Kitchen", "arcade/games/mocial/songs/kitchen.mp3"],
        ["Light On", "arcade/games/mocial/songs/light-on.mp3"],
        ["STAY", "arcade/games/mocial/songs/stay.mp3"]
    ] },
    { id: "warmleche", label: "WARMLECHE", songs: [
        ["Chuck Brown", "arcade/songs/warmleche/01.mp3"],
        ["Coeursica", "arcade/songs/warmleche/02.mp3"],
        ["Farley 4evr", "arcade/songs/warmleche/03.mp3"],
        ["Fishing4stars", "arcade/songs/warmleche/04.mp3"],
        ["Heartattaq", "arcade/songs/warmleche/05.mp3"],
        ["Howl (like monkey)", "arcade/songs/warmleche/06.mp3"],
        ["Rainb0wbridge", "arcade/songs/warmleche/07.mp3"],
        ["SWELLS", "arcade/songs/warmleche/08.mp3"],
        ["Stay Dry", "arcade/songs/warmleche/09.mp3"],
        ["Watercolours", "arcade/songs/warmleche/10.mp3"]
    ] },
    { id: "katseye", label: "KATSEYE", songs: [
        ["Animal", "arcade/songs/katseye/01.mp3"],
        ["Debut", "arcade/songs/katseye/02.mp3"],
        ["Gabriela", "arcade/songs/katseye/03.mp3"],
        ["Gameboy", "arcade/songs/katseye/04.mp3"],
        ["Gnarly", "arcade/songs/katseye/05.mp3"],
        ["Hootie Frutti", "arcade/songs/katseye/06.mp3"],
        ["M.I.A.", "arcade/songs/katseye/07.mp3"],
        ["My Way", "arcade/songs/katseye/08.mp3"],
        ["PINKY UP", "arcade/songs/katseye/09.mp3"],
        ["Touch", "arcade/songs/katseye/10.mp3"]
    ] },
    { id: "migos", label: "MIGOS", songs: [
        ["Bad and Boujee ft. Lil Uzi Vert", "arcade/songs/migos/01.mp3"],
        ["Hotel Lobby", "arcade/songs/migos/hotel-lobby.mp3"],
        ["Fight Night", "arcade/songs/migos/02.mp3"],
        ["Handsome and Wealthy", "arcade/songs/migos/03.mp3"],
        ["Hannah Montana", "arcade/songs/migos/04.mp3"],
        ["MotorSport ft. Nicki Minaj & Cardi B", "arcade/songs/migos/05.mp3"],
        ["Narcos", "arcade/songs/migos/06.mp3"],
        ["Stir Fry", "arcade/songs/migos/07.mp3"],
        ["T-Shirt", "arcade/songs/migos/08.mp3"],
        ["Versace", "arcade/songs/migos/09.mp3"],
        ["Walk It Talk It ft. Drake", "arcade/songs/migos/10.mp3"]
    ] },
    { id: "neilyoung", label: "NEIL YOUNG", songs: [
        ["After the Gold Rush", "arcade/songs/neilyoung/01.mp3"],
        ["Cinnamon Girl", "arcade/songs/neilyoung/02.mp3"],
        ["Cortez the Killer", "arcade/songs/neilyoung/03.mp3"],
        ["Down by the River", "arcade/songs/neilyoung/04.mp3"],
        ["Harvest Moon", "arcade/songs/neilyoung/05.mp3"],
        ["Heart of Gold", "arcade/songs/neilyoung/06.mp3"],
        ["Hey Hey, My My (Into the Black)", "arcade/songs/neilyoung/07.mp3"],
        ["Old Man", "arcade/songs/neilyoung/08.mp3"],
        ["Rockin' in the Free World", "arcade/songs/neilyoung/09.mp3"],
        ["The Needle and the Damage Done", "arcade/songs/neilyoung/10.mp3"]
    ] },
    { id: "yeat", label: "YEAT", songs: [
        ["Breathe", "arcade/songs/yeat/01.mp3"],
        ["COMË N GO", "arcade/songs/yeat/02.mp3"],
        ["Gët Busy", "arcade/songs/yeat/03.mp3"],
        ["IM YEAT", "arcade/songs/yeat/04.mp3"],
        ["If We Being Rëal", "arcade/songs/yeat/05.mp3"],
        ["Monëy so big", "arcade/songs/yeat/06.mp3"],
        ["Out thë way", "arcade/songs/yeat/07.mp3"],
        ["Talk", "arcade/songs/yeat/08.mp3"],
        ["The Bell", "arcade/songs/yeat/09.mp3"]
    ] }
];

// The faders: what each one runs from and to, and where it starts
var FADERS = [
    { id: "vol", label: "VOL", min: 0, max: 100, value: 80 },
    { id: "bass", label: "BASS", min: -12, max: 12, value: 0 },
    { id: "treb", label: "TREB", min: -12, max: 12, value: 0 },
    { id: "pan", label: "PAN", min: -100, max: 100, value: 0 }
];

var state = { station: 0, track: 0, shuffle: false };
var audio = new Audio();
audio.preload = "none";
var graph = null;        // the Web Audio chain, made on first play

function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
}

// ===== The window ============================================================

var win = el("div", "popup-window");
win.id = "radio-window";
win.appendChild(buildWindowChrome(win, "MOCIAL FM"));
windowIcons["radio-window"] = "mocial-fm-icon.svg";

var body = el("div", "popup-inner-wrapper radio-inner");
body.innerHTML =
    '<div class="radio-top">' +
        '<div class="radio-lcd">' +
            '<div class="radio-lcd-row">' +
                '<span class="radio-station"></span>' +
                '<span class="radio-track-no"></span>' +
            '</div>' +
            '<div class="radio-title-box"><span class="radio-title"></span></div>' +
            '<canvas class="radio-spectrum" width="300" height="56"></canvas>' +
            '<div class="radio-lcd-row">' +
                '<span class="radio-state">STOP</span>' +
                '<span class="radio-time">00:00</span>' +
            '</div>' +
        '</div>' +
    '</div>' +
    '<div class="radio-presets"></div>' +
    '<div class="radio-transport">' +
        '<button type="button" class="radio-btn" data-act="prev" aria-label="Previous">|&#9664;&#9664;</button>' +
        '<button type="button" class="radio-btn radio-play" data-act="play" aria-label="Play">&#9654;</button>' +
        '<button type="button" class="radio-btn" data-act="next" aria-label="Next">&#9654;&#9654;|</button>' +
        '<div class="radio-seek" role="slider" aria-label="Song position" tabindex="0"><div class="radio-seek-fill"></div></div>' +
    '</div>' +
    '<div class="radio-mixer-label"><span>MIXER</span></div>' +
    '<div class="radio-faders"></div>';
win.appendChild(body);
document.body.insertBefore(win, document.querySelector("footer"));
$(win).draggable({ handle: ".windows-header-wrapper" });

var lcdStation = body.querySelector(".radio-station");
var lcdTrackNo = body.querySelector(".radio-track-no");
var lcdTitleBox = body.querySelector(".radio-title-box");
var lcdTitle = body.querySelector(".radio-title");
var lcdState = body.querySelector(".radio-state");
var lcdTime = body.querySelector(".radio-time");
var canvas = body.querySelector(".radio-spectrum");
var playBtn = body.querySelector(".radio-play");
var seek = body.querySelector(".radio-seek");
var seekFill = body.querySelector(".radio-seek-fill");

// ----- Station buttons: a row of them under the LCD, each a label over a
// bevelled button with an LED in it -----
var presets = body.querySelector(".radio-presets");
function preset(label, onClick) {
    var wrap = el("div", "radio-preset");
    wrap.appendChild(el("span", "radio-preset-label", label));
    var btn = el("button", "radio-preset-btn");
    btn.type = "button";
    btn.setAttribute("aria-label", label);
    btn.appendChild(el("i", "radio-led"));
    btn.addEventListener("click", onClick);
    wrap.appendChild(btn);
    presets.appendChild(wrap);
    return btn;
}
var stationBtns = STATIONS.map(function(station, i) {
    return preset(station.short || station.label, function() { tune(i); });
});
var shuffleBtn = preset("SHUFFLE", function() {
    state.shuffle = !state.shuffle;
    renderLeds();
});

function renderLeds() {
    stationBtns.forEach(function(btn, i) {
        btn.classList.toggle("on", i === state.station);
        btn.setAttribute("aria-pressed", i === state.station ? "true" : "false");
    });
    shuffleBtn.classList.toggle("on", state.shuffle);
    shuffleBtn.setAttribute("aria-pressed", state.shuffle ? "true" : "false");
}

// ----- Faders -----
var faderBox = body.querySelector(".radio-faders");
var faderValues = {};

function faderReadout(f, v) {
    if (f.id === "vol") return String(Math.round(v));
    if (f.id === "pan") return v === 0 ? "C" : (v < 0 ? "L" : "R") + Math.abs(Math.round(v));
    return (v > 0 ? "+" : "") + Math.round(v);
}

FADERS.forEach(function(f) {
    faderValues[f.id] = f.value;
    var strip = el("div", "radio-fader");
    var readout = el("div", "radio-fader-value");
    var track = el("div", "radio-fader-track");
    track.setAttribute("role", "slider");
    track.setAttribute("tabindex", "0");
    track.setAttribute("aria-label", f.label);
    track.setAttribute("aria-valuemin", f.min);
    track.setAttribute("aria-valuemax", f.max);
    var knob = el("div", "radio-fader-knob");
    track.appendChild(knob);
    strip.appendChild(readout);
    strip.appendChild(track);
    strip.appendChild(el("div", "radio-fader-label", f.label));
    faderBox.appendChild(strip);

    function set(v) {
        v = Math.max(f.min, Math.min(f.max, v));
        faderValues[f.id] = v;
        var share = (v - f.min) / (f.max - f.min);
        // the knob's centre travels between 8px from either end of the groove
        knob.style.bottom = "calc(" + share.toFixed(4) + " * (100% - 16px) + 8px)";
        readout.textContent = faderReadout(f, v);
        track.setAttribute("aria-valuenow", Math.round(v));
        track.setAttribute("aria-valuetext", readout.textContent);
        applyMix();
    }

    function fromPointer(e) {
        var r = track.getBoundingClientRect();
        var share = 1 - (e.clientY - r.top - 8) / (r.height - 16);
        set(f.min + share * (f.max - f.min));
    }

    track.addEventListener("pointerdown", function(e) {
        e.preventDefault();
        e.stopPropagation();
        track.setPointerCapture(e.pointerId);
        fromPointer(e);
        track.addEventListener("pointermove", fromPointer);
    });
    track.addEventListener("pointerup", function() {
        track.removeEventListener("pointermove", fromPointer);
    });
    // Double-click snaps back to where it started, like a real desk
    track.addEventListener("dblclick", function() { set(f.value); });
    track.addEventListener("keydown", function(e) {
        var step = (f.max - f.min) / 20;
        if (e.key === "ArrowUp" || e.key === "ArrowRight") set(faderValues[f.id] + step);
        else if (e.key === "ArrowDown" || e.key === "ArrowLeft") set(faderValues[f.id] - step);
        else return;
        e.preventDefault();
    });
    set(f.value);
});

// ===== Sound =================================================================
// audio -> bass shelf -> treble shelf -> pan -> volume -> analyser -> out.
// Made on the first play, since browsers only allow audio after a click.
function ensureGraph() {
    if (graph) return graph;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try {
        var ctx = new Ctx();
        var source = ctx.createMediaElementSource(audio);
        var bass = ctx.createBiquadFilter();
        bass.type = "lowshelf";
        bass.frequency.value = 200;
        var treb = ctx.createBiquadFilter();
        treb.type = "highshelf";
        treb.frequency.value = 3000;
        var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        var gain = ctx.createGain();
        var analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.75;
        source.connect(bass);
        bass.connect(treb);
        var last = treb;
        if (pan) {
            treb.connect(pan);
            last = pan;
        }
        last.connect(gain);
        gain.connect(analyser);
        analyser.connect(ctx.destination);
        graph = { ctx: ctx, bass: bass, treb: treb, pan: pan, gain: gain, analyser: analyser, bins: new Uint8Array(analyser.frequencyBinCount) };
    } catch (e) {
        graph = null;
    }
    applyMix();
    return graph;
}

function applyMix() {
    if (!graph) {
        audio.volume = faderValues.vol / 100;
        return;
    }
    audio.volume = 1;
    graph.gain.gain.value = faderValues.vol / 100;
    graph.bass.gain.value = faderValues.bass;
    graph.treb.gain.value = faderValues.treb;
    if (graph.pan) graph.pan.pan.value = faderValues.pan / 100;
}

// ===== Playing ===============================================================

function station() {
    return STATIONS[state.station];
}

function load(track) {
    var songs = station().songs;
    state.track = (track + songs.length) % songs.length;
    audio.src = songs[state.track][1];
    renderLcd();
}

function play() {
    if (!audio.src) load(state.track);
    var g = ensureGraph();
    if (g && g.ctx.state === "suspended") g.ctx.resume();
    audio.play().catch(function() {});
}

function tune(i) {
    if (i === state.station && !audio.paused) return;
    state.station = i;
    renderLeds();
    load(0);
    play();
}

function next(step) {
    var songs = station().songs;
    var track = state.track + step;
    if (state.shuffle && songs.length > 1) {
        do { track = Math.floor(Math.random() * songs.length); } while (track === state.track);
    }
    load(track);
    play();
}

body.querySelector('[data-act="play"]').addEventListener("click", function() {
    if (audio.paused) play();
    else audio.pause();
});
body.querySelector('[data-act="prev"]').addEventListener("click", function() {
    // Like a CD player: a few seconds in, back to the start of this one
    if (audio.currentTime > 3) audio.currentTime = 0;
    else next(-1);
});
body.querySelector('[data-act="next"]').addEventListener("click", function() { next(1); });
audio.addEventListener("ended", function() { next(1); });

function seekTo(e) {
    if (!audio.duration) return;
    var r = seek.getBoundingClientRect();
    audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * audio.duration;
}
seek.addEventListener("pointerdown", function(e) {
    e.stopPropagation();
    seekTo(e);
});
seek.addEventListener("keydown", function(e) {
    if (!audio.duration) return;
    if (e.key === "ArrowRight") audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
    else if (e.key === "ArrowLeft") audio.currentTime = Math.max(0, audio.currentTime - 5);
    else return;
    e.preventDefault();
});

// ===== The LCD ===============================================================

function clock(s) {
    s = Math.max(0, Math.floor(s || 0));
    return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}

function renderLcd() {
    var songs = station().songs;
    lcdStation.textContent = station().label;
    lcdTrackNo.textContent = "TRK " + String(state.track + 1).padStart(2, "0") + "/" + String(songs.length).padStart(2, "0");
    lcdTitle.textContent = songs[state.track][0];
    // Long titles scroll across the display; short ones sit still
    lcdTitle.classList.remove("scroll");
    if (lcdTitle.scrollWidth > lcdTitleBox.clientWidth) {
        lcdTitle.style.setProperty("--scroll", (lcdTitleBox.clientWidth - lcdTitle.scrollWidth - 8) + "px");
        lcdTitle.classList.add("scroll");
    }
    renderTime();
}

function renderTime() {
    lcdTime.textContent = clock(audio.currentTime) + (audio.duration ? " / " + clock(audio.duration) : "");
    seekFill.style.width = audio.duration ? (audio.currentTime / audio.duration * 100) + "%" : "0";
}

function renderState() {
    var on = !audio.paused;
    lcdState.textContent = on ? "▶ ON AIR" : (audio.currentTime > 0 ? "PAUSE" : "STOP");
    // The pause bars are drawn, not typed: no font draws them reliably
    playBtn.innerHTML = on ? '<i class="radio-pause-icon"></i>' : "&#9654;";
    playBtn.setAttribute("aria-label", on ? "Pause" : "Play");
    body.classList.toggle("is-playing", on);
}

audio.addEventListener("timeupdate", renderTime);
audio.addEventListener("loadedmetadata", renderTime);
audio.addEventListener("play", renderState);
audio.addEventListener("pause", renderState);

// The spectrum: blocky blue bars, like a 90s plug-in's display. Live from the
// analyser while playing; when stopped, the bars settle to the floor.
var ctx2d = canvas.getContext("2d");
var BARS = 16, SEGMENTS = 9;
var levels = new Array(BARS).fill(0);
var peaks = new Array(BARS).fill(0);

function drawSpectrum() {
    var w = canvas.width, h = canvas.height;
    ctx2d.clearRect(0, 0, w, h);
    var live = graph && !audio.paused;
    if (live) graph.analyser.getByteFrequencyData(graph.bins);
    var barW = w / BARS;
    var segH = h / SEGMENTS;
    for (var i = 0; i < BARS; i++) {
        var target = live ? graph.bins[Math.min(graph.bins.length - 1, Math.floor(i * 1.5) + 1)] / 255 : 0;
        levels[i] += (target - levels[i]) * (target > levels[i] ? 0.6 : 0.15);
        peaks[i] = Math.max(peaks[i] - 0.012, levels[i]);
        var lit = Math.round(levels[i] * SEGMENTS);
        for (var s = 0; s < SEGMENTS; s++) {
            var y = h - (s + 1) * segH;
            ctx2d.fillStyle = s < lit ? (s >= SEGMENTS - 2 ? "#d8f2ff" : s >= SEGMENTS - 4 ? "#8fd3ff" : "#3a8dff") : "rgba(58, 141, 255, 0.12)";
            ctx2d.fillRect(i * barW + 1, y + 1, barW - 3, segH - 2);
        }
        var peakSeg = Math.min(SEGMENTS - 1, Math.round(peaks[i] * SEGMENTS));
        if (peaks[i] > 0.03) {
            ctx2d.fillStyle = "#ffffff";
            ctx2d.fillRect(i * barW + 1, h - (peakSeg + 1) * segH + 1, barW - 3, 2);
        }
    }
    requestAnimationFrame(drawSpectrum);
}
requestAnimationFrame(drawSpectrum);

// ===== Opening and closing ===================================================
// The window's X stops the radio; minimising leaves it playing.
new MutationObserver(function() {
    if (win.getClientRects().length === 0 && !audio.paused) audio.pause();
}).observe(win, { attributes: true, attributeFilter: ["style"] });

makeElementDraggable("radio-icon-group", function() {
    var origin = document.getElementById("radio-icon-group");
    if (!$(win).is(":hidden")) {
        hidePopup("radio-window", origin);
        return;
    }
    showPopup("radio-window", origin);
    renderLcd();
});

renderLeds();
load(0);
renderState();

})();
