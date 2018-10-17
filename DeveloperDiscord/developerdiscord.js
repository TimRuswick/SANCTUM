// .env Variables
require('dotenv').config({path: '../.env'});

// Node Modules
const Discord = require('discord.js');
const client = new Discord.Client();
//const cron = require('node-cron');

// Bot Modules
//const dataRequest = require('../modules/dataRequest');
//const calcRandom = require('../modules/calcRandom');

const playingMessage = '!join | Bot Things.';

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
    client.user.setActivity(playingMessage);
    console.log(`Connected! \
    \nLogged in as: ${client.user.username} - (${client.user.id})`);
});

// Create an event listener for messages
client.on('message', async message => {
    // Ignores ALL bot messages
    if (message.author.bot) return;
    /*
    // Message has to be in Outskirts (should be edited later)
    if (!(message.channel.id === process.env.TAVERN_CHANNEL_ID
        || message.channel.id === process.env.TEST_CHANNEL_ID)) return;
    // Has to be (prefix)command
    if (message.content.indexOf(process.env.PREFIX) !== 0) return;
    */
    // "This is the best way to define args. Trust me."
    // - Some tutorial dude on the internet
    const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    switch (command) {
        case "ping":
            if (isAdmin(message.author.id))
                message.reply("What is your command, glorious master!");
            break;
        case "test":
            // For testing embeds
            
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