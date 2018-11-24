// @ts-nocheck
// .env Variables
require('dotenv').config({path: '../.env'});

// Node Modules
const Discord = require('discord.js');
const client = new Discord.Client();
const cron = require('node-cron');

// Bot Modules
const shared = require('../Shared/shared');

const normalActivity = '!wager | Games of Fortune';

// State Machine
var MosiahEnumState = {
    WAITING: 0,
    GAMBLING: 1
}
var mosiahState = MosiahEnumState.WAITING;

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
    console.log(`Connected! \
    \nLogged in as: ${client.user.username} - (${client.user.id})`);
});

// Create an event listener for messages
client.on('message', async message => {
    // Ignores ALL bot messages
    if (message.author.bot) return;
    // Message has to be in Tavern or Test
    if (!(message.channel.id === process.env.TAVERN_CHANNEL_ID
        || message.channel.id === process.env.TEST_CHANNEL_ID)) return;
    // Has to be (prefix)command
    if (message.content.indexOf(process.env.PREFIX) !== 0) return;

    // "This is the best way to define args. Trust me."
    // - Some tutorial dude on the internet
    const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    const guild = client.guilds.get(process.env.SANCTUM_ID);

    switch (command) {
        case "mosiah":
            switch (args[0]) {
                case "summon":
                case "s":
                    if (shared.utility.isAdmin(message.author.id, guild)) 
                        mosiahTurnOnline();
                    break;
                case "vanish":
                case "v":
                    if (shared.utility.isAdmin(message.author.id, guild))
                        mosiahTurnOffline();
                    break;
            }
            break;
        case "wager":
            if (mosiahState == MosiahEnumState.GAMBLING)
                wagerMessage(message, args);
            else
                message.reply("I'm out and about right now. Don't wanna get found by the wrong peoples.");
            break;
        case "rigged":
            // Better dialog would be nice
            message.channel.send("What are ya talkin' about? I may look like it, being an outcaster from the city, but I'd never rip peoples off.");

            // Testing out textadv payment
            if (shared.utility.isAdmin(message.author.id, guild)) shared.dataRequest.sendServerData("gambleWon", 50, message.author.id);
            break;
    }
});

// Handles errors
client.on('error', console.error);

// Wagering
function wagerMessage(message, args) {
    var amount = Math.floor(args[0]);
    var account = shared.dataRequest.loadServerData("account", message.author.id);
    if (amount > 0) {
        if (amount <= account) {
            if (shared.utility.randomPercent(49)) {
                message.channel.send(`${message.author} Ya got me. Here's your ${amount} crystals.`);
                shared.dataRequest.sendServerData("gambleWon", amount, message.author.id);
            } else {
                message.channel.send(`${message.author} Looks like ya lost. Guess I'll keep your ${amount} crystals.`);
                shared.dataRequest.sendServerData("gambleLost", amount, message.author.id);
            }
        } else {
              message.channel.send(`:x: ${message.author} Yer a funny one ain't ya. Show me the crystals first.`);
        }
    } else {
        message.channel.send(`:x: ${message.author} Aww c'mon. You wanna wager me nothin'?`);
    }
}

// Cron schedules to determine when Mosiah is online or offline
cron.schedule('0 7 * * Saturday', function(){
    console.log('Saturday join.' + new Date().toLocaleString());
    mosiahTurnOnline();
});
  
cron.schedule('0 7 * * Sunday', function(){
    console.log('Sunday leave.' + new Date().toLocaleString());
    mosiahTurnOffline();
});

// Functions for turning Mosiah online and offline
function mosiahTurnOnline() {
    client.user.setStatus('online');
    client.user.setActivity(normalActivity);
    client.channels.get(process.env.TAVERN_CHANNEL_ID).send("Anyone wanna wager a few crystals with me?");
    mosiahState = MosiahEnumState.GAMBLING;
}

function mosiahTurnOffline() {
    client.user.setStatus('invisible');
    mosiahState = MosiahEnumState.WAITING;
}

// Log our bot in
client.login(process.env.MOSIAH_TOKEN);