// Entity icons
const goldMedalEntity = "&#x1F947;" // 🥇
const tombStoneEntity = "&#x1FAA6;"; // 🪦
const clipboardEntity = "&#x1F4CB;"; // 📋
const familyEntity = "&#x1F46A;"; // 👪
const personEntity = "&#x1F9CD;"; // 🧍
const hammerEntity = "&#x1F528;"; // 🔨
const bombEntity = "&#x1F4A3;"; // 💣

// System settings
const systemTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Demo mode
const demo = (typeof window !== 'undefined') && new URLSearchParams(window.location.search).has("demo");

// Season configuration
const season70start = 1741687200;
const knownFinishedSeasons = demo ? [83] : range(70, 69+(((Date.now() / 1000)-season70start)/1209600), 1);

// TimeStamp divisor
const timeStampDivisor = 1000;

// Raid configuration
const numBossesPerLap = 7;
const raidTokenTimer = 12*60*60;
const expectedTokensPerSeason = 26;

// Rank names
const ranksName = ["Stone1","Stone2","Stone3","Iron1","Iron2","Iron3","Bronze1","Bronze2","Bronze3","Silver1","Silver2","Silver3","Gold1","Gold2","Gold3","Diamond1","Diamond2","Diamond3","Adamantine1","Adamantine2","Adamantine3"];

// Progression/Star configuration
const progressionIndexStarName = {"s": "star small","S":"star","r":"red star small","R":"red star","w":"white star","W": "white star", "M":"mythic star"};
const progressionIndexNumStars = ["","s","ss","ss","sss","ssss","ssss","ssSss","r","r","rr","rrr","rRr","rrrr","rrRrr","w","W","WW","WWW","M"];
const progressionIndexStars = progressionIndexNumStars.map(stars => {
    return stars.split("").map(star => `<img class="${star.toLowerCase() == star ? "smallStar" : "bigStar"}" src="images/stars/${progressionIndexStarName[star]}.png">`).join("");
});
const progressionIndexStarsDiscord = progressionIndexNumStars.map(stars => {
    let len = stars.length;
    if (len==0) {
        return "";
    }
    return ` ${len>1 ? `${len}x ` : ""}${stars.toLowerCase()[0] == "w" ? ":11Stars:" : (stars[0] == "r" ? ":6Stars:" : ":1Star:")}`;
});
const progressionIndexRarityStarsText = ["C 0S","C 1S","C 2S","U 2S","U 3S","U 4S","R 4S","R 5S","R 1R","E 1R","E 2R","E 3R","L 3R","L 4R","L 5R","L 1W","M 1W","M 2W","M 3W","M MS"];

// Rarity configuration
const tierToRarityName = ["Common","Uncommon","Rare","Epic","Legendary"];

// Boss friendly names mapping
const bossFriendlyNames = {
    "AvatarOfKhaine": ["Avatar", "Aethana", "Eldryon"],
    "Belisarius": ["Belisarius Cawl", "Tan Gi'da", "Actus"],
    "BelisariusRW": ["Belisarius Cawl", "Tan Gi'da", "Actus"],
    "Ghazghkull": ["Ghazghkull", "Gibbascrapz", "Tanksmasha"],
    "HiveTyrantGorgon": ["Hive Tyrant", "Alpha", "Omega"],
    "HiveTyrantKronos": ["Hive Tyrant", "Alpha", "Omega"],
    "HiveTyrantLeviathan": ["Hive Tyrant", "Alpha", "Omega"],
    "Magnus": ["Magnus", "Thaumachus", "Abraxas"],
    "Mortarion": ["Mortarion", "Rotbone", "Corrodius"],
    "Riptide": ["Riptide", "Sho'syl", "Re'vas"],
    "RogalDorn": ["Rogal Dorn", "Sibyll", "Thaddeus"],
    "ScreamerKiller": ["Screamer-Killer", "Neurothrope", "Winged Prime"],
    "SilentKing": ["Szarekh", "Hapthatra", "Mesophet"],
    "TervigonGorgon": ["Tervigon", "Alpha", "Omega"],
    "TervigonKronos": ["Tervigon", "Alpha", "Omega"],
    "TervigonLeviathan": ["Tervigon", "Alpha", "Omega"]
};