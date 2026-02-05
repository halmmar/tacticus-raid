// Unit and team related functions

const unitNameImage = function(id, title, _class) {
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

const unitsUsedStr = function(e) {
    return getUnitsUsedSorted(e).map(id => unitNameImage(id)).join("");
};

function unitsUsedSelector(e) {
    var units = e["heroDetails"].map(h => h["unitId"]);
    if (e["machineOfWarDetails"]) {
        units.push(e["machineOfWarDetails"]["unitId"]);
    }
    return units.join(",");
}

const teamPower = function(e) {
    power = e["heroDetails"].reduce((a, h) => a+h["power"], 0) + (e["machineOfWarDetails"]||{"power":0})["power"];
    return Math.round(power/1000) + "k";
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