// .env Variables
require('dotenv').config({path: '../.env'});

// Node Modules
const Discord = require('discord.js');
const client = new Discord.Client();
const cron = require('node-cron');

// Bot Modules (stores http requests & random functions respectively)
const npcSettings = require('./npcSettings');
const dialog = require('./dialog');
const dataRequest = require('../modules/dataRequest');
const calcRandom = require('../modules/calcRandom');

const commandArray = ['!checkin', '!stats', '!inventory', '!upgrade', '!heal', '!quests']

// Creates an array that seperates 10 items into seperate arrays each
const itemDB = {
    "iron_sword": {
        "name": "Iron Sword",
        "info": "This sturdy sword is great for slashing Ravagers.",
        "type": {
            "type": "Weapon",
            "subtype": "Sword",
            "stats": [
                { "attack": 2 }
            ]
        },
        "amount": 1
    },
    "steel_sword": {
        "name": "Steel Sword",
        "info": "A tougher form of the Iron Sword, it deals greater blows.",
        "type": {
            "type": "Weapon",
            "subtype": "Sword",
            "stats": [
                { "attack": 3 }
            ]
        },
        "amount": 1
    },
    "leather_armour": {
        "name": "Leather Armour",
        "info": "A light piece of armour made of leather.",
        "type": {
            "type": "Equipment", 
            "subtype": "Armour",
            "stats": [
                {"defence": 3}, {"speed": 1}
            ]
        },
        "amount": 1
    },
    "leather_helm": {
        "name": "Leather Helm",
        "info": "A leather headpiece, designed for some protection and shade.",
        "type": {
            "type": "Equipment", 
            "subtype": "Helm",
            "stats": [
                {"defence": 2}, {"speed": 1}
            ]
        },
        "amount": 1
    },
    "leather_boots": {
        "name": "Leather Boots",
        "info": "Comfy, leather boots made for long trips in New Eden's deserts.",
        "type": {
            "type": "Equipment", 
            "subtype": "Boots",
            "stats": [
                {"defence": 1}, {"speed": 1}
            ]
        },
        "amount": 1
    },
    "iron_armour": {
        "name": "Iron Armour",
        "info": "Tough, iron armour. It feels solid.",
        "type": {
            "type": "Equipment", 
            "subtype": "Armour",
            "stats": [
                {"defence": 4}, {"speed": -1}
            ]
        },
        "amount": 1
    },
    "health_potion": {
        "name": "Health Potion",
        "info": "A sweet-smelling potion that heals the drinker for 50 HP.",
        "type": {
            "type": "Potion",
            "stats": [
                {"healing": 50}
            ]
        },
        "amount": 1
    }
}

// For development testing
var userItems = [];

addItem(undefined, itemDB["health_potion"], 10);
addItem(undefined, itemDB["iron_sword"], 1);
addItem(undefined, itemDB["leather_armour"], 1);
addItem(undefined, itemDB["leather_boots"], 1);
addItem(undefined, itemDB["leather_helm"], 1);
addItem(undefined, itemDB["steel_sword"], 1);
    
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
    if (client.user.username !== "Ghost 5.0.1")
        client.user.setStatus('online');
    else
        client.user.setStatus('invisible');
    
    if (client.user.username == "Captain Montomery") {
    	const newName = "Captain Montgomery";
        console.log("Username is " + client.user.username + "! Typos are NOT(?) cannon, so better change stuff.\nAttempting rename to " + newName + "...");

        // Set username
        client.user.setUsername(newName)
            .then(user => console.log(`Success! New username is now ${user.username}.`))
            .catch(console.error);

        // Changes nickname
        //client.guilds.get(process.env.SANCTUM_ID).members.get(client.user.id).setNickname("");
    }
    
    // Sets your "Playing"
    if (npcSettings.activity) {
        client.user.setActivity(npcSettings.activity, { type: npcSettings.type })
            .then(presence => console.log(`Activity set to ${presence.game ? presence.game.name : 'none'}`))
            .catch(console.error);
    }

    console.log(`Connected! \
    \nLogged in as: ${client.user.username} - (${client.user.id})`);
});

