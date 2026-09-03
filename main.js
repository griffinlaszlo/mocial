
// Function to close the popup
function closePopup() {
    document.getElementById("popup").style.display = "none";
}

// Function to open the popup
function openPopup() {
    document.getElementById("popup").style.display = "block";
}

// Open the popup automatically after 3 seconds (3000 milliseconds)
window.onload = function() {
    setTimeout(function() {
        openPopup();
    }, 3000);
};

// Function to position the popup randomly
function positionPopupRandomly() {
    const popup = document.getElementById("popup-content");
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = popup.offsetWidth;
    const popupHeight = popup.offsetHeight;

    // Ensuring the popup stays within the horizontal bounds of the viewport
    const maxX = viewportWidth - popupWidth;
    const randomX = Math.random() * maxX;

    // Ensuring the popup stays within the vertical bounds of the viewport
    const maxY = viewportHeight - popupHeight;
    const randomY = Math.random() * maxY;

    // Apply the random position
    popup.style.left = randomX + 'px';
    popup.style.top = randomY + 'px';
}


function makePopupDraggable() {
    const popup = document.getElementById("popup-content");
    let isDragging = false;
    let dragStartX, dragStartY;


    function onMouseMove(e) {
        if (!isDragging) return;

        let newX = popup.offsetLeft + (e.clientX - dragStartX);
        let newY = popup.offsetTop + (e.clientY - dragStartY);

        popup.style.left = newX + 'px';
        popup.style.top = newY + 'px';

        dragStartX = e.clientX;
        dragStartY = e.clientY;
    }

    function onMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    popup.addEventListener('dragstart', function(e) {
        e.preventDefault(); // Prevent default drag behavior
    });
}

// Open the popup and make it draggable
window.onload = function() {
    setTimeout(function() {
        openPopup();
        positionPopupRandomly();
        makePopupDraggable();
    }, 3000);
};



$(document).ready(function() {
    $("#canary-yellow-wrapper").draggable();
});
$(document).ready(function() {
    $("#postmodern-wrapper").draggable();
});
$(document).ready(function() {
    $("#under-ghost-wrapper").draggable();
});
$(document).ready(function() {
    $("#snapmap-wrapper").draggable();
});
$(document).ready(function() {
    $("#patent-figures-window").draggable();
});
$(document).ready(function() {
    $("#s13688-window").draggable();
});
$(document).ready(function() {
    $("#ambient-streaming-window").draggable();
});
$(document).ready(function() {
    $("#files-window").draggable();
});
$(document).ready(function() {
    $("#folder-contents-window").draggable();
});
$(document).ready(function() {
    // Handle-limited, like the dino window: the body has a text field and two
    // dropdowns in it, and a whole-window drag swallows clicks into them.
    $("#converter-window").draggable({ handle: ".windows-header-wrapper" });
});
$(document).ready(function() {
    // Handle-limited: there's a text field in the body, and a whole-window
    // drag swallows clicks into it.
    $("#google-window").draggable({ handle: ".windows-header-wrapper" });
});
$(document).ready(function() {
    $("#cat-window").draggable({ handle: ".windows-header-wrapper" });
});
$(document).ready(function() {
    // Handle-limited: the body is one big textarea, and a whole-window drag
    // would make it impossible to select text inside it.
    $("#notepad-window").draggable({ handle: ".windows-header-wrapper" });
});
$(document).ready(function() {
    $("#dino-window").draggable({ handle: ".windows-header-wrapper" });
});
$(document).ready(function() {
    $("#college-window").draggable();
});
$(document).ready(function() {
    $("#letter-of-intent-window").draggable();
});
$(document).ready(function() {
    $("#phd-acceptance-window").draggable();
});
$(document).ready(function() {
    $("#random-window").draggable();
});
$(document).ready(function() {
    $("#settings-window").draggable();
});

// Corner-resize on popups is disabled for now - the border/content visibly
// disconnected from the resize handle while dragging and couldn't be
// verified live to fix properly. Re-enable by restoring the
// $(".popup-window").resizable({...}) call here if picked back up later.



function makeElementDraggable(elementId, onClick, onDragEnd, onDragMove) {
    var element = document.getElementById(elementId);
    var posX = 0, posY = 0, offsetX = 0, offsetY = 0;
    var startX = 0, startY = 0, dragged = false;

    element.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
        offsetX = e.clientX;
        offsetY = e.clientY;
        startX = e.clientX;
        startY = e.clientY;
        dragged = false;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        if (Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3) {
            dragged = true;
        }
        posX = offsetX - e.clientX;
        posY = offsetY - e.clientY;
        offsetX = e.clientX;
        offsetY = e.clientY;
        element.style.top = (element.offsetTop - posY) + "px";
        element.style.left = (element.offsetLeft - posX) + "px";
        if (dragged && typeof onDragMove === 'function') {
            onDragMove();
        }
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        if (!dragged && typeof onClick === 'function') {
            onClick();
        } else if (dragged && typeof onDragEnd === 'function') {
            onDragEnd();
        }
    }
}

// Secret gesture: drag "home" into the header to reveal + open settings
function isOverlappingHeader(el) {
    var header = document.querySelector("header");
    var elRect = el.getBoundingClientRect();
    var headerRect = header.getBoundingClientRect();
    return elRect.top < headerRect.bottom && elRect.bottom > headerRect.top &&
           elRect.left < headerRect.right && elRect.right > headerRect.left;
}

function setHomeIconVisual(asSettings) {
    var img = document.getElementById("computer-icon");
    var labelWrapper = document.getElementById("computer-icon-label");
    var label = labelWrapper.querySelector("a");
    var header = document.querySelector("header");
    if (asSettings) {
        img.src = "settings-icon.png";
        img.classList.add("as-settings-icon");
        labelWrapper.classList.add("as-settings-label");
        label.textContent = "settings";
        header.style.opacity = "0.15";
    } else {
        img.src = "computer-icon.png";
        img.classList.remove("as-settings-icon");
        labelWrapper.classList.remove("as-settings-label");
        label.textContent = "home";
        header.style.opacity = "";
    }
}

// ===== Password gate ========================================================
// The flag and the hash live in index.html's <head> so the gate can hide the
// page before it paints. This is only the dialog's behaviour.
//
// Worth being clear about what this is: the site is a static file, so its
// markup reaches every visitor regardless of the dialog. Someone who opens
// View Source can read straight past it. This keeps casual visitors out while
// the site is being built - it is not protection for anything secret.
//
// The hash isn't security either, just a way to keep the literal password out
// of a public repo so it can't be read at a glance (or harvested, if you reuse
// it somewhere that matters). Generate a new one from the console with
// hashPassword("...").
function hashPassword(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) {
        h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    }
    return h.toString(16);
}

(function setUpPasswordGate() {
    if (!document.documentElement.classList.contains("gated")) return;

    var input = document.getElementById("site-password");
    var error = document.getElementById("password-error");

    function unlock() {
        if (hashPassword(input.value) !== window.SITE_PASSWORD_HASH) {
            error.textContent = "The password is incorrect. Try again.";
            input.select();
            return;
        }
        // sessionStorage, not localStorage: unlocked for this tab session, so
        // closing the browser asks again rather than remembering forever
        sessionStorage.setItem("mocial-unlocked", "1");
        document.documentElement.classList.remove("gated");

        // Drop ?lock off the URL, or reloading would re-lock immediately and
        // leave you unable to get in without editing the address bar
        if (window.FORCE_LOCK && window.history.replaceState) {
            window.history.replaceState({}, "", window.location.pathname);
        }
    }

    document.getElementById("password-ok").addEventListener("click", unlock);
    input.addEventListener("keydown", function(e) {
        if (e.key === "Enter") unlock();
        else error.textContent = "";
    });
    document.getElementById("password-cancel").addEventListener("click", function() {
        input.value = "";
        error.textContent = "";
        input.focus();
    });

    input.focus();
})();

