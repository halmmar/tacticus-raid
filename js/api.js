// API and data fetching functions

const fetchJSON = function(url) {
    return fetch(url, {
        method: "GET",
        headers: {"X-USER-ID": localStorage.getItem("user-id"), "X-API-KEY": localStorage.getItem("api-key")}
    }).then(response => {
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        return response.json();
    });
};

const createSeason = function(i) {
    var id = `seasonSelectSeason${i}`;
    if (i && !document.getElementById(id)) {
        seasonSelect.innerHTML += `<option id="${id}" value="${i}">Season ${i}</option>`
    }
    allSeenSeasons[i] = i;
};

const notifyGuildData = function(guild) {
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
}

async function fetchSelectedSeason(guilds, seasonNumber) {
    guilds.split(",").forEach(name => {
        var guild = guildsData[name];

        if (seasonNumber == 0) {
            guild[seasonNumber] = guild[seasonNumber] || fetchJSON(`proxy.py?url=/api/v1/guildRaid&guild=${name}`).then(fixMythicTier).then(notifyCurrentSeason);
        } else {
            guild[seasonNumber] = guild[seasonNumber] || fetchJSON(demo ? `demo/${seasonNumber}.json` : `proxy.py?url=/api/v1/guildRaid/${seasonNumber}&guild=${name}`).then(fixMythicTier);
        }
    });
}

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
}

async function updateSeason() {
    currentSeason = +document.getElementById("seasonSelect").value;
    localStorage.setItem("seasonSelect", currentSeason);
    await fetchSelectedSeason(currentGuild, currentSeason);
}

const initialize = async function() {
    if (demo) {
        playerSelected = userName = "Rilak";
        userGuildRole = "OFFICER";
        highlightUser = true;
        document.getElementById("guildSelect").value = "Demo";
        currentSeason = 83;
    } else {
        if (localStorage.getItem("user-id") == undefined || localStorage.getItem("api-key") == undefined || localStorage.getItem("user-name")==undefined) {
            currentMode = 'login';
            initialized = true;
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
    config.guildsList.filter(guild => guild[2]).forEach(guild => {
        currentGuildToGuildName.set(guild[0], guild[2]);
    });
    document.getElementById("guildSelect").innerHTML = config.guildsList.map(guild => `<option value="${guild[0]}">${guild[1]}</option>`).join("\n");

    updateGuild();

    await fetchSelectedSeason(currentGuild, currentSeason);

    initialized = true;

    updateCurrentView();
};