// Create an event listener for messages
client.on('message', async message => {
    // Ignores ALL bot messages
    if (message.author.bot) return;

    // Message has to be in a bot channel
    //if (!channelProcessor.isBotChannel(message.channel.id)) {
    if (message.channel.id !== npcSettings.botChannel) {
        // If it's the gate
        if (message.channel.id === process.env.GATE_CHANNEL_ID && client.user.username === "A.D.A.M") {
            const args = message.content.slice(prefix.length).trim().split(/ +/g);
            const command = args.shift().toLowerCase();

            // If they haven't done the right command to enter
            if (!(command === "obsidian" || command === "hand" || command === "genesis")) {
                console.log("User sent " + command + (command !== "obsidian"));
                if (!(command !== "intro" || command !== "introgenesis" || command !== "introhand" || command !== "introobsidian" || command !== "introend")) {                   
                    message.reply("Please choose one of the factions by typing your desired faction shown above (!genesis, !obsidian, or !hand).")
                    .then(msg => {
                        msg.delete(10000)
                    })
                    .catch(console.error); 
                }   
            }
            message.delete(100);
        }
    }
    if (message.channel.id === process.env.STASIS_CHANNEL_ID) return;
    
    // Has to be (prefix)command
    if (message.content.indexOf(process.env.PREFIX) !== 0) return;

    // "This is the best way to define args. Trust me."
    // - Some tutorial dude on the internet
    const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    switch (command) {
        case "ping":
            if (isAdmin(message.author.id))
                message.reply("What is your command, almighty and glorious master!");
            break;
        case "intro":
            if (client.user.username == "A.D.A.M.")
                sendMessage(message.channel.id, dialog.getDialog("intro", message.author.id));
            break;
        case "introobsidian":
            if (client.user.username == "Kamala, Obsidian Vice President")
                sendMessage(message.channel.id, dialog.getDialog("introObsidian", message.author.id));
            break;
        case "introgenesis":
            // Typos officially cannon
            if (client.user.username == "Captain Montgomery")
                sendMessage(message.channel.id, dialog.getDialog("introGenesis", message.author.id));
            break;
        case "introhand":
            if (client.user.username == "Dairo, High Prophet of The Hand")
                sendMessage(message.channel.id, dialog.getDialog("introHand", message.author.id));
            break;
        case "introend":
            if (client.user.username == "A.D.A.M.")
                sendMessage(message.channel.id, dialog.getDialog("introEnd", message.author.id));
            break;
        case "admingetroleids":
            //for (var i in discordBot.servers[serverID].roles) {
            //    console.log(discordBot.servers[serverID].roles[i]); // issues
            //}
            console.log("!adminGetRoleIDs is Disabled for now");
            break;
        case "obsidian":
            if (client.user.username == "Kamala, Obsidian Vice President")
                changeFaction(process.env.GROUP_A_ROLE, message.channel.id, message.author.id, 
                    message.member, process.env.GROUP_A_BOT_ID);
            break;
        case "genesis":
            if (client.user.username == "Captain Montgomery")
                changeFaction(process.env.GROUP_B_ROLE, message.channel.id, message.author.id, 
                    message.member, process.env.GROUP_B_BOT_ID);
            break;
        case "hand":
            if (client.user.username == "Dairo, High Prophet of The Hand")
                changeFaction(process.env.GROUP_C_ROLE, message.channel.id, message.author.id, 
                    message.member, process.env.GROUP_C_BOT_ID);
        break;
        case "beginners":
            if (!isAdmin()) break;
            if (client.user.username == "A.D.A.M.") {

                var timedEvents = `Mori will revive all weakened travelers every day, and may heal you for a cost, if Mori can find the right things to do so.`;

                var commandsText = `These commands can be done in <#${process.env.GROUP_B_BOT_ID}>, <#${process.env.GROUP_C_BOT_ID}>, or <#${process.env.GROUP_A_BOT_ID}>.\n` + 
                `**!checkin** - For your help around the city, you can use this to be given a sum of **<:crystals:460974340247257089> Crystals** daily from your faction leader.\n` +
                `**!stats** - Your faction leader can check your stats, and your total crystals, materials, etc., with this command.\n`;

                const embed = new Discord.RichEmbed()
                    .setAuthor( "SANCTUM Beginner's Guide", client.user.avatarURL)
                    .setColor("#f1c40f")
                    .setTitle("Welcome to SANCTUM!")
                    .setDescription("Welcome to SANCTUM, traveler. I hope you will understand the basics on how to survive after the Genesis ship's crash.")
                    .addField("Basic Commands", commandsText)
                    .addField("Mori", timedEvents)

                message.channel.send({embed});
            }
            break;
        case "questboard":
            if (!isAdmin(message.author.id)) break;
            if (client.user.username != "A.D.A.M.") break;

            var quests = {
                "quests": [
                    {
                        "title": "The Lost Pendant",
                        "id": "thelostpendant",
                        "description": "Lorem ipsum, or some placeholder text. I wish I knew what to put here, I'm no writer! I need to put more text here in order for the inlines to work more nicely. Not like it matters on mobile, however.",
                        "objective": "Go to <#${process.env.OUTSKIRTS_CHANNEL_ID}> and **!scavenge** in hopes to find the pendant.",
                        "userID": process.env.LIBRARIAN_ID,
                        "color": "keepersOfTheCityColor",
                        "recommendedLVL": 1,
                        "questLength": "Short",
                        "rewards": [
                            {
                                "name": "Crystals",
                                "emote": "<:crystals:460974340247257089>",
                                "amount": 10
                            },
                            {
                                "name": "Electronics",
                                "emote": "<:melectronics:462682568911749120>",
                                "amount": 2
                            },
                            {
                                "name": "Gem",
                                "emote": "<:mgem:462450060718768148>",
                                "amount": 2
                            }
                        ]
                    },
                    {
                        "title": "Looming Ravager Outside",
                        "id": "loomingravager",
                        "description": "Hey, I have a problem, ya' see. There's a Ravager outside my tavern! And I've been waiting fo' it to go, but it ain't leaving!! I need your help to get rid of it, it's scaring me and my customers!",
                        "objective": "Go and help slay a Ravager.",
                        "userID": process.env.ALEXIS_ID,
                        "color": "keepersOfTheCityColor",
                        "recommendedLVL": 1,
                        "questLength": "Short",
                        "rewards": [
                            {
                                "name": "Crystals",
                                "emote": "<:crystals:460974340247257089>",
                                "amount": 5
                            }
                        ]
                    }
                ]
            }

            // Collects all preset colors
            const keepersOfTheCityColor = message.guild.roles.find(role => role.name === "Keepers of the City").color;
            console.log("COLOR: " + keepersOfTheCityColor);

            // Header & Footer (mobile design choice) for quests
            const header = new Discord.RichEmbed()
                .setAuthor("Quests", client.user.avatarURL)
                .setColor(keepersOfTheCityColor)
                .setTitle("The Travelers' Quest Board")
                .setDescription("Residents of New Eden can post their help requests here, and whoever fulfils them can earn some rewards.")
                .setFooter(`⏰ 7 hrs. before the quests are exchanged for new ones.`)
            await message.channel.send({embed: header});

            // Displays all quests in order
            for (let i = 0; i < quests.quests.length; i++) {
                const element = quests.quests[i];
                const bot = client.guilds.get(process.env.SANCTUM_ID).members.get(element.userID);
                var newColor = element.color;
                var newDescription = element.description;
                var newObjective = element.objective;
                var newReward = "";
                const questLength = `Quest Length: **${element.questLength}**.`;

                // Adds rewards up
                element.rewards.forEach(reward => {
                    newReward += `> **${reward.emote} ${reward.name}** [${reward.amount}x]\n`;
                });

                // Returns internal color if needed
                if (element.color === "keepersOfTheCityColor") newColor = keepersOfTheCityColor;

                // Replaces certain strings with internal channel data if needed
                // NEED TO FIGURE OUT REGEX EXPRESSIONS FOR MASS REPLACE
                newObjective = element.objective.replace("${process.env.OUTSKIRTS_CHANNEL_ID}", `${process.env.OUTSKIRTS_CHANNEL_ID}`);

                const body = new Discord.RichEmbed()
                    .setAuthor(`${bot.displayName}`, bot.user.avatarURL)
                    .setColor(newColor)
                    .setTitle(`📃 ${element.title}`)
                    .setDescription(newDescription)
                    .addField("Objective", newObjective)
                    .addField("Reward", newReward, true)
                    .addField("Info", `Recommended Level: **<:level:461650552506286093> ${element.recommendedLVL}+**.\n${questLength}`, true)
                    .setFooter(`React with ❗ to take on the quest, and help ${bot.displayName}.`)

                var bodyMessage = await message.channel.send({embed: body});
                await bodyMessage.react("❗");   
            }

            // Specifically for mobile
            await message.channel.send({embed: header});

            break;
        case "guild":
            if (!isAdmin(message.author.id)) break;
            if (client.user.username != "A.D.A.M.") break;
            
            switch (args[0]) {
                case "create":
                    // Start message
                    var progressMessage = await message.channel.send(`${message.author} I will setup a safe place in the City, please wait.`);

                    // Creates new channel & sets topic
                    var channelName = message.content.replace("!guild create ", '').trim();
                    var newChannel = await message.guild.createChannel(channelName, 'text');
                    await newChannel.setParent('496813609201172500');
                    newChannel.setTopic(`This is the ${channelName} guild!`);

                    // Chooses a role name
                    const roleName = channelName.replace(/\\/g, "");
                    
                    // Creates role & adds it to author
                    var newRole = await message.guild.createRole({
                        name: roleName,
                        color: 'DARK_AQUA',
                    });
                    await message.member.addRole(newRole);

                    // Sets permissions
                    await newChannel.overwritePermissions(message.guild.roles.find(role => role.name === '@everyone'), {
                        'VIEW_CHANNEL': false
                    });
                    await newChannel.overwritePermissions(message.guild.roles.find(role => role.name === roleName), {
                        'VIEW_CHANNEL': true
                    });
                    await newChannel.overwritePermissions(message.guild.roles.find(role => role.name === 'Can View All Guilds'), {
                        'VIEW_CHANNEL': true
                    });

                    // Progress message
                    await progressMessage.edit(`${message.author} I have finished setting up your new ${newRole} guild, in the City. Put it into good use, traveler.`);

                    break;
                case "tag": 
                    // Appends guild name to user (Grabs nickname by removing anything in []s)
                    // NOTE: CODE WORKS, JUST DOESN'T LOOK RIGHT
                    /*
                    const userNickname = message.member.displayName.replace(/\[(.*?)\]+/g, '').trim();
                    message.member.setNickname(`[${roleName}] ${userNickname}`)
                        .catch((e) => {
                            console.log("ERROR HAPPENED I THINK")
                            console.log(e);
                            
                            // Catches >32 nickname
                            if (e.code == 50035) {
                                message.channel.send(`${message.author} I couldn't change your username in order to put your guild tag, as it would be too long.`)
                            }
                        });
                    */
                   break;
            }

            break;
        
    }
                
    if (!checkValidDisplay(message.member, message.channel.id, true) && client.user.username != "A.D.A.M.") return;

    switch (command) {
        case "checkin":
            if (client.user.username == "A.D.A.M.") break;
            var checkinAmount = calcRandom.random(4, 9);
            var checkInResponse = String(dataRequest.sendServerData("checkin", checkinAmount, message.author.id));
            if (checkInResponse == "1") {
                sendMessage(message.channel.id, dialog.getDialog("checkin", message.author.id, checkinAmount));
                addXP(message.author.id, 1);
            } else {
                sendMessage(message.channel.id, dialog.getDialog("checkinLocked", message.author.id, checkInResponse));
            }
            break;
        case "give": // Could revamp to make player ID and amount interchangable
            if (client.user.username == "A.D.A.M.") break;
            var giveAmount = Math.floor(args[0]);
            if (message.mentions.members.size > 0) {
                console.log(message.mentions.members);
                var giveToID = message.mentions.members.first().id;
                console.log("GIVE: " + giveToID + " | message.author.id: " + message.author.id)
                if (giveToID === message.author.id) {
                    sendMessage(message.channel.id, dialog.getDialog("giveInvalidUserSelf", message.author.id));
                    return;
                }
                var amountInAccount = dataRequest.loadServerData("account",message.author.id);
                if (giveAmount > 0) {
                    if (amountInAccount >= giveAmount) {
                        if (dataRequest.sendServerData("transfer",giveToID,message.author.id,giveAmount) == 1) {
                            sendMessage(message.channel.id, dialog.getDialog("giveSuccessful", message.author.id, giveToID, giveAmount));
                        } else {
                            sendMessage(message.channel.id, dialog.getDialog("giveFailed", message.author.id));
                        }
                    } else {
                        sendMessage(message.channel.id, dialog.getDialog("giveNotEnoughInAccount", message.author.id));
                    }
                } else {
                    sendMessage(message.channel.id, dialog.getDialog("giveNotAboveZero", message.author.id));
                }
            } else {
                sendMessage(message.channel.id, dialog.getDialog("giveInvalidUser", message.author.id));
            }
        break;
        case "lore":
            if (client.user.username == "A.D.A.M.") break;
            sendMessage(message.channel.id, dialog.getDialog("lore", args[0]));
            break;
        case "stats":
            if (client.user.username == "A.D.A.M.") break;
            getLevelUp(message.author.id);

            var attacker = String(dataRequest.loadServerData("userStats",message.author.id));
            var scavengeResponse = String(dataRequest.loadServerData("artifactsGet",message.author.id));
            var attackerStrength = parseFloat(attacker.split(",")[0]);
            var attackerSpeed = parseFloat(attacker.split(",")[1]);
            var attackerStamina = parseFloat(attacker.split(",")[2]);
            var attackerHealth = parseFloat(attacker.split(",")[3]);
            var attackerMaxStamina = parseFloat(attacker.split(",")[4]);
            var attackerMaxHealth = parseFloat(attacker.split(",")[5]);
            var attackerWallet = parseFloat(attacker.split(",")[6]);
            var attackerXP = parseFloat(attacker.split(",")[7]);
            var attackerLVL = Math.floor(parseFloat(attacker.split(",")[8]));
            var attackerLvlPercent = parseFloat(attacker.split(",")[9]);
            var attackerStatPoints = parseFloat(attacker.split(",")[10]);
            var attackerChests = parseFloat(attacker.split(",")[11]);

            var items = scavengeResponse.split(",");
            var response = items[0];
            var ultrarare = parseFloat(items[1]);
            var rare = parseFloat(items[2]);
            var uncommon = parseFloat(items[3]);
            var common = parseFloat(items [4]);
            var scrap = parseFloat(items[5]);
            var totalQuantity = ultrarare + rare + uncommon + common + scrap;
            var userStats = "";

            if (attackerLVL >= 30) {
                userStats += "<@" + message.author.id + "> <:level:461650552506286093> **" + attackerLVL + "** (MAX)\t\t" + "<:cannister:462046687058198530> **" + attackerStatPoints +  "**\t\t" + "<:cyphercrate:464135029036154950> **" + attackerChests + "** (" + attackerLvlPercent + "%)";
            } else {
                userStats += "<@" + message.author.id + "> <:level:461650552506286093> **" + attackerLVL + "** (" + attackerLvlPercent + "%)\t\t\t" + "<:cannister:462046687058198530> **" + attackerStatPoints +  "**\t\t\t<:cyphercrate:464135029036154950> **" + attackerChests + "**";
            }
            userStats += "```STR: " + attackerStrength + " | SPD: " + attackerSpeed + " | STAM: " + attackerStamina + "/" + attackerMaxStamina + " | HP: " + attackerHealth + "/" + attackerMaxHealth + "```";
            userStats +=  "<:crystals:460974340247257089> **" + attackerWallet + "**\t\t";
            if (response == "success") {
                if (totalQuantity > 0) {
                    //userStats += "\n";
                    if (scrap > 0) { userStats += "<:scrap:463436564379336715> **" + scrap + "**\t\t"; }
                    if (common > 0) { userStats += "<:mcloth:462682568483930123> **" + common + "**\t\t"; }
                    if (uncommon > 0) { userStats += "<:mmetal:462682568920137728> **" + uncommon + "**\t\t"; }
                    if (rare > 0) { userStats += "<:melectronics:462682568911749120> **" + rare + "**\t\t"; }
                    if (ultrarare > 0) {userStats += "<:mgem:462450060718768148> **" + ultrarare + "**\n\n"; }
                } else {console.log("failure2");}
            } else {console.log("failure");}

            sendMessage(message.channel.id, userStats);
            break;
        case "estats":
            // Sees if the user is supposed to level up
            getLevelUp(message.author.id);

            // Grabs all parameters from server
            var attacker = String(dataRequest.loadServerData("userStats",message.author.id));
            var scavengeResponse = String(dataRequest.loadServerData("artifactsGet",message.author.id));
            var attackerStrength = parseFloat(attacker.split(",")[0]);
            var attackerSpeed = parseFloat(attacker.split(",")[1]);
            var attackerStamina = parseFloat(attacker.split(",")[2]);
            var attackerHealth = parseFloat(attacker.split(",")[3]);
            var attackerMaxStamina = parseFloat(attacker.split(",")[4]);
            var attackerMaxHealth = parseFloat(attacker.split(",")[5]);
            var attackerWallet = parseFloat(attacker.split(",")[6]);
            var attackerXP = parseFloat(attacker.split(",")[7]);
            var attackerLVL = Math.floor(parseFloat(attacker.split(",")[8]));
            var attackerLvlPercent = parseFloat(attacker.split(",")[9]);
            var attackerStatPoints = parseFloat(attacker.split(",")[10]);
            var attackerChests = parseFloat(attacker.split(",")[11]);

            var items = scavengeResponse.split(",");
            var response = items[0];
            var ultrarare = parseFloat(items[1]);
            var rare = parseFloat(items[2]);
            var uncommon = parseFloat(items[3]);
            var common = parseFloat(items [4]);
            var scrap = parseFloat(items[5]);
            var totalQuantity = ultrarare + rare + uncommon + common + scrap;

            // Forms stats into a string
            var levelText = `<:level:461650552506286093> **${attackerLVL}**`;
            var levelProgress = `(${attackerLvlPercent}%)`;
            var crystalText = `<:crystals:460974340247257089> **${attackerWallet}**`;
            var cannisterText = `<:cannister:462046687058198530> **${attackerStatPoints}**`;
            var cypherCrateText = `<:cyphercrate:464135029036154950> **${attackerChests}**`;
            var userStats = "```" + `STR: ${attackerStrength} | SPD: ${attackerSpeed} | STAM: ${attackerStamina}/${attackerMaxStamina} | HP: ${attackerHealth}/${attackerMaxHealth}` + "```";
            var materialsText = ``;
            
            // Materials
            if (response == "success") {
                if (totalQuantity > 0) {
                    if (scrap > 0) {        materialsText += `<:scrap:463436564379336715> **${scrap}**`; }
                    if (common > 0) {       materialsText += ` | <:mcloth:462682568483930123> **${common}**`; }
                    if (uncommon > 0) {     materialsText += ` | <:mmetal:462682568920137728> **${uncommon}**`; }
                    if (rare > 0) {         materialsText += ` | <:melectronics:462682568911749120> **${rare}**`; }
                    if (ultrarare > 0) {    materialsText += ` | <:mgem:462450060718768148> **${ultrarare}**`; }
                } else {console.log("failure2");}
            } else {console.log("failure");}

            // Says level is maxed out if it is LVL 30+
            if (attackerLVL >= 30) {
                levelProgress = `(MAX)`;
                cypherCrateText += ` (${attackerLvlPercent}%)`;
            }

            // Creates embed & sends it
            const embed = new Discord.RichEmbed()
                .setAuthor(`${message.member.displayName}`, message.author.avatarURL)
                .setColor(message.member.displayColor)
                .setDescription(`${levelText} ${levelProgress} | ${crystalText} | ${cannisterText} | ${cypherCrateText}`)
                .addField("Stats", userStats)
                .addField("Materials", `${materialsText}`)
                .setFooter("Commands: !inventory | !checkin | !upgrade | !heal | !quests")

            message.channel.send(embed);
            break;
        case "inventory":
            if (args[0] !== undefined) {
                var num = Math.floor(parseInt(args[0]));       
                if (Number.isSafeInteger(num)) {
                    return sendInventory(message, num);
                }
            } else {
                return sendInventory(message);
            }
            break;
        case "inv":
            if (args[0] !== undefined) {
                var num = Math.floor(parseInt(args[0]));       
                if (Number.isSafeInteger(num)) {
                    return sendInventory(message, num);
                }
            } else {
                return sendInventory(message);
            }
            break;
        case "item":
            return appraiseItem(message);
            
        case "help":
            if (client.user.username == "A.D.A.M.") break;
            if (!args[0]) {
                sendMessage(message.channel.id, dialog.getDialog("help", message.author.id));
            } else if (message.mentions.members.first() !== undefined) {
                // MORI
                if (message.mentions.members.first().id == process.env.MORI_ID) {
                    sendMessage(message.channel.id, dialog.getDialog("helpMori", message.author.id));
                }
                // RAVAGER
                if (message.mentions.members.first().id == process.env.RAVAGER_ID) {
                    sendMessage(message.channel.id, dialog.getDialog("helpRavager", message.author.id));
    
                }
                // MOSIAH
                if (message.mentions.members.first().id == process.env.MOSIAH_ID) {
                    sendMessage(message.channel.id, dialog.getDialog("helpMosiah", message.author.id));
    
                }
                // GRAZE
                if (message.mentions.members.first().id == process.env.GRAZE_ID) {
                    sendMessage(message.channel.id, dialog.getDialog("helpGraze", message.author.id));
    
                }
                // SONYA
                /*
                if (message.mentions.members.first().id == process.env.SONYA_ID) {
                    sendMessage(message.channel.id, dialog.getDialog("helpSonya", message.author.id));
                }
                */
                // REY
                if (message.mentions.members.first().id == process.env.REY_ID) {
                    sendMessage(message.channel.id, dialog.getDialog("helpRey", message.author.id));
                }
                // ALEXIS
                if (message.mentions.members.first().id == process.env.ALEXIS_ID) {
                    sendMessage(message.channel.id, dialog.getDialog("helpAlexis", message.author.id));
                }
                //sendMessage(message.channel.id, ":frowning:" + message.mentions.members.first().id);
            }
            break;
    }
    
});

