var getJSON = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
    var status = xhr.status;
    if (status === 200) {
      callback(null, xhr.response);
    } else {
      callback(status, xhr.response);
    }
    };
    xhr.send();
};

const goldMedalEntity = "&#x1F947;" // 🥇
const tombStoneEntity = "&#x1FAA6;"; // 🪦
const clipboardEntity = "&#x1F4CB;"; // 📋
const familyEntity = "&#x1F46A;"; // 👪
const personEntity = "&#x1F9CD;"; // 🧍
const hammerEntity = "&#x1F528;"; // 🔨
const bombEntity = "&#x1F4A3;"; // 💣

const systemTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const demo = (typeof window !== 'undefined') && new URLSearchParams(window.location.search).has("demo");

const season70start = 1741687200;
const knownFinishedSeasons = demo ? [83] : range(70, 69+(((Date.now() / 1000)-season70start)/1209600), 1);

const numBossesPerLap = 6;
const raidTokenTimer = 12*60*60;

const expectedTokensPerSeason = 26; // Could be allowed to be 27...

activityFilterBombs = true;
highlightUser = undefined;
userName = undefined;
userGuildRole = undefined;
currentTeam = "admecDominus,admecManipulus,admecMarshall,admecRuststalker,tauMarksman,ultraDreadnought";
guildsData = {};
unitNames = {};
currentGuild = '';
currentMode = 'playerStats';
currentSeason = 0;
playerSelected = '';
movement = {};
allSeenSeasons = {};
playerUnits = {};
discordNames = {};
summaryDamage = {};
bossSortMode = undefined;
bossVsMode = 'Top';
weightedSortMode = "final";
bossTeamMode = "player";
playerTokens = {};
statusSortMode = 'bomb';
inventory = undefined;
upgradeSelected = undefined;
playerUnitsSortMode = undefined;
selectedPlayerUnits = undefined;
selectedGW = undefined;
initialized = false;

allGuildNamesInOrder = [];

const ranksName = ["Stone1","Stone2","Stone3","Iron1","Iron2","Iron3","Bronze1","Bronze2","Bronze3","Silver1","Silver2","Silver3","Gold1","Gold2","Gold3","Diamond1","Diamond2","Diamond3","Adamantine1","Adamantine2","Adamantine3"];
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

tierToRarityName = ["Common","Uncommon","Rare","Epic","Legendary"];

