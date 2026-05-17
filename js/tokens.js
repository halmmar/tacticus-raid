// Token calculation functions

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
}

function getTokenTimes(currentRaid, entries, guildData) {
    const ts = Date.now() / timeStampDivisor;
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
