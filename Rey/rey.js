// .env Variables
const path = require('path');
require('dotenv').config({path: path.join(__dirname, "../.env")});

// Node Modules
const Discord = require('discord.js');
const client = new Discord.Client();
const cron = require('node-cron');

// Bot Modules
const shared = require('../Shared/shared');

// State Machine
var ReyEnumState = {
    WAITING: 0,
    SCAVENGING: 1
}
var reyState = ReyEnumState.WAITING;

const playingActivity = "!scavenge | Scavenging...";

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

    client.user.setStatus('invisible');
    client.user.setActivity(playingActivity);
    console.log(`Connected! \
    \nLogged in as: ${client.user.username} - (${client.user.id})`);
});

// Create an event listener for messages
client.on('message', async message => {
    // Ignores ALL bot messages
    if (message.author.bot) return;
    // Message has to be in Outskirts or Test
    if (!(message.channel.id === process.env.OUTSKIRTS_CHANNEL_ID
        || message.channel.id === process.env.TEST_CHANNEL_ID)) return;
    // Has to be (prefix)command
    if (message.content.indexOf(process.env.PREFIX) !== 0) return;

    // "This is the best way to define args. Trust me."
    // - Some tutorial dude on the internet
    const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    const guild = client.guilds.get(process.env.SANCTUM_ID);

    switch (command) {
        case "rey":
            switch (args[0]) {
                case "summon":
                case "s":
                    if (shared.utility.isAdmin(message.author.id, guild))
                        reySpawnTimer(process.env.OUTSKIRTS_CHANNEL_ID, true);
                    break;
                case "vanish":
                case "v":
                    if (shared.utility.isAdmin(message.author.id, guild))
                        reyTurnOffline(process.env.OUTSKIRTS_CHANNEL_ID);
                    break;
            }
            break;
        case "scavenge":
        case "s":
            scavengeMessage(message);
            break;
        case "materials":
        case "m":
            materialsMessage(message, args);
            break;
    }
});

// Handles errors
client.on('error', console.error);

// Testing a bug-fix for when Discord doesn't recover Playing status
client.on('resume', () => {
    console.log("RESUME: setting playing activity to " + playingActivity);
    client.user.setActivity(playingActivity);
});

function scavengeMessage(message) {
    if (reyState == ReyEnumState.SCAVENGING) {
        scavenge(message.author.id, message.channel.id);
    } else {
        // Tell that Rey is out of the city
        message.reply("I'm outta the city for a while, now. I'll be back later!");
    }
}

function materialsMessage(message, args) {
    if (args[0] === undefined) {
        var materials = shared.core.getMaterials(message.author.id);

        if (materials.response == "success"){
            if (materials.totalQuantity > 0) {
                var messageContent = `${message.author} ***Here's what you found so far...***`;
                const embed = shared.utility.embedTemplate(client, client.user.id)
                    .setTitle("Materials")
                    .setDescription(shared.core.getMaterialsText(client, materials))
                    .setFooter(`${message.member.displayName}, you got ${materials.totalQuantity} materials total.`, message.author.avatarURL)
                message.channel.send(messageContent, {embed});
            } else {
                message.channel.send(`:x: ${message.author} Looks like you don't have any materials yet. Help me out on a ***!scavenge***.`);
            }
        } else {
            message.channel.send(`:x: ${message.author} Sorry, something went wrong. Give me a minute.`);
        }
    } else {
        message.channel.send(`:x: ${message.author} Sorry, not sure what you want me to do.`);
    }
}

//cron.schedule('*/10 * * * *', function() {
cron.schedule('0 */2 * * *', function() {
    console.log('Running 2 hourly process...');
    if (reyState == ReyEnumState.WAITING) {
        reySpawnTimer(process.env.OUTSKIRTS_CHANNEL_ID); 
    }
});