var bossFriendlyNames = {
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

function hasRights(role) {
    const roleValue = {"MEMBER": 1, "OFFICER": 2, "CO_LEADER": 3, "LEADER": 4, "ADMIN": 5};
    return (roleValue[userGuildRole]||0) >= (roleValue[role]||0);
}

var bossFriendlyName = function(name, encounterIndex) {
    return (bossFriendlyNames[name] || [name, name + " left prime", name + " right prime"])[encounterIndex];
};

function ranksImage(rank, id) {
    return `<img class="unitThumbnail" src="images/ranks/${unitNames.mows.includes(id) ? "mow" : ranksName[rank].toLowerCase()}.png" />`
}

function playerMoved(name, season) {
    return (movement[season]||[]).includes(name);
}

function memberCell(name, season) {
    let link = (name != userName && !hasRights("OFFICER")) ? name : `<div class="nameLink"><a class="nameLink" href="javascript:playerSelected='${name}';updateCurrentView('playerStats')">${name}</a></div>`;
    return `<td class="${(movement[season]||[]).includes(name) ? "midseasonMove " : ""}">${link}</td>`
}

function getColorPercent(value) {
    //value from 0=red to 1=green
    var hue = (value * 120).toString(10);
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

function range(start, stop, step) {
	return Array.from(
		{ length: (stop - start) / step + 1 },
		(_, i) => start + i * step
	);
}

var fetchJSON = function(url) {
  return fetch(url, {
        method: "GET",
        headers: {"X-USER-ID": localStorage.getItem("user-id"), "X-API-KEY": localStorage.getItem("api-key")}}).then(response => {
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      };
      return response.json();
  });
};

var createSeason = function(i) {
    var id = `seasonSelectSeason${i}`;
    if (i && !document.getElementById(id)) {
        seasonSelect.innerHTML += `<option id="${id}" value="${i}">Season ${i}</option>`
    }
    allSeenSeasons[i] = i;
};

var notifyGuildData = function(guild) {
    var seasons = guild["guild"]["guildRaidSeasons"].slice(0,-1);
    seasonSelect = document.getElementById("seasonSelect");
    seasons.forEach(createSeason);
    return guild;
};

function notifyCurrentSeason(raidData) {
    var seasonNumber = raidData.season;
    range(70, seasonNumber-1, 1).forEach(createSeason);
    return raidData;
}

var initialize = async function() {
    if (demo) {
        playerSelected = userName = "Rilak";
        userGuildRole = "OFFICER";
        highlightUser = true;
        document.getElementById("guildSelect").value = "Demo";
        currentSeason = 83;
    } else {
        if (localStorage.getItem("user-id") == undefined || localStorage.getItem("api-key") == undefined || localStorage.getItem("user-name")==undefined) {
            currentMode = 'login';
            updateCurrentView();
            return;
        }
        playerSelected = userName = localStorage.getItem("user-name");
        userGuildRole = localStorage.getItem("user-guild-role");
        highlightUser = localStorage.getItem("highlight-user");
        if (highlightUser == undefined) {
            highlightUser = true;
        } else {
            highlightUser = JSON.parse(highlightUser);
        }
        document.getElementById("guildSelect").value = localStorage.getItem("guildSelect") || "";
        currentSeason = +localStorage.getItem("seasonSelect") || 0;
    }

    document.getElementById("view-menu").innerHTML = document.getElementById("view-menu-container").innerHTML;

    switch (userGuildRole) {
        case "ADMIN":
        case "LEADER":
        case "CO_LEADER":
        case "OFFICER": {
            break;
        }
        default: {
            ["menu-roster","menu-activity","menu-simulation","menu-characters"].forEach(id => document.getElementById(id).remove());
        }
    }

    console.log(knownFinishedSeasons);
    range(demo ? 83 : 70, currentSeason, 1).reverse().forEach(createSeason);
    knownFinishedSeasons.reverse().forEach(createSeason);
    
    document.getElementById("seasonSelect").value = currentSeason;

    config = fetchJSON(demo ? "demo/config.json" : "config.json");

    unitNames = fetchJSON("unitnames.json");
    playerUnits = fetchJSON(demo ? "demo/playerunits.json" : "proxy.py?url=units");
    summaryDamage = fetchJSON(demo ? "demo/summary.json" : "proxy.py?url=summary");

    config = await config;
    movement = config.movement;
    discordNames = config.discordNames;
    allGuildNamesInOrder = config.guildsList.filter(guild => !(guild[0].includes(","))).map(guild => guild[0]);
    document.getElementById("guildSelect").innerHTML = config.guildsList.map(guild => `<option value="${guild[0]}">${guild[1]}</option>`).join("\n");

    updateGuild();

    await fetchSelectedSeason(currentGuild, currentSeason);

    initialized = true;

    updateCurrentView();
};

function fixMythicTier(raid) {
    raid.entries = raid.entries.map(entry => {
        if (entry.rarity == "Mythic" || (entry.rarity == "Legendary" && (entry.maxHp > 20e6 || (entry.encounterIndex>0 && entry.maxHp > 1.9e6)))) {
            entry.rarity = "Mythic";
            entry.tier -= 1;
            entry.set += 5;
        }
        if (raid.season>=84 && entry.tier>4) {
            entry.tier = Math.ceil((entry.tier-4)/2)+4;

        }
        return entry;
    });
    return raid;
};

async function fetchSelectedSeason(guilds, seasonNumber) {
    guilds.split(",").forEach(name => {
        var guild = guildsData[name];

        if (seasonNumber == 0) {
            guild[seasonNumber] = guild[seasonNumber] || fetchJSON(`proxy.py?url=/api/v1/guildRaid&guild=${name}`).then(fixMythicTier).then(notifyCurrentSeason);
        } else {
            guild[seasonNumber] = guild[seasonNumber] || fetchJSON(demo ? `demo/${seasonNumber}.json` : `proxy.py?url=/api/v1/guildRaid/${seasonNumber}&guild=${name}`).then(fixMythicTier);
        };
    });
};

function updateGuild() {
    currentGuild = document.getElementById("guildSelect").value;

    if (currentGuild != "") {
        localStorage.setItem("guildSelect", currentGuild);
    }

    currentGuild.split(",").forEach(guild => {
        if (!guildsData[guild]) {
            guildsData[guild] = {
                "guild": demo ? fetchJSON("demo/guild.json") : fetchJSON(`proxy.py?url=/api/v1/guild&guild=${guild}`).then(notifyGuildData)
            };
        }    
    });
};

async function updateSeason() {
    currentSeason =  +document.getElementById("seasonSelect").value;
    localStorage.setItem("seasonSelect", currentSeason);
    await fetchSelectedSeason(currentGuild, currentSeason);
};

function findLastBossEntry(entries, encounterIndex) {
    var lastBossEntry = entries.findLast(entry => entry.encounterIndex==encounterIndex) || {"type": "???", "maxHp": 1, "remainingHp": 1, "tier": 0};
    if (lastBossEntry.remainingHp == 0) {
        lastBossEntry = Object.assign({}, lastBossEntry);
        lastBossEntry.tier = lastBossEntry.tier + (lastBossEntry.set >= (numBossesPerLap-1));
        lastBossEntry.set = lastBossEntry.set >= (numBossesPerLap-1) ? 0 : lastBossEntry.set + 1;
        let previousBoss = entries.findLast(entry => entry["encounterIndex"]==encounterIndex && entry.tier>=(numBossesPerLap-1) && entry.set == lastBossEntry.set);
        if (previousBoss) {
            lastBossEntry = {"type": previousBoss.type, "maxHp": previousBoss.maxHp, "remainingHp": previousBoss.maxHp, "tier": lastBossEntry.tier, "set": lastBossEntry.set, "encounterIndex": encounterIndex};
        } else {
            let previousBoss = entries.findLast(entry => entry["encounterIndex"]==0 && entry.tier>=4 && entry.set == lastBossEntry.set) || {"type": "???", "maxHp": 1, "remainingHp": 1, "tier": 0};
            if (previousBoss) {
                lastBossEntry = {"type": previousBoss.type, "maxHp": 1, "remainingHp": 1, "tier": lastBossEntry.tier, "set": lastBossEntry.set, "encounterIndex": encounterIndex};
            } else {
                lastBossEntry = {"type": "???", "maxHp": 1, "remainingHp": 1, "tier": lastBossEntry.tier, "set": lastBossEntry.set, "encounterIndex": encounterIndex};
            }
        }
    }
    return lastBossEntry;
}

function findLastSideBossEntry(lastBossEntry, entries, encounterIndex) {
    var lastSideBossEntryAnyTier = entries.findLast(entry => entry.encounterIndex==encounterIndex && entry.set == lastBossEntry.set)||{maxHp: 1};
    return entries.findLast(entry => entry.encounterIndex==encounterIndex && entry.tier==lastBossEntry.tier && entry.set == lastBossEntry.set) || {"type": lastBossEntry.type, "maxHp": lastSideBossEntryAnyTier.maxHp, "remainingHp": lastSideBossEntryAnyTier.maxHp, "tier": lastBossEntry.tier, "set": lastBossEntry.set, "encounterIndex": encounterIndex};
}

function lastHitCurrentBoss(currentRaid, bombsAvailable, minBombDamage, maxBombDamage, discordBombsAvailable) {
    lastBossEntry = findLastBossEntry(currentRaid.entries, 0);
    var lap = lastBossEntry.tier > 4 ? `#${lastBossEntry.tier-3}` : "";

    var lastSideBoss1Entry = findLastSideBossEntry(lastBossEntry, currentRaid.entries, 1);
    var lastSideBoss2Entry = findLastSideBossEntry(lastBossEntry, currentRaid.entries, 2);

    var res = [lastSideBoss1Entry, lastSideBoss2Entry, lastBossEntry].map(entry => {
        let maxHp = entry["maxHp"];
        let remainingHp = entry["remainingHp"];
        let percent = Math.floor(100 * entry["remainingHp"] / entry["maxHp"]);

        let maxBombs = Math.ceil(remainingHp / minBombDamage);
        let minBombs = Math.ceil(remainingHp / maxBombDamage);

        let name = bossFriendlyName(entry.type,entry.encounterIndex);

        let bombText = "";

        if (remainingHp && name != "Corrodius" && bombsAvailable >= minBombs) {
            bombText = `<a href="javascript:navigator.clipboard.writeText('${minBombs==maxBombs ? minBombs : `${minBombs}-${maxBombs}`} ${bombEntity} needed on ${name.replace("'","\\'")} ${discordBombsAvailable.join(" ")}');">${bombEntity}</a>`
        }

        let rarity = tierToRarityName[lastBossEntry.tier > 4 ? 4: lastBossEntry.tier];
        let set = lastBossEntry["set"]+1;
        if (rarity == "Legendary" && lastBossEntry.set > 4) {
            rarity = "Mythic";
            set -= 5;
        }
    
        let innerHTML = `${name} ${rarity[0]}${set}${lap} ${remainingHp ? `${damageToFixedMillion(remainingHp)}/${damageToFixedMillion(maxHp)}` : tombStoneEntity}${bombText}`;
        let style = `background: linear-gradient(to right, rgba(255,0,0,1) 0%, rgba(255,0,0,0.2) ${percent}%, rgba(255,0,0,0) ${percent}%);`;
        return `<tr class="current-boss-status"><td style="${style}" colspan="9">${innerHTML}</td></tr>`;
    });
    return res.join("\n");
}

var updateCurrentView = async function(newMode) {
    if (!initialized) {
        document.getElementById("current-view").innerHTML = `Loading...`;
        return;
    }
    if (!demo && (localStorage.getItem("user-id") == undefined || localStorage.getItem("api-key") == undefined || localStorage.getItem("user-name") == undefined)) {
        newMode = "login";
    }

    if (userName) {
        document.getElementById("menu-home").innerHTML = userName;
        document.getElementById("login-link").innerHTML = `Settings`;
    }

    if (newMode) {
        currentMode = newMode;
    }

    var waitingForAllSeasons;
    var waitingForData;

    switch (currentMode) {
        case "login": {
            document.getElementById("current-view").innerHTML = document.getElementById("view-login").innerHTML;
            let user_id = localStorage.getItem("user-id");
            let api_key = localStorage.getItem("api-key");
            document.getElementById("user-id").value = user_id || "";
            document.getElementById("api-key").value = api_key || "";
            if (userName) {
                document.getElementById("api-response").innerHTML = `Your own stats: <a href="javascript:playerSelected='${userName}';updateCurrentView('playerStats')">${userName}</a>${!hasRights("OFFICER") ? "" : `<form id="remove-rights" onsubmit="removeOfficerRights(event);"><input type="submit" value="Remove officer rights until next login"></input></form>`}`;
            }
            document.getElementById("highlight-user").checked = highlightUser;
            return;   
        }
        case "inventory":
            if (inventory == undefined) {
                inventory = await fetchJSON(demo ? "demo/inventory.json" : `proxy.py?url=inventory`);
            }
            guildsData[currentGuild].guild = await guildsData[currentGuild].guild;
            viewInventory(inventory);
            return;
        case "activity":
        case "current-status":
        case "playerStats":
        case "characters": {
            let seasons = [...new Set(Object.keys(allSeenSeasons).sort().concat(demo ? [] : 0).map(season => currentGuild.split(",").map(guild => {fetchSelectedSeason(guild, season); return season;})).flat())].map(i=>+i);
            console.log(seasons);
            let guilds = currentGuild.split(",");
            waitingForAllSeasons = await Promise.all(guilds.map(async guild => {
                return await Promise.all(seasons.map(async season => {
                    return guildsData[guild][season] = await guildsData[guild][season];
                }))}));
            waitingForAllSeasons = waitingForAllSeasons.flat().flat();
            break;
        }
    }

    waitingForData = await Promise.all(currentGuild.split(",").map(guild => {
        return Promise.all([guildsData[guild][currentSeason], guildsData[guild].guild]);
    }));

    var [currentRaid, guildData] = waitingForData.reduce(([raid1, guild1],[raid2, guild2]) => {
        raid = Object.assign({}, raid1);
        guild = {};
        guild.guild = Object.assign({}, guild1.guild);
        raid.entries = raid.entries.concat(raid2.entries);
        guild.guild.members = guild.guild.members.concat(guild2.guild.members);
        guild.guild.name += " + " + guild2.guild.name;
        return [raid, guild];
    });
    movement = await movement;

    if (currentRaid.entries.length == 0 && currentRaid.length == undefined) {
        document.getElementById("current-view").innerHTML = "Season did not start yet";
        return;
    }

    switch (currentMode) {
        case "gw-list":
            gwsData = await fetchJSON(demo ? "demo/guildwars.json" : "guildwars.json");
            viewGWs(gwsData);
            break;
        case "gw":
            gwData = await fetchJSON(`proxy.py?url=gw&gw=${selectedGW}`);
            viewGW(gwData);
        case "current-status":
            discordNames = await discordNames;
            viewStatus(currentRaid, waitingForAllSeasons, guildData);
            break;
        case "current-top":
            viewCurrentTop(5, currentRaid);
            break;
        case "laps":
            viewLaps(currentRaid, guildData);
            break;
        case "roster":
            viewRoster(currentRaid);
            break;
        case "bosses": {
            viewByBoss(true, currentRaid, "default");
            break;
        }
        case "bosses-weighted": {
            viewByBoss(true, currentRaid, "weighted");
            break;
        }
        case "primes":
            viewByBoss(false, currentRaid, false);
            break;
        case "playerStats":
            summaryDamage = await summaryDamage;
            discordNames = await discordNames;
            if (playerSelected != userName && !hasRights("OFFICER")) {
                document.getElementById("current-view").innerHTML = "Insufficient rights";
                return;
            }
            if (playerTokens[playerSelected]==undefined) {
                playerTokens[playerSelected] = await fetchJSON(demo ? "demo/tokens.json" : `proxy.py?url=tokens&player=${playerSelected}`);
                if (demo) {
                    var tsNow = new Date()/1000;
                    playerTokens[playerSelected].lastUpdatedOn += tsNow - playerTokens[playerSelected].fakeCurrentTime;
                }
            }
            viewPlayerStats(playerSelected, currentRaid, waitingForAllSeasons);
            break;
        case "simulation":
            viewSimulation(currentRaid);
            break;
            case "characters": {
                if (!hasRights("OFFICER")) {
                    document.getElementById("current-view").innerHTML = "Insufficient rights";
                    return;
                }
                viewCharacters(waitingForAllSeasons, guildData);
                break;
            }
        case "log": {
            discordNames = await discordNames;
            viewLog(currentRaid, guildData);
            break;
        }
        case "activity": {
            viewActivity(currentRaid, waitingForAllSeasons, guildData);
            break;
        }
        default:
            document.getElementById("current-view").innerHTML = `Unknown mode ${currentMode}`;
    }
};

function secondsToDaysFixed(seconds, decimals) {
    let days = Math.floor(seconds/(24*3600));
    let remain = seconds - days*24*3600;
    return `${days}d ${Math.floor(remain/3600)}h`;
};

function secondsToHourFixed(seconds, decimals) {
    return (seconds/3600).toFixed(1);
};

function damageToFixedMillion(damage) {
    return damage ? (damage/1e6).toFixed(2) + "M" : "&nbsp;";
};

function damageToFixedThousands(damage) {
    return damage ? (damage/1e3).toFixed(0) + "k" : "&nbsp;";
};

function damageToFixedWithTombstone(damage, entry) {
    var prefix = "";
    if (entry.damageDealt == entry.maxHp)  {
        prefix = goldMedalEntity;
    } else if (entry.remainingHp == 0) {
        prefix = tombStoneEntity;
    }
    return prefix + damageToFixedThousands(damage);
}

function calculateCapped(raidStart, currentTime, tokenTimes, startTokens, moved) {
    // Calculates when raid tokens are capped and for how long
    var currentTokens = startTokens;
    var lastTokenGenerated = tokenTimes[0] > raidStart && tokenTimes[0] < (raidStart+3*raidTokenTimer) ? raidStart : tokenTimes[0];
    var tokenUse = 0;
    var cappedTime = 0;
    const raidEnd = raidStart + 28*raidTokenTimer - 1;
    currentTime = currentTime > raidEnd ? raidEnd : currentTime;

    tokenTimes.forEach(t => {
        if (t < raidStart && ((lastTokenGenerated+28*raidTokenTimer) < t)) {
            lastTokenGenerated = t;
            currentTokens = startTokens; // Someone who re-joined?
        }
        while (t >= lastTokenGenerated + raidTokenTimer && currentTokens < 3) {
            currentTokens++;
            lastTokenGenerated += raidTokenTimer;
        }
        if (currentTokens == 3) {
            if (t >= raidStart) {
                if (lastTokenGenerated < raidStart+2*raidTokenTimer) {
                    lastTokenGenerated = raidStart+2*raidTokenTimer;
                }
                cappedTime += (t-lastTokenGenerated);
            }
            lastTokenGenerated = t;
        }
        if (t >= raidStart) {
            tokenUse++;
        }
        currentTokens = currentTokens >= 1 ? currentTokens-1 : 0;
    });
    while (currentTime >= lastTokenGenerated + raidTokenTimer && currentTokens < 3) {
        currentTokens++;
        lastTokenGenerated += raidTokenTimer;
    }
    if (currentTokens == 3 && !moved) {
        cappedTime += (currentTime-Math.max(lastTokenGenerated, raidStart));
    }
    return [tokenUse,currentTokens,Math.floor(cappedTime/raidTokenTimer),cappedTime,currentTokens==3 ? 0 : raidTokenTimer-(currentTime-lastTokenGenerated)];
};

async function viewStatus(currentRaid, allSeasonRaids, guildData) {
    var entries = currentRaid.entries.sort((a,b) => a.completedOn-b.completedOn);
    var season = currentRaid.season;
    var bombsAvailable = 0;
    var totalTokenUse = 0;
    var totalCurrentTokensLow = 0;
    var totalCurrentTokensHigh = 0;
    var totalTokensLostLow = 0;
    var totalTokensLostHigh = 0;
    var totalCappedTimeLow = 0;
    var totalCappedTimeHigh = 0;
    var totalDamageLostLow = 0;
    var totalDamageLostHigh = 0;

    var discordBombsAvailable = [];
    var discordTokenWarning = [];
    const allSeasonEntries = allSeasonRaids.map(raid => raid.entries).flat().sort((a,b) => a.completedOn-b.completedOn);

    var {legendaryTokenCount: legendaryTokenCount, damageCount: damageCount, playerRaidTimes: playerRaidTimes, maxBombDamage: maxBombDamage, minBombDamage: minBombDamage, playerBombTimesInverse: playerBombTimesInverse, tsBombsAgo: tsBombsAgo, raidStart: raidStart, ts: ts}
    = getTokenTimes(currentRaid, allSeasonEntries, guildData);

    allMembers = currentSeason==0 ? new Set(guildData.guild.members.map(it => it.userName)) : new Set();

    var rows = playerBombTimesInverse.map(it => {
        let id = it[1];
        let moved = playerMoved(id, season);
        let movedClass = moved ? " midseasonMove" : "";
        let raidTokens = playerRaidTimes[id] || [];
        let bombAvailable = it[0] < tsBombsAgo;
        let cellTime = bombAvailable ? "&check;" : `${secondsToHourFixed(it[0]-tsBombsAgo, 1)}h`;
        const [tokenUse,currentTokensLow,tokensLostLow,cappedTimeLow,timeToNextTokenLow] = currentRaid.season==70 ? [raidTokens.length, 0, 0] : calculateCapped(raidStart, ts, raidTokens, 0, moved);
        const [_,currentTokensHigh,tokensLostHigh,cappedTimeHigh,timeToNextTokenHigh] = currentRaid.season==70 ? [raidTokens.length, 0, 0] : calculateCapped(raidStart, ts, raidTokens, 3, moved);
        if (tokenUse==0 && it[2]==0 && !allMembers.has(id)) {
            return undefined;
        }
        let avgDamage = legendaryTokenCount[id] ? damageCount[id] / legendaryTokenCount[id] : 0;
        totalTokenUse += tokenUse;
        const damageLostLow = moved ? 0 : avgDamage * tokensLostLow;
        const damageLostHigh = moved ? 0 : avgDamage * tokensLostHigh;
        let availTokens = [currentTokensLow, currentTokensHigh].sort((a,b) => a-b);
        let timeToNextToken = [timeToNextTokenLow,timeToNextTokenHigh].sort((a,b) => a-b);
        if (!moved) {
            totalCurrentTokensLow += availTokens[0];
            totalCurrentTokensHigh += availTokens[1];
            totalTokensLostLow += tokensLostLow;
            totalTokensLostHigh += tokensLostHigh;
            totalCappedTimeLow += +cappedTimeLow;
            totalCappedTimeHigh += +cappedTimeHigh;
            totalDamageLostLow += damageLostLow;
            totalDamageLostHigh += damageLostHigh;
        }
        if (bombAvailable && !moved) {
            bombsAvailable++;
            discordBombsAvailable.push(discordNames[id]||id);
        }
        let warning = (currentTokensLow==3 || (currentTokensLow==2 && timeToNextToken[1]<2*60*60));
        if (warning && !moved) {
            discordTokenWarning.push(discordNames[id]||id);
        }
        return [`${highlightRow(it[1])}<td>${cellTime}</td><td>${it[2]}</td>${memberCell(it[1],season)}</td><td>${tokenUse}</td>
        <td class="${movedClass} count">${availTokens[0]}${availTokens[0]==availTokens[1] ? "" : `~${availTokens[1]}`}</td>
        <td class="${movedClass}${warning ? " warning" : ""}">${secondsToHourFixed(timeToNextToken[0],1)}${timeToNextToken[0]==timeToNextToken[1] ? "" : `~${secondsToHourFixed(timeToNextToken[1],1)}`}h</td>
          ${hasRights("OFFICER") ?
            `<td class="${movedClass} count">${tokensLostLow==tokensLostHigh ? tokensLostLow : `${tokensLostLow}~${tokensLostHigh}`}</td>
            <td>${moved ? "" : `${secondsToHourFixed(cappedTimeLow,1)}${cappedTimeLow==cappedTimeHigh ? "" : `~${secondsToHourFixed(cappedTimeHigh,1)}`}h`}</td>
            <td>${damageToFixedThousands(avgDamage)}</td><td>${damageToFixedMillion(damageLostLow)}</td>`
            : ""}
        </tr>`,bombAvailable,it[0],cappedTimeLow,tokenUse,(1+availTokens[0])*raidTokenTimer-timeToNextToken[1]];
    }).filter(it => it).sort((a,b) => {
        switch (statusSortMode) {
        case 'lost':
            return b[3]-a[3];
        case 'used':
            return b[4]-a[4];
        case 'avail':
            return b[5]-a[5];
        default:
            return a[2]-b[2];
        }
    }).map(it => it[0]).join("\n");
    var bossStatus = lastHitCurrentBoss(currentRaid, bombsAvailable, minBombDamage, maxBombDamage, discordBombsAvailable);
    var header = `
    <tr><th colspan="2"><a href="javascript:statusSortMode='bomb';updateCurrentView();">Bomb</a></th><th>&nbsp;</th><th colspan="${hasRights("OFFICER") ? 4 : 2}">Raid Tokens</th>${hasRights("OFFICER") ? `<th colspan="2">Damage</th>` : ""}</tr>
    <tr><th>Next</th><th>#</th><th>Player</th><th><a href="javascript:statusSortMode='used';updateCurrentView();">Used</a></th><th><a href="javascript:statusSortMode='avail';updateCurrentView();">Avail</a></th><th>Next</th>${hasRights("OFFICER") ? `<th><a href="javascript:statusSortMode='lost';updateCurrentView();">Lost</a></th><th><a href="javascript:statusSortMode='lost';updateCurrentView();">Capped</a></th><th>Avg</th><th>Lost</th>` : ""}</tr>
    `;
    var tail = `<tr><td>${bombsAvailable} ${
        discordBombsAvailable ? `<a href="javascript:navigator.clipboard.writeText('Bombs needed ${discordBombsAvailable.join(" ")} ');"><img class="unitThumbnail" src="images/discord.svg" /></a>`
        : ""
        }</td><td>&nbsp;</td><td class="name">Total</td><td>${totalTokenUse}</td><td>${totalCurrentTokensLow}${totalCurrentTokensLow==totalCurrentTokensHigh ? "" : `~${totalCurrentTokensHigh}`}</td><td>${
            discordTokenWarning ? `<a href="javascript:navigator.clipboard.writeText('You are about to cap raid tokens ${discordTokenWarning.join(" ")} ');"><img class="unitThumbnail" src="images/discord.svg" /></a>`
            : "&nbsp;"
            }</td>
            ${hasRights("OFFICER") ? `
                <td>${totalTokensLostLow}${totalTokensLostLow==totalTokensLostHigh ? "" : `~${totalTokensLostHigh}`}</td>
                <td>${secondsToHourFixed(totalCappedTimeLow,1)}${totalCappedTimeLow==totalCappedTimeHigh ? "" : `~${secondsToHourFixed(totalCappedTimeHigh,1)}`}h</td>
                <td>${damageToFixedThousands(totalDamageLostLow/totalTokensLostLow)}</td>
                <td>${damageToFixedMillion(totalDamageLostLow)}</td>` : ""}</tr>`;
    document.getElementById("current-view").innerHTML = '<table class="tokenTable">' + bossStatus + header + rows + tail + "</table>";
}

var uniqPlayer = function(a) {
    var seen = {};
    return a.filter(it => {
        id = it["userName"];
        return id in seen ? false : (seen[id] = true);
    });
};

var unitNameImage = function(id, title, _class) {
    let name = (unitNames.names[id] || {name: id}).name;
    return `<img title="${title || name}" class="unitThumbnail${_class ? ` ${_class}` : ""}" src="images/${name}.png">`;
}

function getUnitsUsedSorted(e) {
    var units = e["heroDetails"].map(h => h["unitId"]).sort();
    if (e["machineOfWarDetails"]) {
        units.push(e["machineOfWarDetails"]["unitId"]);
    }
    return units;
}

var unitsUsedStr = function(e) {
    return getUnitsUsedSorted(e).map(id => unitNameImage(id)).join("");
};

function unitsUsedSelector(e) {
    var units = e["heroDetails"].map(h => h["unitId"]);
    if (e["machineOfWarDetails"]) {
        units.push(e["machineOfWarDetails"]["unitId"]);
    }
    return units.join(",");
}

var teamPower = function(e) {
    power = e["heroDetails"].reduce((a, h) => a+h["power"], 0) + (e["machineOfWarDetails"]||{"power":0})["power"];
    return Math.round(power/1000) + "k";
};

function getEntriesByBoss(raid) {
    var bossNames = Array(numBossesPerLap).fill(undefined);
    var bossHealth = Array(numBossesPerLap).fill(undefined).map(it => Array(3).fill(undefined));
    var byBoss = Array(numBossesPerLap).fill(undefined).map(it => Array(3).fill(undefined).map(it => []));
    raid['entries'].forEach(entry => {
        if (entry['damageType']=="Battle" && entry['tier']>=4) {
            // Tier 4 = Legendary lap 1, Tier 5 = lap 2, etc
            var set = entry.set;
            if (entry.remainingHp == 0 && (entry.type == undefined || entry.type != bossNames[set]) && bossNames.includes(entry.type)) {
                console.log("Bugfix: https://github.com/SnowprintStudios/tacticus-api/blob/main/CHANGELOG.md#2025-03-21");
                set = (set+4) % 5;
                entry.set = set;
            }
            if (bossNames[set] == undefined) {
                bossNames[set] = entry['type'];
            } else if (bossNames[set] != entry['type']) {
                console.log("Old bug; wrong boss used, should have been fixed above",entry);
            }
            byBoss[set][entry['encounterIndex']].push(entry);
            bossHealth[set][entry['encounterIndex']] = entry['maxHp'];
        }
    });
    return [bossNames, bossHealth, byBoss];
}

var viewCurrentTop = async function(N, currentRaid) {
    [bossNames,_,byBoss] = getEntriesByBoss(currentRaid);
    byBoss.forEach(bossesInclSides => bossesInclSides.forEach(boss => {
        boss.sort((a,b) => b["damageDealt"]-a["damageDealt"]);
    }));
    var byBossPlayerOnce = byBoss.map(bosses => bosses.map(boss => uniqPlayer(boss)));
    unitNames = await unitNames;
    var bossesHtml = Object.keys(bossNames).map(function (i) {
        return Object.keys(byBossPlayerOnce[i]).map(function (encounterIndex) {
            var table = `<table class="bossTable"><caption>${bossFriendlyName(bossNames[i], encounterIndex)} ${+i >= 5 ? "M" : "L"}${((+i)%5)+1}</caption>
            <colgroup><col class="player"><col class="damage"><col class="power"><col class="units"></colgroup>
            <tr><th>Player</th><th>Damage</th><th>Power</th><th>Team</th></tr>`;
            var rows = byBossPlayerOnce[i][encounterIndex].slice(0,N).map(it => {
                return `${highlightRow(it.userName)}${memberCell(it["userName"],currentRaid.season)}<td class="damage">${damageToFixedWithTombstone(it.damageDealt, it)}</td><td class="power">${teamPower(it)}</td><td class="units"><a href="javascript:currentTeam='${unitsUsedSelector(it)}';updateCurrentView('characters');">${unitsUsedStr(it)}</a></td></tr>`;
            }).join("\n");
            return table+rows+"</table>";
        }).join("\n") + '<div style="clear:both;"></div>';
    }).join("\n");
    document.getElementById("current-view").innerHTML = bossesHtml;
};

var viewRoster = function(currentRaid) {
    if (!hasRights("OFFICER")) {
        document.getElementById("current-view").innerHTML = "";
        return;
    }
    var playerData = {};
    currentRaid['entries'].forEach(entry => {
        var curPlayerData;
        if (entry['damageType']!="Battle") {
            return;
        }
        if (!(curPlayerData = playerData[entry['userName']])) {
            playerData[entry['userName']] = curPlayerData = {"nameCell": memberCell(entry["userName"],currentRaid.season), "bossCount": 0, "primeCount": 0, "killCount": 0, "killDamage": 0, "bossDamage": 0, "primeDamage": 0, "prelegCount": 0};
        }
        if (entry["tier"] < 4) {
            curPlayerData["prelegCount"] += 1;
            return;
        }
        if (false && entry["remainingHp"] <= 0 && entry["damageDealt"] < entry["maxHp"]/2) {
            curPlayerData["killCount"] += 1;
            curPlayerData["killDamage"] += entry["damageDealt"];
            return;
        }
        if (entry["encounterIndex"]>0) {
            curPlayerData["primeCount"] += 1;
            curPlayerData["primeDamage"] += entry["damageDealt"];
            return;
        }
        curPlayerData["bossCount"] += 1;
        curPlayerData["bossDamage"] += entry["damageDealt"];
    });
    var playerDataList = Object.values(playerData).sort((a,b) => {
        // return (b["bossDamage"]+b["primeDamage"])/(b["bossCount"]+b["primeCount"])-(a["bossDamage"]+a["primeDamage"])/(a["bossCount"]+a["primeCount"]);
        return (b["bossDamage"]+b["primeDamage"])-(a["bossDamage"]+a["primeDamage"]);
    });
    var head = `<table class="rosterTable">
      <tr>
        <th>&nbsp;</th>
        <th colspan="3">Legendary</th>
        <th colspan="3">Bosses</th>
        <th colspan="3">Side-bosses</th>
        <th colspan="3">Total</th>
      </tr>
      <tr class="headerRow">
        <th>Player</th>
        <th>Damage</th>
        <th>Avg</th>
        <th>#</th>
        <th>Damage</th>
        <th>Avg</th>
        <th>#</th>
        <th>Damage</th>
        <th>Avg</th>
        <th>#</th>
        <th>#</th>
      </tr>
    `;
    var tail = `</table><div style="clear:both;"></div>`;
    var rows = playerDataList.map(entry => {
        var dmgTotal = entry["bossDamage"]+entry["primeDamage"];
        var countTotal = entry["bossCount"]+entry["primeCount"];
        var killDamage = entry["killDamage"];
        return `<tr>
        ${entry["nameCell"]}
        <td class="damage">${damageToFixedMillion(dmgTotal+killDamage)}</td>
        <td class="damage">${damageToFixedThousands(dmgTotal/countTotal)}</td>
        <td class="count">${countTotal}</td>
        <td class="damage">${damageToFixedMillion(entry["bossDamage"])}</td>
        <td class="damage">${damageToFixedThousands(entry["bossDamage"]/entry["bossCount"])}</td>
        <td class="count">${entry["bossCount"]}</td>
        <td class="damage">${damageToFixedMillion(entry["primeDamage"])}</td>
        <td class="damage">${damageToFixedThousands(entry["primeDamage"]/entry["primeCount"])}</td>
        <td class="count">${entry["primeCount"]}</td>
        <td class="count">${countTotal+entry["killCount"]+entry["prelegCount"]}</td>
        </tr>`
    }).join("\n");
    document.getElementById("current-view").innerHTML = head+rows+tail;
}

function byBossStats(encounterIndexes, byBoss, mode) {
    var playerData = {};
    var totalDamagePerEncounter = [0,0,0];
    var totalTokenCount = [0,0,0];
    var topDamage = [0,0,0];
    var weighted = mode == "weighted";
    let ignoreKills = mode == "ignore-kills";
    var byTeam = bossTeamMode == "team";
    encounterIndexes.forEach(encounterIndex => {
        byBoss[encounterIndex].forEach(entry => {
            if ((weighted||ignoreKills) && 0 == entry["remainingHp"] && entry["damageDealt"] < entry["maxHp"]/2) {
                return;
            }
            var id = byTeam ? getUnitsUsedSorted(entry).join(",") : entry["userName"];
            var curPlayerData;
            if (!playerData[id]) {
                playerData[id] = curPlayerData = {dmg: [[],[],[]], totalDmg: 0, name: id, totalDmgByEncounter: [0,0,0], tokenCount: 0};
            } else {
                curPlayerData = playerData[id];
            }
            var dmg = +entry["damageDealt"];
            curPlayerData.dmg[encounterIndex].push(dmg);
            curPlayerData.totalDmg += dmg;
            curPlayerData.totalDmgByEncounter[encounterIndex] += dmg;
            curPlayerData.tokenCount++;
            totalDamagePerEncounter[encounterIndex] += dmg;
            totalTokenCount[encounterIndex]++;
            topDamage[encounterIndex] = Math.max(topDamage[encounterIndex], dmg);
        });
        if (weighted) {
            Object.keys(playerData).forEach(player => {
                let curPlayerData = playerData[player];
                let dmgLst = curPlayerData.dmg[encounterIndex];
                if (dmgLst.length <= 1) {
                    // Can't remove any hits if we only did 1
                    return;
                }
                dmgLst.sort((a,b) => a-b);
                // Remove the weakest hit from the average to encourage experimentation
                let ignoreDmg = dmgLst[0];
                curPlayerData.dmg[encounterIndex] = dmgLst = Array.from(dmgLst.splice(1,dmgLst.length));
                curPlayerData.totalDmg -= ignoreDmg;
                curPlayerData.totalDmgByEncounter[encounterIndex] -= ignoreDmg;
                curPlayerData.tokenCount--;
                totalDamagePerEncounter[encounterIndex] -= ignoreDmg;
                totalTokenCount[encounterIndex]--;
            });
        }
    });
    return {playerData: playerData, totalDamagePerEncounter: totalDamagePerEncounter, totalTokenCount: totalTokenCount, topDamage: topDamage};
};

async function viewByBoss(isBoss, currentRaid, mode) {
    [bossNames,_,byBoss] = getEntriesByBoss(currentRaid);
    var encounterIndexes = isBoss ? [0] : [1,2];
    var playerTotalPercent = {};
    var playerTotalCount = {};
    var playerTotalCountAllTokens = {};
    const weighted = mode == "weighted";
    const byTeam = bossTeamMode == "team";
    if (byTeam) {
        unitNames = await unitNames;
    }
    if (weighted) {
        currentRaid.entries.forEach(entry => {
            if (entry.damageType == "Battle") {
                let player = entry.userName;
                playerTotalCountAllTokens[player] = (playerTotalCountAllTokens[player]||0) + 1;
            }
        });
    }
    const changePlayerVsTeam = `<a href="javascript:bossTeamMode='${byTeam ? "player" : "team"}';updateCurrentView();">${byTeam ? familyEntity : personEntity}</a>`;
    var tables = Array.from(bossNames.keys().map(function (i) {
        let stats = byBossStats(encounterIndexes, byBoss[i], mode);
        var playerData = stats.playerData;
        var totalDamagePerEncounter = stats.totalDamagePerEncounter;
        var totalDamage = totalDamagePerEncounter.reduce((a,b) => a+b, 0);
        let head = `
        <table class="bossEveryoneTable"><caption>${bossFriendlyName(bossNames[i], 0)} ${i<5 ? "L" : "M"}${(+i%5)+1}${isBoss ? "" : " Primes"}</caption>
          <tr>
            <th><a href="javascript:bossSortMode='name';updateCurrentView();">${byTeam ? "Team" : "Player"}</a> ${changePlayerVsTeam}</th>
            <th>${weighted||!hasRights("OFFICER") ? `<a href="javascript:bossSortMode='tokens';updateCurrentView();">Tok</a>` : `<a href="javascript:bossSortMode='totalDamage';updateCurrentView();">Damage</a>`}</th>
            <th${isBoss ? "" : ' colspan="2"'}>
              <a href="javascript:bossSortMode='${bossSortMode=="averageDamage"&&hasRights("OFFICER") ? "topDamage" : "averageDamage"}';updateCurrentView();">${bossSortMode=="topDamage" ? "Top" : isBoss ? "Avg" : "Average"}</a>
            ${isBoss ? "</th><th>" : '<br>L/R</th><th colspan="2">'}<a href="javascript:bossVsMode='${bossVsMode == 'Top' ? 'Avg' : 'Top'}';updateCurrentView();">Vs. ${bossVsMode}</a>${isBoss ? "" : '<br>L/R'}</th>
          </tr>
        `;
        var averageDamage = [0,1,2].map(encounterIndex => totalDamagePerEncounter[encounterIndex]/stats.totalTokenCount[encounterIndex]);
        var averageDamageCells = encounterIndexes.map(i => `<td class="damage">${damageToFixedThousands(averageDamage[i])}</td>`).join("");
        var topDamageCells = encounterIndexes.map(encounterIndex => `<td class="damage">${damageToFixedThousands(stats.topDamage[encounterIndex])}</td>`).join("");
        var tail = `<tr><td class="name">Total</td><td class="damage">${weighted||!hasRights("OFFICER") ? "&nbsp;" : damageToFixedMillion(totalDamage)}</td>${averageDamageCells}${topDamageCells}</tr></table>`;
        var rowsToSort = Object.values(playerData).map(entry => {
            return [`${highlightRow(entry.name)}
                        ${byTeam ? `<td class="name">${entry.name.split(",").map(unitNameImage).join("")}</td>` : memberCell(entry.name, currentRaid.season)}
                        <td class="damage">${weighted || !hasRights("OFFICER") ? entry.dmg.reduce((a,b) => a+b.length, 0) : damageToFixedMillion(entry.totalDmg)}</td>
                        ${encounterIndexes.map(i => `<td class="damage">${damageToFixedThousands(bossSortMode == "topDamage" ? Math.max(...entry.dmg[i], 0) : entry.totalDmgByEncounter[i]/entry.dmg[i].length)}</td>`).join("")}
                        ${encounterIndexes.map(i => {
                            if (!entry.dmg[i].length) {
                                return `<td>&nbsp;</td>`;
                            }
                            let dmg = bossSortMode == "topDamage" ? Math.max(...entry.dmg[i]) : entry.totalDmgByEncounter[i]/entry.dmg[i].length;
                            let percent = Math.floor(100*dmg/((bossVsMode=="Top" ? stats.topDamage : averageDamage)[i]));
                            if (weighted) {
                                playerTotalPercent[entry.name] = (playerTotalPercent[entry.name] || 0) + percent * entry.tokenCount;
                                playerTotalCount[entry.name] = (playerTotalCount[entry.name] || 0) + entry.tokenCount;
                            }
                            return `<td style="background-color: ${getColorPercent(percent/100)};" class="damage percent">${percent}%</td>`;
                        }).join("")}
                        </tr>`,entry];
        });
        var rows = rowsToSort.sort(([ahtml,a],[bhtml,b]) => {
            switch (bossSortMode || ((weighted || byTeam || !hasRights("OFFICER")) ? "averageDamage" : "totalDamage")) {
                case "name": {
                    return a.name.localeCompare(b.name);
                }
                case "tokens": {
                    return b.tokenCount==a.tokenCount ? (b.totalDmg/b.tokenCount - a.totalDmg/a.tokenCount) : (b.tokenCount - a.tokenCount);
                }
                case "topDamage": {
                    let maxA = Math.max(...a.dmg.map(e => Math.max(...e)));
                    let maxB = Math.max(...b.dmg.map(e => Math.max(...e)));
                    return maxB-maxA;
                }
                case "averageDamage": {
                    return (b.totalDmg/b.tokenCount - a.totalDmg/a.tokenCount);
                }
                case "totalDamage":
                case "default": {
                    return (b.totalDmg - a.totalDmg);
                }
            };
        }).map(a => a[0]).join("\n");
        return head+rows+tail;
    })).join("\n");
    var weightedSummary = "";
    if (weighted && !byTeam) {
        allPlayerWeightedEntries = Object.keys(playerTotalPercent).sort().map(player => [player, playerTotalPercent[player], playerTotalCount[player], playerTotalCountAllTokens[player], playerTotalCount[player]]);
        let mostTokensUsed = Math.min(28, allPlayerWeightedEntries.reduce((a,b) => Math.max(a,b[3]), 0));
        let sortEntries = function() {
            allPlayerWeightedEntries.sort((a,b) => b[1]/b[4]-a[1]/a[4]);
        };
        if (weightedSortMode=="base") {
            sortEntries();
        }
        allPlayerWeightedEntries = allPlayerWeightedEntries.map(([player,total,count,allTokens,countPenalty]) => {
            // We penalize for each token below the expected (28-1)
            // But tokens used pre-legendary or for kill shots should not affect the average
            // So we scale with count/allTokens
            let penaltyCount = count*Math.max(0, mostTokensUsed-allTokens-1)/allTokens;
            return [player,total,count,allTokens,countPenalty+penaltyCount];
        });
        if (weightedSortMode=="final") {
            sortEntries();
        }
        var head = `<div>Ignoring partial hits (killing blows) and the lowest hit for each boss, then calculating the score relative to the rest of the guild. If not all tokens are used, a penalty applies (tokens used pre-legendary and for killing blows are counted and you are not penalized for attacking these).</div>
        <table class="bossEveryoneTable">
        <caption>Weighted Score</caption>
        <tr><th><a href="javascript:weightedSortMode='name';updateCurrentView();">${bossTeamMode != "team" ? "Player" : "Team"}</a> ${changePlayerVsTeam}</th><th><a href="javascript:weightedSortMode='base';updateCurrentView();">Base</a></th><th><a href="javascript:weightedSortMode='final';updateCurrentView();">Final</a></th></tr>`;
        var totalPercent = 0;
        var rows = allPlayerWeightedEntries.map(([player,total,count,allTokens,countPenalty]) => {
            let percent1 = total/count;
            let percent2 = total/countPenalty;
            totalPercent += percent1;
            return `<tr>${memberCell(player, currentRaid.season)}
            <td style="background-color: ${getColorPercent(percent1/100)};" class="damage">${Math.floor(percent1)}%</td>
            <td style="background-color: ${getColorPercent(percent2/100)};" class="damage">${Math.floor(percent2)}%</td>
            </tr>`;
        }).join("\n");
        var tail = `<tr><td>Average</td><td style="background-color: ${getColorPercent(totalPercent/allPlayerWeightedEntries.length/100)};" class="damage">${Math.floor(totalPercent/allPlayerWeightedEntries.length)}%</td></table>`;
        weightedSummary = head+rows+tail;
    }
    document.getElementById("current-view").innerHTML = weightedSummary + tables;
}

async function viewPlayerStats(playerSelected, currentRaid, allSeasonRaids) {
    var head = `<table class="playerStatsTable"><caption>Raids</caption>
    <tr><th>Time</th><th colspan="2">Boss</th><th>Damage</th><th>Team</th><th>&nbsp;</th><th>Power</th></tr>
    `;
    var tail = `</table>`;
    unitNames = await unitNames;
    playerUnits = await playerUnits;
    var allSeasonEntries = allSeasonRaids.map(raid => (raid||{}).entries).flat().filter(entry => entry.userName==playerSelected && entry.damageType=="Battle");
    const res = getCharactersFromRaids([{"userName": playerSelected}], allSeasonEntries, []);
    var allSeasonEntriesLegendaryTier = allSeasonEntries.filter(entry => entry.tier>=4)
    const charactersFromRaids = res.characters[playerSelected];
    const thisSeasonEntries = currentRaid['entries'].filter(entry => entry["userName"]==playerSelected && entry["damageType"]=="Battle");

    var rows = logRows(thisSeasonEntries, currentRaid.season, false);

    const {playerDamageScaled: weights, playerActualTokenUsage: playerActualTokenUsage, bossNames: bossNames, guildAverageDamage: guildAverageDamage, playerDamageScalingFactor: playerDamageScalingFactor} = getOptimalWeights(currentRaid, undefined, true, currentRaid.season);
    const seasonStart = currentRaid.entries[0].completedOn;
   
    weightRows = range(0,(weights[playerSelected]||[]).length-1,1).map(set => {
        let cells = [0,1,2].map(encounterIndex => {
            let weight = weights[playerSelected][set][encounterIndex];
            let oldHit = false;
            if (weight == 0) {
                let oldHits = allSeasonEntriesLegendaryTier.filter(entry => entry.set==set && entry.encounterIndex==encounterIndex && entry.type == bossNames[set] && entry.completedOn < seasonStart).slice(-5);
                if (oldHits.length>0) {
                    weight = oldHits.reduce((a,b) => a+b.damageDealt, 0)/oldHits.length/guildAverageDamage[set][encounterIndex]/playerDamageScalingFactor[playerSelected];
                    oldHit = true;
                }
            }
            return `<td class="percent${oldHit ? " oldHit" : ""}"  ${
            weight
            ? `style="background-color: ${getColorPercent(Math.max(0,2*weight-1))};"`
            : `style="background-color: rgb(128,128,128);"`
        }>${weight.toFixed(2)}</td>`}).join("");
        let tokenCells = playerActualTokenUsage[playerSelected][set].map(tokenCount => `<td class="percent">${tokenCount}</td>`).join("");
        return `<tr><td>${bossFriendlyName(bossNames[set],0)}</td>${cells}${tokenCells}</tr>`
    }).join("\n");

    const weightsTable = `<table class="weightsTable"><caption>Value of tokens. 1.0=best boss to spend tokens on. 0.0=no damage dealt so far. <span class="oldHit">Underlined</span> numbers are estimates based on the last 5 hits from previous seasons.</caption>
    <tr><th>Boss</th><th>&nbsp;</th><th>L</th><th>R</th><th colspan="3">Token use</th></tr>
    ${weightRows}
    </table>`;

    var unitTable = "";
    if (playerUnits[playerSelected]) {
        selectedPlayerUnits = Object.keys(playerUnits[playerSelected]).sort().map(unitId => {
            const unit = playerUnits[playerSelected][unitId];
            const unitName = (unitNames.names[unitId]||{name: unitId}).name;
            let power = charactersFromRaids[unitId];
            return {html: `
                <td>${unitNameImage(unitName)}</td>
                <td><div class="unitName">${unitName}</div></td>
                <td class="stars">${progressionIndexStars[unit.progressionIndex]}</td>
                <td>${ranksImage(unit.rank, unitId)}</td>
                <td class="stars">${unit.abilities[0].level}/${unit.abilities[1].level}</td>
                <td class="damage">${damageToFixedThousands(power)}</td>
                `,name: unitName,power: power,rank: unit.rank, progression: unit.progressionIndex,active: unit.abilities[0].level,passive: unit.abilities[1].level};
        });
        unitTable = `<table id="unitTable"></table>`
    }

    var tokensTable = "";
    var tokens = playerTokens[playerSelected];
    if (tokens.tokens) {
        var tsNow = new Date()/1000;
        tokensTable = `
        <table class="tokensTable">
          <caption>Tokens (<span class="${tsNow > tokens.lastUpdatedOn+2*60*60 ? "warning" : ""}">${toDateStr(tokens.lastUpdatedOn)}</span>)</caption>
          <tr><th>Name</th><th>Count</th><th>Next</th><th>Capped</th><th>Capped (date)</th><th>Timer</th></tr>
          ${
            [
                ["guildRaid","tokens","Guild Raid"],
                ["guildRaid","bombTokens","Bombs",true],
                ["arena","tokens","Arena"],
                ["salvageRun","tokens","Salvage Run"],
                ["onslaught","tokens","Onslaught"],
            ].map(([a,b,friendlyName,invertedLogic]) => {
                let tok = tokens.tokens[a][b];
                let ts = tokens.lastUpdatedOn;
                let t = tok.max==tok.current ? 0 : ((tok.max-tok.current-1)*tok.regenDelayInSeconds+tok.nextTokenInSeconds);
                let warning = invertedLogic ? (t==0 ? " ready" : "") : t < 2*60*60 ? " warning": (t < 9*60*60 ? " sleepWarning": "");
                return `<tr>
                  <td>${friendlyName}</td><td class="count">${tok.current}/${tok.max}</td>
                  <td>${secondsToHourFixed(tok.nextTokenInSeconds,1)}h</td>
                  <td class="damage${warning}">${secondsToHourFixed(t,1)}h</td>
                  <td>${toDateStr(ts+t)}</td>
                  <td class="damage">${secondsToHourFixed(tok.regenDelayInSeconds,1)}h</td>
                  </tr>`;
            }).join("")
          }
        </table>
        `
    }

    var historyRelativeStatsTable = `
    <table><caption>Ignores the weakest hit to a boss and pre-legendary.</caption>
    <tr><td>Season</td><td>Tokens</td>${allGuildNamesInOrder.map(name => `<td>${name}</td>`).join("")}</tr>
    ${
        allSeasonRaids.reverse().map(raid => {
            if (summaryDamage[allGuildNamesInOrder[0]][raid.season] == undefined) {
                return "";
            }
            var moved = playerMoved(playerSelected, raid.season) || raid.season == 70;
            var playerEntries = raid.entries.filter(e => e.damageType == "Battle" && e.userName == playerSelected);
            var numEntries = playerEntries.length;
            var scaleDamageFromTokens = moved ? 1 : numEntries >= expectedTokensPerSeason ? 1.0 : numEntries / expectedTokensPerSeason;
            var count = Array(numBossesPerLap).fill(0);
            playerEntries = playerEntries.filter(e => {
                var res = e.encounterIndex == 0 && e.remainingHp && e.tier > 4;
                if (res) {
                    count[e.set]++;
                }
                return res;
            });
            playerEntries.sort((a,b) => a.set - b.set || a.damageDealt - b.damageDealt);
            playerEntries = playerEntries.filter(e => {
                if (count[e.set]>1) {
                    count[e.set]=0;
                    return 0;
                }
                return 1;
            });
            var numBossHits = playerEntries.length;
            return `<tr><td${moved ? ' class="midseasonMove"' : ""}>${raid.season}</td><td${moved ? ' class="midseasonMove"' : ""}>${numEntries}</td>${
                allGuildNamesInOrder.map(name => {
                    const scaling = summaryDamage[name][raid.season];
                    if (scaling == undefined) {
                        return 
                    }
                    const damageRelative = playerEntries.reduce((partialSum, e) => partialSum + (scaleDamageFromTokens * e.damageDealt / (scaling[e.set][0] * numBossHits)), 0);
                    return `<td class="damage" style="background-color: ${getColorPercent(damageRelative)};">${Math.floor(damageRelative*100)}%</td>`;
                }).join("")
            }
        </tr>`;
        }).join("\n")
    }
    </table>
    `;

    document.getElementById("current-view").innerHTML = `<h3>${playerSelected} season ${currentRaid.season}</h3>` + weightsTable + tokensTable + head + rows + tail + unitTable + historyRelativeStatsTable;
    updateSelectedPlayerUnitSortMode();
};

function updateSelectedPlayerUnitSortMode(mode) {
    if (mode != undefined) {
        playerUnitsSortMode = mode;
    }
    if (document.getElementById("unitTable")==undefined) {
        return;
    }
    var i=1;
    let unitRows = selectedPlayerUnits.sort((a,b) => {
        let nameCompare = a.name.localeCompare(b.name);
        switch (playerUnitsSortMode) {
            case "ability": {
                let amax = Math.max(a.active,a.passive);
                let bmax = Math.max(b.active,b.passive);
                if (amax != bmax) {
                    return bmax-amax;
                }
                let amin = Math.min(a.active,a.passive);
                let bmin = Math.min(b.active,b.passive);
                if (amin != bmin) {
                    return bmin-amin;
                }
            }
            case "rank": {
                if (a.rank != b.rank) {
                    return b.rank - a.rank;
                }
            }
            case "progression": {
                if (a.progression != b.progression) {
                    return b.progression - a.progression;
                }
            }
            case "power": {
                if (a.power!=b.power) {
                    return (b.power||0)-(a.power||0);
                }
            }
            case "name":
            default: {
                return nameCompare;
            }
        }
    }).map(a=>`<tr><td class="count">${i++}</td>${a.html}</tr>`).join("\n");
    document.getElementById("unitTable").innerHTML = `
    <tr><th colspan="3"><a href="javascript:updateSelectedPlayerUnitSortMode('name');">Character</a></th><th><a href="javascript:updateSelectedPlayerUnitSortMode('progression');">Stars</a></th><th><a href="javascript:updateSelectedPlayerUnitSortMode('rank');">R</a></th><th><a href="javascript:updateSelectedPlayerUnitSortMode('ability');">A/P</a></th><th><a href="javascript:updateSelectedPlayerUnitSortMode('power');">Power</a></th></tr>
    ${unitRows}
    `;
}

function toDateStr(t) {
    return new Date(t*1000).toLocaleString("en-US", {month: 'short', day: '2-digit', hour: '2-digit', hour12: false, minute: '2-digit', timeZone: systemTimeZone});
}

function viewLaps(currentRaid, currentGuild) {
    [bossNames,_,byBoss] = getEntriesByBoss(currentRaid);
    let season = currentRaid["season"];
    let guildName = currentGuild.guild.name;
    let currentLap = Math.max(1,currentRaid.entries.at(-1).tier-3);

    let previousBossKilled = (currentRaid.entries.findLast(entry => entry["tier"]<4) || currentRaid.entries.at(0) || {"completedOn": 0}).completedOn;

    let head = `<table class="lapTable"><caption class="seasonReportCaption">${guildName} - Season ${season} Lap Report</caption>`;
    let bossNameRow = `<tr>${range(0,bossNames.length-1,1).map(i => `<th>${bossFriendlyName(bossNames[i],0)} ${i<5 ? "L" : "M"}${(i%5)+1}</th>`).join("")}</tr>`
    let rows = range(1,currentLap,1).map(lap => {
        var entriesThisLap = currentRaid.entries.filter(e => e["tier"]-3 == lap);
        var tokensThisLap = 0;
        var timeThisLap = 0;
        let row = range(0,bossNames.length-1,1).map(i => {
            let entriesThisLapThisBoss = entriesThisLap.filter(e => e["set"]==i).sort((a,b) => b["completedOn"]-a["completedOn"]);
            let entriesOnBossTokens = entriesThisLapThisBoss.filter(entry => entry["encounterIndex"]==0 && entry["damageType"]=="Battle");
            let entriesOnSideBossTokens = entriesThisLapThisBoss.filter(entry => entry["encounterIndex"]!=0 && entry["damageType"]=="Battle");
            let dmgOnBoss = entriesOnBossTokens.reduce((a,b) => a+b["damageDealt"], 0);
            let lastEntry = entriesThisLapThisBoss.at(0);
            if (!lastEntry) {
                return `<td>Missing in API</td>`;
            }
            let isDead = lastEntry["remainingHp"] == 0;
            let finishedAt = lastEntry.completedOn;
            let finishedAtStr = toDateStr(finishedAt);
            let timeOnBoss = finishedAt - previousBossKilled;
            let timeOnBossStr = secondsToDaysFixed(timeOnBoss);
            previousBossKilled = finishedAt;
            tokensThisLap += entriesOnBossTokens.length + entriesOnSideBossTokens.length;
            timeThisLap += timeOnBoss;
            return `<td><table class="lapTable">
                <tr><td>Tickets</td><td>${entriesOnBossTokens.length+entriesOnSideBossTokens.length}</td></tr>
                <tr><td>Boss Avg.</td><td>${damageToFixedThousands(dmgOnBoss / entriesOnBossTokens.length)}</td></tr>
                <tr><td>Time</td><td>${timeOnBossStr}</td></tr>
                <tr><td colspan="2">${isDead ? tombStoneEntity : "&#x1F409;"} ${finishedAtStr}</td></tr>
            </table></td>`;
        }).join("\n");
        return `<tr><td class="lapSummary" colspan="${numBossesPerLap}">Lap ${lap} - Tickets Used: ${tokensThisLap} - Total Time: ${secondsToDaysFixed(timeThisLap)}</td></tr><tr>${row}</tr>`;
    }).join("\n");
    let tail = `</table>`;

    document.getElementById("current-view").innerHTML = head + bossNameRow + rows + tail;
};

function getOptimalWeights(currentRaid, startTokens, includeMovedPlayers, season) {
    const [bossNames,bossHealth,byBoss] = getEntriesByBoss(currentRaid);
    const encounterIndexes = [0,1,2];
    let stats = [];
    let playerDamageAvg = {};
    let playerDamageScaled = {};
    let playerDamageScalingFactor = {};
    let playerDamageByBoss = Array(numBossesPerLap).fill(undefined).map(it => Array(3).fill(undefined).map(it => []));
    let playerActualTokenUsage = {};
    let playerTokens = {};
    let playerTokenValue = {}; // Relative value to the rest of the guild based on bosses not hit
    let playerTokensUsed = {};
    let guildAverageDamage = [[[],[],[]],[[],[],[]],[[],[],[]],[[],[],[]],[[],[],[]],[[],[],[]]];
    range(0,5,1).forEach(i => {
        stats[i] = byBossStats(encounterIndexes, byBoss[i], "weighted");
        encounterIndexes.forEach(encounterIndex => {
            guildAverageDamage[i][encounterIndex] = Math.floor(stats[i].totalDamagePerEncounter[encounterIndex] / stats[i].totalTokenCount[encounterIndex]);
            Object.keys(stats[i].playerData).forEach(player => {
                if (!includeMovedPlayers && (movement[season]||[]).includes(player)) {
                    return;
                }
                let playerStats = stats[i].playerData[player];
                let attacks = playerStats.dmg[encounterIndex];
                let playerAvg = attacks.length ? Math.floor(attacks.reduce((a,b) => a+b,0) / attacks.length) : 0;
                playerDamageScaled[player] = playerDamageScaled[player] || [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]];
                playerDamageScaled[player][i][encounterIndex] = playerAvg ? playerAvg / guildAverageDamage[i][encounterIndex] : 0;
                playerDamageAvg[player] = playerDamageAvg[player] || [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]];
                playerDamageAvg[player][i][encounterIndex] = playerAvg;
            });
        });
    });
    Object.keys(playerDamageScaled).forEach(player => {
        let maxDmg = Math.max(...playerDamageScaled[player].flat());
        playerDamageScalingFactor[player] = maxDmg;
        let tokenCount = 0;
        playerActualTokenUsage[player] = Array(numBossesPerLap).fill(undefined).map(it => Array(3).fill(0));
        
        playerTokenValue[player] = range(0,4,1).map(boss => {
            if (stats[boss].playerData[player] == undefined) {
                return 0;
            }
            tokenCount += stats[boss].playerData[player].tokenCount;
            let dmg = encounterIndexes.map(encounterIndex => {
                let n = stats[boss].playerData[player].dmg[encounterIndex].length;
                return playerDamageScaled[player][boss][encounterIndex] * n;
            }).reduce((a,b) => a+b, 0);
            return dmg;
        }).reduce((a,b) => a+b, 0) / tokenCount;
        playerDamageScaled[player] = playerDamageScaled[player].map(a => a.map(d => d / maxDmg));
        playerTokens[player] = startTokens;
        playerTokensUsed[player] = [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]];
        range(0,5,1).forEach(boss => encounterIndexes.forEach(encounterIndex => {
            playerDamageByBoss[boss][encounterIndex].push({"player": player, "weight": playerDamageScaled[player][boss][encounterIndex]});
        }));
    });
    range(0,5,1).forEach(boss => encounterIndexes.forEach(encounterIndex => {
        playerDamageByBoss[boss][encounterIndex].sort((a,b) => b.weight == a.weight ? playerDamageAvg[b.player][boss][encounterIndex] - playerDamageAvg[a.player][boss][encounterIndex] : b.weight - a.weight);
    }));
    currentRaid.entries.forEach(entry => {
        if (entry.damageType!="Battle" || entry.tier<4) {
            return;
        }
        if (playerActualTokenUsage[entry.userName] == undefined) {
            return; // Someone who quit before legendary
        }
        playerActualTokenUsage[entry.userName][entry.set][entry.encounterIndex]++;
    });
    return {stats: stats, playerDamageAvg: playerDamageAvg, playerDamageScaled: playerDamageScaled, playerDamageByBoss: playerDamageByBoss, playerActualTokenUsage: playerActualTokenUsage, playerTokens: playerTokens, playerTokenValue: playerTokenValue, playerTokensUsed: playerTokensUsed, guildAverageDamage: guildAverageDamage, bossNames: bossNames, bossHealth: bossHealth, byBoss: byBoss, playerDamageScalingFactor: playerDamageScalingFactor};
}

