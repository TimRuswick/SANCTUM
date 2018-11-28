// .env Variables
const path = require('path');
require('dotenv').config({path: path.join(__dirname, "../.env")});

// Node Modules
const Discord = require('discord.js');
const client = new Discord.Client();
const cron = require('node-cron');

// Bot Modules
//const dataRequest = require('../modules/dataRequest');
//const calcRandom = require('../modules/calcRandom');

const playingActivity = '!join | Bot Things.';

const roles = {
    "roles": [
        "artists", 
        "developers", 
        "designers",
        "testers",
        "writers"
    ],

    "artists": {
        "name": "Artists"
    },
    "developers": {
        "name": "Developers"
    },
    "designers": {
        "name": "Designers"
    },
    "testers": {
        "name": "Testers"
    },
    "writers": {
        "name": "Writers"
    }
}

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

    // Has to be (prefix)command
    if (message.content.indexOf(process.env.PREFIX) !== 0) return;
    
    // "This is the best way to define args. Trust me."
    // - Some tutorial dude on the internet
    const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    let embedImage;
    switch (command) {
        case "ping":
            if (isAdmin(message.author.id))
                message.reply("What is your command, glorious master!");
            break;
        case "embedthumbnail":
            let embedThumbnail = new Discord.RichEmbed()
                .setColor('ORANGE')
                .setThumbnail("https://cdn.discordapp.com/attachments/509560565429960746/509572140882984970/unknown.png")
            await message.channel.send({embed: embedThumbnail});
            break;

        case "image":
            message.channel.send({
                file: "https://cdn.discordapp.com/attachments/509560565429960746/509572140882984970/unknown.png" // Or replace with FileOptions object
            })
            break;
        
        case "embedimage":
            embedImage = new Discord.RichEmbed()
                .setColor('ORANGE')
                .setImage("https://cdn.discordapp.com/attachments/509560565429960746/509572140882984970/unknown.png")
            await message.channel.send({embed: embedImage});
            break;
        
        case "embedimagelocal":
            let file = new Discord.Attachment('./test.png');
            embedImage = new Discord.RichEmbed()
                .setColor('ORANGE')
                .setImage('attachments://' + file)
            break;
        
        case "test":
            // Does image for background (& future map)
            let imageEmbed = new Discord.RichEmbed()
                .setColor('ORANGE')
                .setImage("https://cdn.discordapp.com/attachments/509560565429960746/509572140882984970/unknown.png")
            await message.channel.send({embed: imageEmbed});

            // Does text dialog
            let textEmbed = new Discord.RichEmbed()
                .setAuthor("Vivian (DAO)", client.user.avatarURL)
                .setTitle(`Somewhere, Someplace`)
                .setColor('ORANGE')
                .setDescription(`Somewhere. Someplace. I dunno what to say here, it's just placeholder.\n\n` + 
                `:arrow_up: Move up somewhere else.\n:arrow_right: Move somewhere that's not up.\n:key: Unlock the mysterious door that doesn't exist.`)
            let newMessage = await message.channel.send({embed: textEmbed});

            // Collects emotes and reacts upon the reaction (120 seconds)
            // Directions
            const Directions = {
                NORTH: 0,
                EAST: 1,
                SOUTH: 2,
                WEST: 3
            }
            var moveOptions = [
                {
                    "emote": '⬆',
                    "direction": "north",
                    "enumDirection": Directions.NORTH
                },
                {
                    "emote": '⬇',
                    "direction": "south",
                    "enumDirection": Directions.SOUTH
                },
                {
                    "emote": '⬅',
                    "direction": "west",
                    "enumDirection": Directions.WEST
                },
                {
                    "emote": '➡',
                    "direction": "east",
                    "enumDirection": Directions.EAST
                },
                {
                    "emote": "🔑",
                    "command": true
                }
            ]
            var options = [moveOptions[0], moveOptions[3], moveOptions[4]];
            // Reacts
            for (let i = 0; i < options.length; i++) {
                const element = options[i];
                //console.log("Direction -> " + element.direction + " | " + JSON.stringify(playerDungeon.location.connections, null, 4))
                console.log("Element: " + JSON.stringify(element, null, 4));
                if (!element.command) {
                    console.log("[Reaction Options] Emote: " + element.emote + "  | newMessage: " + newMessage);
                    await newMessage.react(element.emote);
                } else if (element.command) {
                    console.log("[Reaction Options] Assuming command as emote: " + element.emote + " | newMessage: " + newMessage);
                    await newMessage.react(element.emote);
                }
            }
            break;
        case "join":
            // If chose a parameter
            if (args[0]) {
                var moddedArgs = args[0].toLowerCase();
                if (roles.roles.includes(moddedArgs)) {
                    console.log("[JOIN] Found it! " + moddedArgs + "\nAdding role to " + message.author.username);

                    // Gets specified role
                    var roleName = roles[moddedArgs].name;
                    var newRole = message.guild.roles.find(role => role.name === roleName);

                    // Checks if user already has roles
                    if (!message.member.roles.has(newRole.id)) {                            
                        // Adds Team Role
                        var addTeam = false;
                        var teamRole = message.guild.roles.find(role => role.name === "Team");
                        if (!message.member.roles.has(teamRole.id)) addTeam = true;
                        
                        if (!addTeam) await message.member.addRole(newRole).catch(console.error);
                        else await message.member.addRoles([newRole, teamRole]).catch(console.error);

                        const embed = new Discord.RichEmbed()
                            .setAuthor(client.user.username, client.user.avatarURL)
                            .setTitle("Successful")
                            .setDescription(`${message.author}, you have been given the ${newRole} role!`)
                            .setColor(message.guild.members.get(client.user.id).displayColor)
                            .setFooter("Check out the general category and your role specific channel!", message.author.avatarURL)
                        await message.channel.send(embed);
                    } else {
                        const embed = new Discord.RichEmbed()
                            .setAuthor(client.user.username, client.user.avatarURL)
                            .setTitle("Failed")
                            .setDescription(`${message.author}, you already have the ${newRole} role!`)
                            .setColor(message.guild.members.get(client.user.id).displayColor)
                            .setFooter("To leave a role, use !leave [ROLE NAME].", message.author.avatarURL)
                        await message.channel.send(embed);
                    }
                } else {
                    showErrorMessage(args, command, message);
                }
            } else {
                displayJoinMessage(message);
            }
            break;
        case "leave":
            // If chose a parameter
            if (args[0]) {
                var moddedArgs = args[0].toLowerCase();
                if (roles.roles.includes(moddedArgs)) {
                    console.log("[LEAVE] Found it! " + moddedArgs + "\nRemoving role to " + message.author.username);
                    const joinRoleMessage = "To join a role, use !join [ROLE NAME].";
                    var playerRoles = message.member.roles.filter(role => role.name === roles[moddedArgs].name);

                    // Gets specified role
                    var roleName = roles[moddedArgs].name;
                    var newRole = message.guild.roles.find(role => role.name === roleName);

                    // Checks if user already has roles
                    if (message.member.roles.has(newRole.id)) {
                        // Removes Team Role (if it's the last "team" type role)
                        var removeTeam = false;
                        var teamRole = message.guild.roles.find(role => role.name === "Team");
                        var playerRoles = message.member.roles.filter(role => roles.roles.includes(role.name.toLowerCase()));
                        var debugString = "All the roles a user has:\n";
                        
                        // Grabs
                        message.member.roles.forEach(element => {
                            debugString += `> ${element.name}\n`
                        });
                        console.log(debugString + "removeTeam = " + removeTeam);
                        debugString = "All the team-defined roles a user has:\n";
                        playerRoles.forEach(element => {
                            debugString += `> ${element.name}\n`
                        });
                        console.log(debugString);

                        if (playerRoles.size <= 1) {
                            if (message.member.roles.has(teamRole.id)) removeTeam = true;
                        }

                        // Removes specified role
                        var roleName = roles[moddedArgs].name;
                        var newRole = message.guild.roles.find(role => role.name === roleName);

                        if (!removeTeam) {
                            console.log("Removed only one role: removeTeam = " + removeTeam)
                            await message.member.removeRole(newRole).catch(console.error);
                        } else {
                            console.log("Removing team role: removeTeam = " + removeTeam)
                            await message.member.removeRoles([newRole, teamRole]).catch(console.error)
                        }

                        const embed = new Discord.RichEmbed()
                            .setAuthor(client.user.username, client.user.avatarURL)
                            .setTitle("Successful")
                            .setDescription(`${message.author}, you have removed the ${newRole} role!`)
                            .setColor(message.guild.members.get(client.user.id).displayColor)
                            .setFooter(joinRoleMessage, message.author.avatarURL)
                        await message.channel.send(embed);
                    } else {
                        const embed = new Discord.RichEmbed()
                            .setAuthor(client.user.username, client.user.avatarURL)
                            .setTitle("Failed")
                            .setDescription(`${message.author}, you already don't have the ${newRole} role!`)
                            .setColor(message.guild.members.get(client.user.id).displayColor)
                            .setFooter(joinRoleMessage, message.author.avatarURL)
                        await message.channel.send(embed);
                    }
                } else {
                    showErrorMessage(args, command, message);
                }
            } else {
                displayJoinMessage(message);
            }
            break;
    }
});

