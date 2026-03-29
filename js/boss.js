// Boss-related helper functions

const bossFriendlyName = function(name, encounterIndex) {
    return (bossFriendlyNames[name] || [name, name + " left prime", name + " right prime"])[encounterIndex];
};

function ranksImage(rank, id) {
    return `<img class="unitThumbnail" src="images/ranks/${unitNames.mows.includes(id) ? "mow" : ranksName[rank].toLowerCase()}.png" />`
}

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
}

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
    let guildAverageDamage = [[[],[],[]],[[],[],[]],[[],[],[]],[[],[],[]],[[],[],[]],[[],[],[]],[[],[],[]]];
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
                playerDamageScaled[player] = playerDamageScaled[player] || [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]];
                playerDamageScaled[player][i][encounterIndex] = playerAvg ? playerAvg / guildAverageDamage[i][encounterIndex] : 0;
                playerDamageAvg[player] = playerDamageAvg[player] || [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]];
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
