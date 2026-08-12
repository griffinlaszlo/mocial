
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

// Restore the home icon's dragged position, but only when the reload was
// triggered by clicking the home icon itself (not a normal browser refresh)
(function() {
    var restoreIntent = localStorage.getItem("homeIconRestoreOnLoad");
    localStorage.removeItem("homeIconRestoreOnLoad");
    if (restoreIntent) {
        var saved = localStorage.getItem("homeIconPos");
        if (saved) {
            try {
                var pos = JSON.parse(saved);
                var el = document.getElementById("computer-icon-group");
                if (el && pos.top && pos.left) {
                    el.style.top = pos.top;
                    el.style.left = pos.left;
                }
            } catch (e) {}
        }
    }
})();

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
var windowIcons = {
    // Files
    "snapmap-wrapper":          "fileicon.png",
    "postmodern-wrapper":       "fileicon.png",
    "under-ghost-wrapper":      "fileicon.png",
    "canary-yellow-wrapper":    "fileicon.png",
    "patent-figures-window":    "fileicon.png",
    "s13688-window":            "fileicon.png",
    "ambient-streaming-window": "fileicon.png",
    // Folders
    "random-window":            "folder-icon.png",
    "files-window":             "cd1.png",
    "folder-contents-window":   "folder-icon.png",
    "settings-window":          "settings-icon.png"
};

$(document).ready(function() {
    Object.keys(windowIcons).forEach(function(windowId) {
        var win = document.getElementById(windowId);
        if (!win) return;
        var title = win.querySelector(".window-title");
        if (!title || title.querySelector(".window-title-icon")) return;

        var img = document.createElement("img");
        img.src = windowIcons[windowId];
        img.className = "window-title-icon";
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
function syncOpenWindowClass() {
    var anyOpen = [].some.call(document.querySelectorAll(".popup-window"), function(el) {
        return window.getComputedStyle(el).display !== "none";
    });
    document.body.classList.toggle("has-open-window", anyOpen);
}
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

// Initialize the draggable function
makeElementDraggable("computer-icon-group", function() {
    var el = document.getElementById("computer-icon-group");
    if (el.style.top && el.style.left) {
        localStorage.setItem("homeIconPos", JSON.stringify({
            top: el.style.top,
            left: el.style.left
        }));
        localStorage.setItem("homeIconRestoreOnLoad", "1");
    }
    window.location.reload();
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
makeElementDraggable("college-icon-group");
makeElementDraggable("google-icon-group", function() {
    window.location.href = "https://google.com";
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
    window.location.href = "dinasour.html";
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

// Settings: stack layout
var stackOrder = [
    "settings-icon-group", "computer-icon-group", "folder-icon-group",
    "google-icon-group", "dancing-icon-group", "moon-icon-group",
    "dino-icon-group", "college-icon-group", "files-icon-group"
];
var stackRightOffsets = {
    "settings-icon-group": 10, "computer-icon-group": 10, "folder-icon-group": 10,
    "google-icon-group": 8, "dancing-icon-group": 10, "moon-icon-group": 10,
    "dino-icon-group": 10, "college-icon-group": 10, "files-icon-group": 10
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