client.on('error', console.error);

// Gets footer commands for botspam channel commands
function getFooterCommands(currentCommand) {
    var textFooter = "";
    const filtered = commandArray.filter(word => word !== currentCommand);
    //console.log(filtered);

    filtered.forEach(element => {
        var appendedText = " | ";
        if (textFooter.length !== 0) textFooter += appendedText; 
        textFooter += element;
    });
    //console.log(textFooter);
    return textFooter;
}

// Adds item to inventory
function addItem(userID, item, amount) {
    // If item exists in inventory
    console.log("[Add Item] " + amount);
    var i = userItems.findIndex(i => i.name === item.name);
    console.log("[Item Amount Item Exists] i Equals " + i);

    // If there is an item that exists in inventory
    if (i !== -1) {
        console.log("[Item Amount Start] " + userItems[i].amount);
        userItems[i].amount += amount;    // Increments amount value
        console.log("[Item Amount Finish] " + userItems[i].amount);
    // Disallows adding objects such as crystals
    } else {
        console.log("[Item Amount Wait] Created item for the first time.");
        var clonedItem = JSON.parse(JSON.stringify(item));  // Clones item in order to not actually increment the rooms.js item JSON data
        userItems.push(clonedItem);
        addItem(userID, item, amount - 1);
    }
}

