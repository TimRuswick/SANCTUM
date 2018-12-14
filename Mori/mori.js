// .env Variables
const path = require('path');
require('dotenv').config({path: path.join(__dirname, "../.env")});

// Node Modules
const Discord = require('discord.js');
const client = new Discord.Client();
const cron = require('node-cron');

// Bot Modules (stores http requests & random functions respectively)
const shared = require('../Shared/shared');

const playingActivity = '!heal | BioMed Specialist.';

var medItems = [0, 1, 2];
var availableTreatments = [];
var itemCount = 3;

const treatments = [
    // Name | Type | Crystals | HP | Description
    /*
    ['TREAT','5','15','Heals 15HP immediately. Must have more than 0HP.'],
    ['TREATV2','7','%15','Heals to 15% HP immediately. Must have more than 0HP.'],
    */
    ['PATCH','3','50','Heals 50HP immediately. Must have more than 0HP.'],
    ['PATCHV2','5','%50','Heals to 50% HP immediately. Must have more than 0HP.'],
    ['REGEN','7','100','Heals 100HP immediately. Must have more than 0HP.'],
    ['REGENV2','9','%100','Heals all HP to maximum immediately. Must have more than 0HP.'],
    ['REVIVE','10','25','Brings a traveler back from a KO (0HP) to 25HP immediately.'],
    ['REVIVEV2','18','%50','Brings a traveler back from a KO (0HP) to 50% HP immediately.'],
    ['REVIVEV3','23','%100','Brings a traveler back from a KO (0HP) to 100% HP immediately.']
];

resetInventory(itemCount);

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

//Revives everyone every morning at 7am PST (server time dependant).
cron.schedule('0 7 * * *', function() {
    console.log('Reviving');
    shared.dataRequest.sendServerData("reviveAll",0);
  
    var dialogOptions = [
      'Ahhh. Just finished reviving all of our fellow travelers.',
      `Rezing travelers is hard work. <@${process.env.ALEXIS_ID}> How was your night?`,
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
        shared.messaging.sendMessage(client, process.env.TAVERN_CHANNEL_ID, dialogOptions[randomNumber]);
        client.channels.get(process.env.TAVERN_CHANNEL_ID).stopTyping(true);
    }, shared.utility.random(2500,6000));
    resetInventory(itemCount);
});

// Create an event listener for messages
client.on('message', async message => {
    // Ignores ALL bot messages
    if (message.author.bot) return;
    // Message has to be in Outskirts (should be edited later)
    if (!shared.messaging.isFactionBotspam(message.channel.id)) return;
    // Has to be (prefix)command
    if (message.content.indexOf (process.env.PREFIX) !== 0) return;

    // "This is the best way to define args. Trust me."
    // - Some tutorial dude on the internet
    const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    
    switch (command) {
        case "reset":
            if (shared.utility.isAdmin(message.author.id, message.guild)) {
                // Message for prototyping
                //message.channel.send(`${message.author} Alright master. I'll indulge myself of getting *different* ways to heal you. It's not like it's hard or anything to get these materials to do it in this bare wasteland, you know.\n\n***RESET INVENTORY FOR DEVELOPER/ADMIN***`); 
                resetInventory(3);
            }
        break;
        case "heal":
            if (!args[0]) {
                // Grabs parameters from server
                var stats = shared.core.getStats(message.author.id);
                
                var intro = `${message.author} Here's what I've got at the moment. My prices are based on availability, `
                    + `it's hard to find stuff these days.`;
                var newMessage = "";
                for (var i = 0; i < availableTreatments.length; i++) {
                    newMessage += `${availableTreatments[i][0]} - ${shared.utility.getEmote(client, "crystals")} **${availableTreatments[i][1]}**\n` + "```" + availableTreatments[i][3] + "```\n";
                }
                const keepersOfTheCityColor = client.guilds.get(process.env.SANCTUM_ID).roles.find(role => role.name === "Keepers of the City").color;
                const embed = new Discord.RichEmbed()
	                .setAuthor("Mori", client.user.avatarURL)
					.setColor(keepersOfTheCityColor)
					.setTitle("BioTech Healing")
                    .setDescription(newMessage)
                    .setFooter(`${message.member.displayName}, you have ${stats.wallet} crystals. Use !heal [OPTION] to buy.`, message.author.avatarURL)

                message.channel.send(intro, embed);
            } else {
                var purchase = args[0].toUpperCase();
                var treatmentCost = 0;
                var treatmentName = '';
                var treatmentAvailable = false;
                for (var i = 0, len = availableTreatments.length; i < len; i++) {
                    if (availableTreatments[i][0] === purchase) {
                        treatmentAvailable = true;
                        treatmentName = availableTreatments[i][0];
                        treatmentCost = availableTreatments[i][1];
                        break;
                    }
                }
                if (treatmentAvailable) {
                    var healResponse = String(shared.dataRequest.sendServerData("heal", treatmentCost, message.author.id, treatmentName));
                    var response = String(healResponse.split(",")[0]);
                    var health = String(healResponse.split(",")[1]);
                    switch (response) {
                        case "success":
                            message.channel.send(`${message.author} I\'ve applied a ${purchase} via nanotech.\n${shared.utility.getEmote(client, "crystals")} **-${treatmentCost}** | **${health}** HP.`);
                            break;
                        case "notEnoughCrystals":
                            message.channel.send(`:x: ${message.author} Sorry, looks like you don\'t have the funds for that.`);
                            break;
                        case "cantDoThat":
                            message.channel.send(`:x: ${message.author} Sorry, you don\'t meet the requirements for this procedure.`);
                            break;
                        case "youreKnockedOut":
                            message.channel.send(`:x: ${message.author} You\'re currently knoecked out (0HP). You require a revive procdure to heal immediately, or you can wait until 7 AM UTC when I revive everyone.`);
                            break;
                        case "lessThanYourHealth":
                            message.channel.send(`:x: ${message.author} Doing that procedure would put you at less than your current HP.`);
                            break;
                        case "fullHealth":
                            message.channel.send(`:x: ${message.author} Looks like you\'re already full health. Why would you want to heal?`);
                            break;
                        case "failure":
                            message.channel.send(`:x: ${message.author} Sorry, not sure I understand what procedure you\'d like to purchase.`);
                            break;
                    }
                } else{
                    message.channel.send(`:x: ${message.author} I don\'t have that type of procedure available.`);
                }
            }
        break;
    }
});

