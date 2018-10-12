// .env Variables
require('dotenv').config({path: '../.env'});

// Node Modules
const Discord = require('discord.js');
const client = new Discord.Client();
const cron = require('node-cron');

// Bot Modules
const dataRequest = require('../modules/dataRequest');
const calcRandom = require('../modules/calcRandom');

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
    client.user.setActivity(normalActivity);
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

    switch (command) {
        case "wager":
            if (mosiahState == MosiahEnumState.GAMBLING)
                wagerMessage(message, args);
            else
                message.reply("I'm out and about right now. Don't wanna get found by the wrong peoples.");
            break;
        case "summon":
            if (isAdmin(message.author.id)) MosiahTurnOnline();
            break;
        case "vanish":
            if (isAdmin(message.author.id)) MosiahTurnOffline();
            break;
        case "rigged":
            message.channel.send("What are you talkin' about? I may look like it, being an outcaster from the city, but I'd never rip peoples off.");

            // Testing out textadv payment
            if (isAdmin(message.author.id)) dataRequest.sendServerData("gambleWon", 50, message.author.id);
            break;
    }
});

client.on('error', console.error);

// Gets if user has an Overseers rank
function isAdmin(userID) {
    var guild = client.guilds.get(process.env.SANCTUM_ID);
    return guild.members.get(userID).roles.find(role => role.name === "Overseers");
}

function wagerMessage(message, args) {
    var amount = Math.floor(args[0]);
    var account = dataRequest.loadServerData("account", message.author.id);
    if (amount > 0) {
        if (amount <= account) {
            if (calcRandom.gamble(49)) {
                sendMessage(message.channel.id, "<@" + message.author.id + "> Ya got me. Here's your " + amount + " crystals. ");
                dataRequest.sendServerData("gambleWon", amount, message.author.id);
            } else {
                sendMessage(message.channel.id, "<@" + message.author.id + "> Looks like ya lost. Guess I'll keep your " + amount + " crystals. ");
                dataRequest.sendServerData("gambleLost", amount, message.author.id);
            }
        } else {
              sendMessage(message.channel.id, ":x: <@" + message.author.id + "> Yer a funny one ain't ya. Show me the crystals first.");
        }
    } else {
        sendMessage(message.channel.id, ":x: <@" + message.author.id + "> Aww c'mon. You wanna wager me nothin'?");
    }
}

cron.schedule('0 7 * * Saturday', function(){
    console.log('Saturday join.' + new Date().toLocaleString());
    MosiahTurnOnline();
});
  
cron.schedule('0 7 * * Sunday', function(){
    console.log('Sunday leave.' + new Date().toLocaleString());
    MosiahTurnOffline();
});
  
function MosiahTurnOnline() {
    client.user.setStatus('online');
    client.channels.get(process.env.TAVERN_CHANNEL_ID).send("*Psst.* Anyone wanna wager a few **<:crystals:460974340247257089> Crystals** with me?");
    mosiahState = MosiahEnumState.GAMBLING;
}

function MosiahTurnOffline() {
    client.user.setStatus('invisible');
    mosiahState = MosiahEnumState.WAITING;
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
client.login(process.env.MOSIAH_TOKEN);