// Sends inventory into chat
async function sendInventory(message, pageNum, newMessage) {
    var items = "";
    var groupedArr = createGroupedArray(userItems, 5);
    
    // Sets a default page num, or makes it human readable
    if (pageNum === undefined) pageNum = 1; else {
        if (pageNum < 1) pageNum = 1;
        if (groupedArr.length < pageNum) pageNum = groupedArr.length;
    }

    // Checks if page number is valid
    if (pageNum > groupedArr.length) {
        // If it's longer than actual length, but isn't just an empty inventory
        if (!groupedArr.length === 0) return;  
    }

    //console.log(pageNum);

    // Grabs item in loop, parses it, then adds it to "items" variable
    if (groupedArr[pageNum - 1]) {
        for (let index = 0; index < groupedArr[pageNum - 1].length; index++) {
            // Grabs an item, from a page index
            const element = groupedArr[pageNum - 1][index];

            // Makes if there is an emote, it'll add an extra space
            var emoteText = "";
            if (element.emote) emoteText = element.emote + " ";

            // Adds it in
            items += `> ${emoteText}**${element.name}** [${element.amount}x] ${element.info}\n`; 
        }  
    }

    // No items message to fill field
    if (items === "") items = "There are no items in the party's inventory.";

    // To make the message of "Page 1/0" with no items in !inventory not happen
    var moddedLength = groupedArr.length;
    if (moddedLength < 1) moddedLength = 1;

    const footer = getFooterCommands("!inventory");

    // Creates embed & sends it
    const inv = new Discord.RichEmbed()
        .setAuthor(`${message.member.displayName}`, message.author.avatarURL)
        .setColor(message.member.displayColor)
        .setDescription("I can appraise your items with `!item [ITEM NAME]`, traveler.")
        .addField(`Items (Page ${pageNum}/${moddedLength})`, items)
        .setFooter(`Commands: ${footer}`)

    var invMessage;
    if (!newMessage)
        invMessage = await message.channel.send({embed: inv});
    else {
        invMessage = newMessage;
        await invMessage.edit({embed: inv});
    }
    
    // Collector for emotes
    const emotes = ['⬅', '❌', '➡'];
    const collector = invMessage.createReactionCollector(
        (reaction, user) => emotes.includes(reaction.emoji.name) && user.id !== client.user.id , { time: 15 * 1000 });
    var react = "";
    var endedOnReact;
    
    // Sends reactions
    if (!newMessage) {
        for (let i = 0; i < emotes.length; i++) {
            const element = emotes[i];
            console.log(element);
            await invMessage.react(element);   
        }
    }

    // Collects reactions
    collector.on("collect", async reaction => {
        var user = reaction.users.last();
        react = reaction.emoji.name;
        if (react !== '❌') { reaction.remove(user); }
        endedOnReact = true;
        collector.stop();
    });

    // Clears reactions
    collector.once("end", async collecter => {
        console.log("[Reaction Options] Ended collector, clearing emotes and sending timing out message if needed.");

        if (!endedOnReact) {
            invMessage.clearReactions();
            return message.channel.send(":x: **Timed Out**: The emote reaction request timed out after 15 seconds.");
        }
        if (react === '❌') {
            invMessage.clearReactions();
            return invMessage.edit(invMessage.content);
        }

        var pageNumModifier = 0;
        if (react === emotes[0]) pageNumModifier -= 1;
        if (react === emotes[2]) pageNumModifier += 1;
        console.log(pageNum + " | " + pageNumModifier);
        sendInventory(message, pageNum + pageNumModifier, invMessage);
    });
}

