// The sound toggle every arcade game draws, styled as a Win95 button: a
// bevelled grey face with the tray's pixel speaker on it, sound waves when
// it's on and a red X when it's muted. Added for mocial so the games' own
// round/modern icons match the desktop around them.
//
// Each game still owns its mute state, hit area and M key - this only draws.
// It paints onto the game's own canvas, so it's drawn from a 13x13 bitmap:
// at 1 unit per canvas pixel it stays crisp in the low-res pixel games, and
// the higher-res ones just pass a bigger size.
(function() {
    var COLORS = {
        W: "#ffffff",   // bevel highlight, speaker fill
        K: "#000000",   // bevel shadow, outlines
        D: "#808080",   // inner bevel shadow
        ".": "#c0c0c0", // button face
        R: "#ff0000"    // muted X
    };

    // Row 0 and column 0 are the highlight, the last two rows and columns
    // the shadow; rows and columns 1-10 are the face
    var ON = [
        "WWWWWWWWWWWWK",
        "W....K.....DK",
        "W...KK..K..DK",
        "W..KWK...K.DK",
        "WKKKWK.K..KDK",
        "WKWWWK..K.KDK",
        "WKWWWK..K.KDK",
        "WKKKWK.K..KDK",
        "W..KWK...K.DK",
        "W...KK..K..DK",
        "W....K.....DK",
        "WDDDDDDDDDDDK",
        "KKKKKKKKKKKKK"
    ];
    var MUTED = [
        "WWWWWWWWWWWWK",
        "W....K.....DK",
        "W...KK.....DK",
        "W..KWK.....DK",
        "WKKKWK.R..RDK",
        "WKWWWK..RR.DK",
        "WKWWWK..RR.DK",
        "WKKKWK.R..RDK",
        "W..KWK.....DK",
        "W...KK.....DK",
        "W....K.....DK",
        "WDDDDDDDDDDDK",
        "KKKKKKKKKKKKK"
    ];

    // ctx: the game's 2D context. x, y: top-left in that context's units.
    // size: the button's width and height in the same units.
    window.drawWin95Speaker = function(ctx, x, y, size, muted) {
        var rows = muted ? MUTED : ON;
        var n = rows.length;
        var u = size / n;
        ctx.save();
        ctx.globalAlpha = 1;
        for (var r = 0; r < n; r++) {
            // Edges are rounded per cell rather than per unit, so a size that
            // isn't a multiple of 13 still tiles with no seams between cells
            var y0 = Math.round(y + r * u), y1 = Math.round(y + (r + 1) * u);
            for (var c = 0; c < n; c++) {
                var x0 = Math.round(x + c * u), x1 = Math.round(x + (c + 1) * u);
                ctx.fillStyle = COLORS[rows[r][c]];
                ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
            }
        }
        ctx.restore();
    };
})();