function viewSimulation(currentRaid) {
    const startTokens = 2;
    const {playerDamageAvg: playerDamageAvg, playerDamageScaled: playerDamageScaled, playerDamageByBoss: playerDamageByBoss, playerActualTokenUsage: playerActualTokenUsage, playerTokens: playerTokens, playerTokenValue: playerTokenValue, playerTokensUsed: playerTokensUsed, guildAverageDamage: guildAverageDamage, bossNames: bossNames, bossHealth: bossHealth} = getOptimalWeights(currentRaid, startTokens, false, currentRaid.season);
    let tokenRefreshes = 26-startTokens; // 28 tokens - 1 for nonlegendary - 1 more
    let done = false;
    let numEstimated = 0;
    let lastKilledBoss = [0,0];
    
    range(1,12,1).forEach(lap => {
        range(0,4,1).forEach(boss => {
            range(2,0,-1).forEach(encounterIndex => {
                let currentHealth = bossHealth[boss][encounterIndex];
                let bossName = bossFriendlyName(bossNames[boss],encounterIndex);
                if (done) {
                    return;
                }
                if (currentHealth == undefined) {
                    console.log(`Skipping ${bossName} (did not find any attack to it)`);
                    return;
                }
                if (["Alpha","Omega","Winged Prime"].includes(bossName)) {
                    console.log(`Skipping ${bossFriendlyName(boss,encounterIndex)} (we usually do not attack it)`);
                    return;
                }
                
                console.log(`Boss health ${bossName} ${currentHealth}`);
                function useTokens(entry,minTokens,minWeight) {
                    if (currentHealth <= 0) {
                        return;
                    }
                    if (playerTokens[entry.player] < minTokens) {
                        return;
                    }
                    if (entry.weight < minWeight) {
                        return;
                    }
                    let dmg = playerDamageAvg[entry.player][boss][encounterIndex] || Math.floor(guildAverageDamage[boss][encounterIndex]*playerTokenValue[entry.player]);
                    if (!playerDamageAvg[entry.player][boss][encounterIndex]) {
                        numEstimated++;
                        console.log(`Token used by ${entry.player} vs ${bossName} for ${dmg} dmg (estimated)`);
                    }
                    currentHealth -= dmg;
                    playerTokens[entry.player]--;
                    playerTokensUsed[entry.player][boss][encounterIndex]++;
                    // console.log(`Token used by ${entry.player} vs ${bossName} for ${dmg} dmg`);
                }
                while (!done) {
                    playerDamageByBoss[boss][encounterIndex].forEach(entry => useTokens(entry,3,0));
                    playerDamageByBoss[boss][encounterIndex].forEach(entry => useTokens(entry,1,1));
                    playerDamageByBoss[boss][encounterIndex].forEach(entry => useTokens(entry,2,0.7));
                    playerDamageByBoss[boss][encounterIndex].forEach(entry => useTokens(entry,1,0.8));
                    if (currentHealth <= 0) {
                        console.log(`Killed ${bossNames[boss]} #${lap}`);
                        lastKilledBoss = [boss,lap];
                        return;
                    }
                    if (tokenRefreshes > 0) {
                        tokenRefreshes--;
                        Object.keys(playerTokens).forEach(player => {
                            playerTokens[player]++;
                        });
                        console.log("Token refresh");
                    } else {
                        playerDamageByBoss[boss][encounterIndex].forEach(entry => useTokens(entry,1,0));
                        playerDamageByBoss[boss][encounterIndex].forEach(entry => useTokens(entry,1,0));
                        if (currentHealth <= 0) {
                            console.log(`Killed ${bossNames[boss]} #${lap}`);
                            lastKilledBoss = [boss,lap];
                            return;
                        }
                        console.log(`Failed to kill ${bossNames[boss]}#${lap} ${currentHealth}`);
                        done = true;
                    }
                }
            });
        });
    });
    function tokenUsageCell(player, boss, encounterIndex) {
        return `<td ${encounterIndex==0 ? 'colspan="2" ' : ''}class="tokenCount${encounterIndex == 0 ? "TopRow" : ""} ${playerDamageAvg[player][boss][encounterIndex] || !playerTokensUsed[player][boss][encounterIndex] ? '' : ' estimate'}">${playerTokensUsed[player][boss][encounterIndex]}</td>`;
    };
    function actualTokenUsageCell(player, boss, encounterIndex) {
        return `<td ${encounterIndex==0 ? 'colspan="2" ' : ''}class="tokenCount${encounterIndex == 0 ? "TopRow" : ""}">${playerActualTokenUsage[player][boss][encounterIndex]}</td>`;
    };
    rows = Object.keys(playerTokensUsed).sort().map(player => {
        cells1 = range(0,4,1).map(boss => `<td><table class="tokenCountTable"><tr>${tokenUsageCell(player,boss,0)}</tr><tr>${tokenUsageCell(player,boss,1)}${tokenUsageCell(player,boss,2)}</tr></table></td>`).join("");
        return `<tr>${memberCell(player, currentRaid.season)}${cells1}</tr>`;
    });
    document.getElementById("current-view").innerHTML = `<table class="optimal"><caption>Ticket usage simulator for season ${currentRaid.season} - kills ${bossNames[lastKilledBoss[0]]}#${lastKilledBoss[1]}</caption>
    <tr><th>&nbsp;</th><th colspan="5">Simulated</th></tr>
    <tr><th>Name</th>${x = range(1,5,1).map(boss => `<th>L${boss}</th>`).join(""), x}</tr>
    ${rows.join("\n")}
    </table>`;
};