// Appraise an item
async function appraiseItem(message) {
    const itemName = message.content.replace("!item", "").trim().toLowerCase();
    console.log("[Item Appraisal] " + `<< ${itemName} >>`);

    // Show if no parameter is given
    if (itemName === "" || !itemName) {
        message.channel.send(`:x: ${message.author} Please tell me the item name from your inventory, or I won't know which item you want me to look at.`);
        return;
    }

    var i = userItems.findIndex(i => i.name.toLowerCase() === itemName);
    console.log("[Item Amount Item Exists] i Equals " + i);

    // If there is an item that exists in inventory
    if (i !== -1) {
        console.log(`[Item Appraisal] Found item in inventory!`);
        const embed = new Discord.RichEmbed()
            .setAuthor(`${message.member.displayName}`, message.author.avatarURL)
            .setColor(message.member.displayColor)
            .setTitle(userItems[i].name)
            .setDescription(userItems[i].info)

        if (userItems[i].type.subtype)
            embed.addField("Type", `${userItems[i].type.type}\n> ${userItems[i].type.subtype}`, true)
        else
            embed.addField("Type", `${userItems[i].type.type}`, true)

        if (userItems[i].type.stats) {
            console.log(JSON.stringify(userItems[i].type.stats, null, 4))
            var itemStats = "There are no stats avaliable.";
            var resetItemStats = false;
            userItems[i].type.stats.forEach(element => {
                if (element) {
                    if (!resetItemStats) {
                        resetItemStats = true;
                        itemStats = "";
                    }
                    const types = [
                        "attack",
                        "defence",
                        "speed",
                        "healing"
                    ];

                    types.forEach(type => {
                        if (element[type]) {
                            switch (type) {
                                case "attack":
                                    itemStats += `ATK: ${element.attack}\n`;
                                    break;
                                case "defence":
                                    itemStats += `DEF: ${element.defence}\n`;
                                    break;
                                case "speed":
                                    itemStats += `SPD: ${element.speed}\n`;
                                    break;
                                case "healing":
                                    itemStats += `Healing: ${element.healing} HP\n`;
                                    break;
                            }
                        }
                    });
                }
            });
        }
        
        embed.addField("Stats", `${itemStats}`, true);

        message.channel.send(embed);

    // Disallows adding objects such as crystals
    } else {
        console.log("[Item Appraisal] Couldn't find item in inventory.");
        message.channel.send(`:x: ${message.author} I'm unable to find "${itemName}" in your inventory.`);
    }
}

