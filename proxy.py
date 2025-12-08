#!/usr/bin/env python3

import json
import os
import sys
from secrets import api_get_raw, keys, members, playerids, cacheRaidData, stripGuildRaidData
from urllib import parse

def error(message=""):
  print('Status: 500 Error\r\n')
  print(message)
  sys.exit(0)

api_key = os.environ.get('HTTP_X_API_KEY','')
user_id = os.environ.get('HTTP_X_USER_ID','')

membersByName = {v["name"]: k for k, v in members.items()}

if user_id not in playerids:
  error("User ID is not in the member list")

with open(".secrets/playerData/%s.key" % user_id, "r") as fin:
  if api_key != fin.read().strip():
    error("Wrong API key. Try logging in again")

query = dict(parse.parse_qsl(os.environ.get("QUERY_STRING","")))
api_entrypoint = query.get("url","")
guild_name = query.get("guild", "")
api_key = keys.get(guild_name, "")
if api_entrypoint not in ["units","tokens","inventory","summary","gw"] and api_key == "":
  error("Unknown guild")
if api_key and not api_entrypoint.startswith("/api/v1/guild"):
  error("Entrypoint is not guild or guildRaid:"+api_entrypoint)

def cacheRaidDataWithError(guild_name, season):
  res = cacheRaidData(guild_name, season)
  if res:
    error(res)


if api_entrypoint.startswith("/api/v1/guildRaid/"):
  season = int(api_entrypoint.split("/")[-1])
  cacheRaidDataWithError(guild_name, season)
  with open(".season/%s/%s.json" % (guild_name,season),"r") as fin:
    data = fin.read()
  print("Cache-Control: max-age=36000")
elif api_entrypoint == "units":
  with open(".secrets/playerunits.json","r") as fin:
    data = fin.read()
  print("Cache-Control: max-age=3600")
elif api_entrypoint == "summary":
  with open(".secrets/summary.json","r") as fin:
    data = fin.read()
  print("Cache-Control: max-age=36000")
elif api_entrypoint == "inventory":
  with open(".secrets/inventory.json","r") as fin:
    data = fin.read()
  print("Cache-Control: max-age=3600")
elif api_entrypoint == "tokens":
  playerName = query.get("player")
  id = membersByName.get(playerName) or playerName
  if (id != user_id) and (playerids.get(user_id,"MEMBER") not in ["ADMIN","LEADER","CO_LEADER","OFFICER"]):
    error("Insufficient rights to user data")
  f = ".secrets/playerData/%s.json" % id
  data = {}
  if ("/" not in id) and os.path.exists(f):
    with open(f,"r") as fin:
      data = json.load(fin)
    del data["player"]["progress"]["campaigns"]
    data = {"tokens": data["player"]["progress"], "lastUpdatedOn": data["metaData"]["lastUpdatedOn"]}
  data = json.dumps(data)
elif api_entrypoint == "gw":  
  with open(".secrets/.gw-filtered/%s" % query.get("gw","").replace("..",""),"r") as fin:
    data = fin.read()
  print("Cache-Control: max-age=36000")
else:
  data = api_get_raw(api_entrypoint, guild_name)

def replaceUserId(member):
  id = member["userId"]
  del member["userId"]
  member["userName"] = members.get(id, {"name": id.split("-")[0]}).get("name")

if api_entrypoint == "/api/v1/guild":
  guildData = json.loads(data)
  for season in guildData["guild"]["guildRaidSeasons"][0:-1]:
    cacheRaidDataWithError(guild_name, season)
  for m in guildData["guild"]["members"]:
    replaceUserId(m)
  del guildData["guild"]["guildId"]
  del guildData["guild"]["guildTag"]
  data = json.dumps(guildData, indent=4, sort_keys=True)
elif api_entrypoint == "/api/v1/guildRaid":
  raidData = json.loads(data)
  for season in range(70, raidData["season"]):
    cacheRaidDataWithError(guild_name, season)
  stripGuildRaidData(raidData)
  data = json.dumps(raidData, indent=4, sort_keys=True)

print("Content-Type: text/json\n")
print(data)