// The icon each window carries at the left of its own title bar, the way a
// Win95 window shows the icon of what it's displaying.
//
// A window that shows content is a file and gets the plain file icon. A window
// that shows a folder's contents carries a mini version of the desktop icon
// that opens it - the random folder's folder, Now Playing's CD - so the icon
// on the desktop and the one in the title bar are the same thing at two sizes.
// Only folders and applications get an icon in their title bar. A window
// showing a file - a PDF, an image, a video - gets none: the file icon in the
// bar told you nothing the title didn't, and repeated on every window it just
// added noise. Anything absent from this map has no title-bar icon.
var windowIcons = {
    // Folders - a mini version of the desktop icon that opens them
    "random-window":          "folder-icon.png",
    "college-window":         "folder-icon.png",
    "folder-contents-window": "folder-icon.png",
    "files-window":           "cd1.png",
    // Applications - their own icon, the way a Win95 app window does
    "dino-window":            "dino.png",
    "google-window":          "google-icon.png",
    "cat-window":             "cat.png",
    "notepad-window":         "tips.png",
    "settings-window":        "settings-icon.png",
    "converter-window":       "music_note_spinning.gif"
};

// The taskbar still wants an icon on every button - a real taskbar never has a
// bare one - so windows with no title-bar icon fall back to the file icon there.
var TASKBAR_FALLBACK_ICON = "fileicon.png";

// Height is keyed to the ARTWORK, not to the window, so any window that uses
// the folder icon in future is sized the same without being re-tuned.
//
// The art isn't drawn to a common scale: the folder and CD carry a lot of
// empty margin inside their own bounds, so they need more height than the
// file icon to read as the same size. Anything not listed uses the CSS
// default. Vertical centring is handled in CSS and is size-independent, so
// changing a number here can't knock an icon out of line with the text.
var iconSizes = {
    "folder-icon.png":   "2.2em",
    "cd1.png":           "1.6em",
    "dino.png":          "1.6em",
    "settings-icon.png": "1.5em"
};

$(document).ready(function() {
    Object.keys(windowIcons).forEach(function(windowId) {
        var win = document.getElementById(windowId);
        if (!win) return;
        var title = win.querySelector(".window-title");
        if (!title || title.querySelector(".window-title-icon")) return;

        var src = windowIcons[windowId];
        var img = document.createElement("img");
        img.src = src;
        img.className = "window-title-icon";
        if (iconSizes[src]) img.style.height = iconSizes[src];
        img.draggable = false;
        img.alt = "";
        title.insertBefore(img, title.firstChild);
    });
});

// Popup fly-in animation: when a popup opens from an icon click, it
// animates in from that icon's position instead of just snapping into view.
var POPUP_FLY_IN = true;

// Below 960px the floating-window layout can't work - windows stack in
// document flow and the icon column sits on top of them. Two treatments are
// built so they can be compared on a real phone:
//
//   "stacked"    - icon column stays as the desktop, windows stack below it,
//                  opening one scrolls you to it
//   "fullscreen" - one window at a time covering the viewport, close to return
//
// Override per visit with ?mobile=stacked or ?mobile=fullscreen.
var MOBILE_TREATMENT = "stacked";
(function() {
    var choice = new URLSearchParams(window.location.search).get("mobile");
    if (choice === "stacked" || choice === "fullscreen") MOBILE_TREATMENT = choice;
    document.body.classList.add("mobile-" + MOBILE_TREATMENT);
})();

function isMobileLayout() {
    return window.matchMedia("(max-width: 960px)").matches;
}

// Stacked mode reserves room for the icon column, but only while a window is
// actually open - otherwise an untouched page carries a screenful of dead
// scroll. Windows are hidden through several paths (hidePopup, the title-bar
// close buttons' inline onclick, applyPopupChoices), so rather than routing
// them all through one function, watch the elements themselves.
// A window counts as on screen only if it's actually rendered. Testing its own
// computed display isn't enough: the password dialog is display:block inside a
// hidden gate wrapper, so it reads as open when the gate is down. getClientRects
// comes back empty whenever the element or any ancestor is hidden.
function isWindowOnScreen(el) {
    return el.id !== "password-dialog" && el.getClientRects().length > 0;
}

function syncOpenWindowClass() {
    var anyOpen = [].some.call(document.querySelectorAll(".popup-window"), isWindowOnScreen);
    document.body.classList.toggle("has-open-window", anyOpen);
    renderTaskbar();
}

// The footer is a Win95 taskbar. Every open window gets a button carrying the
// same icon its title bar does; clicking one minimises or restores it. The
// page's own button sits at the left and stays pressed.
//
// Rebuilt from scratch on every change rather than diffed - there are only
// ever a handful of windows, and the same MutationObserver that tracks
// has-open-window drives it, so every path that opens or closes a window is
// already covered without routing them through one function.
function renderTaskbar() {
    var tasks = document.getElementById("taskbar-tasks");
    if (!tasks) return;

    [].slice.call(tasks.querySelectorAll(".task-button-window")).forEach(function(btn) {
        btn.parentNode.removeChild(btn);
    });

    [].slice.call(document.querySelectorAll(".popup-window")).forEach(function(win) {
        if (!win.id || !isWindowOnScreen(win)) return;
        var titleEl = win.querySelector(".window-title");
        if (!titleEl) return;

        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "task-button task-button-window" +
                        (win.classList.contains("iconize") ? " is-minimised" : "");

        var img = document.createElement("img");
        img.src = windowIcons[win.id] || TASKBAR_FALLBACK_ICON;
        img.alt = "";
        img.draggable = false;
        btn.appendChild(img);

        var label = document.createElement("span");
        label.textContent = titleEl.textContent.trim();
        btn.appendChild(label);

        btn.addEventListener("click", function() {
            $(win).toggleClass("iconize").removeClass("resize");
        });

        tasks.appendChild(btn);
    });
}

// The tray clock reads 24-hour; the flyout it opens reads 12-hour per city,
// which is the split in the Win95 tray it's modelled on.
//
// Named zones rather than fixed offsets so the rows stay right through both
// countries' DST changes - the US and EU don't switch on the same dates, so
// hardcoded offsets would be wrong for a couple of weeks twice a year.
var WORLD_CLOCKS = [
    { id: "clock-us", zone: "America/Los_Angeles" },
    { id: "clock-uk", zone: "Europe/London" },
    { id: "clock-de", zone: "Europe/Berlin" }
];

// Intl.DateTimeFormat is the only thing here that can throw on an old browser,
// so each formatter is built once behind a try and a null formatter just leaves
// that row at its placeholder rather than breaking the tray clock with it.
function makeZoneFormatter(zone) {
    try {
        return new Intl.DateTimeFormat("en-US", {
            timeZone: zone, hour: "2-digit", minute: "2-digit", hour12: true
        });
    } catch (e) {
        return null;
    }
}

// Tray clock. setInterval rather than an animation-frame loop, so it keeps
// ticking in webviews that throttle frames.
$(document).ready(function() {
    var clock = document.getElementById("tray-clock");
    if (!clock) return;

    // The clock span only carries the text; the surrounding button is the
    // control, so the whole tray - speaker icon included - is the hit area.
    var trayButton = document.getElementById("tray-button");

    var rows = WORLD_CLOCKS.map(function(spec) {
        return {
            el: document.getElementById(spec.id),
            format: makeZoneFormatter(spec.zone)
        };
    });

    function tick() {
        var now = new Date();
        var hours = now.getHours();
        var minutes = now.getMinutes();
        // Military time: zero-padded, no suffix. 16:37, 09:05, 00:12.
        clock.textContent = (hours < 10 ? "0" : "") + hours + ":" +
                            (minutes < 10 ? "0" : "") + minutes;

        rows.forEach(function(row) {
            if (!row.el || !row.format) return;
            row.el.textContent = row.format.format(now);
        });
    }
    tick();
    // 20s is fine for a minute display, but it can leave a row up to 20s stale
    // the moment the flyout opens - so open() ticks as well.
    setInterval(tick, 20000);

    var flyout = document.getElementById("clock-flyout");
    if (!flyout || !trayButton) return;

    // The tray doubles as a music box. Every way the flyout opens or closes -
    // the button, a click away, Escape - runs through setOpen, so hanging the
    // audio off it covers all of them without a second set of handlers.
    var trayAudio = document.getElementById("tray-audio");

    function setOpen(open) {
        if (open) tick();
        flyout.hidden = !open;
        trayButton.setAttribute("aria-expanded", open ? "true" : "false");
        document.body.classList.toggle("clock-open", open);

        if (!trayAudio) return;
        if (open) {
            // pause() leaves currentTime alone, so this picks the track back up
            // where it stopped rather than restarting it - the dance icon
            // behaves the same way. Opening always follows a click, so autoplay
            // policy is satisfied; the promise only rejects when a play is
            // interrupted by an immediate close, which isn't worth surfacing.
            var started = trayAudio.play();
            if (started) started.catch(function() {});
        } else {
            trayAudio.pause();
        }
    }

    trayButton.addEventListener("click", function(e) {
        e.stopPropagation();   // otherwise the document handler closes it again
        setOpen(flyout.hidden);
    });

    // Click-away and Escape, the way a real tray flyout dismisses.
    document.addEventListener("click", function(e) {
        if (!flyout.hidden && !flyout.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && !flyout.hidden) setOpen(false);
    });
});
$(document).ready(function() {
    var observer = new MutationObserver(syncOpenWindowClass);
    document.querySelectorAll(".popup-window").forEach(function(el) {
        observer.observe(el, { attributes: true, attributeFilter: ["style", "class"] });
    });
    syncOpenWindowClass();
});

