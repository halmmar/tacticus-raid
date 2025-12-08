#!/usr/bin/env python3

import json
import glob
import os
import sys
from secrets import api_get, keys, members
from pathlib import Path
import hashlib
import random

ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
salt = ''.join(random.choice(ALPHABET) for i in range(16))

def anonymize(name):
  return str(hashlib.md5((salt+name).encode("utf-8")).hexdigest()[-6:])

def getUserId(id):
  return members.get(id, {"name": id.split("-")[0]}).get("name")

guild = list(keys.keys())[0]
res = api_get("/api/v1/guild", key=guild)
del res["guild"]["guildId"]
del res["guild"]["guildTag"]
res["guild"]["name"] = "Demo Guild"
res["guild"]["guildRaidSeasons"] = [83]

for member in res["guild"]["members"]:
  id = member["userId"]
  member["level"] = "hidden"
  del member["lastActivityOn"]
  id = member["userId"]
  del member["userId"]
  member["userName"] = getUserId(id)
  if members.get(id, {}).get('role') != "ADMIN":
    member["role"] = "MEMBER"
    member["userName"] = anonymize(member["userName"])
  else:
    adminName = member["userName"]
random.shuffle(res["guild"]["members"])

print(res)

with open("demo/guild.json", "w") as fout:
  json.dump(res, fout)

with open(".secrets/playerunits.json", "r") as fin:
  units = {adminName: json.load(fin)[adminName]}

with open("demo/playerunits.json", "w") as fout:
  json.dump(units, fout)

with open(".secrets/summary.json", "r") as fin:
  summary = {"Demo": {"83": json.load(fin)[guild]["83"]}}

with open("demo/summary.json", "w") as fout:
  json.dump(summary, fout)

with open(".secrets/.season/%s/83.json" % guild, "r") as fin:
  raid = json.load(fin)
  for entry in raid["entries"]:
    id = entry["userId"]
    del entry["userId"]
    entry["userName"] = getUserId(id)
    if entry["userName"] != adminName:
      entry["userName"] = anonymize(entry["userName"])

with open("demo/83.json", "w") as fout:
  json.dump(raid, fout)