// Creates an array that creates multiple different arrays inside of that array -> [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
// http://www.frontcoded.com/splitting-javascript-array-into-chunks.html
var createGroupedArray = function(arr, chunkSize) {
    var groups = [], i;
    for (i = 0; i < arr.length; i += chunkSize) {
        groups.push(arr.slice(i, i + chunkSize));
    }
    return groups;
}

// See if the bot should display its message
function checkValidDisplay(member, channelID, checkRole) {
    if (client.user.username == "Kamala, Obsidian Vice President"       && channelID === process.env.GROUP_A_BOT_ID) {
        if (checkRole) { if (member.roles.has(process.env.GROUP_A_ROLE)) return true; } else true;
    }
    else if (client.user.username == "Captain Montgomery"                && channelID === process.env.GROUP_B_BOT_ID) {
        if (checkRole) { if (member.roles.has(process.env.GROUP_B_ROLE)) return true; } else true;
    }
    else if (client.user.username == "Dairo, High Prophet of The Hand"  && channelID === process.env.GROUP_C_BOT_ID) {
        if (checkRole) { if (member.roles.has(process.env.GROUP_C_ROLE)) return true; } else true;
    }
    else if (client.user.username == "Ghost 5.0.1") {        
        // JSON
        const rooms = require('../TextAdv/rooms.json');
        var roomExists = false;

        // Loops for all rooms
        rooms.rooms.forEach(element => {
            if (channelID === rooms[element].channel) roomExists = true; 
        });

        if (!roomExists) {
            if (channelID === process.env.TEST_CHANNEL_ID) return true;
        } else return true;
    
    }

    return false;
}

