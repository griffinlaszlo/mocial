# GRIFF SKI CO.

The merch shop. A standalone site (its own HTML/CSS/JS, no dependency on
mocial's `main.js`/`main.css`) that mocial currently frames in a popup window
via the `shop` desktop icon — the same way the `dino` icon frames
`dinasour.html`. Because it's self-contained, this whole folder can be copied
onto its own domain later and linked directly from Instagram; nothing in it
assumes it's running inside mocial.

## What's here

| File | What's in it |
|---|---|
| `index.html` | Page structure — product view, cart drawer, checkout modal. |
| `style.css` | All styling. |
| `shop.js` | Colorways, sizes, cart (localStorage), checkout. |
| `build_colorways.py` | Regenerates `assets/tee-*.png` and the desktop-icon cutout from `../griffinchairlift.png`. |
| `assets/` | The six colorway prints, web-sized. |

## Things to edit before this goes live

All three sit in constants at the top of `shop.js`:

- `PRICE` — currently a placeholder ($32).
- `ORDER_EMAIL` — where "Send Order" sends orders. Currently your gmail.
- `RUN_SIZE` — currently 100, used in the product copy.

## Checkout is email-only for now

There's no payment processor wired up. "Send Order" builds a `mailto:` with
the order details pre-filled and hands it to the browser; there's a "copy
order details" fallback if `mailto:` gets blocked (some in-app browsers do
this). That's enough to actually run a 100-unit drop by hand, but it means
you're collecting payment separately (Venmo, Cash App, whatever) after the
order lands in your inbox.

The natural next step is Stripe Payment Links — no backend needed, just a
link generated from the Stripe dashboard, swapped in for the mailto. Worth
doing before this goes on Instagram; email-only checkout doesn't scale past
"I know everyone ordering."

## Colorways: why only jacket + helmet vary

`griffinchairlift.png` is flattened art, not layered by garment. Jacket
(`#1388b9`) and helmet (`#f0303d`) are the only two regions with a color
unique to that part, so `build_colorways.py` can isolate and hue-shift them
safely (it keys off hue + saturation, so it leaves the near-black line art,
which shares the same hue space but has almost no saturation, untouched).

Pants share their color with the outline itself, and goggles/gloves share
theirs with the beer bottle and chair highlights — recoloring those without
also recoloring unrelated parts of the drawing needs either new source art
that puts each garment on its own fill/layer, or hand-painted masks. Until
one of those exists, "pick your own pants color" isn't really possible from
this file.

To add a new preset colorway (rather than a new part), add an entry to
`PRESETS` in `build_colorways.py` and to `COLORWAYS` in `shop.js` (slug and
label have to match), then re-run:

```bash
python3 build_colorways.py
```

## Running it standalone

```bash
python3 -m http.server 8899
```

Then open `http://localhost:8899/index.html` from this folder. It doesn't
need mocial running to work.