// Rising z-index so the most recently opened fullscreen window sits on top,
// and closing it reveals whatever was under it
var mobileTopZ = 20000;

// Stacked windows are laid out in a flex column so they can be ordered by when
// they were opened rather than by their order in the HTML - otherwise opening
// the random folder and then Tech Crunch would put Tech Crunch above it, since
// that's how they sit in index.html. Each newly opened window gets the next
// order value, so it lands at the bottom of the stack.
var stackedOrder = 0;

function flyPopupIn(popupEl, originEl) {
    if (!POPUP_FLY_IN || !originEl) return;
    // Stacked windows can land a thousand-plus pixels from the icon, which
    // makes the fly-in a long meaningless swoop. Fullscreen keeps it - zooming
    // out of the tapped icon to fill the screen reads well.
    if (isMobileLayout() && MOBILE_TREATMENT === "stacked") return;
    var popupRect = popupEl.getBoundingClientRect();
    var originRect = originEl.getBoundingClientRect();
    var dx = (originRect.left + originRect.width / 2) - (popupRect.left + popupRect.width / 2);
    var dy = (originRect.top + originRect.height / 2) - (popupRect.top + popupRect.height / 2);

    popupEl.style.transition = "none";
    popupEl.style.transform = "translate(" + dx + "px, " + dy + "px) scale(0.15)";
    popupEl.style.opacity = "0";
    // force a reflow so the browser registers the start state before animating
    void popupEl.offsetHeight;
    popupEl.style.transition = "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease";
    popupEl.style.transform = "translate(0, 0) scale(1)";
    popupEl.style.opacity = "1";

    setTimeout(function() {
        popupEl.style.transition = "";
        popupEl.style.transform = "";
    }, 400);
}

// Reverse of flyPopupIn: shrink the popup back down into the icon it came
// from, then hide it once the animation finishes.
function flyPopupOut(popupEl, originEl) {
    if (!POPUP_FLY_IN || !originEl ||
        (isMobileLayout() && MOBILE_TREATMENT === "stacked")) {
        $(popupEl).hide();
        return;
    }
    var popupRect = popupEl.getBoundingClientRect();
    var originRect = originEl.getBoundingClientRect();
    var dx = (originRect.left + originRect.width / 2) - (popupRect.left + popupRect.width / 2);
    var dy = (originRect.top + originRect.height / 2) - (popupRect.top + popupRect.height / 2);

    popupEl.style.transition = "transform 0.3s cubic-bezier(0.64, 0, 0.78, 0), opacity 0.3s ease";
    popupEl.style.transform = "translate(" + dx + "px, " + dy + "px) scale(0.15)";
    popupEl.style.opacity = "0";

    setTimeout(function() {
        $(popupEl).hide();
        popupEl.style.transition = "";
        popupEl.style.transform = "";
        popupEl.style.opacity = "";
    }, 300);
}

// Show a popup by id, flying it in from originEl (an icon element) if enabled
function showPopup(popupId, originEl) {
    var popup = document.getElementById(popupId);
    if (!popup) return;
    $(popup).show();

    if (isMobileLayout() && MOBILE_TREATMENT === "fullscreen") {
        popup.style.zIndex = ++mobileTopZ;
        flyPopupIn(popup, originEl);
        return;
    }

    // Stacked: append to the bottom of the column. No scrolling - the stack
    // sits high enough to overlap the lower icons, so the first window is
    // already on screen and the page doesn't lurch under you.
    if (isMobileLayout()) {
        popup.style.order = ++stackedOrder;
    }

    flyPopupIn(popup, originEl);
}

// Hide a popup by id, flying it back into originEl (an icon element) if enabled
function hidePopup(popupId, originEl) {
    var popup = document.getElementById(popupId);
    if (!popup || $(popup).is(":hidden")) return;
    flyPopupOut(popup, originEl);
}

document.getElementById("fly-in-on").addEventListener("change", function() {
    if (this.checked) POPUP_FLY_IN = true;
});
document.getElementById("fly-in-off").addEventListener("change", function() {
    if (this.checked) POPUP_FLY_IN = false;
});

function openSettingsWindow(originEl) {
    var popup = document.getElementById("settings-window");
    popup.style.display = "block";
    var w = popup.offsetWidth;
    var h = popup.offsetHeight;
    popup.style.left = Math.max(0, (window.innerWidth / 2 - w / 2 + window.scrollX)) + "px";
    popup.style.top = Math.max(0, (window.innerHeight / 2 - h / 2 + window.scrollY)) + "px";
    flyPopupIn(popup, originEl);
}

// Initialize the draggable function.
//
// No click handler: clicking home used to save its position and reload the
// page, which read as the site closing and reopening under you. Dragging it
// into the header to reveal settings is unaffected - that's onDragEnd below.
makeElementDraggable("computer-icon-group", function() {
    // "Show desktop": clear everything out of the way, and put it all back on
    // a second click. Windows are minimised rather than closed, so they stay
    // in the taskbar and nothing is lost. This replaced the old behaviour of
    // saving the icon's position and reloading, which read as the site
    // closing and reopening under you.
    var open = [].filter.call(document.querySelectorAll(".popup-window"), isWindowOnScreen);
    if (!open.length) return;

    var allMinimised = open.every(function(win) {
        return win.classList.contains("iconize");
    });
    open.forEach(function(win) {
        $(win).toggleClass("iconize", !allMinimised).removeClass("resize");
    });
}, function() {
    // onDragEnd
    var el = document.getElementById("computer-icon-group");
    var overlaps = isOverlappingHeader(el);
    setHomeIconVisual(false);
    if (overlaps) {
        document.getElementById("settings-icon-group").style.display = "block";
        openSettingsWindow(el);
        el.style.top = "";
        el.style.left = "";
    }
}, function() {
    // onDragMove (live preview while dragging)
    var el = document.getElementById("computer-icon-group");
    setHomeIconVisual(isOverlappingHeader(el));
});
makeElementDraggable("folder-icon-group", function() {
    var el = document.getElementById("files-window");
    var opening = $(el).is(":hidden");
    $(el).toggle();
    if (opening) flyPopupIn(el, document.getElementById("folder-icon-group"));
});
makeElementDraggable("files-icon-group", function() {
    toggleDesktopFolder("random");
});
makeElementDraggable("college-icon-group", function() {
    toggleDesktopFolder("college");
});
makeElementDraggable("google-icon-group", function() {
    var win = document.getElementById("google-window");
    var origin = document.getElementById("google-icon-group");

    if (!$(win).is(":hidden")) {
        hidePopup("google-window", origin);
        return;
    }

    showPopup("google-window", origin);
    // Straight into the field - the window exists to be typed in
    setTimeout(function() {
        document.getElementById("google-query").focus();
    }, 80);
});
makeElementDraggable("dancing-icon-group", function() {
    var img = document.getElementById("dancing-icon");
    var audio = document.getElementById("dancing-audio");
    var isPlaying = img.src.indexOf("dancing.gif") !== -1;
    if (isPlaying) {
        img.src = "dancing.png";
        audio.pause();
    } else {
        img.src = "dancing.gif";
        audio.play();
    }
});
makeElementDraggable("moon-icon-group", function() {
    var img = document.getElementById("moon-icon");
    var label = document.querySelector("#moon-icon-label a");
    var isDark = document.body.classList.contains("dark-mode");
    if (isDark) {
        document.body.classList.remove("dark-mode");
        img.src = "moon.gif";
        label.textContent = "darkness";
    } else {
        document.body.classList.add("dark-mode");
        img.src = "sun.gif";
        label.textContent = "lightness";
    }
});
makeElementDraggable("dino-icon-group", function() {
    var win = document.getElementById("dino-window");
    var frame = document.getElementById("dino-frame");
    var origin = document.getElementById("dino-icon-group");

    if (!$(win).is(":hidden")) {
        hidePopup("dino-window", origin);
        return;
    }

    // Point the iframe at the game the first time it's opened rather than on
    // every page load - it's a standalone 118KB page that would otherwise sit
    // there running behind a hidden window
    if (!frame.getAttribute("src")) frame.src = "dinasour.html";

    showPopup("dino-window", origin);
    // The game listens for space and arrow keys, so hand it the keyboard
    // instead of making you click into the frame first
    setTimeout(function() {
        frame.focus();
        try { frame.contentWindow.focus(); } catch (e) {}
    }, 60);
});
// Opens the FREE IDEAS notepad, toggling it shut on a second click like dino
// and sneaky links do.
makeElementDraggable("tips-icon-group", function() {
    var win = document.getElementById("notepad-window");
    var origin = document.getElementById("tips-icon-group");

    if (!$(win).is(":hidden")) {
        hidePopup("notepad-window", origin);
        return;
    }

    showPopup("notepad-window", origin);
    // Reload on every open, so notes changed in the file - or from another
    // browser - are picked up without refreshing the page
    loadNotepad();
    // Straight into the text - the window exists to be typed in
    setTimeout(function() {
        document.getElementById("notepad-text").focus();
    }, 80);
});

