// View functions

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

const viewCurrentTop = async function(N, currentRaid) {
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

const viewRoster = function(currentRaid) {
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
}

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
}

function viewSimulation(currentRaid) {
    const startTokens = 2;
    const {playerDamageAvg: playerDamageAvg, playerDamageScaled: playerDamageScaled, playerDamageByBoss: playerDamageByBoss, playerActualTokenUsage: playerActualTokenUsage, playerTokens: playerTokens, playerTokenValue: playerTokenValue, playerTokensUsed: playerTokensUsed, guildAverageDamage: guildAverageDamage, bossNames: bossNames, bossHealth: bossHealth} = getOptimalWeights(currentRaid, startTokens, false, currentRaid.season);
    let tokenRefreshes = 26-startTokens;
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
    }
    function actualTokenUsageCell(player, boss, encounterIndex) {
        return `<td ${encounterIndex==0 ? 'colspan="2" ' : ''}class="tokenCount${encounterIndex == 0 ? "TopRow" : ""}">${playerActualTokenUsage[player][boss][encounterIndex]}</td>`;
    }
    rows = Object.keys(playerTokensUsed).sort().map(player => {
        cells1 = range(0,4,1).map(boss => `<td><table class="tokenCountTable"><tr>${tokenUsageCell(player,boss,0)}</tr><tr>${tokenUsageCell(player,boss,1)}${tokenUsageCell(player,boss,2)}</tr></table></td>`).join("");
        return `<tr>${memberCell(player, currentRaid.season)}${cells1}</tr>`;
    });
    document.getElementById("current-view").innerHTML = `<table class="optimal"><caption>Ticket usage simulator for season ${currentRaid.season} - kills ${bossNames[lastKilledBoss[0]]}#${lastKilledBoss[1]}</caption>
    <tr><th>&nbsp;</th><th colspan="5">Simulated</th></tr>
    <tr><th>Name</th>${x = range(1,5,1).map(boss => `<th>L${boss}</th>`).join(""), x}</tr>
    ${rows.join("\n")}
    </table>`;
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
}

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
    const guildName = currentGuildToGuildName.get(currentGuild);
    const ourTeamIndex = data.guildData[0].name == guildName ? 1 : 2;
    if (ourTeamIndex == 2 && data.guildData[1].name != guildName) {
        document.getElementById("current-view").innerHTML = `The guild is not selected for this GW`;
    }
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
        if (e.attacker.units == undefined) {
            e.attacker.units = [];
        }
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