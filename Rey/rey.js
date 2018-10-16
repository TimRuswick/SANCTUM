// .env Variables
require('dotenv').config({path: '../.env'});

// Node Modules
const Discord = require('discord.js');
const client = new Discord.Client();
const cron = require('node-cron');
const request = require('sync-request');

// Bot Modules
const dataRequest = require('../modules/dataRequest');
const calcRandom = require('../modules/calcRandom');

// State Machine
var ReyEnumState = {
    WAITING: 0,
    SCAVENGING: 1
}
var reyState = ReyEnumState.WAITING;

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
    client.user.setActivity('');
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
    
    switch (command) {
        case "scavenge":
            scavengeMessage(message);
            break;
        case "s":
            scavengeMessage(message);
            break;
        case "materials":
            materialsMessage(message, args);
            break;
        case "m":
            materialsMessage(message, args);
            break;
        case "summon":
            if (isAdmin(message.author.id))
                ReySpawnTimer(process.env.OUTSKIRTS_CHANNEL_ID);
            break;
        case "vanish":
            if (isAdmin(message.author.id))
                ReyTurnOffline(process.env.OUTSKIRTS_CHANNEL_ID);
            break;
    }
});

client.on('error', console.error);

function scavengeMessage(message) {
    if (reyState == ReyEnumState.SCAVENGING) {
        scavenge(message.author.id, message.channel.id);
    } else {
        // Tell that Rey is out of the city
        message.reply("I'm out of the city for a while. I'll be back later!");
    }
}

function materialsMessage(message, args) {
    if (args[0] === undefined) {
        var scavengeResponse = String(dataRequest.loadServerData("artifactsGet", message.author.id));
        var items = scavengeResponse.split(",");
        var response = items[0];
        var ultrarare = parseFloat(items[1]);
        var rare = parseFloat(items[2]);
        var uncommon = parseFloat(items[3]);
        var common = parseFloat(items [4]);
        var scrap = parseFloat(items[5]);
        var totalQuantity = ultrarare + rare + uncommon + common + scrap;

        if (response == "success"){
            if (totalQuantity > 0) {
                var messageContent = "<@" + message.author.id + "> ***Here\'s what you found so far:***\n\n";
                if (scrap > 0) { messageContent += "<:scrap:463436564379336715> **" + scrap + "**\t\t"; }
                if (common > 0) { messageContent += "<:mcloth:462682568483930123> **" + common + "**\t\t"; }
                if (uncommon > 0) { messageContent += "<:mmetal:462682568920137728> **" + uncommon + "**\t\t"; }
                if (rare > 0) { messageContent += "<:melectronics:462682568911749120> **" + rare + "**\t\t"; }
                if (ultrarare > 0) { messageContent += "<:mgem:462450060718768148> **" + ultrarare + "**\n\n"; }
                sendMessage(message.channel.id, messageContent);
            } else {
                sendMessage(message.channel.id, ":x: <@" + message.author.id + "> Looks like you don\'t have any materials yet. Help me out on a ***!scavenge***.");
            }
        } else {
            sendMessage(message.channel.id, ":x: <@" + message.author.id + "> Sorry, something went wrong. Give me a minute.");
        }
    } else {
        sendMessage(message.channel.id, ":x: <@" + message.author.id + "> Sorry, not sure what you want me to do.");
    }
}

//cron.schedule('*/10 * * * *', function() {
cron.schedule('0 */2 * * *', function() {
    console.log('Running 2 hourly process...');
    if (reyState == ReyEnumState.WAITING) {
        ReySpawnTimer(process.env.OUTSKIRTS_CHANNEL_ID); 
    }
});

// Gets if user has an Overseers rank
function isAdmin(userID) {
    var guild = client.guilds.get(process.env.SANCTUM_ID);
    return guild.members.get(userID).roles.find(role => role.name === "Overseers");
}

// Async Waiting
function sleep(time) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, time);
    });
}

// https://stackoverflow.com/questions/3733227/javascript-seconds-to-minutes-and-seconds
function fmtMSS(s){   // accepts seconds as Number or String. Returns m:ss
    return( s -         // take value s and subtract (will try to convert String to Number)
            ( s %= 60 ) // the new value of s, now holding the remainder of s divided by 60 
                        // (will also try to convert String to Number)
          ) / 60 + (    // and divide the resulting Number by 60 
                        // (can never result in a fractional value = no need for rounding)
                        // to which we concatenate a String (converts the Number to String)
                        // who's reference is chosen by the conditional operator:
            9 < s       // if    seconds is larger than 9
            ? ':'       // then  we don't need to prepend a zero
            : ':0'      // else  we do need to prepend a zero
          ) + s ;       // and we add Number s to the string (converting it to String as well)
}

