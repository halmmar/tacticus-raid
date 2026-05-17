// Main entry point and view controller

const updateCurrentView = async function(newMode) {
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
                    var tsNow = new Date()/timeStampDivisor;
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