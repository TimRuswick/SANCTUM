// .env Variables
require('dotenv').config({path: '../.env'});

// Node Modules
const Discord = require('discord.js');
const client = new Discord.Client();
const cron = require('node-cron');

// Bot Modules (stores http requests & random functions respectively)
const dataRequest = require('../modules/dataRequest');
const calcRandom = require('../modules/calcRandom');
const channelProcessor = require('../modules/channelProcessor');

// State Machine (Uncomment if needed)
/*
var BotEnumState = {
    WAITING: 0,
    ACTIVE: 1
}
var botState = BotEnumState.ACTIVE;
*/

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
    client.user.setActivity('!upgrade | Nanotech Upgrades.');
    console.log(`Connected! \
    \nLogged in as: ${client.user.username} - (${client.user.id})`);
});

// Error handler
client.on('error', console.error);

// Create an event listener for messages
client.on('message', async message => {
    // Ignores ALL bot messages
    if (message.author.bot) return;
    // Message has to be a bot channel (should be edited later)
    if (!channelProcessor.isBotChannel(message.channel.id)) return;
    // Has to be (prefix)command
    if (message.content.indexOf(process.env.PREFIX) !== 0) return;

    // "This is the best way to define args. Trust me."
    // - Some tutorial dude on the internet
    const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    //handle the command
    switch(command) {
        case "upgrade":
        if (!args[0]) {
            //shows upgrade menu
            var intro = `${message.author} Hey buddy! Here's what we can upgrade ASAP!`;
            var newMessage = "STR - <:cannister:462046687058198530> **1**\n```Permanently upgrades your Strength by 1, so you can hit them Ravagers harder.```\n"
            newMessage += "SPD - <:cannister:462046687058198530> **1**\n```Permanently upgrades your Speed by 1, so you can get hit less in battle.```\n"
            newMessage += "STAM - <:cannister:462046687058198530> **1**\n```Permanently upgrades your Max Stamina by 1, so you can hit more Ravagers.```\n"
            newMessage += "HP - <:cannister:462046687058198530> **1**\n```Permanently upgrades your Max HP by 10, so you can can take those beatings like a champ.```"
            //sendMessage(message.channel.id, newMessage);
            
            // Grabs all parameters from server
            var attacker = String(dataRequest.loadServerData("userStats",message.author.id));
            var attackerStatPoints = parseFloat(attacker.split(",")[10]); // Cannisters
            const keepersOfTheCityColor = client.guilds.get(process.env.SANCTUM_ID).roles.find(role => role.name === "Keepers of the City").color;
            const embed = new Discord.RichEmbed()
                .setAuthor("Graze", client.user.avatarURL)
                .setColor(keepersOfTheCityColor)
                .setTitle("Nanotech Upgrades")
				.setDescription(newMessage)
				.setFooter(`${message.member.displayName}, you have ${attackerStatPoints} cannisters! Use !upgrade [OPTION] to upgrade that stat!`)
				
			message.channel.send(intro, embed);
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
                sendMessage(message.channel.id, ":x: <@" + message.author.id + "> Believe me, I wish I could upgrade things like that.");
                return;
            }

            var upgradeResponse = dataRequest.sendServerData("upgradeStats", statToUpgrade, message.author.id);
            if (String(upgradeResponse) == "notEnoughPoints") {
                sendMessage(message.channel.id, ":x: <@" + message.author.id + "> Hey now, you don't have that many cannisters.");
                return;
            }
            if (String(upgradeResponse) == "failure") {
                sendMessage(message.channel.id, ":x: <@" + message.author.id + "> Sorry, no can do right now. Come back later though, ok?");
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
                sendMessage(message.channel.id, "<@" + message.author.id + "> Sweet! I used your Nanotech Cannister to upgrade your **" + skillName + "** by " + numberOfPointsToUpgrade + " " + suffix);
            }
        }
        break;
  };
});

// Send message handler
function sendMessage(userID, channelID, message) {
    // Handle optional first argument (so much for default arugments in node)
    if (message === undefined) {
        message = channelID;
        channelID = userID;
        userID = null;
    }

    // Utility trick (@userID with an optional argument)
    if (userID != null) {
        message = "<@" + userID + "> " + message;
    }
    
    // Sends message (needs client var, therefore I think external script won't work)
    client.channels.get(channelID).send(message);
}

// Log our bot in (change the token by looking into the .env file)
client.login(process.env.GRAZE_TOKEN);