// Rey spawn timer
async function reySpawnTimer(channel, bypassStartTimer) {
    // Random from 6 sec up to 15 min
    if (!bypassStartTimer) {
        var startTime = shared.utility.random(6000, 20 * 60 * 1000);
        console.log(`Waiting for ${shared.utility.formatMSS(Math.trunc(startTime / 1000))} min. for summon.`);
        await shared.utility.sleep(startTime);
    }
    client.user.setStatus('online');
    client.user.setActivity(playingActivity);

    const useEmbed = true;

    if (!useEmbed)
        shared.messaging.sendMessage(client, channel, `***Hey y\'all! Let's scavenge us some materials!***\
        \nUse !scavenge to get some materials.`);
    else {
        const dialog = "***Hey y'all! Let's scavenge us some materials!***";
        const crystals = shared.utility.getEmote(client, "crystals");

        const embed = shared.utility.embedTemplate(client, client.user.id)
            .setTitle("Scavenging")
            .setDescription(`Spend ${crystals} **3** and \`1 STAM\`, y'all might find some cool things!`)
            .setFooter(`Use !scavenge to start digging.`)
        client.channels.get(channel).send(dialog, {embed});
    }

    reyState = ReyEnumState.SCAVENGING;

    // Start time plus another 6 - 10 min
    //var leaveTime = startTime + (2 * 60 * 1000); // Debug 2 Minute Mode
    var leaveTime  = shared.utility.random(6 * 60 * 1000, 10 * 60 * 1000);
    await shared.utility.sleep(leaveTime);

    shared.messaging.sendMessage(client, channel, "Getting ready to pack up here, I think we found enough.\n\n:warning: ***LAST CALL!***");
    await shared.utility.sleep(30000);
    reyTurnOffline(channel);
}

function reyTurnOffline(channel) {
    shared.messaging.sendMessage(client, channel, `Alright ladies and gents... I'm out of here. Nice finding stuff with y'all! \
    \n\n:v: ***HEADS BACK TO THE CITY***`);
    client.user.setStatus('invisible');
    client.user.setActivity('');
    reyState = ReyEnumState.WAITING;
}

// Scavenge logic
function scavenge(userID, channelID) {
    var stats = shared.core.getStats(userID);

    var staminaCost = 1;
    var crystalCost = 3;
    if (stats.health > 0) {
        if (stats.stamina >= staminaCost) {
            if (stats.wallet >= crystalCost) {
                var scavengeResponse = String(shared.dataRequest.sendServerData("scavenge", staminaCost, userID, crystalCost));
                var items = scavengeResponse.split(",");
                var response = parseFloat(items[0]);
                var ultrarare = parseFloat(items[1]);
                var rare = parseFloat(items[2]);
                var uncommon = parseFloat(items[3]);
                var common = parseFloat(items [4]);
                var scrap = parseFloat(items[5]);

                var dialogOptions = [
                    'Hey that works!',
                    'That\'s interesting... Should be able to use that.',
                    'That\'s really useful.',
                    'Great find!',
                    'Wish I found as much stuff as you.',
                    'You\'re on a roll here.',
                    'You\'re better than me at this!',
                    'Nice! Should fetch you a pretty penny.',
                    'That\'s awesome.',
                    'You\'re good at this.'
                ];

                var randomNumber = Math.floor(Math.random() * dialogOptions.length);
                var message = `<@${userID}> \t\t`;
                message += `${shared.utility.getEmote(client, "crystals")} **-${crystalCost}**\t\t`
                if (scrap > 0) { message += `${shared.utility.getEmote(client, "mscrap")} **+${scrap}**\t\t`; }
                if (common > 0) { message += `${shared.utility.getEmote(client, "mcloth")} **+${common}**\t\t`; }
                if (uncommon > 0) { message += `${shared.utility.getEmote(client, "melectronics")} **+${uncommon}**\t\t`; }
                if (rare > 0) { message += `${shared.utility.getEmote(client, "mmetal")} **+${rare}**\t\t`; }
                if (ultrarare > 0) { message += `${shared.utility.getEmote(client, "mgem")} **+${ultrarare}**\t\t`; }
                message += `\n***${dialogOptions[randomNumber]}***`;
                shared.messaging.sendMessage(client, channelID, message);
            } else {
                shared.messaging.sendMessage(client, channelID, `:x: <@${userID}> You don't have enough crystals to sustain you while you're out. Bad idea.`);
            }
        } else {
            shared.messaging.sendMessage(client, channelID, `:x: <@${userID}> You don't have enough stamina for that right now. You should probably get some rest.`);
        }
    } else {
        shared.messaging.sendMessage(client, channelID, `:x: <@${userID}> You're in really bad shape... You should go see <@${process.env.MORI_ID}> before you go on a scavenge.`);
    }
}

// Log our bot in
client.login(process.env.REY_TOKEN);