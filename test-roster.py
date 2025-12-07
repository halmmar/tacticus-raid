#!/usr/bin/env python3

import json
import glob
import os
import requests
import sys
from secrets import api_get, keys, members
from pathlib import Path

for guild in keys.keys():
  res = api_get("/api/v1/guild", key=guild)
  print()
  print(guild)
  print()
  for member in res["guild"]["members"]:
    id = member["userId"]
    print(members.get(id,id))