// Opens SNEAKY LINKS, and toggles it shut on a second click like dino does.
// The window no longer opens on arrival, so this is the only way in.
makeElementDraggable("incognito-icon-group", function() {
    var win = document.getElementById("converter-window");
    var origin = document.getElementById("incognito-icon-group");

    if (!$(win).is(":hidden")) {
        closeConverterWindow();
        return;
    }
    openConverterWindow(origin);
});
makeElementDraggable("settings-icon-group", function() {
    var popup = document.getElementById("settings-window");
    if (popup.style.display === "block") {
        popup.style.display = "none";
    } else {
        openSettingsWindow(document.getElementById("settings-icon-group"));
    }
});


// "Now Playing" files window contents and navigation
//
// Two treatments to switch between: change FILES_TREATMENT below.
//   "inline" - clicking a folder drills into it inside the same popup,
//              with a "back" item (tomato.gif) to return to the folder list.
//   "popup"  - clicking a folder opens a second popup window titled
//              "NOW PLAYING: <FOLDER>" showing just that folder's files.
var FILES_TREATMENT = "popup";

var filesData = {
    root: [
        { type: "folder", name: "press", id: "press" },
        { type: "folder", name: "patent", id: "patent" },
        { type: "folder", name: "virality", id: "virality" },
        { type: "folder", name: "png", id: "png" }
    ],
    press: [
        { type: "file", name: "tech crunch", openPopup: "snapmap-wrapper" },
        { type: "file", name: "snap newsroom", url: "https://newsroom.snap.com/now-playing-brings-music-sharing-to-snap-map" },
        { type: "file", name: "spotify newsletter", url: "https://spotify.substack.com/p/snapchat-turns-snap-map-into-a-realtime" },
        { type: "file", name: "igeeksblog", url: "https://www.igeeksblog.com/snapchat-now-playing-snap-map/" },
        { type: "file", name: "cleveland.com", url: "https://www.cleveland.com/news/2026/07/snapchat-has-something-new-for-music-lovers-now-playing.html" },
        { type: "file", name: "ceci_linkedin", url: "https://www.linkedin.com/posts/ceci-mourkogiannis-a71a7912_happy-monday-today-we-are-proud-to-introduce-ugcPost-7487517874211745793-XgNk/" }
    ],
    patent: [
        { type: "file", name: "application" },
        { type: "file", name: "figures", openPopup: "patent-figures-window" }
    ],
    virality: [
        { type: "file", name: "tiktok1" },
        { type: "file", name: "tiktok2" },
        { type: "file", name: "tiktok3" },
        { type: "file", name: "tiktok4" },
        { type: "file", name: "tiktok5" }
    ],
    png: []
};

function renderFilesGrid(folderKey) {
    var grid = document.getElementById("files-grid");
    grid.innerHTML = "";

    if (FILES_TREATMENT === "inline" && folderKey !== "root") {
        var back = document.createElement("div");
        back.className = "file-item";
        back.innerHTML = '<img src="tomato.gif" class="back-icon" draggable="false"><span>back</span>';
        back.onclick = function() { renderFilesGrid("root"); };
        grid.appendChild(back);
    }

    var items = filesData[folderKey] || [];
    items.forEach(function(item) {
        var el = document.createElement("div");
        el.className = "file-item";
        var icon = item.type === "folder" ? "folder-icon.png" : "fileicon.png";
        var iconClass = item.type === "folder" ? "" : " file-type-icon";
        el.innerHTML = '<img src="' + icon + '" class="' + iconClass.trim() + '" draggable="false"><span>' + item.name + "</span>";
        if (item.type === "folder") {
            el.onclick = function() {
                if (FILES_TREATMENT === "popup") {
                    openFolderContents(item.id);
                } else {
                    renderFilesGrid(item.id);
                }
            };
        } else if (item.openPopup) {
            el.onclick = function() { showPopup(item.openPopup, el); };
        } else if (item.url) {
            el.onclick = function() { window.open(item.url, "_blank"); };
        }
        grid.appendChild(el);
    });
}

function openFolderContents(folderKey) {
    var title = document.getElementById("folder-contents-title");
    var grid = document.getElementById("folder-contents-grid");
    title.textContent = "NOW PLAYING: " + folderKey.toUpperCase();
    grid.innerHTML = "";

    var items = filesData[folderKey] || [];
    items.forEach(function(item) {
        var el = document.createElement("div");
        el.className = "file-item";
        el.innerHTML = '<img src="fileicon.png" class="file-type-icon" draggable="false"><span>' + item.name + "</span>";
        if (item.openPopup) {
            el.onclick = function() { showPopup(item.openPopup, el); };
        } else if (item.url) {
            el.onclick = function() { window.open(item.url, "_blank"); };
        }
        grid.appendChild(el);
    });

    var rootWindow = document.getElementById("files-window");
    var contentsWindow = document.getElementById("folder-contents-window");
    var rootRect = rootWindow.getBoundingClientRect();
    contentsWindow.style.left = (window.scrollX + rootRect.left + 40) + "px";
    contentsWindow.style.top = (window.scrollY + rootRect.top + 40) + "px";

    $("#folder-contents-window").show();
}

renderFilesGrid("root");

// Desktop folders that open a window listing their contents as folder icons.
// Clicking the icon opens just that window; its contents open individually
// from the grid inside. Add more folders here with the same shape -
// toggleDesktopFolder/renderDesktopFolder are not random-specific.
var desktopFolders = {
    random: {
        iconId: "files-icon-group",
        windowId: "random-window",
        gridId: "random-grid",
        items: [
            { name: "techcrunch",    popup: "snapmap-wrapper" },
            { name: "patent",        popup: "patent-figures-window" },
            { name: "application",   popup: "ambient-streaming-window" },
            { name: "ww",            popup: "canary-yellow-wrapper" },
            { name: "warmleche",     popup: "postmodern-wrapper" },
            { name: "undertheghost", popup: "under-ghost-wrapper" },
            { name: "dsresearch",    popup: "s13688-window" }
        ]
    },
    college: {
        iconId: "college-icon-group",
        windowId: "college-window",
        gridId: "college-grid",
        items: [
            { name: "letter_of_intent", popup: "letter-of-intent-window" },
            { name: "phd_acceptance",  popup: "phd-acceptance-window" },
            // Same window the random folder's "dsresearch" opens - one file
            // showing up in two folders, not two copies of it
            { name: "ds research", popup: "s13688-window" }
        ]
    }
};

