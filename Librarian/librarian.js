// .env Variables
const path = require('path');
require('dotenv').config({path: path.join(__dirname, "../.env")});

// Node Modules
const Discord = require('discord.js');
const client = new Discord.Client();
const cron = require('node-cron');

const shared = require("../Shared/shared");

// State Machine (Uncomment if needed)
var BotEnumState = {
    WAITING: 0,
    ACTIVE: 1
}
var botState = BotEnumState.ACTIVE;

const playingActivity = 'Scribe of the Codex';

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
    // Message has to be in Outskirts (should be edited later)
    //if (!(message.channel.id === process.env.TAVERN_CHANNEL_ID
    //    || message.channel.id === process.env.TEST_CHANNEL_ID)) return;
    // Has to be (prefix)command
    if (message.content.indexOf(process.env.PREFIX) !== 0) return;

    // "This is the best way to define args. Trust me."
    // - Some tutorial dude on the internet
    const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    switch (command) {
        case "ping":
            if (shared.utility.isAdmin(message.author.id, message.guild))
                message.reply("Pong!");
            break;
        case "summon":
            if (shared.utility.isAdmin(message.author.id, message.guild)) {
                console.log("Summon the bot!");
                botTurnOnline(process.env.TAVERN_CHANNEL_ID);
            }
            break;
        case "vanish":
            if (shared.utility.isAdmin(message.author.id, message.guild)) {
                botTurnOffline(process.env.TAVERN_CHANNEL_ID);
            }
            break;
    }
});

// Testing a bug-fix for when Discord doesn't recover Playing status
client.on('resume', () => {
    console.log("RESUME: setting playing activity to " + playingActivity);
    client.user.setActivity(playingActivity);
});

// Handles errors
client.on('error', console.error);

// Turn online and turn offline
function botTurnOnline(channel) {
    client.channels.get(channel).send(
        `Insert Online Message here.` +
        `\n\n***SOME BOLD AND ITALIC TEXT***`);
    client.user.setStatus('online');
    client.user.setActivity(playingActivity);
    botState = BotEnumState.ACTIVE;
}

function botTurnOffline(channel) {
    client.channels.get(channel).send(
        `Insert Offline Message here.` +
        `\n\n***SOME BOLD AND ITALIC TEXT***`);
    client.user.setStatus('invisible');
    client.user.setActivity('');
    botState = BotEnumState.WAITING;
}

// You may use cron normally
cron.schedule('0 7 * * Saturday', function() {
    console.log('Saturday join.');
});

// Log our bot in (change the token by looking into the .env file)
client.login(process.env.LIBRARIAN_TOKEN);