function getCharactersFromRaids(members, entries, teamMembers) {
    var characters = {};
    var teamUsedCount = {};
    var teamMaxDamage = {};
    members.forEach(member => {
        characters[member.userName] = {};
    });
    entries.forEach(entry => {
        if (entry["damageType"]!="Battle") {
            return;
        }
        let name = entry["userName"];
        if (characters[name] == undefined) {
            return;
        }
        let mow = entry["machineOfWarDetails"];
        var heroesThisRaid = entry["heroDetails"].map(hero => hero.unitId).concat(mow ? [mow.unitId] : []);
        entry["heroDetails"].forEach(hero => {
            characters[name][hero.unitId] = Math.max(characters[name][hero.unitId]||0,hero.power);
        });
        if (mow) {
            characters[name][mow.unitId] = Math.max(characters[name][mow.unitId]||0,mow.power);
        }
        if (entry["tier"]>=4 && teamMembers.reduce((a,b) => a && heroesThisRaid.includes(b),true)) {
            teamUsedCount[name] = (teamUsedCount[name]||0) + 1;
            teamMaxDamage[name] = Math.max(teamMaxDamage[name]||0, entry["damageDealt"]);
        }
    });
    return {"characters": characters, "teamUsedCount": teamUsedCount, "teamMaxDamage": teamMaxDamage};
}

