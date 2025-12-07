#!/usr/bin/env python3

import json
import requests

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

init()
