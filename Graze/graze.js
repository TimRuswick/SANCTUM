// .env Variables
const path = require('path');
require('dotenv').config({path: path.join(__dirname, "../.env")});

// Node Modules
const Discord = require('discord.js');
const client = new Discord.Client();

// Bot Modules
const shared = require('../Shared/shared');

const playingActivity = '!upgrade | Nanotech Upgrades.';

// The ready event is vital, it means that your bot will only start reacting to information
// from Discord _after_ ready is emitted
client.on('ready', async () => {
    // Generates invite link
    try {
        let link = await client.generateInvite(["ADMINISTRATOR"]);
        console.log("Invite Link: " + link);
    } catch(e) {
        console.log(e.stack);
    }

    // You can set status to 'online', 'invisible', 'away', or 'dnd' (do not disturb)
    client.user.setStatus('online');
    // Sets your "Playing"
    client.user.setActivity(playingActivity);
    console.log(`Connected! \
    \nLogged in as: ${client.user.username} - (${client.user.id})`);
});

// Create an event listener for messages
client.on('message', async message => {
    // Ignores ALL bot messages
    if (message.author.bot) return;
    // Message has to be a bot channel (should be edited later)
    if (!shared.messaging.isFactionBotspam(message.channel.id)) return;
    // Has to be (prefix)command
    if (message.content.indexOf(process.env.PREFIX) !== 0) return;

    // "This is the best way to define args. Trust me."
    // - Some tutorial dude on the internet
    const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    //handle the command
    switch (command) {
        case "upgrade":
            if (!args[0]) {
                // Shows upgrade menu
                var intro = `${message.author} Hey buddy! Here's what we can upgrade ASAP!`;
                var newMessage = `STR - ${shared.utility.getEmote(client, "cannister")} **1**` + "\n```Permanently upgrades your Strength by 1, so you can hit them Ravagers harder.```\n";
                newMessage += `SPD - ${shared.utility.getEmote(client, "cannister")} **1**` + "\n```Permanently upgrades your Speed by 1, so you can get hit less in battle.```\n";
                newMessage += `STAM - ${shared.utility.getEmote(client, "cannister")} **1**` + "\n```Permanently upgrades your Max Stamina by 1, so you can hit more Ravagers.```\n";
                newMessage += `HP - ${shared.utility.getEmote(client, "cannister")} **1**` + "\n```Permanently upgrades your Max HP by 10, so you can can take those beatings like a champ.```";

                // Grabs all parameters from server
                var stats = shared.core.getStats(message.author.id);
                const embed = shared.utility.embedTemplate(client, client.user.id)
                    .setTitle("Nanotech Upgrades")
                    .setDescription(newMessage)
                    .setFooter(`${message.member.displayName}, you have ${stats.statPoints} cannisters! Use !upgrade [OPTION] to upgrade that stat!`, message.author.avatarURL)
                    
                message.channel.send(intro, {embed});
            } else {
                console.log(args[0]);
                //Upgrades stats
                var statToUpgrade = String(args[0]);
                var numberOfPointsToUpgrade = 1;
                var canUpgrade = 0;
                var suffix = "point.";
                //var statToUpgrade = String(args.split(" ")[0]);
                //var numberOfPointsToUpgrade = parseFloat(args.split(" ")[1]);
                switch (statToUpgrade.toUpperCase()) {
                    case "STRENGTH":
                        statToUpgrade = "STR";
                        break;
                    case "HEALTH":
                        statToUpgrade = "HP";
                        break;
                    case "STAMINA":
                        statToUpgrade = "STAM";
                        break;
                    case "SPEED":
                        statToUpgrade = "SPD";
                        break;
                }
                
                switch (statToUpgrade.toUpperCase()) {
                    case "STR":
                        numberOfPointsToUpgrade = 1;
                        canUpgrade = 1;
                        suffix = "point.";
                        break;
                    case "HP":
                        numberOfPointsToUpgrade = 10;
                        canUpgrade = 1;
                        suffix = "points.";
                        break;
                    case "SPD":
                        numberOfPointsToUpgrade = 1;
                        canUpgrade = 1;
                        suffix = "point.";
                        break;
                    case "STAM":
                        numberOfPointsToUpgrade = 1;
                        canUpgrade = 1;
                        suffix = "point.";
                        break;
                }
                if (canUpgrade == 0) {
                    message.channel.send(`:x: ${message.author} Believe me, I wish I could upgrade things like that.`);
                    return;
                }

                var upgradeResponse = shared.dataRequest.sendServerData("upgradeStats", statToUpgrade, message.author.id);
                if (String(upgradeResponse) == "notEnoughPoints") {
                    message.channel.send(`:x: ${message.author} Hey now, you don't have that many cannisters.`);
                    return;
                }
                if (String(upgradeResponse) == "failure") {
                    message.channel.send(`:x: ${message.author} Sorry, no can do right now. Come back later though, ok?`);
                    return;
                }
                if (String(upgradeResponse) == "success") {
                    var skillName = "";
                    switch (statToUpgrade.toUpperCase()) {
                        case "STR":
                            skillName = "strength";
                            break;
                        case "HP":
                            skillName = "health";
                            break;
                        case "SPD":
                            skillName = "speed";
                            break;
                        case "STAM":
                            skillName = "stamina";
                            break;
                    }
                    message.channel.send(`${message.author} Sweet! I used your Nanotech Cannister to upgrade your **${skillName}** by ${numberOfPointsToUpgrade} ${suffix}`);
                }
            }
            break;
  };
});

// Error handler
client.on('error', console.error);

// Testing a bug-fix for when Discord doesn't recover Playing status
client.on('resume', () => {
    console.log("RESUME: setting playing activity to " + playingActivity);
    client.user.setActivity(playingActivity);
});

// Log our bot in (change the token by looking into the .env file)
client.login(process.env.GRAZE_TOKEN);