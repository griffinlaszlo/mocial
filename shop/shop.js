// GRIFF SKI CO. — standalone shop front-end. No backend, no payment
// processor wired up yet (see the checkout note in index.html) — this is the
// browsing/cart/order-intake half of the store, built first so it can run
// inside mocial and later get copied straight onto its own domain.

// ---- Things you'll actually want to edit -----------------------------
var PRICE = 32;                              // placeholder — set your real price
var ORDER_EMAIL = "laszlogriffin@gmail.com"; // where "Send Order" emails land
var RUN_SIZE = 100;                          // shirts in this run
// ------------------------------------------------------------------------

var SIZES = ["S", "M", "L", "XL", "XXL"];

// jacket hex drives both the swatch dot and the page's --accent color, so
// the "Add to Cart" button and price tint subtly with whatever's selected.
var COLORWAYS = [
    { slug: "og-blue",      label: "OG Blue",      accent: "#1388b9" },
    { slug: "blackout",     label: "Blackout",     accent: "#202020" },
    { slug: "powder-white", label: "Powder White", accent: "#8fb9cc" },
    { slug: "sunset",       label: "Sunset",       accent: "#ff7a3d" },
    { slug: "forest",       label: "Forest",       accent: "#2f6b3c" },
    { slug: "bruise",       label: "Bruise",       accent: "#6a3fb5" }
];

var CART_KEY = "griffco_cart_v1";

var state = {
    colorway: COLORWAYS[0],
    size: null,
    qty: 1
};

function loadCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
        return [];
    }
}
function saveCart(cart) {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {}
}
var cart = loadCart();

function money(n) {
    return "$" + n.toFixed(2).replace(/\.00$/, "");
}

// ---- Product panel -------------------------------------------------------
function renderColorwayRow() {
    var row = document.getElementById("colorway-row");
    row.innerHTML = "";
    COLORWAYS.forEach(function(cw) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "swatch-btn" + (cw.slug === state.colorway.slug ? " is-selected" : "");
        btn.style.background = cw.accent;
        btn.setAttribute("role", "radio");
        btn.setAttribute("aria-checked", cw.slug === state.colorway.slug ? "true" : "false");
        btn.title = cw.label;
        btn.addEventListener("click", function() {
            state.colorway = cw;
            applyColorway();
        });
        row.appendChild(btn);
    });
}

function applyColorway() {
    document.getElementById("design-img").src = "assets/tee-" + state.colorway.slug + ".png";
    document.getElementById("colorway-name").textContent = state.colorway.label;
    document.documentElement.style.setProperty("--accent", state.colorway.accent);
    renderColorwayRow();
}

function renderSizeRow() {
    var row = document.getElementById("size-row");
    row.innerHTML = "";
    SIZES.forEach(function(size) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "size-btn" + (size === state.size ? " is-selected" : "");
        btn.textContent = size;
        btn.setAttribute("role", "radio");
        btn.setAttribute("aria-checked", size === state.size ? "true" : "false");
        btn.addEventListener("click", function() {
            state.size = size;
            document.getElementById("size-warning").hidden = true;
            renderSizeRow();
        });
        row.appendChild(btn);
    });
}

document.getElementById("qty-minus").addEventListener("click", function() {
    state.qty = Math.max(1, state.qty - 1);
    document.getElementById("qty-value").textContent = state.qty;
});
document.getElementById("qty-plus").addEventListener("click", function() {
    state.qty = Math.min(10, state.qty + 1);
    document.getElementById("qty-value").textContent = state.qty;
});

document.getElementById("add-to-cart-btn").addEventListener("click", function() {
    if (!state.size) {
        document.getElementById("size-warning").hidden = false;
        return;
    }
    var existing = cart.find(function(line) {
        return line.colorway === state.colorway.slug && line.size === state.size;
    });
    if (existing) {
        existing.qty += state.qty;
    } else {
        cart.push({
            colorway: state.colorway.slug,
            colorwayLabel: state.colorway.label,
            size: state.size,
            qty: state.qty,
            price: PRICE
        });
    }
    saveCart(cart);
    renderCart();
    openCart();
});

document.getElementById("product-price").textContent = money(PRICE);

// ---- Cart drawer ----------------------------------------------------------
function cartCount() {
    return cart.reduce(function(sum, line) { return sum + line.qty; }, 0);
}
function cartSubtotal() {
    return cart.reduce(function(sum, line) { return sum + line.qty * line.price; }, 0);
}