async function viewCharacters(allRaids, guildData) {
    unitNames = await unitNames;
    playerUnits = await playerUnits;
    var members = guildData.guild.members;
    var membersLevel = Object.fromEntries(members.map(m => [m.userName, m.level]));
    var entries = allRaids.map(raid => raid.entries).flat();
    var teamMembers = currentTeam.split(",");
    const res = getCharactersFromRaids(members, entries, teamMembers);
    const characters = res.characters;
    const teamUsedCount = res.teamUsedCount;
    const teamMaxDamage = res.teamMaxDamage;
    var head = `
    <input id="teamSelector" value="${currentTeam}" size=80 onChange="currentTeam=document.getElementById('teamSelector').value;updateCurrentView()" />
    <table><caption>Units used in raids</caption>
    <tr><th>&nbsp;</th><th colspan="2">Total</th><th colspan="3">Team</th></tr>
    <tr><th>Player</th><th>PL</th><th>#</th><th>Power</th><th>Collected</th><th>Power</th><th>Used</th><th>Max</th></tr>`
    var tail = `</table>`;
    var rows = Object.keys(characters).sort().map(name => {
        var teamImage = teamMembers.filter(unit => characters[name][unit]).map(unit => {
            var title = undefined;
            if (playerUnits[name]) {
                rank = ranksName[playerUnits[name][unit].rank];
                rank = rank[0] + rank.at(-1);
                let abilities = playerUnits[name][unit].abilities;
                let stars = progressionIndexRarityStarsText[playerUnits[name][unit].progressionIndex];
                title = `${stars} ${rank} ${unitNames[unit]||unit} ${abilities[0].level}/${abilities[1].level}`;
            }
            return unitNameImage(unit, title);
        }).join("");
        var team = teamMembers.map(unit => characters[name][unit]||0);
        return `${highlightRow(name)}${memberCell(name, undefined)}<td class="damage">${membersLevel[name]}</td><td class="count">${Object.keys(characters[name]).length}</td><td class="damage">${damageToFixedMillion(Object.values(characters[name]).reduce((a,b) => a+b, 0))}</td><td>${teamImage}</td><td class="damage">${damageToFixedMillion(team.reduce((a,b)=>a+b,0))}</td><td class="count">${teamUsedCount[name]||""}</td><td class="damage">${damageToFixedThousands(teamMaxDamage[name]||0)}</td></tr>`;
    }).join("\n");
    document.getElementById("current-view").innerHTML = head + rows + tail;
};

