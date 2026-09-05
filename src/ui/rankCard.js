const {
    createCanvas,
    loadImage,
} = require("@napi-rs/canvas");


/*
 * --------------------------------
 * Constants
 * --------------------------------
 */

const WIDTH = 1200;
const HEIGHT = 500;


/*
 * --------------------------------
 * Fonts
 * --------------------------------
 *
 * Keep the main card typography on
 * common fonts that are available on
 * Windows / Discord bot environments.
 *
 * This prevents unsupported-font
 * characters from becoming boxes.
 */

const FONT_FAMILY = "Arial";


/*
 * --------------------------------
 * Formatting
 * --------------------------------
 */

function formatBalance(balance) {

    return Number(balance)
        .toLocaleString("en-US");
}


/*
 * --------------------------------
 * Tier Visuals
 * --------------------------------
 */

const TIER_STYLES = {

    Common: {
        color: "#b8bcc4",
        secondary: "#777d88",

        emoji:
            "⚪",

        description:
            "A Fortune player.",
    },


    Rare: {
        color: "#62b5ff",
        secondary: "#3977b5",

        emoji:
            "✨",

        description:
            "A rising Fortune player.",
    },


    Unique: {
        color: "#69e6e6",
        secondary: "#328f9a",

        emoji:
            "💎",

        description:
            "A player of distinction.",
    },


    Legend: {
        color: "#d9a441",
        secondary: "#91691e",

        emoji:
            "🏆",

        description:
            "Among Fortune's legends.",
    },


    Mythic: {
        color: "#b77aff",
        secondary: "#6338a8",

        emoji:
            "🔮",

        description:
            "Among the elite.",
    },


    God: {
        color: "#ffd86b",
        secondary: "#a66f13",

        emoji:
            "👑",

        description:
            "A Fortune god.",
    },
};


/*
 * --------------------------------
 * Twemoji
 * --------------------------------
 */

const TWEMOJI_BASE_URL =
    "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72";


const emojiCache =
    new Map();


function emojiToCodePoints(emoji) {

    return Array.from(emoji)
        .map((character) =>
            character.codePointAt(0)
                .toString(16)
        )
        .join("-");
}


async function loadTwemoji(emoji) {

    if (!emoji) {
        return null;
    }


    const codePoints =
        emojiToCodePoints(
            emoji
        );


    if (
        emojiCache.has(
            codePoints
        )
    ) {

        return emojiCache.get(
            codePoints
        );
    }


    const promise =
        loadImage(
            `${TWEMOJI_BASE_URL}/${codePoints}.png`
        )
        .catch((error) => {

            console.error(
                `⚠️ Failed to load Twemoji "${emoji}":`,
                error.message
            );

            return null;
        });


    emojiCache.set(
        codePoints,
        promise
    );


    return promise;
}


/*
 * --------------------------------
 * Rounded Rectangle
 * --------------------------------
 */

function roundedRect(
    ctx,
    x,
    y,
    width,
    height,
    radius
) {

    const r =
        Math.min(
            radius,
            width / 2,
            height / 2
        );


    ctx.beginPath();


    ctx.moveTo(
        x + r,
        y
    );


    ctx.arcTo(
        x + width,
        y,
        x + width,
        y + height,
        r
    );


    ctx.arcTo(
        x + width,
        y + height,
        x,
        y + height,
        r
    );


    ctx.arcTo(
        x,
        y + height,
        x,
        y,
        r
    );


    ctx.arcTo(
        x,
        y,
        x + width,
        y,
        r
    );


    ctx.closePath();
}


function drawRoundedRect(
    ctx,
    x,
    y,
    width,
    height,
    radius,
    fillStyle,
    strokeStyle = null,
    lineWidth = 1
) {

    roundedRect(
        ctx,
        x,
        y,
        width,
        height,
        radius
    );


    if (fillStyle) {

        ctx.fillStyle =
            fillStyle;

        ctx.fill();
    }


    if (strokeStyle) {

        ctx.strokeStyle =
            strokeStyle;

        ctx.lineWidth =
            lineWidth;

        ctx.stroke();
    }
}