client.on('error', console.error);

// Testing a bug-fix for when Discord doesn't recover Playing status
client.on('resume', () => {
    console.log("RESUME: setting playing activity to " + playingActivity);
    client.user.setActivity(playingActivity);
});

// Minute cron
cron.schedule('*/1 * * * *', function() {
    // Sets your "Playing"
    client.user.setActivity(playingActivity);
});

// Async Waiting
function sleep(time) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, time);
    });
}

// Gets if user has an Overseers rank
function isAdmin(userID) {
    // Developer's Discord
    var guild = client.guilds.get("500140223871582228");
    return guild.members.get(userID).roles.find(role => role.name === "Team Leads");
}

// Show !join message listing commands
function displayJoinMessage(message) {
    var newDialog = "";
    roles.roles.forEach(element => {
        var roleName = roles[element].name;
        var newRole = message.guild.roles.find(role => role.name === roleName);
        var memberLength = newRole.members.size;
        newDialog += `__${element}__ \`${memberLength} Members\`\n`;
    });

    const embed = new Discord.RichEmbed()
        .setAuthor(client.user.username, client.user.avatarURL)
        .setTitle("Roles")
        .setDescription(newDialog)
        .setColor(message.guild.members.get(client.user.id).displayColor)
        .setFooter("To join or leave a role, use !join [ROLE NAME] or !leave [ROLE NAME].")

    message.channel.send(embed);
}

// Shows error messages for !join and !leave for unknown roles
function showErrorMessage(args, command, message) {
    const embed = new Discord.RichEmbed()
        .setAuthor(client.user.username, client.user.avatarURL)
        .setTitle("Failed")
        .setDescription(`Sorry, I couldn't find the "${args[0]}" role.`)
        .setFooter(`Use !${command} to get a list of roles to ${command}.`)
        .setColor(message.guild.members.get(client.user.id).displayColor)

    message.channel.send(embed);
}

// Log our bot in (change the token by looking into the .env file)
client.login(process.env.DEVELOPER_TOKEN);