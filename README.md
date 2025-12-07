# Tacticus Raid Tool

The tacticus raid tool is a tool for setting up a private server where your guild raid API data can remain secure from prying eyes.

Authentication is done by users providing their player ID (basically username) and player API key (basically a password they can revoke whenever).

Users who are officers and above have additional rights and can see more things than other members and is checked when a user logs in (if you are promoted in the guild, you can simply press login again and get additional rights).

The tool fetches the player's units/etc hourly to provide additional information (such as their units, their ranks, but also what tokens are available in case one wants to check this without loggin into the game).

If there is no mapping for a username, part of the user ID string is returned; the tool never returns the full user ID. 

## Configuration

To get started, create the following files in the .secrets folder (perhaps store these in a separate git repo to manage the files and let other guild members update the configuration).

.secrets/api.json contains a map of guild codes to guild API keys (which need to be provided by a CO-LEADER or LEADER):
```
{
    "G1": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "G2": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

.secrets/config.json contains the list of guilds to be listed on the main page. Commas in the names can be used to combine several guilds into the same view (in case you want to compare your sister guilds to judge a player for promotion or demotion within those guilds; or simply to be able to get see the best runs of the season across all guilds):
```
{
    "guildsList": [
        ["G1","Full Guild Name"],
        ["G1","Full Guild Name of Sister Guild"],
        ["G1,G2","G1 and G2"]
    ]
}
```

.secrets/members.json contains a map of player IDs for ALL guild members. You can add a role here to override the actual role in Tacticus (in case the player who runs the server is not an officer in-game). If you add discord names for everyone, you can copy-paste messages to ping players who capped tokens or have a bomb ready and should bomb a boss:
```
{
    "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx": {"name": "Rilak", "discord": "@rilak", "role": "ADMIN"},
    "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxx2": {"name": "Member1", "discord": "@blabla"}
}
```

.secrets/movement.json contains a list of players who moved guilds during a particular season (or perhaps called in for vacation). These players are not penalized for using fewer than 26 tokens in a raid season and are marked underlined in the UI:
```
{
    "80": ["Rilak"],
    "84": ["M1","M2"]
}
```

In .secrets/gw, you can put guild war data (in case you know how to intercept client traffic data). The strucure looks something like:

* eventResults.eventResponseData.activityLogs
* eventResults.eventResponseData.playerData
* eventResults.eventResponseData.guildData

The scripts do use character images from the Tacticus planner, but this git repo should be updated when new characters are added.

## Running

Certain scripts need to run roughly hourly (fetching users data, updating unit lists, etc). There is a script `update.sh` which you might want to modify slightly (I run www-data and my own user for the same directory when developing, so it changes owners, etc to make the scripts run properly). It runs both summary.js (through docker) and hourly.py (through Python3). You will need to have Python installed as cgi handler since the backend uses that (and docker in order to run part of the hourly updates).

I use the following in my apache config (to also prevent users accessing data from the secrets):

```
<Directory "/data/tacticus-raid/">
      Options +ExecCGI
      AddHandler cgi-script .py
      Require all granted
</Directory>

<FilesMatch "^\.">
    Order allow,deny
    Deny from all
</FilesMatch>

<DirectoryMatch "^\.|\/\.">
    Order allow,deny
    Deny from all
</DirectoryMatch>
```