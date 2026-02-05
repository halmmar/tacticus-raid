var vm = require("vm");
var fs = require('fs');

var data = fs.readFileSync('./tacticusraid.js');
const script = new vm.Script(data);
script.runInThisContext();

const files = fs.readdirSync(".secrets/.season", { recursive: true });

res = {};

files.forEach(f => {
    f = ".secrets/.season/" + f;
    if (!f.endsWith(".json")) {
        return;
    }
    var t = f.split("/");
    var seasonNum = +t[3].split(".")[0];
    var raid = fixMythicTier(JSON.parse(fs.readFileSync(f, 'utf8')));
    raid.entries.forEach(e => {
        if (e.damageType != 'Battle') {
            return;
        }
        if (e.tier<4 || e.set != 5 /*|| e.encounterIndex == 0*/) {
            return;
        }
        let boss = bossFriendlyName(e.type, e.encounterIndex);
        let bestDmg = Math.max(1.0*e.damageDealt, res[boss] ? res[boss][0] : 0);
        res[boss] = [bestDmg, bestDmg != e.damageDealt ? res[boss][1] : 0==e.remainingHp, e.maxHp, e.encounterIndex==0];
    })
});

console.log(res)

Object.entries(res).sort((a,b) => b[1][3] - a[1][3] ? b[1][3] - a[1][3] : b[1][0]-a[1][0]).forEach(e => {
    console.log(`${e[0]}: ${e[1][0]}${e[1][1] ? "🪦" : ""} (${Math.floor(e[1][0]/e[1][2]*100.0)}%)`);
})