async function setAPIToken(event) {
    event.preventDefault();
    const userId = document.getElementById("user-id").value;
    const apiKey = document.getElementById("api-key").value;
    let result = await fetch("login.py", {
        method: "GET",
        headers: {
            "X-USER-ID": userId,
            "X-API-KEY": apiKey
        }
    }).then(response => {
        console.log(response);
        if (!response.ok) {
            return {"Failed": response.status};
        } else {
            localStorage.setItem("user-id", userId);
            localStorage.setItem("api-key", apiKey);
            return response.json();
        }
    });
    if (result.userName) {
        localStorage.setItem("user-name", userName = result.userName);
        localStorage.setItem("user-guild-role", userGuildRole = result.role);
        document.getElementById("api-response").innerHTML = `Logged in as ${userName}. Refresh the page to access the database.`;
        window.location.reload();
    } else {
        document.getElementById("api-response").innerHTML = JSON.stringify(result);
    }
}

function removeOfficerRights(event) {
    console.log("???");
    event.preventDefault();
    localStorage.setItem("user-guild-role", userGuildRole = "MEMBER");
    window.location.reload();
}

function upgradeInfo(upg) {
    let type = upg.startsWith("upgHp") ? "Health" : upg.startsWith("upgArm") ? "Armour" : upg.startsWith("upgDmg") ? "Damage" : "???";
    let rarity = upg[type=="Health" ? 5 : 6];
    return {type: type, rarity: rarity, crafted: upg.endsWith("C")};
}

function viewInventory(inventory) {
    if (demo) {
        document.getElementById("current-view").innerHTML = "DEMO disabled. Here, players can see upgrades held by themselves and others in the guild (to be able to trade easier)";
        return;
    }
    document.getElementById("current-view").innerHTML = `
    <div>
    <input id="filter-upgrades-tradeable" type="checkbox" onchange="javascript:updateUpgrade();" checked />
    <label for="filter-upgrades-tradeable">Only tradeable upgrades</label>
    </div>
    <table id="upgradeTable">
    </table>
    <table id="ownedUpgradeTable">
    </table>
    `
    updateUpgrade();
}

function updateUpgrade(newUpgradeSelected) {
    if (newUpgradeSelected != undefined) {
        upgradeSelected = newUpgradeSelected;
    }
    var filterUpgrades = document.getElementById("filter-upgrades-tradeable").checked;
    console.log(upgradeSelected);
    const tradeableRarities = new Set(["C","U","R"]);

    let upgradesFiltered = range(0,inventory.names.length-1,1).filter(i => {
        if (!filterUpgrades) return true;
        let info = upgradeInfo(inventory.names[i][1]);
        return (!info.crafted) && (tradeableRarities.has(info.rarity));
    });

    if (!upgradesFiltered.includes(upgradeSelected)) {
        upgradeSelected = upgradesFiltered[0];
    }

    let rows = guildsData[currentGuild].guild.guild.members.map(({userName: id}) => {
        let inv = inventory.players[id];
        if (inv==undefined) {
            return undefined;
        }
        return `${highlightRow(id)}${memberCell(id)}<td>${inv[upgradeSelected]}</td></tr>`
    }).filter(a => a != undefined).join("\n");

    document.getElementById("upgradeTable").innerHTML = `
    <caption>${inventory.names[upgradeSelected][0]}</caption>
    <tr><th>Player</th><th>Count</th></tr>
    ${rows}
    `;

    document.getElementById("ownedUpgradeTable").innerHTML = `
    <caption>Owned upgrades</caption>
    <tr><th>Name</th><th>#</th><th>T</th><th>R</th><th>${hammerEntity}</th></tr>
    ${
        upgradesFiltered.map(i => {
            let upg = upgradeInfo(inventory.names[i][1]);
            return [`<tr>
                <td><a href="javascript:updateUpgrade(${i})">${inventory.names[i][0]}</a></td>
                <td class="damage">${inventory.players[userName][i]}</td>
                <td><img class="unitthumbnail" src="images/${upg.type}.webp"></img></td>
                <td>${upg.rarity}</td>
                <td>${upg.crafted ? hammerEntity : "&nbsp;"}</td>
                </tr>`,inventory.players[userName][i]];
        }).sort((a,b) => b[1]-a[1]).map(a=>a[0]).join("\n")
    }`;
}