function renderDesktopFolder(folderKey) {
    var folder = desktopFolders[folderKey];
    var grid = document.getElementById(folder.gridId);
    grid.innerHTML = "";

    folder.items.forEach(function(item) {
        // Every entry here opens a popup, so every entry is a file
        var el = document.createElement("div");
        el.className = "file-item";
        el.innerHTML = '<img src="fileicon.png" class="file-type-icon" draggable="false"><span>' + item.name + "</span>";
        el.onclick = function() {
            var popup = document.getElementById(item.popup);
            if (popup && $(popup).is(":hidden")) showPopup(item.popup, el);
        };
        grid.appendChild(el);
    });
}

function toggleDesktopFolder(folderKey) {
    var folder = desktopFolders[folderKey];
    var origin = document.getElementById(folder.iconId);
    var win = document.getElementById(folder.windowId);

    // Window already up: pull it, and anything opened from it, back into the icon
    if (!$(win).is(":hidden")) {
        folder.items.forEach(function(item) { hidePopup(item.popup, origin); });
        flyPopupOut(win, origin);
        return;
    }

    showPopup(folder.windowId, origin);
}

renderDesktopFolder("random");
renderDesktopFolder("college");

// Settings: pointer color
function setPointerColor(color) {
    var cursorValue = color === "red"
        ? "url('cursor-arrow.png') 1 0, auto"
        : "url('cursor2-arrow.png') 0 0, auto";
    document.documentElement.style.cursor = cursorValue;
    document.body.style.cursor = cursorValue;
    document.body.classList.toggle("pointer-red", color === "red");
}
document.getElementById("pointer-white").addEventListener("change", function() {
    if (this.checked) setPointerColor("white");
});
document.getElementById("pointer-red").addEventListener("change", function() {
    if (this.checked) setPointerColor("red");
});

// Settings: now playing folder navigation treatment
document.getElementById("nav-inline").addEventListener("change", function() {
    if (this.checked) {
        FILES_TREATMENT = "inline";
        $("#folder-contents-window").hide();
        renderFilesGrid("root");
    }
});
document.getElementById("nav-popup").addEventListener("change", function() {
    if (this.checked) {
        FILES_TREATMENT = "popup";
        renderFilesGrid("root");
    }
});

// Settings: popups on open
var popupChoiceMap = {
    "popup-choice-wheres-west": "canary-yellow-wrapper",
    "popup-choice-warm-leche": "postmodern-wrapper",
    "popup-choice-snapmap": "snapmap-wrapper",
    "popup-choice-patent-figures": "patent-figures-window",
    "popup-choice-s13688": "s13688-window",
    "popup-choice-ambient": "ambient-streaming-window",
    "popup-choice-under-ghost": "under-ghost-wrapper"
};
function applyPopupChoices() {
    var onEnabled = document.getElementById("popups-on-open-on").checked;
    Object.keys(popupChoiceMap).forEach(function(checkboxId) {
        var wrapperId = popupChoiceMap[checkboxId];
        var checked = onEnabled && document.getElementById(checkboxId).checked;
        document.getElementById(wrapperId).style.display = checked ? "block" : "none";
    });
}
document.getElementById("popups-on-open-off").addEventListener("change", function() {
    if (this.checked) {
        document.getElementById("popups-on-open-choices").style.display = "none";
        applyPopupChoices();
    }
});
document.getElementById("popups-on-open-on").addEventListener("change", function() {
    if (this.checked) {
        document.getElementById("popups-on-open-choices").style.display = "block";
        applyPopupChoices();
    }
});
Object.keys(popupChoiceMap).forEach(function(checkboxId) {
    document.getElementById(checkboxId).addEventListener("change", applyPopupChoices);
});
applyPopupChoices();

// Settings: show header
document.getElementById("show-header-off").addEventListener("change", function() {
    if (this.checked) document.body.classList.add("header-hidden");
});
document.getElementById("show-header-on").addEventListener("change", function() {
    if (this.checked) document.body.classList.remove("header-hidden");
});

// Settings: logo (extensible - add a filename here + a matching radio in
// index.html's "Header Options > Logo option" row to add more options later)
var logoOptions = {
    original: null,
    notes: "notes.png"
};
function setLogo(name) {
    var logo = document.getElementById("site-logo");
    var title = document.getElementById("title");
    var src = logoOptions[name];
    if (src) {
        logo.src = src;
        logo.style.display = "block";
        title.classList.add("has-logo-behind");
    } else {
        logo.style.display = "none";
        title.classList.remove("has-logo-behind");
    }
}
document.getElementById("logo-original").addEventListener("change", function() {
    if (this.checked) setLogo("original");
});
document.getElementById("logo-notes").addEventListener("change", function() {
    if (this.checked) setLogo("notes");
});
setLogo("original");

// Core: copy the current on-screen position of every VISIBLE popup/icon
// as ready-to-paste CSS. Anything hidden is skipped, so if only one thing
// is showing, you get back just that one rule.
document.getElementById("copy-layout-btn").addEventListener("click", function() {
    var elements = document.querySelectorAll(".popup-window, .desktop-icon-group");
    var lines = [];
    elements.forEach(function(el) {
        if (!el.id) return;
        var style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") return;
        var rect = el.getBoundingClientRect();
        var left = Math.round(rect.left + window.scrollX);
        var top = Math.round(rect.top + window.scrollY);
        lines.push("#" + el.id + " { left: " + left + "px; top: " + top + "px; right: auto; }");
    });
    var output = lines.length ? lines.join("\n") : "/* nothing visible to capture */";
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(output).then(function() {
            alert("Copied layout for " + lines.length + " visible item(s):\n\n" + output);
        }).catch(function() {
            prompt("Copy this manually:", output);
        });
    } else {
        prompt("Copy this manually:", output);
    }
});

// Settings: lock the site back up behind the password gate. Works whether or
// not REQUIRE_PASSWORD is on - ?lock forces the gate either way, so the dialog
// can be brought up on demand without turning it on for every visitor.
document.getElementById("lock-site-btn").addEventListener("click", function() {
    window.location.href = "index.html?lock";
});

// Settings: bottom bar - Win95 taskbar, or the original centred copyright line
document.getElementById("bottom-bar-taskbar").addEventListener("change", function() {
    if (this.checked) document.body.classList.remove("bottom-bar-classic");
});
document.getElementById("bottom-bar-classic").addEventListener("change", function() {
    if (this.checked) document.body.classList.add("bottom-bar-classic");
});

