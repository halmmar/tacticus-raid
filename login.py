#!/usr/bin/env python3

import json
import requests
import os
import sys
from secrets import playerids, members

def error(message=""):
  print('Status: 500 Error\r\n\r\n')
  print(message)
  sys.exit(0)

api_key = os.environ.get('HTTP_X_API_KEY','')
user_id = os.environ.get('HTTP_X_USER_ID','')

if user_id not in playerids:
  error("User ID is not in the member list")

data = requests.get('https://api.tacticusgame.com/api/v1/player', headers={'accept': 'application/json', 'X-API-KEY': api_key}).json()

userName = data["player"]["details"]["name"].replace("《EN》","").replace("《ENChaos》","").strip()

if members.get(user_id,{}).get("name","") != userName:
  error("Username in our database does not match the user ID")

playerDataDir = ".secrets/playerData"
os.makedirs(playerDataDir, exist_ok=True)
with open("%s/%s.json" % (playerDataDir, user_id), "w") as fout:
  json.dump(data, fout)
with open("%s/%s.key" % (playerDataDir, user_id), "w") as fout:
  fout.write(api_key)

print("Content-Type:text/json\r\n")
print(json.dumps({"userName": userName, "id": user_id, "role": playerids[user_id]}))