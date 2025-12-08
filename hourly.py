#!/usr/bin/env python3

import json
import glob
import os
import requests
import shutil
import sys
from secrets import api_get, keys, members, cacheRaidData
from pathlib import Path

def error(message=""):
  print('Status: 500 Error\r\n\r\n')
  print(message)
  sys.exit(0)

allMembers = {}

res = api_get("/api/v1/guildRaid", key=list(keys.keys())[0])
currentSeason = int(res["season"])

for guild in keys.keys():
  res = api_get("/api/v1/guild", key=guild)
  if "guild" not in res:
    raise Exception("/guild entrypoint not working for %s" % guild)
  for member in res["guild"]["members"]:
    allMembers[member["userId"]] = members.get(member["userId"],{}).get("role",member["role"])
  for season in range(70,currentSeason):
    message = cacheRaidData(guild, season)
    if message:
      raise Exception(message)
  

with open(".secrets/playerids.json","w") as fout:
  json.dump({"playerIds": allMembers}, fout)

playerInfo = {}
units = {}
oldUnits = None
allUpgradeNames = set()
upgradeIDs = {}
upgrades = {}

def dumpUnits():
  return json.dumps(units, indent=4, sort_keys=True)

with open("unitnames.json","r") as fin:
  units = json.load(fin)
  oldUnits = dumpUnits()

for f in glob.glob(".secrets/playerData/*.key"):
  playerId = os.path.basename(f).replace(".key", "").strip()
  if playerId not in allMembers:
    continue
  jsonfile = f.replace(".key",".json")
  with open(f,"r") as fin:
    api_key = fin.read().strip()
  playerData = requests.get('https://api.tacticusgame.com/api/v1/player', headers={'accept': 'application/json', 'X-API-KEY': api_key}).json()
  if playerData.get("error")=="Forbidden":
    continue
  with open(jsonfile,"w") as fout:
    json.dump(playerData, fout)
  playerName = members[playerId]["name"]
  playerInfo[playerName] = {}
  if "player" not in playerData:
    print("%s not returning correct data?" % playerName)
    print(playerData)
  for unit in playerData["player"]["units"]:
    id = unit["id"]
    abilities = [ability["id"] for ability in unit["abilities"]]

    units["names"][id] = {"name": unit["name"], "abilities": abilities, "faction": unit["faction"], "grandAlliance": unit["grandAlliance"]}

    del unit["id"]
    del unit["xp"]
    del unit["items"]
    del unit["name"]
    del unit["faction"]
    del unit["grandAlliance"]
    playerInfo[playerName][id] = unit
  upgradesThisPlayer = {}
  for upgrade in playerData["player"]["inventory"]["upgrades"]:
    allUpgradeNames.add(upgrade["name"])
    upgradeIDs[upgrade["name"]] = upgrade["id"]
    upgradesThisPlayer[upgrade["name"]] = upgrade["amount"]
  upgrades[playerName] = upgradesThisPlayer

  Path(f).touch() 

allUpgradeNames = list([u, upgradeIDs[u]] for u in sorted(list(allUpgradeNames)))

for id in upgrades.keys():
  d = upgrades[id]
  upgrades[id] = [d.get(u[0],0) for u in allUpgradeNames]

with open(".secrets/inventory.json","w") as fout:
  fout.write(json.dumps({"names": allUpgradeNames, "players": upgrades},  sort_keys=True))

mows = set(units.get("mows") or [])

for f in glob.glob(".secrets/season/*/*.json"):
  with open(f,"r") as fin:
    season = json.load(fin)
  for entry in season.get("entries",""):
    id = (entry.get("machineOfWarDetails") or {}).get("unitId")
    if id is not None:
      mows.add(id)

units["mows"] = sorted(list(mows))

newUnits = dumpUnits()
if oldUnits.strip() != newUnits.strip():
  with open("unitnames.json","w") as fout:
    fout.write(newUnits)

with open(".secrets/playerunits.json","w") as fout:
  json.dump(playerInfo, fout)

with open(".secrets/config.json","r") as fin:
  config = json.load(fin)

with open(".secrets/movement.json","r") as fin:
  movement = json.load(fin)

discordNames = {}
for m in members.keys():
  n = members[m].get("name") 
  d = members[m].get("discord")
  if n and d:
    discordNames[n] = d

config['discordNames'] = discordNames
config['movement'] = movement

with open("config.json","w") as fout:
  fout.write(json.dumps(config,  sort_keys=True))

def idToPortrait(word, name):
  words = "".join([c if c.islower() else ("_"+c.lower()) for c in word]).split("_")
  return (words[0],[name.lower(), "".join(words[1:])] + words[1:])

for (id,unit) in units["names"].items():
  name = unit["name"]
  f = "images/%s.png" % name
  if not os.path.exists(f):
    (faction,names) = idToPortrait(id, name)
    faction = {"tau": "tauta", "orks": "orkss", "eldar": "aelda"}.get(faction, faction)
    names = {"Imospekh": ["hexmark"], "Sibyll": ["psyker"]}.get(name, names)
    found = False
    for name in names:
      spFile = ".snowprint_assets/characters/ui_image_RoundPortrait_%s_%s_01.png" % (faction,name)
      if os.path.exists(spFile):
        print("Found unit thumbnail:", id, f)
        shutil.copyfile(spFile, f)
        found = True
        break
      print("Did not find:", spFile)
    if not found:
      print("Missing unit thumbnail:", id, name, f)