// Gets if user has an Overseers rank
function isAdmin(userID) {
    var guild = client.guilds.get(process.env.SANCTUM_ID);
    return guild.members.get(userID).roles.find(role => role.name === "Overseers");
}

// Change Faction
async function changeFaction(factionID, channelID, userID, member, botChannelID) {
    if (member.roles.has(factionID)) {
        if (factionID === process.env.GROUP_A_ROLE)
            sendMessage(channelID, dialog.getDialog("orderAlreadyJoined", userID));
        else if (factionID === process.env.GROUP_B_ROLE)
            sendMessage(channelID, dialog.getDialog("anarchyAlreadyJoined", userID));
        else if (factionID === process.env.GROUP_C_ROLE)
            sendMessage(channelID, dialog.getDialog("religionAlreadyJoined", userID));
    } else {
        if (dataRequest.loadServerData("hasConvertedToday", userID) == 1) {
            sendMessage(channelID, dialog.getDialog("alreadyConvertedToday", userID));
        } else {
            // Creates new user
            var response = String(dataRequest.sendServerData("newUser", "New user.", userID));
            
            //var response = "createdUser"
            // Obsidian Tech.
            if (factionID === process.env.GROUP_A_ROLE) {
                await member.removeRole(process.env.GROUP_B_ROLE);
                await member.removeRole(process.env.GROUP_C_ROLE);
                await member.addRole(process.env.GROUP_A_ROLE);

                dataRequest.sendServerData("conversion", "Converted to The Order.", userID);
                
                if (response == "createdUser") {
                    client.users.get(userID).send(dialog.getDialog("newUserPM", userID, getFactionName(factionID)));
                    sendMessage(botChannelID, dialog.getDialog("newUserWelcome", userID, `<#${getFactionName(factionID)}>`));    
                } else {
                    sendMessage(channelID, dialog.getDialog("orderJoin", userID));
                }

            // Genesis Command
            } else if (factionID === process.env.GROUP_B_ROLE) {
                await member.removeRole(process.env.GROUP_C_ROLE);
                await member.removeRole(process.env.GROUP_A_ROLE);
                await member.addRole(process.env.GROUP_B_ROLE);

                dataRequest.sendServerData("conversion", "Converted to the Anarchy.", userID);
                
                if (response == "createdUser") {
                    client.users.get(userID).send(dialog.getDialog("newUserPM", userID, getFactionName(factionID)));
                    sendMessage(botChannelID, dialog.getDialog("newUserWelcome", userID, `<#${getFactionName(factionID)}>`));    
                } else {
                    sendMessage(channelID, dialog.getDialog("anarchyJoin", userID));
                }
            
            // The Hand
            } else if (factionID === process.env.GROUP_C_ROLE) {
                await member.removeRole(process.env.GROUP_A_ROLE);
                await member.removeRole(process.env.GROUP_B_ROLE);
                await member.addRole(process.env.GROUP_C_ROLE);

                dataRequest.sendServerData("conversion", "Converted to The Religion.", userID);
    
                if (response == "createdUser") {
                    client.users.get(userID).send(dialog.getDialog("newUserPM", userID, getFactionName(factionID)));
                    sendMessage(botChannelID, dialog.getDialog("newUserWelcome", userID, `<#${getFactionName(factionID)}>`));     
                } else {
                    sendMessage(channelID, dialog.getDialog("religionJoin", userID));
                }
            }
        }
    }
}