function renderCart() {
    document.getElementById("cart-count").textContent = cartCount();

    var itemsEl = document.getElementById("cart-items");
    itemsEl.innerHTML = "";

    if (!cart.length) {
        itemsEl.innerHTML = '<div class="cart-empty">Your cart is empty.</div>';
    } else {
        cart.forEach(function(line, i) {
            var row = document.createElement("div");
            row.className = "cart-line";
            row.innerHTML =
                '<img src="assets/tee-' + line.colorway + '.png" alt="">' +
                '<div class="cart-line-info">' +
                    '<div class="cart-line-title">Chairlift Tee — ' + line.colorwayLabel + '</div>' +
                    '<div class="cart-line-meta">Size ' + line.size + ' &times; ' + line.qty + ' &middot; ' + money(line.price * line.qty) + '</div>' +
                    '<button type="button" class="cart-line-remove" data-index="' + i + '">Remove</button>' +
                '</div>';
            itemsEl.appendChild(row);
        });
        itemsEl.querySelectorAll(".cart-line-remove").forEach(function(btn) {
            btn.addEventListener("click", function() {
                cart.splice(Number(btn.dataset.index), 1);
                saveCart(cart);
                renderCart();
            });
        });
    }

    document.getElementById("cart-subtotal").textContent = money(cartSubtotal());
    document.getElementById("checkout-btn").disabled = cart.length === 0;
}

var drawer = document.getElementById("cart-drawer");
var overlay = document.getElementById("drawer-overlay");
function openCart() {
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    overlay.hidden = false;
}
function closeCart() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
}
document.getElementById("cart-button").addEventListener("click", openCart);
document.getElementById("cart-close").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

// ---- Checkout ---------------------------------------------------------
var checkoutOverlay = document.getElementById("checkout-overlay");
var formPane = document.getElementById("checkout-form-pane");
var donePane = document.getElementById("checkout-done-pane");

function orderSummaryText() {
    var lines = cart.map(function(line) {
        return "- " + line.qty + " x Chairlift Tee (" + line.colorwayLabel + ", size " + line.size + ") @ " + money(line.price) + " = " + money(line.price * line.qty);
    });
    return lines.join("\n") + "\n\nSubtotal: " + money(cartSubtotal());
}

function openCheckout() {
    document.getElementById("checkout-summary").textContent = orderSummaryText();
    formPane.hidden = false;
    donePane.hidden = true;
    checkoutOverlay.hidden = false;
    closeCart();
}
function closeCheckout() {
    checkoutOverlay.hidden = true;
}
document.getElementById("checkout-btn").addEventListener("click", openCheckout);
document.getElementById("checkout-close").addEventListener("click", closeCheckout);

document.getElementById("place-order-btn").addEventListener("click", function() {
    var name = document.getElementById("checkout-name").value.trim();
    var email = document.getElementById("checkout-email").value.trim();
    var address = document.getElementById("checkout-address").value.trim();
    if (!name || !email || !address) {
        alert("Fill in your name, email, and shipping address first.");
        return;
    }

    var body = "New Griff Ski Co. order\n\n" +
        "Name: " + name + "\n" +
        "Email: " + email + "\n" +
        "Shipping address:\n" + address + "\n\n" +
        "Order:\n" + orderSummaryText();

    window.lastOrderText = body;
    var mailto = "mailto:" + encodeURIComponent(ORDER_EMAIL) +
        "?subject=" + encodeURIComponent("Griff Ski Co. order — " + name) +
        "&body=" + encodeURIComponent(body);
    window.location.href = mailto;

    cart = [];
    saveCart(cart);
    renderCart();

    document.getElementById("order-email-address").textContent = ORDER_EMAIL;
    formPane.hidden = true;
    donePane.hidden = false;
});

document.getElementById("copy-order-btn").addEventListener("click", function() {
    var text = window.lastOrderText || "";
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
            alert("Copied. Paste it into an email to " + ORDER_EMAIL + ".");
        }).catch(function() {
            prompt("Copy this manually:", text);
        });
    } else {
        prompt("Copy this manually:", text);
    }
});
document.getElementById("checkout-done-btn").addEventListener("click", closeCheckout);

// ---- Init -------------------------------------------------------------
applyColorway();
renderSizeRow();
renderCart();
document.querySelector(".product-copy").textContent =
    "Screen-printed on a heavyweight white tee. Griff, one chairlift, one beer, going 100mph doing absolutely nothing. Limited edition — " + RUN_SIZE + " made, then it's gone.";