// Settings: stack layout
var stackOrder = [
    "settings-icon-group", "computer-icon-group", "folder-icon-group",
    "google-icon-group", "dancing-icon-group", "moon-icon-group",
    "tips-icon-group", "dino-icon-group", "incognito-icon-group",
    "college-icon-group", "files-icon-group"
];
var stackRightOffsets = {
    "settings-icon-group": 10, "computer-icon-group": 10, "folder-icon-group": 10,
    "google-icon-group": 8, "dancing-icon-group": 10, "moon-icon-group": 10,
    "tips-icon-group": 10, "dino-icon-group": 10, "incognito-icon-group": 10,
    "college-icon-group": 10, "files-icon-group": 10
};
function applyStackLayout(mode) {
    var rowSpacing = 110;
    var totalWidth = stackOrder.length * 100 + (stackOrder.length - 1) * (rowSpacing - 100);
    var startLeft = Math.max(10, (window.innerWidth - totalWidth) / 2);
    var headerRect = document.querySelector("header").getBoundingClientRect();
    var footerRect = document.querySelector("footer").getBoundingClientRect();

    stackOrder.forEach(function(id, i) {
        var group = document.getElementById(id);
        group.style.left = "";
        group.style.right = "";
        group.style.top = "";
        group.style.bottom = "";

        if (mode === "right") {
            group.style.right = stackRightOffsets[id] + "px";
            // top left at its CSS default (already tuned per-icon)
        } else if (mode === "left") {
            group.style.left = stackRightOffsets[id] + "px";
            // top left at its CSS default (already tuned per-icon)
        } else if (mode === "top") {
            group.style.top = (window.scrollY + headerRect.bottom + 15) + "px";
            group.style.left = (startLeft + i * rowSpacing) + "px";
        } else if (mode === "bottom") {
            group.style.top = (window.scrollY + footerRect.top - 58) + "px";
            group.style.left = (startLeft + i * rowSpacing) + "px";
        } else if (mode === "random") {
            var maxLeft = Math.max(0, window.innerWidth - 120);
            var maxTop = Math.max(100, window.innerHeight - 200);
            group.style.left = Math.floor(Math.random() * maxLeft) + "px";
            group.style.top = Math.floor(Math.random() * maxTop) + "px";
        }
    });
}
document.getElementById("stack-layout-right").addEventListener("change", function() {
    if (this.checked) applyStackLayout("right");
});
document.getElementById("stack-layout-left").addEventListener("change", function() {
    if (this.checked) applyStackLayout("left");
});
document.getElementById("stack-layout-top").addEventListener("change", function() {
    if (this.checked) applyStackLayout("top");
});
document.getElementById("stack-layout-bottom").addEventListener("change", function() {
    if (this.checked) applyStackLayout("bottom");
});
document.getElementById("stack-layout-random").addEventListener("change", function() {
    if (this.checked) applyStackLayout("random");
});

// Settings: popup header color in dark mode
var popupHeaderDarkColors = {
    gray: "#4a4a4a",
    black: "#000000",
    blue: "linear-gradient(90deg, rgba(51,78,165,1) 0%, rgba(76,127,193,1) 100%)",
    darkblue: "linear-gradient(90deg, rgba(20,30,70,1) 0%, rgba(45,60,110,1) 100%)"
};
function setPopupHeaderDarkColor(name) {
    document.body.style.setProperty("--popup-header-dark-bg", popupHeaderDarkColors[name]);
}
document.getElementById("dark-headers-gray").addEventListener("change", function() {
    if (this.checked) setPopupHeaderDarkColor("gray");
});
document.getElementById("dark-headers-black").addEventListener("change", function() {
    if (this.checked) setPopupHeaderDarkColor("black");
});
document.getElementById("dark-headers-blue").addEventListener("change", function() {
    if (this.checked) setPopupHeaderDarkColor("blue");
});
document.getElementById("dark-headers-darkblue").addEventListener("change", function() {
    if (this.checked) setPopupHeaderDarkColor("darkblue");
});
setPopupHeaderDarkColor("gray");

// Settings: popup header color in light mode
var popupHeaderLightColors = {
    blue: "linear-gradient(90deg, rgba(51,78,165,1) 0%, rgba(76,127,193,1) 100%)",
    gray: "#8a8a8a",
    black: "#000000"
};
function setPopupHeaderLightColor(name) {
    document.body.style.setProperty("--popup-header-light-bg", popupHeaderLightColors[name]);
}
document.getElementById("light-headers-blue").addEventListener("change", function() {
    if (this.checked) setPopupHeaderLightColor("blue");
});
document.getElementById("light-headers-gray").addEventListener("change", function() {
    if (this.checked) setPopupHeaderLightColor("gray");
});
document.getElementById("light-headers-black").addEventListener("change", function() {
    if (this.checked) setPopupHeaderLightColor("black");
});
setPopupHeaderLightColor("blue");

// Settings: footer color in dark mode
document.getElementById("dark-footer-on").addEventListener("change", function() {
    if (this.checked) document.body.classList.add("footer-dark");
});
document.getElementById("dark-footer-off").addEventListener("change", function() {
    if (this.checked) document.body.classList.remove("footer-dark");
});

// typing effect

function typeWriter(text, elementId, speed, callback) {
    let i = 0;
    const output = document.getElementById(elementId);

    function typing() {
        if (i < text.length) {
            let char = text[i];
            output.innerHTML += char;
            i++;
            setTimeout(typing, speed);
        } else if (callback) {
            callback(); // Execute the callback function after finishing typing
        }
    }
    typing();
}

const title = "mocial"

typeWriter(title, 'title', 40);


// ===== YouTube converter ====================================================
// This is chrome and polling only. The conversion itself happens in
// converter/server.py, which has to be running on your own machine - the site
// is a static file, so there is nowhere on mocial.org for yt-dlp to live.
//
// Nothing below knows what an mp3 is. Both dropdowns are built from whatever
// the converter reports at GET /api/formats, so a format added to the FORMATS
// table in server.py appears here without an edit on this side.

// Point somewhere else with:
//   localStorage.setItem("mocial-converter-api", "http://192.168.1.5:8770")
var CONVERTER_API = localStorage.getItem("mocial-converter-api") || "http://127.0.0.1:8770";
var CONVERTER_POLL_MS = 500;
var CONVERTER_OFFLINE = "The converter isn't running. Start it with: python3 converter/server.py";

var converterPane = "form";
var converterJobId = null;
var converterTimer = null;
var converterFormats = null;
var converterFinished = null;   // the finished job, held for the Save button
var converterOrigin = null;     // the icon it flew in from, once it has one

// Every call goes through here so a converter that isn't running produces one
// useful sentence rather than a browser-flavoured network error.
function converterFetch(path, options) {
    return fetch(CONVERTER_API + path, options).then(function(res) {
        if (res.ok) {
            return res.status === 204 ? null : res.json();
        }
        return res.json().catch(function() {
            return {};
        }).then(function(body) {
            throw new Error(body.error || ("The converter returned " + res.status + "."));
        });
    }, function() {
        throw new Error(CONVERTER_OFFLINE);
    });
}

function converterFormatBytes(bytes) {
    if (bytes === null || bytes === undefined) return "";
    var units = ["B", "KB", "MB", "GB"];
    var i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }
    return (i === 0 ? Math.round(bytes) : bytes.toFixed(1)) + " " + units[i];
}


function setConverterError(message) {
    document.getElementById("converter-error").textContent = message || "";
}

// One window, three panes. The buttons stay put and change what they say -
// swapping the buttons themselves made the dialog jump as it resized.
function setConverterPane(name) {
    converterPane = name;
    ["form", "progress", "done"].forEach(function(pane) {
        document.getElementById("converter-pane-" + pane).style.display =
            (pane === name) ? "block" : "none";
    });

    var formats = document.getElementById("converter-formats");
    var go = document.getElementById("converter-go");
    var cancel = document.getElementById("converter-cancel");

    // One column, two tenants. The form's actions are the format buttons; the
    // working states want Convert/Cancel instead. They swap rather than sit
    // together, so the column stays the same width and the dialog doesn't
    // resize under you mid-job.
    var onForm = (name === "form");
    if (formats) formats.style.display = onForm ? "" : "none";
    go.style.display = onForm ? "none" : "";
    cancel.style.display = onForm ? "none" : "";

    if (name === "progress") {
        // Nothing to confirm while it runs, so the dialog is down to one button
        go.style.display = "none";
        cancel.textContent = "Cancel";
    } else if (name === "done") {
        go.textContent = "Save";
        cancel.textContent = "Again";
    }
}

// Only used when the converter can't be reached as the dialog opens, so the
// row has its buttons instead of sitting empty. Deliberately not cached into
// converterFormats - the real list still replaces it the moment the converter
// answers, so a converter started after the page loaded self-heals.
var CONVERTER_FALLBACK_FORMATS = {
    "default": "mp3",
    formats: [
        { key: "mp3", label: "MP3 (audio)", qualities: [], default_quality: "" },
        { key: "mp4", label: "MP4 (video)", default_quality: "720", qualities: [
            { value: "480", label: "480p" },
            { value: "720", label: "720p" },
            { value: "1080", label: "1080p" },
            { value: "best", label: "Best available" }
        ] }
    ]
};