function addXP(userID,amount) {
    var response = String(dataRequest.sendServerData("addXP", amount, userID));
}

function getLevelUp(userID) {
    const server = client.guilds.get(process.env.SANCTUM_ID);
    const member = server.members.get(userID);
    if (client.user.username == "Kamala, Obsidian Vice President"   && !member.roles.has(process.env.GROUP_A_ROLE)) return;
    if (client.user.username == "Captain Montgomery"                 && !member.roles.has(process.env.GROUP_B_ROLE)) return;
    if (client.user.username == "Dairo, High Prophet of The Hand"   && !member.roles.has(process.env.GROUP_C_ROLE)) return;

    //const user = server.members.get(userID);
    var response = String(dataRequest.sendServerData("getLevelUp", 0, userID));
    var responseMessage = String(response.split(",")[0]);
    var lvl = Math.floor(parseFloat(response.split(",")[1]));
    var statPoints = parseFloat(response.split(",")[2]);

    var attacker = String(dataRequest.loadServerData("userStats", userID));
    var chests = parseFloat(attacker.split(",")[11]);

    console.log(response.split(","));
    
    majorLevelUp(lvl, server, userID);

    if (responseMessage == "levelup") {
    //if (true) {
        console.log("Chests: " + chests)
        checkinLevelUp(userID, lvl, statPoints, chests);
    }
}

async function majorLevelUp(level, server, userID) {
    const user = server.members.get(userID);

    var newChannel = "";

    var levels = [
        // Role, Level
        [server.roles.find(role => role.name === "LVL 1+"), 1, process.env.CRYSTAL_SHORES_CHANNEL_ID],
        [server.roles.find(role => role.name === "LVL 15+"), 15, process.env.SEA_OF_FOG_CHANNEL_ID],
        [server.roles.find(role => role.name === "LVL 30+"), 30, process.env.DEADLANDS_CHANNEL_ID]
    ]

    // Shrinking level
    if (level < 30) {
        level = 15;
    } else if (level < 15) {
        level = 1;
    }

    // Rank Level Up
    var levelRole = server.roles.find(role => role.name === `LVL ${level}+`);
    if (levelRole) {
        var memberRole = user.roles.has(levelRole.id);
        if (!memberRole) {
            user.addRole(levelRole).catch(console.error);
            for (let i = 0; i < levels.length; i++) {
                const element = levels[i];
                if (element[1] !== level) {
                    await user.removeRole(element[0]);
                }
            }
            if (user !== undefined) {// && newChannel !== undefined) {
                var levelMarks = [1, 15, 30];

                for (let i = 0; i < levelMarks.length; i++) {
                    const element = levelMarks[i];
                    // Gets channel of array
                    newChannel = client.channels.get(levels[levels.findIndex(level => level[1] === element)][2]);
                    if (level === element) 
                        newChannel.send(dialog.getDialog("level" + level, user, newChannel));
                }
            }
        }
    }
}

// Gets the user's role by member
function getFactionChannel(member) {
    var playerChannel;
    var isGroupA = member.roles.has(process.env.GROUP_A_ROLE);
    var isGroupB = member.roles.has(process.env.GROUP_B_ROLE);
    var isGroupC = member.roles.has(process.env.GROUP_C_ROLE);
    //console.log(member.roles);
    //console.log("isGroup: " + isGroupA + " " + isGroupB + " " + isGroupC);
    if (isGroupA)       playerChannel = process.env.GROUP_A_BOT_ID;
    else if (isGroupB)  playerChannel = process.env.GROUP_B_BOT_ID;
    else if (isGroupC)  playerChannel = process.env.GROUP_C_BOT_ID;

    return playerChannel;
}

// Gets faction names by ID
function getFactionName(factionID) {
    if (factionID === process.env.GROUP_A_ROLE) {
        return "Obsidian Technologies";
    }
    if (factionID === process.env.GROUP_B_ROLE) {
        return "Genesis Command";
    }
    if (factionID === process.env.GROUP_C_ROLE) {
        return "The Hand";
    }
}

function checkinLevelUp(userID, lvl, statPoints, chests) {
    const guild = client.guilds.get(process.env.SANCTUM_ID);
    if (lvl === 30) {
        //Post level cap level up!
        sendMessage(userID, getFactionChannel(guild.members.get(userID)), dialog.getDialog("levelUpLevelCap", userID, lvl, chests));
    } else {
        //regular level up
        sendMessage(userID, getFactionChannel(guild.members.get(userID)), dialog.getDialog("levelUp", userID, lvl, statPoints));
    }
    //sendMessage(testChannelID, dialog.getDialog("levelUp", userID, lvl, statPoints));
}

// Updates stamina (1) and health by 1% every 2 min.
cron.schedule('*/2 * * * *', function() {
    if (client.user.username === "A.D.A.M.") {
        console.log('Updating STAMINA every 2 min.');
        dataRequest.sendServerData("updateStamina", 0);  
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

// Log our bot in
client.login(npcSettings.token);