function viewActivity(currentRaid, allSeasonRaids, guildData) {
    if (!hasRights("OFFICER")) {
        document.getElementById("current-view").innerHTML = "Insufficient rights";
        return;
    }
    let entries = allSeasonRaids.map(raid => raid.entries).flat().sort((a,b) => a.startedOn-b.startedOn);
    var {hasBomb: hasBomb} = activityFilterBombs ? getTokenTimes(currentRaid, entries, guildData) : {hasBomb: {}};
    let activityTotal = Array(24).fill(0);
    let hourNow = hour = +(new Date().toLocaleString("en-US", {hour: '2-digit', hour12: false, timeZone: systemTimeZone}));
    let rows = guildData.guild.members.filter(member => activityFilterBombs ? hasBomb[member.userName] : true).map(member => {
        let activity = Array(24).fill(0);
        entries.forEach(e => {
            if (e.userName != member.userName) return;
            hour = +(new Date(e.completedOn*1000).toLocaleString("en-US", {hour: '2-digit', hour12: false, timeZone: systemTimeZone}));
            activity[hour]++;
            activityTotal[hour]++;
        });
        let totalActivity = activity.reduce((a,b)=>a+b,0);
        let maxActivity = Math.max(...activity);
        return `<tr>${memberCell(member.userName)}<td class="count">${totalActivity}</td>${Object.keys(activity).map(a => `<td class="count${a==hourNow ? " hourNow" : ""}" style="background-color: ${getColorIntensityPercent(activity[a]/maxActivity)};">${activity[a]}</td>`).join("")}</tr>`;
    }).sort().join("");
    let totalActivity = activityTotal.reduce((a,b)=>a+b,0);
    let maxActivity = Math.max(...activityTotal);
    document.getElementById("current-view").innerHTML = `
    <input type="checkbox" id="activityFilterBombs" ${activityFilterBombs ? "checked" : ""} onChange="javascript:updateActivityFilterBombs();"/>
    <label for="activityFilterBombs">Only players with bombs</label>
    <table>
    <caption>Active hours (bombs or raids, timezone ${systemTimeZone})</caption>
    <tr><th>Name</th><th>Total</th>${Object.keys(activityTotal).map(i => `<th${i==hourNow ? ' class="hourNow"' : ""}>${("0"+i.toString()).slice(-2)}</th>`).join("")}
    ${rows}
    <tr><td>Total</td><td class="count">${totalActivity}</td>${Object.keys(activityTotal).map(a => `<td class="count${a==hourNow ? " hourNow" : ""}" style="background-color: ${getColorIntensityPercent(activityTotal[a]/maxActivity)};">${activityTotal[a]}</td>`).join("")}</tr>
    </table>`;
}

function updateActivityFilterBombs() {
    activityFilterBombs = document.getElementById("activityFilterBombs").checked;
    updateCurrentView();
}

function showKeys() {
    var type = document.getElementById("show-keys").checked ? "text" : "password";
    document.getElementById("user-id").type = type;
    document.getElementById("api-key").type = type;
}

function setHighlightUser() {
    highlightUser = document.getElementById("highlight-user").checked;
    localStorage.setItem("highlight-user", highlightUser);
}

function highlightRow(id) {
    return `<tr${highlightUser && id == userName ? ' class="loggedInPlayer"': ""}>`;
}

function logRows(entries, season, showPlayerName) {
    return entries.map(entry => {
        var tier = entry['tier'] > 4 ? 4 : entry.tier;
        var bossName = bossFriendlyName(entry['type'], entry['encounterIndex']);
        var mow = entry["machineOfWarDetails"];
        var heroesThisRaid = getUnitsUsedSorted(entry);
        var power = entry["heroDetails"].map(hero => hero.power).reduce((a,b) => a+b, 0) + (mow ? mow.power : 0);
        var userName = entry.userName;
        var unitsUsedInRaid = heroesThisRaid.map(unitId => {
            var unitName = (unitNames.names[unitId]||{name: unitId}).name.replace("'","\\'");
            if (playerUnits[userName]) {
                var stats = playerUnits[userName][unitId];
                var rank = unitNames.mows.includes(unitId) ? "" : `:${ranksName[stats.rank]}: `;
                var abilities = stats.abilities;
                return `${rank}${unitName} ${abilities[0].level}/${abilities[1].level} ${progressionIndexStarsDiscord[stats.progressionIndex]}`;
            }
            return unitName;
        }).join("\\n");
        var isBomb = entry.damageType=="Bomb";
        var shortBossNum = `${entry.set >= 5 ? "M" : tierToRarityName[tier][0]}${(entry.set%5)+1}`;
        var clipboardText = `S${season} ${shortBossNum} ${bossName.replace("'","\\'")} - ${damageToFixedThousands(entry["damageDealt"])}\\nRun by ${discordNames[entry["userName"]]||entry["userName"]}\\n${unitsUsedInRaid}`;
        return `<tr>
        <td><p title="startedOn: ${toDateStr(entry.startedOn)}">${toDateStr(entry.completedOn)}</p></td>
        <td class="name">${bossName}</td>
        <td class="name">${shortBossNum}</td>
        ${showPlayerName ? memberCell(userName, season) : ""}
        <td class="damage"><p title="remainingHp: ${damageToFixedWithTombstone(entry.remainingHp, entry)}">${isBomb ? bombEntity : ""}${damageToFixedWithTombstone(entry.damageDealt, entry)}</p></td>
        <td class="units"><a href="javascript:currentTeam='${unitsUsedSelector(entry)}';updateCurrentView('characters');">${unitsUsedStr(entry)}</a></td>
        <td>${isBomb ? "&nbsp;" : `<a href="javascript:navigator.clipboard.writeText('${clipboardText}');">${clipboardEntity}</a>`}</td>
        <td class="damage">${damageToFixedThousands(power)}</td>
        </tr>`;
    }).reverse().join("");    
}

async function viewLog(currentRaid, guildData) {
    unitNames = await unitNames;
    document.getElementById("current-view").innerHTML = `<table>
    ${logRows(currentRaid.entries.sort((a,b) => a.completedOn-b.completedOn), currentRaid.season, true)}
    </table>`
}

function filterGWData(gwData) {
    var data = gwData.eventResults[0].eventResponseData;
    var playerMap = {};
    data.playerData.forEach(player => {
        playerMap[player.userId] = player.displayName;
    });
    data.activityLogs = data.activityLogs.filter(it => it.type == 'battleFinished');
    data.activityLogs.forEach(it => {
        if (!it.attacker) {
            it.attacker = {userId: it.userId};
        }
        delete it.id;
        delete it.userId;
        let attacker = playerMap[it.attacker.userId];
        delete it.attacker.userId;
        it.attacker.userName = attacker;
        if (it.defender.userId) {
            let defender = playerMap[it.defender.userId];
            delete it.defender.userId;
            it.defender.userName = defender;
        } else {
            it.defender.userName = "Default Defender";
        }
    });
    delete data.guildData[0].guildId;
    delete data.guildData[1].guildId;
    delete data.playerData;
    return data;
}

async function viewGWs(gwsData) {
    document.getElementById("current-view").innerHTML = demo ? "DEMO disabled" : `
    <ul>
    ${Object.keys(gwsData).reverse().map(gw => {
        return `<li><a href="javascript:selectedGW='${gwsData[gw]}';updateCurrentView('gw');">${gw}</a></li>`
    }).join("\n")}
    </ul>
    `
};