/*
 * --------------------------------
 * Background
 * --------------------------------
 */

function drawBackground(ctx) {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            WIDTH,
            HEIGHT
        );


    gradient.addColorStop(
        0,
        "#080712"
    );


    gradient.addColorStop(
        0.45,
        "#17102d"
    );


    gradient.addColorStop(
        1,
        "#080812"
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    /*
     * Left atmospheric glow.
     */

    const glow =
        ctx.createRadialGradient(
            260,
            250,
            30,
            260,
            250,
            430
        );


    glow.addColorStop(
        0,
        "rgba(147, 74, 255, 0.28)"
    );


    glow.addColorStop(
        0.5,
        "rgba(92, 44, 170, 0.10)"
    );


    glow.addColorStop(
        1,
        "rgba(0, 0, 0, 0)"
    );


    ctx.fillStyle =
        glow;


    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    /*
     * Right atmospheric glow.
     */

    const rightGlow =
        ctx.createRadialGradient(
            1000,
            180,
            20,
            1000,
            180,
            420
        );


    rightGlow.addColorStop(
        0,
        "rgba(91, 56, 180, 0.20)"
    );


    rightGlow.addColorStop(
        1,
        "rgba(0, 0, 0, 0)"
    );


    ctx.fillStyle =
        rightGlow;


    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    /*
     * Subtle diagonal lines.
     */

    ctx.save();


    ctx.globalAlpha =
        0.055;


    ctx.strokeStyle =
        "#ffffff";


    ctx.lineWidth =
        1;


    for (
        let x = -HEIGHT;
        x < WIDTH + HEIGHT;
        x += 55
    ) {

        ctx.beginPath();


        ctx.moveTo(
            x,
            0
        );


        ctx.lineTo(
            x + HEIGHT,
            HEIGHT
        );


        ctx.stroke();
    }


    ctx.restore();
}


/*
 * --------------------------------
 * Decorative Stars
 * --------------------------------
 */

function drawStars(ctx) {

    const stars = [

        [735, 65, 3],
        [820, 100, 2],
        [900, 55, 2],
        [1035, 115, 3],
        [1100, 75, 2],

        [750, 400, 2],
        [950, 420, 3],
        [1080, 365, 2],
        [690, 145, 2],

    ];


    ctx.save();


    for (
        const [x, y, size]
        of stars
    ) {

        ctx.fillStyle =
            "rgba(220, 190, 255, 0.65)";


        ctx.beginPath();


        ctx.arc(
            x,
            y,
            size,
            0,
            Math.PI * 2
        );


        ctx.fill();
    }


    ctx.restore();
}


/*
 * --------------------------------
 * Safe Display Name
 * --------------------------------
 *
 * Prevent extremely long Discord
 * names from colliding with the
 * top-right tier badge.
 */

function fitDisplayName(
    ctx,
    name,
    maxWidth
) {

    let result =
        String(name || "Fortune Player");


    while (
        result.length > 1 &&
        ctx.measureText(result).width > maxWidth
    ) {

        result =
            result.slice(
                0,
                -1
            );
    }


    if (
        result !== name
    ) {

        result =
            result.slice(
                0,
                Math.max(
                    1,
                    result.length - 1
                )
            ) + "…";
    }


    return result;
}


/*
 * --------------------------------
 * Avatar
 * --------------------------------
 */