function loadConverterFormats() {
    if (converterFormats) return Promise.resolve(converterFormats);

    return converterFetch("/api/formats").then(function(data) {
        converterFormats = data;
        renderConverterFormats(data);
        return data;
    });
}

// One button per format the converter offers. A format with no quality choice
// converts on click; one with choices raises its options first. Because this
// is built from the API rather than written out in the markup, adding a
// format server-side still costs nothing here - it just grows another button.
function renderConverterFormats(data) {
    var host = document.getElementById("converter-formats");
    if (!host) return;
    host.innerHTML = "";

    data.formats.forEach(function(format) {
        var wrapper = document.createElement("div");
        wrapper.className = "converter-format-wrapper";

        var button = document.createElement("button");
        button.type = "button";
        button.className = "converter-format-button";
        // MP3 / MP4 rather than the long label - it's a button, not a menu
        button.textContent = format.key.toUpperCase();
        wrapper.appendChild(button);

        var qualities = format.qualities || [];

        if (!qualities.length) {
            button.addEventListener("click", function() {
                startConversion(format.key, "");
            });
            host.appendChild(wrapper);
            return;
        }

        var flyout = document.createElement("div");
        flyout.className = "converter-flyout";
        flyout.hidden = true;
        button.setAttribute("aria-expanded", "false");

        qualities.forEach(function(quality) {
            var row = document.createElement("button");
            row.type = "button";
            row.className = "converter-flyout-row";
            row.textContent = quality.label;
            row.addEventListener("click", function(e) {
                e.stopPropagation();
                closeConverterFlyouts();
                startConversion(format.key, quality.value);
            });
            flyout.appendChild(row);
        });

        button.addEventListener("click", function(e) {
            // Without this the document handler below closes it again inside
            // the same click - the tray button carries the same guard.
            e.stopPropagation();
            var opening = flyout.hidden;
            closeConverterFlyouts();
            if (opening) {
                flyout.hidden = false;
                button.setAttribute("aria-expanded", "true");
            }
        });

        wrapper.appendChild(flyout);
        host.appendChild(wrapper);
    });
}

function closeConverterFlyouts() {
    [].forEach.call(document.querySelectorAll(".converter-flyout"), function(flyout) {
        flyout.hidden = true;
    });
    [].forEach.call(
        document.querySelectorAll(".converter-format-button[aria-expanded]"),
        function(button) { button.setAttribute("aria-expanded", "false"); }
    );
}

// Click-away and Escape, the way the tray flyout dismisses
document.addEventListener("click", closeConverterFlyouts);
document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") closeConverterFlyouts();
});

// How many blocks make up a full bar. 20 means each one is worth 5% - lighting
// the tenth is the job being half done, exactly.
var CONVERTER_BLOCKS = 20;

function buildConverterBar(bar) {
    if (!bar) return;
    bar.innerHTML = "";
    for (var i = 0; i < CONVERTER_BLOCKS; i++) {
        var block = document.createElement("div");
        block.className = "converter-block";
        bar.appendChild(block);
    }
}

function setConverterBar(bar, percent) {
    if (!bar) return;
    var blocks = bar.children;

    // floor, not round, with 100% special-cased: rounding would light the last
    // block at 97.5% and show a bar that reads finished while ffmpeg is still
    // running. A full bar should mean a finished file.
    var lit = (percent >= 100)
        ? blocks.length
        : Math.floor((percent || 0) / 100 * blocks.length);
    lit = Math.max(0, Math.min(blocks.length, lit));

    for (var i = 0; i < blocks.length; i++) {
        blocks[i].classList.toggle("is-on", i < lit);
    }
}

// One animation, start to finish. The job moves through queued, downloading
// and converting, but that's the converter's business, not something worth
// showing three different ways - it read as the dialog restarting itself
// twice. The blocks just light left to right the whole time.
function renderConverterJob(job) {
    var status = document.getElementById("converter-status");
    var sub = document.getElementById("converter-substatus");

    setConverterBar(document.getElementById("converter-bar"), job.percent || 0);
    status.textContent = "Converting your " + String(job.format || "").toUpperCase() + "...";
    sub.textContent = job.title || "";
}

function stopConverterPolling() {
    if (converterTimer) {
        clearInterval(converterTimer);
        converterTimer = null;
    }
}

function converterFailed(message) {
    stopConverterPolling();
    converterJobId = null;
    setConverterPane("form");
    setConverterError(message);
}

function converterSucceeded(job) {
    stopConverterPolling();
    converterJobId = null;
    converterFinished = job;

    setConverterPane("done");
    setConverterBar(document.getElementById("converter-done-bar"), 100);
    document.getElementById("converter-done-message").textContent =
        (job.title || "Your file") + " is ready.";
    document.getElementById("converter-done-detail").textContent =
        job.filename + "   ·   " + converterFormatBytes(job.size);
}

// Back to an empty form, leaving whatever link is in the field alone
function converterReset() {
    stopConverterPolling();
    converterJobId = null;
    converterFinished = null;
    setConverterPane("form");
    setConverterError("");
}

function pollConverterJob() {
    var polling = converterJobId;
    if (!polling) return;

    converterFetch("/api/jobs/" + polling).then(function(job) {
        // A cancel can land between the request going out and coming back
        if (converterJobId !== polling) return;

        if (job.state === "done") return converterSucceeded(job);
        if (job.state === "error") return converterFailed(job.error || "Conversion failed.");
        if (job.state === "cancelled") return converterReset();
        renderConverterJob(job);
    }).catch(function(err) {
        converterFailed(err.message);
    });
}

// Format and quality come from whichever button was pressed, rather than being
// read back out of the dialog - the button IS the choice now.
function startConversion(format, quality) {
    var url = document.getElementById("converter-url").value.trim();
    if (!url) {
        setConverterError("Paste a YouTube link first.");
        document.getElementById("converter-url").focus();
        return;
    }

    setConverterError("");
    setConverterPane("progress");
    // Seeded with the format so the text is right from the first frame,
    // before the converter has answered with a job of its own
    renderConverterJob({ state: "queued", percent: 0, format: format });

    // Loading the formats here as well as on open means a converter you
    // started after the page did still works, without a reload
    loadConverterFormats().then(function() {
        return converterFetch("/api/convert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url: url,
                format: format,
                quality: quality || ""
            })
        });
    }).then(function(job) {
        converterJobId = job.id;
        renderConverterJob(job);
        converterTimer = setInterval(pollConverterJob, CONVERTER_POLL_MS);
    }).catch(function(err) {
        converterFailed(err.message);
    });
}

function cancelConverterJob() {
    if (converterJobId) {
        // Fire and forget: the job is going away on this side either way
        converterFetch("/api/jobs/" + converterJobId, { method: "DELETE" })
            .catch(function() {});
    }
    converterReset();
}

// Content-Disposition on the converter's side makes this a download rather
// than a navigation, which is why there's no `download` attribute here - it
// wouldn't apply cross-origin anyway.
function saveConverterFile() {
    if (!converterFinished || !converterFinished.download_url) return;

    var link = document.createElement("a");
    link.href = CONVERTER_API + converterFinished.download_url;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
}

function openConverterWindow(originEl) {
    var popup = document.getElementById("converter-window");
    converterOrigin = originEl || null;

    // Centred, the way the settings window is: neither has a desktop icon
    // with a position of its own to sit under. Only on desktop - the mobile
    // layouts position windows from CSS (stacked makes them static
    // !important), so left/top there would be dead weight, and showPopup is
    // what puts the window in the right place in the stack.
    if (!isMobileLayout()) {
        popup.style.display = "block";
        var width = popup.offsetWidth;
        var height = popup.offsetHeight;
        popup.style.left = Math.max(0, (window.innerWidth / 2 - width / 2 + window.scrollX)) + "px";
        popup.style.top = Math.max(0, (window.innerHeight / 2 - height / 2 + window.scrollY)) + "px";
    }
    showPopup("converter-window", originEl);

    converterReset();

    // Builds the format buttons, and surfaces a converter that isn't running
    // now rather than after you've pasted a link and pressed one. The fallback
    // keeps the row populated either way - an empty dialog reads as broken,
    // and the real list replaces it as soon as the converter answers.
    loadConverterFormats().catch(function(err) {
        renderConverterFormats(CONVERTER_FALLBACK_FORMATS);
        setConverterError(err.message);
    });

    setTimeout(function() {
        document.getElementById("converter-url").focus();
    }, 80);
}