// Handles errors
client.on('error', console.error);

// Testing a bug-fix for when Discord doesn't recover Playing status
client.on('presenceUpdate', (oldMember, newMember) => {
    if (oldMember.id !== client.user.id) return;
    console.log(`Detected a presence update from "${oldMember.presence.game.name}" to "${newMember.presence.game.name}".`);
    if (newMember.presence.game.name !== playingActivity) {
        console.log("presenceUpdate: setting playing activity to " + playingActivity);
        client.user.setActivity(playingActivity);   
    }
});

function resetInventory(itemCount) {
    console.log("\nResetting inventory...");
    medItems = [];
    availableTreatments = [];
    var treatmentsClone = shared.utility.cloneArray(treatments);
    var tempnum = 0;
    var i = 0;
    // DEBUG
    //itemCount = treatments.length;

    // Chooses random numbers, in order to pick random heal packs
    var patches = treatments.filter(treatment => treatment[0].includes("PATCH"));
    var regens = treatments.filter(treatment => treatment[0].includes("REGEN"));
    var revives = treatments.filter(treatment => treatment[0].includes("REVIVE"));
    var healTypes = [patches, regens, revives];

    healTypes.forEach(element => {
        tempnum = Math.floor(Math.random() * element.length);
        //console.log("ELEMENT " + element + "\n");
        //console.log("New Object " + element[tempnum] + "\n" + treatments.indexOf(element) + "\n");
        medItems.push(treatments.indexOf(element[tempnum]));
    });
    
    /*
    do {
        tempnum = Math.floor(Math.random() * treatments.length);
        if (!medItems.includes(tempnum)) {
            medItems.push(tempnum);
        }
        i++;
        console.log(tempnum);
    }
    while (medItems.length < itemCount);
    */
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
        var randomized = shared.utility.random(-multiple, multiple);
        availableTreatments[i][1] = tempnum + randomized;

        // Specifically for Treat
        //availableTreatments[i][1] += 

        var hp = availableTreatments[i][2];
        var baseHP = 180;
        if (hp.includes('%')) {
            hp = hp.replace('%', '');
            hp = Math.round(hp / 100 * baseHP);
            console.log(`> ${hp} / ${baseHP} HP (BASE HP ${baseHP})`);
        }
        var healthPerCrystal = (hp / availableTreatments[i][1]).toFixed(2);
        console.log(`${availableTreatments[i][0]} | Cost: ${tempnum} += ${randomized} = ${availableTreatments[i][1]} | HP: ${availableTreatments[i][2]} | HP/C ${healthPerCrystal}`);
    }
}
  
function sortNumber(a,b) {
    return a - b;
}

// Log our bot in (change the token by looking into the .env file)
client.login(process.env.MORI_TOKEN);