async function drawAvatar(
    ctx,
    user,
    tierStyle
) {

    const avatarUrl =
        user.displayAvatarURL({
            extension: "png",
            size: 512,
        });


    const avatar =
        await loadImage(
            avatarUrl
        );


    const centerX =
        185;


    const centerY =
        250;


    const radius =
        125;


    /*
     * Outer tier glow.
     */

    ctx.save();


    ctx.shadowColor =
        tierStyle.color;


    ctx.shadowBlur =
        30;


    ctx.beginPath();


    ctx.arc(
        centerX,
        centerY,
        radius + 5,
        0,
        Math.PI * 2
    );


    ctx.strokeStyle =
        tierStyle.color;


    ctx.lineWidth =
        5;


    ctx.stroke();


    ctx.restore();


    /*
     * Avatar clipping.
     */

    ctx.save();


    ctx.beginPath();


    ctx.arc(
        centerX,
        centerY,
        radius,
        0,
        Math.PI * 2
    );


    ctx.clip();


    ctx.drawImage(
        avatar,
        centerX - radius,
        centerY - radius,
        radius * 2,
        radius * 2
    );


    ctx.restore();


    /*
     * Avatar border.
     */

    ctx.beginPath();


    ctx.arc(
        centerX,
        centerY,
        radius,
        0,
        Math.PI * 2
    );


    ctx.strokeStyle =
        "#e0c5ff";


    ctx.lineWidth =
        3;


    ctx.stroke();
}


/*
 * --------------------------------
 * Draw Emoji Image
 * --------------------------------
 */