function closeConverterWindow() {
    if (converterJobId) cancelConverterJob();
    hidePopup("converter-window", converterOrigin);
}

buildConverterBar(document.getElementById("converter-bar"));
buildConverterBar(document.getElementById("converter-done-bar"));

document.getElementById("converter-go").addEventListener("click", function() {
    if (converterPane === "done") saveConverterFile();
});

document.getElementById("converter-cancel").addEventListener("click", function() {
    if (converterPane === "progress") {
        cancelConverterJob();
        return;
    }
    if (converterPane === "done") {
        // "Again" means another link, not the same one twice - that file is
        // already saved. Cleared and focused so the next paste just goes in.
        //
        // Deliberately here rather than inside converterReset(): cancelling a
        // running job resets too, and there you usually DO want the link back,
        // to retry it or fix a typo.
        var field = document.getElementById("converter-url");
        converterReset();
        field.value = "";
        field.focus();
    }
});

document.getElementById("converter-url").addEventListener("keydown", function(e) {
    if (e.key !== "Enter") {
        setConverterError("");
        return;
    }
    // There's no single Convert button to imply a format any more, so Enter
    // takes the converter's default - mp3, at its only quality.
    var data = converterFormats || CONVERTER_FALLBACK_FORMATS;
    var key = data["default"] || data.formats[0].key;
    var format = data.formats.filter(function(f) { return f.key === key; })[0];
    startConversion(key, format ? format.default_quality : "");
});


// ===== Google search ========================================================
// Google can't be framed the way the dino game is: google.com serves
// x-frame-options: SAMEORIGIN, so an <iframe> pointed at it renders nothing.
// dinasour.html frames fine because it's a local file, same origin.
//
// So the window is a search box that hands the query to the real Google in a
// new tab. If results should ever appear inside the window instead, Google's
// Programmable Search Engine is the supported route - it drops into this same
// window and only needs an engine ID.
function submitGoogleSearch() {
    var field = document.getElementById("google-query");
    var query = field.value.trim();
    if (!query) {
        field.focus();
        return;
    }
    // noopener so the new tab gets no handle back onto this page
    window.open("https://www.google.com/search?q=" + encodeURIComponent(query),
                "_blank", "noopener");
}

document.getElementById("google-search").addEventListener("click", submitGoogleSearch);
document.getElementById("google-query").addEventListener("keydown", function(e) {
    if (e.key === "Enter") submitGoogleSearch();
});


// ===== Purrr ================================================================
// A joke message box after Widget-04 in the icon pack. Both buttons agree with
// you, and both just dismiss it - there's no wrong answer to give.
[].forEach.call(document.querySelectorAll("#cat-window .cat-yes"), function(button) {
    button.addEventListener("click", function() {
        hidePopup("cat-window", null);
    });
});

// Opens on arrival alongside the converter. Its CSS puts it low and left of
// centre, so the two don't land on top of each other.
(function openCatOnEntrance() {
    var root = document.documentElement;

    function open() {
        if (document.readyState === "complete") showPopup("cat-window", null);
        else window.addEventListener("load", function() {
            showPopup("cat-window", null);
        }, { once: true });
    }

    if (!root.classList.contains("gated")) {
        open();
        return;
    }
    var observer = new MutationObserver(function() {
        if (root.classList.contains("gated")) return;
        observer.disconnect();
        open();
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
})();


// ===== Free ideas ===========================================================
// Everyone reads, only you write.
//
// The notes live in ideas.txt at the project root - a real, committable file.
// Two ways in, and which one you get depends on where the page is running:
//
//   Locally, with the converter up:  edits go to PUT /api/notes, which writes
//                                    the file. Editable.
//   Anywhere else (mocial.org):      the file is fetched as a plain static
//                                    asset. Read-only.
//
// The permission model isn't a flag - it's the fact that the only thing that
// can write ideas.txt is a server bound to 127.0.0.1. A visitor can't edit the
// notes because the writer isn't reachable from the internet. Nothing in this
// file is load-bearing for that; setting notepadEditable = true in a console
// on mocial.org would just produce saves that fail.
var NOTEPAD_SAVE_DEBOUNCE_MS = 600;
var notepadEditable = false;
var notepadSaveTimer = null;

function setNotepadStatus(message, isError) {
    var el = document.getElementById("notepad-status");
    if (!el) return;
    el.textContent = message || "";
    el.classList.toggle("is-error", !!isError);
}

function saveNotepad() {
    var field = document.getElementById("notepad-text");
    setNotepadStatus("Saving...");

    converterFetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: field.value })
    }).then(function() {
        setNotepadStatus("Saved to ideas.txt");
    }).catch(function(err) {
        // Loud on purpose. Silently dropping keystrokes is the one behaviour a
        // notepad must never have.
        setNotepadStatus("Not saved - " + err.message, true);
    });
}

function publishNotepad() {
    var button = document.getElementById("notepad-publish");

    // Any keystroke in the debounce window hasn't reached the file yet, and
    // publishing would commit the previous text. Flush first.
    clearTimeout(notepadSaveTimer);

    button.disabled = true;
    setNotepadStatus("Saving...");

    converterFetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: document.getElementById("notepad-text").value })
    }).then(function() {
        setNotepadStatus("Publishing...");
        return converterFetch("/api/publish", { method: "POST" });
    }).then(function(result) {
        setNotepadStatus(result.commit
            ? "Published " + result.commit + " - live in a minute"
            : "Already published - nothing new to send");
    }).catch(function(err) {
        setNotepadStatus(err.message, true);
    }).then(function() {
        button.disabled = false;
    });
}

(function setUpNotepad() {
    var field = document.getElementById("notepad-text");
    if (!field) return;

    document.getElementById("notepad-publish")
            .addEventListener("click", publishNotepad);

    field.addEventListener("input", function() {
        if (!notepadEditable) return;
        // Debounced: a PUT per keystroke would rewrite the file dozens of
        // times a second for no benefit.
        clearTimeout(notepadSaveTimer);
        setNotepadStatus("Typing...");
        notepadSaveTimer = setTimeout(saveNotepad, NOTEPAD_SAVE_DEBOUNCE_MS);
    });
})();

// Called each time the window opens, so notes edited elsewhere - or the file
// edited by hand - show up without a reload.
function loadNotepad() {
    var field = document.getElementById("notepad-text");

    var publish = document.getElementById("notepad-publish");

    function readOnly(text, why) {
        notepadEditable = false;
        field.value = text || "";
        field.readOnly = true;
        // Nothing to offer a reader: the converter is what publishes, and it
        // isn't there. Hidden rather than disabled - a greyed button invites
        // you to wonder what you'd have to do to earn it.
        publish.hidden = true;
        setNotepadStatus(why);
    }

    // Only try the writable path where a converter could plausibly be. On
    // mocial.org this would be a request to the VISITOR's own machine, which
    // is both pointless and slow.
    if (!window.IS_LOCAL) {
        return fetch("ideas.txt", { cache: "no-store" })
            .then(function(res) { return res.ok ? res.text() : ""; })
            .then(function(text) { readOnly(text, "Read-only"); })
            .catch(function() { readOnly("", "Read-only"); });
    }

    return converterFetch("/api/notes").then(function(data) {
        notepadEditable = true;
        field.value = data.text || "";
        field.readOnly = false;
        publish.hidden = false;
        setNotepadStatus(data.updated_at ? "Saved to ideas.txt" : "Empty - start typing");
    }).catch(function() {
        // Converter down. Show whatever was last published rather than a blank
        // window, but don't pretend it's editable - saves would fail.
        return fetch("ideas.txt", { cache: "no-store" })
            .then(function(res) { return res.ok ? res.text() : ""; })
            .then(function(text) {
                readOnly(text, "Read-only - converter isn't running");
            })
            .catch(function() {
                readOnly("", "Read-only - converter isn't running");
            });
    });
}
