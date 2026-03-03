var vm = require("vm");
var fs = require('fs');

function sortOnKeys(dict) {

    var sorted = [];
    for(var key in dict) {
        sorted[sorted.length] = key;
    }
    sorted.sort();

    var tempDict = {};
    for(var i = 0; i < sorted.length; i++) {
        tempDict[sorted[i]] = dict[sorted[i]];
    }

    return tempDict;
}

["./js/utils.js","./js/constants.js","./js/api.js","./js/state.js","./js/boss.js","./js/views.js"].forEach(f => {
    var data = fs.readFileSync(f);
    const script = new vm.Script(data);
    script.runInThisContext();
});

const files = fs.readdirSync(".secrets/.season", { recursive: true });

obj = {}

files.forEach(f => {
    f = ".secrets/.season/" + f;
    console.log(f);
    if (!f.endsWith(".json")) {
        return;
    }
    var t = f.split("/");
    var guild = t[2];
    obj[guild] = obj[guild] || {};
    var seasonNum = +t[3].split(".")[0];
    var raid = fixMythicTier(JSON.parse(fs.readFileSync(f, 'utf8')));
    weights = getOptimalWeights(raid, undefined, true, seasonNum);
    obj[guild][seasonNum] = weights.guildAverageDamage;
});

var json = JSON.stringify(obj);

fs.writeFileSync('.secrets/summary.json', json, 'utf8');

const gwFiles = fs.readdirSync(".secrets/gw", { recursive: true });

wars = {}
obj = {}

gwFiles.forEach(f => {
    f = ".secrets/gw/" + f;
    var war = filterGWData(JSON.parse(fs.readFileSync(f, 'utf8')));
    var g1 = war.guildData[0].name;
    var g2 = war.guildData[1].name;
    var date = new Date(war.activityLogs[0].createdOn);
    var warName = `${date.toISOString().split("T")[0]} ${g1} vs. ${g2}`;
    var fname = warName.replace(/[^a-zA-Z0-9. -\s]/g, '') + ".json";
    wars[warName] = fname;
    fs.writeFileSync(`.secrets/.gw-filtered/${fname}`, JSON.stringify(war), 'utf8');
});

wars = sortOnKeys(wars);

fs.writeFileSync(`guildwars.json`, JSON.stringify(wars), 'utf8');

console.log(wars)
