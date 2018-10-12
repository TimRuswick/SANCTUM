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

var medItems = [0, 1, 2];
var availableTreatments = [];
var itemCount = 3;
const treatments = [
    // Name | Crystals | HP | Description
    /*
    ['TREAT','5','15','Heals 15HP immediately. Must have more than 0HP.'],
    ['TREATV2','7','%15','Heals to 15% HP immediately. Must have more than 0HP.'],
    */
    ['PATCH','10','50','Heals 50HP immediately. Must have more than 0HP.'],
    ['PATCHV2','15','%50','Heals to 50% HP immediately. Must have more than 0HP.'],
    ['REGEN','20','100','Heals 100HP immediately. Must have more than 0HP.'],
    ['REGENV2','25','%100','Heals all HP to maximum immediately. Must have more than 0HP.'],
    ['REVIVE','20','25','Brings a traveler back from a KO (0HP) to 25HP immediately.'],
    ['REVIVEV2','25','%50','Brings a traveler back from a KO (0HP) to 50% HP immediately.'],
    ['REVIVEV3','30','%100','Brings a traveler back from a KO (0HP) to 100% HP immediately.']
];

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
    client.user.setActivity('!heal | BioMed Specialist.');
    console.log(`Connected! \
    \nLogged in as: ${client.user.username} - (${client.user.id})`);

    resetInventory(itemCount);
});

//Revives everyone every morning at 7am PST (server time dependant).
cron.schedule('0 7 * * *', function() {
    console.log('Reviving');
    dataRequest.sendServerData("reviveAll",0);
  
    var dialogOptions = [
      'Ahhh. Just finished reviving all of our fellow travelers.',
      'Rezing travelers is hard work. <@462708244171718656> How was your night?',
      'Finished up bringing everybody back from the dead. I swear I\'m a magician sometimes.',
      'Another day. More lives saved. No thanks from anybody. Good times.',
      'Hello everybody. I see you\'re alive and well. Because of me, but no biggie.',
      'Bringing everybody back every day is grueling, thankless work.',
      'I need a vacation. Just brought everybody back and they immediatly go fight ravagers.',
      'Everybody should be up. Please don\'t run straight to the deadlands.',
      'Everybody is alive. Thanks to me. But hey, no need to thank me or anything. I\' just drink in silence.',
      'Good day. All the travelers are back up. Time for some sleep. Goodnight everybody.'
    ];
    var randomNumber = Math.floor(Math.random() * dialogOptions.length);
  
    client.channels.get(process.env.TAVERN_CHANNEL_ID).startTyping();
    setTimeout(function() {
        sendMessage(process.env.TAVERN_CHANNEL_ID, dialogOptions[randomNumber]);
        client.channels.get(process.env.TAVERN_CHANNEL_ID).stopTyping(true);
    }, calcRandom.random(2500,6000));
    resetInventory(itemCount);
});

// Create an event listener for messages
client.on('message', async message => {
    // Ignores ALL bot messages
    if (message.author.bot) return;
    // Message has to be in Outskirts (should be edited later)
    if (!channelProcessor.isBotChannel(message.channel.id)) return;
    // Has to be (prefix)command
    if (message.content.indexOf (process.env.PREFIX) !== 0) return;

    // "This is the best way to define args. Trust me."
    // - Some tutorial dude on the internet
    const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    switch (command) {
        case "reset":
            if (isAdmin(message.author.id))
                resetInventory(3);
        break;
        case "heal":
            if (!args[0]) {
                // Grabs all parameters from server
                var attacker = String(dataRequest.loadServerData("userStats",message.author.id));
                var attackerWallet = parseFloat(attacker.split(",")[6]);    // Crystals
                
                var intro = `${message.author} Here's what I've got at the moment. My prices are based on availability, `
                    + `it's hard to find stuff these days.`;
                var newMessage = "";
                for (var i = 0; i < availableTreatments.length; i++) {
                    //newMessage += availableTreatments[i][0] + " - **" + availableTreatments[i][1] + "**<:crystals:460974340247257089>\n```" + availableTreatments[i][3] + "```\n";
                    newMessage += `${availableTreatments[i][0]} - <:crystals:460974340247257089> **${availableTreatments[i][1]}**\n` + "```" + availableTreatments[i][3] + "```\n";
                }
                const keepersOfTheCityColor = client.guilds.get(process.env.SANCTUM_ID).roles.find(role => role.name === "Keepers of the City").color;
                const embed = new Discord.RichEmbed()
	                .setAuthor("Mori", client.user.avatarURL)
					.setColor(keepersOfTheCityColor)
					.setTitle("BioTech Healing")
                    .setDescription(newMessage)
                    .setFooter(`${message.member.displayName}, you have ${attackerWallet} crystals. Use !heal [OPTION] to buy.`)
                //sendMessage(message.channel.id, newMessage);
                message.channel.send(intro, embed);
            } else {
                //4815
                var purchase = args[0].toUpperCase();
                var treatmentCost = 0;
                var treatmentName = '';
                var treatmentAvailable = false;
                for (var i = 0, len = availableTreatments.length; i < len; i++) {
                    if (availableTreatments[i][0] === purchase) {
                        treatmentAvailable = true;
                        treatmentName = availableTreatments[i][0];
                        //treatmentCost = availableTreatments[i][1];
                        break;
                    }
                }
                if (treatmentAvailable) {
                    var healResponse = String(dataRequest.sendServerData("heal", treatmentCost, message.author.id, treatmentName));
                    var response = String(healResponse.split(",")[0]);
                    var health = String(healResponse.split(",")[1]);
                    switch (response) {
                        case "success":
                            sendMessage(message.channel.id, "<@" + message.author.id + "> I\'ve applied a " + purchase + " via nanotech .\n**-" + treatmentCost + "**<:crystals:460974340247257089> | **" + health + "**HP." );
                        break;
                        case "notEnoughCrystals":
                            sendMessage(message.channel.id, ":x: <@" + message.author.id + "> Sorry, looks like you don\'t have the funds for that." );
                        break;
                        case "cantDoThat":
                            sendMessage(message.channel.id, ":x: <@" + message.author.id + "> Sorry, you don\'t meet the requirements for this procedure." );
                        break;
                        case "youreKnockedOut":
                            sendMessage(message.channel.id, ":x: <@" + message.author.id + "> You\'re currently knoecked out (0HP). You require a revive procdure to heal immediately, or you can wait until 7 AM UTC when I revive everyone." );
                        break;
                        case "lessThanYourHealth":
                            sendMessage(message.channel.id, ":x: <@" + message.author.id + "> Doing that procedure would put you at less than your current HP." );
                        break;
                        case "fullHealth":
                            sendMessage(message.channel.id, ":x: <@" + message.author.id + "> Looks like you\'re already full health. Why would you want to heal?" );
                        break;
                        case "failure":
                            sendMessage(message.channel.id, ":x: <@" + message.author.id + "> Sorry, not sure I understand what procedure you\'d like to purchase." );
                        break;
                    }
                } else{
                    sendMessage(message.channel.id, ":x: <@" + message.author.id + "> I don\'t have that type of procedure available." );
                }
            }
        break;
    }
});

