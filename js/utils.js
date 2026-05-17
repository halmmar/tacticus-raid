// Utility functions

function range(start, stop, step) {
    return Array.from(
        { length: (stop - start) / step + 1 },
        (_, i) => start + i * step
    );
}

function hasRights(role) {
    const roleValue = {"MEMBER": 1, "OFFICER": 2, "CO_LEADER": 3, "LEADER": 4, "ADMIN": 5};
    return (roleValue[userGuildRole]||0) >= (roleValue[role]||0);
}

// Color utility functions
function getColorPercent(value) {
    //value from 0=red to 1=green
    const hue = (value * 120).toString(10);
    return ["hsl(", hue, ",100%,50%)"].join("");
}

function calculateGradientColor(colorRgb, percentage) {
    const whiteRgb = { r: 255, g: 255, b: 255 };
    const r = Math.round(whiteRgb.r + (colorRgb.r - whiteRgb.r) * percentage);
    const g = Math.round(whiteRgb.g + (colorRgb.g - whiteRgb.g) * percentage);
    const b = Math.round(whiteRgb.b + (colorRgb.b - whiteRgb.b) * percentage);
    return `rgb(${r},${g},${b})`;
}

function getColorIntensityPercent(percentage) {
    return calculateGradientColor({ r: 255, g: 0, b: 255 }, percentage);
}

// Time formatting functions
function secondsToDaysFixed(seconds, decimals) {
    let days = Math.floor(seconds/(24*3600));
    let remain = seconds - days*24*3600;
    return `${days}d ${Math.floor(remain/3600)}h`;
}

function secondsToHourFixed(seconds, decimals) {
    return (seconds/3600).toFixed(1);
}

function toDateStr(t) {
    return new Date(t).toLocaleString("en-US", {month: 'short', day: '2-digit', hour: '2-digit', hour12: false, minute: '2-digit', timeZone: systemTimeZone});
}

// Damage formatting functions
function damageToFixedMillion(damage) {
    return damage ? (damage/1e6).toFixed(2) + "M" : "&nbsp;";
}

function damageToFixedThousands(damage) {
    return damage ? (damage/1e3).toFixed(0) + "k" : "&nbsp;";
}

function damageToFixedWithTombstone(damage, entry) {
    var prefix = "";
    if (entry.damageDealt == entry.maxHp)  {
        prefix = goldMedalEntity;
    } else if (entry.remainingHp == 0) {
        prefix = tombStoneEntity;
    }
    return prefix + damageToFixedThousands(damage);
}

// Player utilities
function playerMoved(name, season) {
    return (movement[season]||[]).includes(name);
}

function memberCell(name, season) {
    let link = (name != userName && !hasRights("OFFICER")) ? name : `<div class="nameLink"><a class="nameLink" href="javascript:playerSelected='${name}';updateCurrentView('playerStats')">${name}</a></div>`;
    return `<td class="${(movement[season]||[]).includes(name) ? "midseasonMove " : ""}">${link}</td>`
}

function highlightRow(id) {
    return `<tr${highlightUser && id == userName ? ' class="loggedInPlayer"': ""}>`;
}

// UI utility functions
function showKeys() {
    var type = document.getElementById("show-keys").checked ? "text" : "password";
    document.getElementById("user-id").type = type;
    document.getElementById("api-key").type = type;
}

function setHighlightUser() {
    highlightUser = document.getElementById("highlight-user").checked;
    localStorage.setItem("highlight-user", highlightUser);
}

// Array utility
const uniqPlayer = function(a) {
    var seen = {};
    return a.filter(it => {
        id = it["userName"];
        return id in seen ? false : (seen[id] = true);
    });
};