#!/usr/bin/env python3

import json
import requests
import os

keys = {}
members = {}
playerids = {}

def init():
  global keys, members, playerids
  with open(".secrets/api.json", "r") as fin:
    keys = json.load(fin)
  with open(".secrets/members.json", "r") as fin:
    members = json.load(fin)
  try:
    with open(".secrets/playerids.json", "r") as fin:
      playerids = json.load(fin)["playerIds"]
  except:
    pass

def api_get_raw(url, key="EN"):
  return requests.get('https://api.tacticusgame.com' + url, headers={'accept': 'application/json', 'X-API-KEY': keys[key]}).content.decode('utf-8')

def api_get(url, key="EN"):
  return requests.get('https://api.tacticusgame.com' + url, headers={'accept': 'application/json', 'X-API-KEY': keys[key]}).json()

def stripGuildRaidData(raid):
  for entry in raid["entries"]:
    id = entry["userId"]
    del entry["userId"]
    entry["userName"] = members.get(id, {"name": id.split("-")[0]}).get("name")

def cacheRaidData(guildId, season):
  fName = ".season/%s/%d.json" % (guildId,season)
  rawname = ".secrets/" + fName
  t1 = os.path.getmtime('.secrets/members.json')
  if not os.path.exists(rawname):
    os.makedirs(os.path.dirname(rawname), exist_ok=True)
    data2 = json.loads(api_get_raw('/api/v1/guildRaid/%d' % season, guildId))
    if "entries" not in data2:
      return ("Missing raid data for %s %s: %s" % (season, guildId, data2))
    with open(rawname, 'w') as fout:
      json.dump(data2, fout)
  elif (not os.path.exists(fName)) or os.path.getmtime(fName) < t1:
    with open(rawname, "r") as fin:
      data2 = json.load(fin)
  if (not os.path.exists(fName)) or os.path.getmtime(fName) < t1:
    os.makedirs(os.path.dirname(fName), exist_ok=True)
    if "entries" not in data2:
      return ("Missing raid data for %s %s: %s" % (season, guildId, data2))
    stripGuildRaidData(data2)
    with open(fName, 'w') as fout:
      json.dump(data2, fout)

init()