async function viewGW(gwData) {
    unitNames = await unitNames;
    var data = gwData;
    var attackerStats = {};
    var defenderStats = {};
    var ownBuffStats = [];
    var opponentBuffStats = [];
    var ownBuffStatsIndividual = {};
    var opponentBuffStatsIndividual = {};
    var ownDefendingCharacterStats = {};
    var opponentDefendingCharacterStats = {};
    var ownAttackingCharacterStats = {};
    var opponentAttackingCharacterStats = {};
    var ownAttackingMowStats = {};
    var opponentAttackingMowStats = {};
    var ownDefendingMowStats = {};
    var opponentDefendingMowStats = {};
    const playerSelected = "";
    var ourMembers = new Set();
    var numAttackAttempts = 0;
    var numAttackWins = 0;
    var numDefenceAttempts = 0;
    var numDefenceWins = 0;
    const medicaeBuff = "EnvDefenderHealthBuff2";
    const ourTeamIndex = data.guildData[0].name == "ETERNAL NEXUS" ? 1 : 2;
    const opponentTeamIndex = ourTeamIndex == 1 ? 2 : 1;
    events = data.activityLogs.filter(e => {
        if (e.type != "battleFinished") {
            return false;
        }
        return e.defender.userName.includes(playerSelected) || e.attacker.userName.includes(playerSelected)
        });
    function attackRow(e) {
        let attackerName = e.attacker.userName;
        let defenderName = e.defender.userName;
        ourMembers.add(e.teamIndex == ourTeamIndex ? attackerName : defenderName);
        let buffStats = (e.teamIndex == ourTeamIndex ? ownBuffStats : opponentBuffStats);
        const nBuffs = (e.buffs||[]).length;
        let buffStatsThisNum = buffStats[nBuffs] || {"successes": 0, "attempts": 0};
        buffStats[nBuffs] = buffStatsThisNum;
        let stats = attackerStats[attackerName] || {"kills": 0, "successes": 0, "attempts": 0, "successesBeforeMedicae": 0, "attemptsBeforeMedicae": 0};
        let aliveDefendersBefore = e.defender.units.filter(u => u.remainingHPBefore).length;
        let aliveDefendersAfter = e.defender.units.filter(u => u.remainingHPAfter).length;
        let alive = aliveDefendersAfter > 0;
        stats.kills += aliveDefendersBefore - aliveDefendersAfter;
        stats.successes += !alive;
        stats.attempts++;
        if (e.buffs && e.buffs.find(b => b.abilityId == medicaeBuff)) {
            stats.successesBeforeMedicae += !alive;
            stats.attemptsBeforeMedicae++;
        }
        attackerStats[attackerName] = stats;
        stats = defenderStats[defenderName] || {"successes": 0, "attempts": 0};
        stats.successes += alive;
        stats.attempts++;
        defenderStats[defenderName] = stats;
        buffStatsThisNum.successes += !alive;
        buffStatsThisNum.attempts++;
        if (e.teamIndex == ourTeamIndex) {
            numAttackAttempts++;
            numAttackWins += !alive;
        }
        if (e.teamIndex == opponentTeamIndex) {
            numDefenceAttempts++;
            numDefenceWins += !alive;
        }
        (e.buffs||[]).forEach(b => {
            if (!ownBuffStatsIndividual[b.abilityId]) {
                ownBuffStatsIndividual[b.abilityId] = {"successes": 0, "attempts": 0};
            }
            if (!opponentBuffStatsIndividual[b.abilityId]) {
                opponentBuffStatsIndividual[b.abilityId] = {"successes": 0, "attempts": 0};
            }
            if (e.teamIndex == ourTeamIndex) {
                ownBuffStatsIndividual[b.abilityId].attempts++;
                ownBuffStatsIndividual[b.abilityId].successes += !alive;
            } else {
                opponentBuffStatsIndividual[b.abilityId].attempts++;
                opponentBuffStatsIndividual[b.abilityId].successes += !alive;
            }
        });
        e.defender.units.forEach(u => {
            if (!ownDefendingCharacterStats[u.unitId]) {
                ownDefendingCharacterStats[u.unitId] = {"successes": 0, "attempts": 0};
            }
            if (!opponentDefendingCharacterStats[u.unitId]) {
                opponentDefendingCharacterStats[u.unitId] = {"successes": 0, "attempts": 0};
            }
            if (e.teamIndex == opponentTeamIndex) {
                ownDefendingCharacterStats[u.unitId].attempts++;
                ownDefendingCharacterStats[u.unitId].successes += !alive;
            } else {
                opponentDefendingCharacterStats[u.unitId].attempts++;
                opponentDefendingCharacterStats[u.unitId].successes += !alive;
            }
        });
        e.attacker.units.forEach(u => {
            if (!ownAttackingCharacterStats[u.unitId]) {
                ownAttackingCharacterStats[u.unitId] = {"successes": 0, "attempts": 0};
            }
            if (!opponentAttackingCharacterStats[u.unitId]) {
                opponentAttackingCharacterStats[u.unitId] = {"successes": 0, "attempts": 0};
            }
            if (e.teamIndex == ourTeamIndex) {
                ownAttackingCharacterStats[u.unitId].attempts++;
                ownAttackingCharacterStats[u.unitId].successes += !alive;
            } else {
                opponentAttackingCharacterStats[u.unitId].attempts++;
                opponentAttackingCharacterStats[u.unitId].successes += !alive;
            }
        });
        let mowId = (e.attacker.machineOfWar || {unitId: "None"}).unitId;
        if (!ownAttackingMowStats[mowId]) {
            ownAttackingMowStats[mowId] = {"successes": 0, "attempts": 0};
        }
        if (!opponentAttackingMowStats[mowId]) {
            opponentAttackingMowStats[mowId] = {"successes": 0, "attempts": 0};
        }
        if (e.teamIndex == ourTeamIndex) {
            ownAttackingMowStats[mowId].attempts++;
            ownAttackingMowStats[mowId].successes += !alive;
        } else {
            opponentAttackingMowStats[mowId].attempts++;
            opponentAttackingMowStats[mowId].successes += !alive;
        }
        mowId = (e.defender.machineOfWar || {unitId: "None"}).unitId;
        if (mowId=="None") {
            console.log("No MoW on defence: " + defenderName)
        }
        if (!ownDefendingMowStats[mowId]) {
            ownDefendingMowStats[mowId] = {"successes": 0, "attempts": 0};
        }
        if (!opponentDefendingMowStats[mowId]) {
            opponentDefendingMowStats[mowId] = {"successes": 0, "attempts": 0};
        }
        if (e.teamIndex == opponentTeamIndex) {
            ownDefendingMowStats[mowId].attempts++;
            ownDefendingMowStats[mowId].successes += !alive;
        } else {
            opponentDefendingMowStats[mowId].attempts++;
            opponentDefendingMowStats[mowId].successes += !alive;
        }
        return `<tr><td>${e.zone.visualId}</td><td>${attackerName}</td>
        <td>${e.attacker.units.map(u => unitNameImage(u.unitId, undefined, u.remainingHPAfter ? "" : "dead")).join("")}${e.attacker.machineOfWar ? unitNameImage(e.attacker.machineOfWar.unitId, undefined, alive ? "dead" : undefined) : ""}</td>
        <td class="damage">${damageToFixedThousands(e.attacker.lineupPower)}</td>
        <td>${defenderName}</td>
        <td>${e.defender.units.map(u => u.remainingHPBefore ? unitNameImage(u.unitId, undefined, u.remainingHPAfter ? "" : "dead") : "").join("")}${e.defender.machineOfWar ? unitNameImage(e.defender.machineOfWar.unitId, undefined, alive ? "" : "dead") : ""}</td>
        <td class="damage">${damageToFixedThousands(e.defender.lineupPower)}</td>
        <td>${(e.buffs || []).map(b => `<img class="unitThumbnail" title="${b.abilityId}" src="images/${b.abilityId}.png" />`).join("")}</td>
        `;
    }
    rowsAttack = events.filter(e => e.teamIndex == ourTeamIndex).map(attackRow);
    rowsDefence = events.filter(e => e.teamIndex == opponentTeamIndex).map(attackRow);
    console.log(data);
    document.getElementById("current-view").innerHTML = `<table>
    <tr><td colspan=6>${data.guildData[0].name} vs. ${data.guildData[1].name}</td></tr>
    <tr><td>Location</td><td colspan=3>Attacker</td><td colspan=3>Defender</td></tr>
    ${rowsAttack.join("\n")}
    </table>

    <table>
    <tr><td colspan=6>${data.guildData[0].name} vs. ${data.guildData[1].name}</td></tr>
    <tr><td>Location</td><td colspan=3>Attacker</td><td colspan=3>Defender</td></tr>
    ${rowsDefence.join("\n")}
    </table>
    
    <table>
    <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><th colspan="3">Ratio</th></tr>
    <tr><td>Name</td><td>Wins</td><td>Attempts</td><td>Kills</td><td><img class="unitThumbnail" src="images/${medicaeBuff}.png" /></td><td><img class="unitThumbnail dead" src="images/${medicaeBuff}.png" /></td><td>Overall</td></tr>
    ${Object.keys(attackerStats).sort((n1,n2) => {
        let s1 = attackerStats[n1];
        let s2 = attackerStats[n2];
        return s1.successes==s2.successes ? (s1.kills==s2.kills ? (n1-n2) : (s2.kills-s1.kills)) : s2.successes-s1.successes;
    }).map(n => {
        if (!ourMembers.has(n)) return "";
        return `<tr>
          <td>${n}</td>
          <td>${attackerStats[n].successes}</td>
          <td>${attackerStats[n].attempts}</td>
          <td>${attackerStats[n].kills}</td>
          <td>${attackerStats[n].successesBeforeMedicae == 0 ? "" : (attackerStats[n].attemptsBeforeMedicae/attackerStats[n].successesBeforeMedicae).toFixed(2)}</td>
          <td>${attackerStats[n].successesBeforeMedicae == attackerStats[n].successes ? "" : ((attackerStats[n].attempts-attackerStats[n].attemptsBeforeMedicae)/(attackerStats[n].successes-attackerStats[n].successesBeforeMedicae)).toFixed(2)}</td>
          <td>${(attackerStats[n].attempts/attackerStats[n].successes).toFixed(2)}</td></tr>`;
    }).join("\n")}
    </table>

    <table>
    <tr><td>Name</td><td>Defenses</td><td>Attempts</td><td>Ratio</td></tr>
    ${Object.keys(defenderStats).sort((n1,n2) => {
        let s1 = defenderStats[n1];
        let s2 = defenderStats[n2];
        let r1 = s1.successes/s1.attempts;
        let r2 = s2.successes/s2.attempts;
        return r2 == r1 ? n1-n2 : r2 - r1;
    }).map(n => {
        if (!ourMembers.has(n)) return "";
        return `<tr><td>${n}</td><td>${defenderStats[n].successes}</td><td>${defenderStats[n].attempts}</td><td class="damage">${(defenderStats[n].attempts / (defenderStats[n].attempts - defenderStats[n].successes)).toFixed(1)}</td></tr>`;
    }).join("\n")}
    </table>

    <table>
    <tr><td>&nbsp;</td><th colspan="2">Ticket Ratio</th>
    <tr><td># buffs</td><td>Attack</td><td>Defense</td></tr>
    ${range(0, Math.max(ownBuffStats.length, opponentBuffStats.length)-1, 1).map(n => {
        let own = (ownBuffStats[n] || {successes: 0, attempts: 0});
        let opp = (opponentBuffStats[n] || {successes: 0, attempts: 0});
        return `<tr><td>${n}</td><td>${(own.attempts/own.successes).toFixed(2)}</td><td>${(opp.attempts/opp.successes).toFixed(2)}</td></tr>`;
    }).join("\n")}
    <tr><td>Overall</td><td>${(numAttackAttempts/numAttackWins).toFixed(2)}</td><td>${(numDefenceAttempts/numDefenceWins).toFixed(2)}</td></tr>
    </table>

    <table>
    <tr><td>&nbsp;</td><th colspan="2">Ticket Ratio</th>
    <tr><td>Buff</td><td>Attack</td><td>Defense</td></tr>
    ${Object.keys(ownBuffStatsIndividual).sort((b1,b2) => {
        let o1 = ownBuffStatsIndividual[b1];
        let o2 = ownBuffStatsIndividual[b2];
        return (o1.attempts/o1.successes) - (o2.attempts/o2.successes);
    }).map(b => {
        let own = ownBuffStatsIndividual[b];
        let opp = opponentBuffStatsIndividual[b];
        return `<tr><td><img class="unitThumbnail" title="${b}" src="images/${b}.png" /></td><td>${(own.attempts/own.successes).toFixed(2)}</td><td>${(opp.attempts/opp.successes).toFixed(2)}</td></tr>`;
    }).join("\n")}
    <tr><td>Overall</td><td>${(numAttackAttempts/numAttackWins).toFixed(2)}</td><td>${(numDefenceAttempts/numDefenceWins).toFixed(2)}</td></tr>
    </table>

    <table>
    <tr><td>&nbsp;</td><th colspan="2">Ticket Ratio</th>
    <tr><td>Defender</td><td>EN</td><td>Opponent</td></tr>
    ${Object.keys(ownDefendingCharacterStats).sort((b1,b2) => {
        let o1 = ownDefendingCharacterStats[b1];
        let o2 = ownDefendingCharacterStats[b2];
        let opp1 = opponentDefendingCharacterStats[b1];
        let opp2 = opponentDefendingCharacterStats[b2];
        return o1.successes && o2.successes ? (o1.attempts/o1.successes) - (o2.attempts/o2.successes) :
               o2.successes==o1.successes ? (opp1.attempts/opp1.successes) - (opp2.attempts/opp2.successes) : o2.successes-o1.successes;
    }).map(b => {
        let own = ownDefendingCharacterStats[b];
        let opp = opponentDefendingCharacterStats[b];
        return `<tr><td>${unitNameImage(b)}</td><td>${(own.attempts/own.successes).toFixed(2)}</td><td>${(opp.attempts/opp.successes).toFixed(2)}</td></tr>`;
    }).join("\n")}
    <tr><td>Overall</td><td>${(numAttackAttempts/numAttackWins).toFixed(2)}</td><td>${(numDefenceAttempts/numDefenceWins).toFixed(2)}</td></tr>
    </table>

    <table>
    <tr><td>&nbsp;</td><th colspan="2">Ticket Ratio</th>
    <tr><td>Attacker</td><td>EN</td><td>Opponent</td></tr>
    ${Object.keys(ownAttackingCharacterStats).sort((b1,b2) => {
        let o1 = ownAttackingCharacterStats[b1];
        let o2 = ownAttackingCharacterStats[b2];
        let opp1 = opponentAttackingCharacterStats[b1];
        let opp2 = opponentAttackingCharacterStats[b2];
        return o1.successes && o2.successes ? (o1.attempts/o1.successes) - (o2.attempts/o2.successes) :
               o2.successes==o1.successes ? (opp1.attempts/opp1.successes) - (opp2.attempts/opp2.successes) : o2.successes-o1.successes;
    }).map(b => {
        let own = ownAttackingCharacterStats[b];
        let opp = opponentAttackingCharacterStats[b];
        return `<tr><td>${unitNameImage(b)}</td><td>${(own.attempts/own.successes).toFixed(2)}</td><td>${(opp.attempts/opp.successes).toFixed(2)}</td></tr>`;
    }).join("\n")}
    <tr><td>Overall</td><td>${(numAttackAttempts/numAttackWins).toFixed(2)}</td><td>${(numDefenceAttempts/numDefenceWins).toFixed(2)}</td></tr>
    </table>

    <table>
    <tr><td>&nbsp;</td><th colspan="2">Ticket Ratio</th>
    <tr><td>Attacker</td><td>EN</td><td>Opponent</td></tr>
    ${Object.keys(ownAttackingMowStats).sort((b1,b2) => {
        let o1 = ownAttackingMowStats[b1];
        let o2 = ownAttackingMowStats[b2];
        let opp1 = opponentAttackingMowStats[b1];
        let opp2 = opponentAttackingMowStats[b2];
        return o1.successes && o2.successes ? (o1.attempts/o1.successes) - (o2.attempts/o2.successes) :
               o2.successes==o1.successes ? (opp1.attempts/opp1.successes) - (opp2.attempts/opp2.successes) : o2.successes-o1.successes;
    }).map(b => {
        let own = ownAttackingMowStats[b];
        let opp = opponentAttackingMowStats[b];
        return `<tr><td>${b!="None" ? unitNameImage(b) : b}</td><td>${(own.attempts/own.successes).toFixed(2)}</td><td>${(opp.attempts/opp.successes).toFixed(2)}</td></tr>`;
    }).join("\n")}
    <tr><td>Overall</td><td>${(numAttackAttempts/numAttackWins).toFixed(2)}</td><td>${(numDefenceAttempts/numDefenceWins).toFixed(2)}</td></tr>
    </table>

    <table>
    <tr><td>&nbsp;</td><th colspan="2">Ticket Ratio</th>
    <tr><td>Defender</td><td>EN</td><td>Opponent</td></tr>
    ${Object.keys(ownDefendingMowStats).sort((b1,b2) => {
        let o1 = ownDefendingMowStats[b1];
        let o2 = ownDefendingMowStats[b2];
        let opp1 = opponentDefendingMowStats[b1];
        let opp2 = opponentDefendingMowStats[b2];
        return o1.successes && o2.successes ? (o1.attempts/o1.successes) - (o2.attempts/o2.successes) :
               o2.successes==o1.successes ? (opp1.attempts/opp1.successes) - (opp2.attempts/opp2.successes) : o2.successes-o1.successes;
    }).map(b => {
        let own = ownDefendingMowStats[b];
        let opp = opponentDefendingMowStats[b];
        return `<tr><td>${b!="None" ? unitNameImage(b) : b}</td><td>${(own.attempts/own.successes).toFixed(2)}</td><td>${(opp.attempts/opp.successes).toFixed(2)}</td></tr>`;
    }).join("\n")}
    <tr><td>Overall</td><td>${(numAttackAttempts/numAttackWins).toFixed(2)}</td><td>${(numDefenceAttempts/numDefenceWins).toFixed(2)}</td></tr>
    </table>
    `;
}

function getTokenTimes(currentRaid, entries, guildData) {
    const ts = Date.now() / 1000;
    const tsBombsAgo = ts - 18*60*60;

    const raidStart = currentRaid.season == 70 ? season70start : currentRaid.entries[0].startedOn-24*60*60; // Pretend we start at previous season end
    const raidEnd = raidStart+14*24*60*60;

    var allMembers = {};
    var legendaryTokenCount = {};
    var damageCount = {};
    var playerBombTimes = {};
    var playerRaidTimes = {};
    var maxBombDamage = 0;
    var minBombDamage = undefined;
    var hasBomb = {};

    guildData.guild.members.forEach(member => {
        allMembers[member.userName] = true;
    });

    entries.forEach(entry => {
        var name = entry.userName;
        if (entry.startedOn > raidEnd) {
            return;
        }
        if (entry.damageType=="Bomb" && entry.damageDealt > maxBombDamage) {
            maxBombDamage = entry.damageDealt;
            if (minBombDamage==undefined) {
                minBombDamage = maxBombDamage;
            }
        }
        if (entry.damageType=="Bomb" && entry.startedOn < raidStart) {
            return;
        }
        if (entry.damageType=="Bomb" && (entry.damageDealt < minBombDamage) && entry.remainingHp) {
            minBombDamage = entry.damageDealt;
        }
        var playerTimes = entry.damageType=="Bomb" ? playerBombTimes : playerRaidTimes;
        if (!playerTimes[name]) {
            playerTimes[name] = [];
        }
        if (entry.startedOn >= raidStart && entry.damageType=="Battle" && entry.tier>=4) {
            if (!damageCount[name]) {
                damageCount[name] = 0;
            }
            damageCount[name] = (damageCount[name]||0) + entry.damageDealt;
            legendaryTokenCount[name] = 1 + (legendaryTokenCount[name]||0);
        }
        playerTimes[name].push(entry.startedOn);
        allMembers[name] = true;
    });

    console.log(`Bomb damage is ${minBombDamage}~${maxBombDamage}`)

    var playerBombTimesInverse = Object.keys(allMembers).map(id => {
        var bombs = playerBombTimes[id] || [];
        var t = bombs.at(-1) || 0;
        hasBomb[id] = t < tsBombsAgo;
        return [t < tsBombsAgo ? 0 : t, id, bombs.length];
    });
    playerBombTimesInverse.sort(function (a,b) {
        return a[0]==b[0] ? (a[1]==b[1] ? a[2].localCompare(b[2]) : a[1] - b[1]) : a[0] - b[0];
    });
    return {legendaryTokenCount: legendaryTokenCount, damageCount: damageCount, playerRaidTimes: playerRaidTimes, maxBombDamage: maxBombDamage, minBombDamage: minBombDamage, playerBombTimesInverse: playerBombTimesInverse, tsBombsAgo: tsBombsAgo, raidStart: raidStart, ts: ts, hasBomb: hasBomb};
}