// Rey spawn timer
async function ReySpawnTimer(channel) {
    // Random from 6 sec up to 15 min
    var startTime = calcRandom.random(6000, 20 * 60 * 1000);
    console.log(`Waiting for ${fmtMSS(Math.trunc(startTime / 1000))} min. for summon.`);
    await sleep(startTime);

    client.user.setStatus('online');
    client.user.setActivity('Scavenging...');

    const useEmbed = true;

    if (!useEmbed)
        sendMessage(channel, `***Hey y\'all! Let's scavenge us some materials!***\
        \nUse !scavenge to get some materials.`);
    else {
        const reyBot = client.guilds.get(process.env.SANCTUM_ID).members.get(client.user.id);
        const dialog = "***Hey y'all! Let's scavenge us some materials!***";
        const embed = new Discord.RichEmbed()
            .setAuthor(reyBot.displayName, reyBot.user.avatarURL)
            .setColor(reyBot.displayColor)
            .setTitle("Scavenging")
            .setDescription(`Use **!scavenge** to get some materials.`)
            .addField("Cost", `> <:crystals:460974340247257089> **Crystals** [3x]\n> **1 STAM**`)

        client.channels.get(channel).send(dialog, embed);
    }

    reyState = ReyEnumState.SCAVENGING;

    // Start time plus another 6 - 10 min
    //var leaveTime = startTime + (2 * 60 * 1000); // Debug 2 Minute Mode
    var leaveTime  = calcRandom.random(6 * 60 * 1000, 10 * 60 * 1000);
    await sleep(leaveTime);

    sendMessage(channel, "Getting ready to pack up here, I think we found enough.\n\n:warning: ***LAST CALL!***");
    await sleep(30000);
    ReyTurnOffline(channel);
}

function ReyTurnOffline(channel) {
    sendMessage(channel, `Alright ladies and gents... I'm out of here. Nice finding stuff with y'all! \
    \n\n:v: ***HEADS BACK TO THE CITY***`);
    client.user.setStatus('invisible');
    client.user.setActivity('');
    reyState = ReyEnumState.WAITING;
}

// Scavenge logic
function scavenge(userID, channelID) {
    var attacker = String(dataRequest.loadServerData("userStats", userID));
    var attackerStamina = parseFloat(attacker.split(",")[2]);
    var attackerHealth = parseFloat(attacker.split(",")[3]);
    var attackerWallet = parseFloat(attacker.split(",")[6]);

    var staminaCost = 1;
    var crystalCost = 3;
    if (attackerHealth > 0) {
        if (attackerStamina >= staminaCost) {
            if (attackerWallet >= crystalCost) {
                var scavengeResponse = String(dataRequest.sendServerData("scavenge", staminaCost, userID, crystalCost));
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
                var message = "<@" + userID + "> \t\t";
                message += "<:crystals:460974340247257089> **-" + crystalCost + "**\t\t"
                if (scrap > 0) { message += "<:scrap:463436564379336715>  **+" + scrap + "**\t\t"; }
                if (common > 0) { message += "<:mcloth:462682568483930123> **+" + common + "**\t\t"; }
                if (uncommon > 0) { message += "<:mmetal:462682568920137728> **+" + uncommon + "**\t\t"; }
                if (rare > 0) { message += "<:melectronics:462682568911749120> **+" + rare + "**\t\t"; }
                if (ultrarare > 0) { message += "<:mgem:462450060718768148> **+" + ultrarare + "**\n\n"; }
                message += "\n***" + dialogOptions[randomNumber] + "*** \n"
                sendMessage(channelID, message);
            } else {
                sendMessage(channelID, ":x: <@" + userID + "> You don\'t have enough crystals to sustain you while you\'re out. Bad idea.");
            }
        } else {
            sendMessage(channelID, ":x: <@" + userID + "> You don\'t have enough stamina for that right now. You should probably get some rest.");
        }
    } else {
        sendMessage(channelID, ":x: <@" + userID + "> You\'re in really bad shape... You should go see <@461294299515191306> before you go on a scavenge.");
    }
}


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
client.login(process.env.REY_TOKEN);