client.on('error', console.error);

// Gets if user has an Overseers rank
function isAdmin(userID) {
    var guild = client.guilds.get(process.env.SANCTUM_ID);
    return guild.members.get(userID).roles.find(role => role.name === "Overseers");
}

function resetInventory(itemCount) {
    console.log("\nResetting inventory...");
    medItems = [];
    availableTreatments = [];
    var treatmentsClone = arrayClone(treatments);
    var tempnum = 0;
    var i = 0;
    // DEBUG
    //itemCount = treatments.length;

    // Chooses random numbers, in order to pick random heal packs
    do {
        tempnum = Math.floor(Math.random() * treatments.length);
        if (!medItems.includes(tempnum)) {
            medItems.push(tempnum);
        }
        i++;
    }
    while (medItems.length < itemCount);
  
    medItems.sort(sortNumber);
    message = "";
    var list2 = new Array();
    for (var i = 0; i < medItems.length; i++) {
        //console.log('MED ITEM: [' + medItems[i] + '] ADDED');
        availableTreatments.push(treatmentsClone[medItems[i]]);
        tempnum = parseFloat(availableTreatments[i][1]);
        //console.log(">>> Tempnum: " + tempnum + " | availableTreatments: " + availableTreatments[i][1]);
        //console.log(">>> MedItems: " + treatments[medItems[i]] + "");
        // Older Calculations
        var multiple = parseFloat(Math.floor(tempnum / 6));
        if (calcRandom.gamble(50)) {
            availableTreatments[i][1] = tempnum + multiple;
        } else {
            availableTreatments[i][1] = tempnum - multiple;
        }

        // Specifically for Treat
        availableTreatments[i][1] += calcRandom.random(-3, 3);

        console.log(availableTreatments[i][0] + " | Base Cost: " + tempnum + " | HP: " + availableTreatments[i][2] + " | Modifier: " + multiple + " | Final: " + availableTreatments[i][1]);
        
        message = availableTreatments[i][0] + " - **" + availableTreatments[i][1] + "**<:crystals:460974340247257089>\n```" + availableTreatments[i][3] + "```\n";
        //console.log(message);
    }
}
  
function sortNumber(a,b) {
    return a - b;
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

/*
This function is for fixing a bug where an array gets edited, and possibly 
causing negative numbers due to my calcRandom +2 -2 change. This will not
work with arrays containing objects (eg. JSON data).
*/
// https://blog.andrewray.me/how-to-clone-a-nested-array-in-javascript/
function arrayClone(arr) {
    var i, copy;

    if( Array.isArray( arr ) ) {
        copy = arr.slice( 0 );
        for( i = 0; i < copy.length; i++ ) {
            copy[ i ] = arrayClone( copy[ i ] );
        }
        return copy;
    } else if( typeof arr === 'object' ) {
        throw 'Cannot clone array containing an object!';
    } else {
        return arr;
    }

}


// Log our bot in (change the token by looking into the .env file)
client.login(process.env.MORI_TOKEN);