async function drawEmoji(
    ctx,
    emoji,
    x,
    y,
    size,
    fallbackColor
) {

    const image =
        await loadTwemoji(
            emoji
        );


    if (image) {

        ctx.drawImage(
            image,
            x,
            y,
            size,
            size
        );

        return true;
    }


    /*
     * Safe geometric fallback.
     */

    ctx.save();


    ctx.fillStyle =
        fallbackColor;


    ctx.beginPath();


    ctx.arc(
        x + size / 2,
        y + size / 2,
        size * 0.32,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.restore();


    return false;
}


/*
 * --------------------------------
 * Rank Card
 * --------------------------------
 */

async function createRankCard({
    user,
    rank,
    balance,
    tier,
}) {

    const canvas =
        createCanvas(
            WIDTH,
            HEIGHT
        );


    const ctx =
        canvas.getContext("2d");


    const tierStyle =
        TIER_STYLES[tier] ||
        TIER_STYLES.Common;


    /*
     * --------------------------------
     * Background
     * --------------------------------
     */

    drawBackground(
        ctx
    );


    drawStars(
        ctx
    );


    /*
     * --------------------------------
     * Outer Border
     * --------------------------------
     */

    drawRoundedRect(
        ctx,
        12,
        12,
        WIDTH - 24,
        HEIGHT - 24,
        28,
        null,
        tierStyle.color,
        2
    );


    /*
     * --------------------------------
     * Avatar
     * --------------------------------
     */

    await drawAvatar(
        ctx,
        user,
        tierStyle
    );


    /*
     * --------------------------------
     * Display Name
     * --------------------------------
     */

    const rawDisplayName =
        user.displayName ||
        user.username ||
        "A Fortune Player";


    ctx.font =
        `700 55px ${FONT_FAMILY}`;


    const displayName =
        fitDisplayName(
            ctx,
            rawDisplayName,
            570
        );


    ctx.fillStyle =
        "#ffffff";


    ctx.textAlign =
        "left";


    ctx.fillText(
        displayName,
        360,
        105
    );


    /*
     * --------------------------------
     * User Bio
     * --------------------------------
     */

    ctx.fillStyle =
        "#c9bfd8";


    ctx.font =
        `italic 28px ${FONT_FAMILY}`;


    ctx.fillText(
        "A Fortune player",
        365,
        140
    );


    /*
     * --------------------------------
     * Divider
     * --------------------------------
     */

    ctx.strokeStyle =
        tierStyle.color;


    ctx.globalAlpha =
        0.7;


    ctx.lineWidth =
        2;


    ctx.beginPath();


    ctx.moveTo(
        360,
        164
    );


    ctx.lineTo(
        1080,
        164
    );


    ctx.stroke();


    ctx.globalAlpha =
        1;


    /*
     * --------------------------------
     * Rank Label
     * --------------------------------
     */

    ctx.fillStyle =
        "#a995c7";


    ctx.font =
        `600 30px ${FONT_FAMILY}`;


    ctx.fillText(
        "RANK",
        365,
        205
    );


    /*
     * Rank Number
     */

    ctx.fillStyle =
        "#ffffff";


    ctx.font =
        `800 50px ${FONT_FAMILY}`;


    ctx.fillText(
        `#${rank}`,
        365,
        258
    );


    /*
     * --------------------------------
     * Balance Label
     * --------------------------------
     */

    ctx.fillStyle =
        "#a995c7";


    ctx.font =
        `600 30px ${FONT_FAMILY}`;


    ctx.fillText(
        "BALANCE",
        570,
        205
    );


    /*
     * --------------------------------
     * Balance + Currency
     * --------------------------------
     *
     * Ethers remains directly beside
     * the rendered balance number.
     */

    const formattedBalance =
        formatBalance(
            balance
        );


    ctx.fillStyle =
        "#ffffff";


    ctx.font =
        `800 45px ${FONT_FAMILY}`;


    const balanceX =
        570;


    const balanceY =
        258;


    ctx.fillText(
        formattedBalance,
        balanceX,
        balanceY
    );


    /*
     * Put "Ethers" immediately after
     * the balance number.
     */

    const balanceWidth =
        ctx.measureText(
            formattedBalance
        ).width;


    ctx.fillStyle =
        tierStyle.color;


    ctx.font =
        `600 35px ${FONT_FAMILY}`;


    ctx.fillText(
        "Ethers",
        balanceX + balanceWidth + 14,
        balanceY
    );


    /*
     * --------------------------------
     * Level Panel
     * --------------------------------
     */

    drawRoundedRect(
        ctx,
        350,
        325,
        730,
        105,
        18,
        "rgba(8, 7, 18, 0.68)",
        "rgba(255,255,255,0.12)",
        1
    );


    /*
     * LEVEL label.
     */

    ctx.fillStyle =
        "#a995c7";


    ctx.font =
        `600 25px ${FONT_FAMILY}`;


    ctx.fillText(
        "LEVEL",
        375,
        355
    );


    /*
     * --------------------------------
     * Tier Emoji
     * --------------------------------
     */

    await drawEmoji(
        ctx,
        tierStyle.emoji,
        375,
        370,
        38,
        tierStyle.color
    );


    /*
     * --------------------------------
     * Tier Name
     * --------------------------------
     */

    ctx.fillStyle =
        "#ffffff";


    ctx.font =
        `800 35px ${FONT_FAMILY}`;


    ctx.fillText(
        tier,
        425,
        400
    );


    /*
     * --------------------------------
     * Tier Description
     * --------------------------------
     */

    ctx.fillStyle =
        "#aaa1b8";


    ctx.font =
        `20px ${FONT_FAMILY}`;


    ctx.fillText(
        tierStyle.description,
        425,
        422
    );


    /*
     * --------------------------------
     * Top-right Tier Badge
     * --------------------------------
     */

    drawRoundedRect(
        ctx,
        1000,
        42,
        120,
        70,
        18,
        "rgba(20, 13, 40, 0.9)",
        tierStyle.color,
        2
    );


    /*
     * Actual Twemoji PNG.
     */

    await drawEmoji(
        ctx,
        tierStyle.emoji,
        1040,
        55,
        44,
        tierStyle.color
    );


    /*
     * --------------------------------
     * Footer
     * --------------------------------
     */

    ctx.fillStyle =
        "#796c8b";


    ctx.font =
        `600 20px ${FONT_FAMILY}`;


    ctx.textAlign =
        "center";


    ctx.fillText(
        "VAULT • RANK CARD",
        WIDTH / 2,
        468
    );


    ctx.textAlign =
        "left";


    /*
     * --------------------------------
     * PNG
     * --------------------------------
     */

    return canvas.encode(
        "png"
    );
}


module.exports = {
    createRankCard,
};