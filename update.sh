#!/bin/sh

chmod o+r -R tacticusplanner/src/assets/images/snowprint_assets
rsync -rv tacticusplanner/src/assets/images/snowprint_assets/ .snowprint_assets/
sudo chmod o+r -R .snowprint_assets
sudo -u www-data ./hourly.py
sudo -u www-data touch guildwars.json
sudo -u www-data mkdir -p .secrets/.gw-filtered
sudo chown www-data guildwars.json .secrets/.gw-filtered
docker run --user www-data -v ./:/data/tacticus-raid -w /data/tacticus-raid node summary.js
