// .env Variables
const path = require('path');
require('dotenv').config({path: path.join(__dirname, "../.env")});

// Node Modules
const Discord = require('discord.js');
const client = new Discord.Client();
const cron = require('node-cron');

const shared = require("../Shared/shared");
const dataRequest = require("../Shared/dataRequest");

// State Machine (Uncomment if needed)
var RavagerEnumState = {
    WAITING: 0,
    ACTIVE: 1
}
const playingMessage = 'Prowling...';
var ravagerState = RavagerEnumState.WAITING;
var hostileCycle = 0;
var spawnPercentage = 50;
var hostileLevel = 1;
var hostileType = "ravager";
var sendAttacksEverySec;
var attackQueue = [];

// The ready event is vital, it means that your bot will only start reacting to information
// from Discord _after_ ready is emitted
client.on('ready', async () => {
    // Generates invite link
    try {
        let link = await client.generateInvite();
        console.log("Invite Link: " + link);
    } catch(e) {
        console.log(e.stack);
    }

    // You can set status to 'online', 'invisible', 'away', or 'dnd' (do not disturb)
    client.user.setStatus('invisible');
    // Sets your "Playing"
    client.user.setActivity(playingMessage);
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
                let array = [1, 2, 3];
                console.log(shared.utility.cloneArray(array));
            break;
        case "hp":
            if (shared.utility.isAdmin(message.author.id, message.guild)) {
                message.reply(
                    healthbar2(shared.utility.getPositiveNumber(args[0]), 
                                shared.utility.getPositiveNumber(args[1]))
                );
            }
            break;
        case "ravager":
        case "r":
            if (shared.utility.isAdmin(message.author.id, message.guild)) {
                switch (args[0]) {
                    case "summon":
                    case "s":
                        console.log("Summon the bot!");
                        newRavagerSequence(true);
                        break;
                    case "vanish":
                    case "v":
                        console.log("Vanish the bot!");
                        ravagerTurnOffline(message.channel);
                        break;
                }
            }
            break;
        case "attack":
            logAttack(message.author.id);
            break;
        case "details":
            embedDetails(message.channel.id, 0);
            break;
    }
});

// Handles errors
client.on('error', console.error);

// Every 15 minutes
cron.schedule('*/15 * * * *', () => {
    console.log('Running 15 min process...');
    if (shared.utility.randomPercent(50)) {
        console.log("Triggered!");
        spawnPercentage = 50;
        newRavagerSequence();
    } else {
        spawnPercentage += 10;
        console.log(`Didn't create one... adding 10% more (now ${spawnPercentage}%) chance of spawning.`);
    }
});

// Creates new Ravager
async function newRavagerSequence(instant) {
    // Prowling
    async function prowling() {
        let creationTime = Math.round(shared.utility.random(35 * 1000, 54 * 10000) / 1000);
        if (instant) creationTime = 0; 
        console.log('Baddie will be created in ' + shared.utility.formatMSS(creationTime) + " min. (" + creationTime + " sec)");
        await shared.utility.sleep(creationTime * 1000);
        ravagerTurnOnline(process.env.DEADLANDS_CHANNEL_ID);
        if (!instant) await shared.utility.sleep(30 * 1000);
    }

    // Appearance
    async function appearance() {
        // Creates new Ravager in server
        var hostileCreated = String(dataRequest.sendServerData("newHostile", hostileLevel));
        var hostileHealth = parseFloat(hostileCreated.split(",")[0]);
        var hostileSpeed = parseFloat(hostileCreated.split(",")[1]);
        var hostileStrength = parseFloat(hostileCreated.split(",")[2]);
        const hostileStats = `LVL: ${hostileLevel} | HP: ${hostileHealth} | STR: ${hostileStrength} | SPD: ${hostileSpeed}`;
        const ravagerMember = client.guilds.get(process.env.SANCTUM_ID).members.get(client.user.id);
        
        // Sends message & changes status
        var appearanceEmbed = new Discord.RichEmbed()
            .setAuthor(ravagerMember.displayName, client.user.avatarURL)
            .setColor(ravagerMember.displayColor)
            .setDescription(`${healthbar(hostileHealth, hostileHealth)}\n` + "```" + hostileStats + "```")
            .setFooter("Use !attack to attack the Ravager.")

        client.channels.get(process.env.DEADLANDS_CHANNEL_ID)
            .send(getDialog("onTheProwl"), { embed: appearanceEmbed });

        client.user.setActivity(hostileStats);

        // Increases level on the next spawn
        hostileLevel++;

        sendAttacksEverySec = setInterval(sendAttacks, 2000);

        // Between 3 and 6 minutes, Ravager attempts to flee
        var fleeTime = Math.round(shared.utility.random(3 * 60 * 1000, 6 * 60 * 1000) / 1000);
        console.log('Baddie will flee in ' + shared.utility.formatMSS(fleeTime) + " min. (" + fleeTime + " sec)");
        await shared.utility.sleep(fleeTime * 1000);
    }

    // Fleeing
    async function fleeing(cachedHostile) {
        hostile = String(dataRequest.loadServerData("hostileActive", 0));
        console.log("[FleeingFunc] Checking if should flee in fleeing(); if 0, Hostile is not there: " + hostile)
        
        // Checks if hostile exists && Ravager fleeing now isn't an older Ravager
        if (hostile !== '0' && cachedHostile === hostile) {
            client.channels.get(process.env.DEADLANDS_CHANNEL_ID).send(
                "**YOU ARE WEAK. THERE IS NO CHALLENGE FOR ME HERE.**" + 
                "\n:bangbang:***ATTEMPTING TO FLEE...***");
            await shared.utility.sleep(20 * 1000);

            let hostile = String(dataRequest.loadServerData("hostileActive", 0));
            if (hostile !== '0') {
                console.log("[FleeingFunc] Fleeing after the 20 seconds...");
                ravagerTurnOffline(process.env.DEADLANDS_CHANNEL_ID);
            }
        }
    }

    // Checks for if there's a Ravager
    var hostile = String(dataRequest.loadServerData("hostileActive", 0));
    console.log(`Baddies: ${hostile}`);
    if (hostile === '0') {
        attackQueue = [];
        await prowling();
        await appearance();
        hostile = String(dataRequest.loadServerData("hostileActive", 0));
        await fleeing(hostile);
    } else {
        console.log(`RAVAGER ALREADY EXISTS!! hostile = ${hostile}`);
    }
}
// Health bar
function healthbar(health, maxHealth) {
    var heartHealthAmount = 30;
    var printString = "";
    var amountMultiple = 0;
    var timesToLoop = Math.floor(maxHealth / heartHealthAmount);
    for (var i = 0; i < timesToLoop; i++) {
        amountMultiple = i * heartHealthAmount;
        if (amountMultiple < health) {
            printString += ":heart: ";
        } else {
            printString += ":black_heart:";
        }
    }
    printString += " (" + health + "/" + maxHealth + ")";
    return printString;
}

function healthbar2(health, maxHealth) {
    var heartHealthAmount = 50;
    var printString = "";
    var amountMultiple = 0;
    var tempHealth = Math.max(health, 0);
    console.log("Health: " + health + "/" + maxHealth + " | " + tempHealth);
    
    // Adds all the red hearts. (with jank patch)
    while (tempHealth >= heartHealthAmount) {
        //if (tempHealth > 0) printString += ":heart: ";
        //else printString += ":black_heart: ";
        printString += ":heart: ";
        tempHealth -= heartHealthAmount;
        //console.log(":heart: Minus " + tempHealth)
    }
  
    // Adds the half heart (if there is one)
    /*
    if(tempHealth > heartHealthAmount / 2){
        printString += `${client.emojis.find(emoji => emoji.name === "hearthalf")}`;
        tempHealth -= heartHealthAmount / 2;
    }
    */

    // Adds the rest of the black hearts
    tempHealth = maxHealth - Math.max(health, 0);
    while (tempHealth >= heartHealthAmount) {
        printString += ":black_heart: ";
        tempHealth -= heartHealthAmount;
        //console.log(":black_heart: Minus " + tempHealth)
    }
  
    printString += " (" + health + "/" + maxHealth + ")";
    return printString;
  //custom emojis <:heartfull:460903750916112414>
}

// Turn online and turn offline
function ravagerTurnOnline(channel) {
    shared.utility.getChannel(client, channel).send(
        `***PROWLING...***`);
    client.user.setStatus('online');
    client.user.setActivity(playingMessage);
    ravagerState = RavagerEnumState.ACTIVE;
}

function ravagerTurnOffline(channel) {
    let hostile = String(dataRequest.loadServerData("hostileActive", 0));
    console.log("[RavagerTurnOffline] hostile = " + hostile)

    // If Ravager is still alive, show flee message
    if (hostile !== '0') {
        var fleeStatus = String(dataRequest.sendAttackData("hostileFlee"));
        console.log("[RavagerTurnOffline] Fleeing test (fleeStatus) = " + fleeStatus)
        if (fleeStatus == "fled") {
            shared.utility.getChannel(client, channel).send(
                `**THE POOR, ILL-EQUIPPED TRAVELERS PUT UP NO FIGHT...**` +
                `\n:footprints: ***RETURNS TO THE WILD. ***`);
            console.log('Hostile Fled... (hostile = ' + hostile + ')');
            hostileLevel = 1;
        }
    }

    clearInterval(sendAttacksEverySec);
    ravagerState = RavagerEnumState.WAITING;
    client.user.setStatus('invisible');
    client.user.setActivity('');
}

// Adds attack to array
function logAttack(userID) {
    if (ravagerState === RavagerEnumState.WAITING) return;

    // Limits attacks to be only 1
    if (attackQueue.findIndex(uID => uID === userID)) {
        console.log("[Logged attack] " + userID + " | " + attackQueue);
        attackQueue.push(userID);
    } else {

    }
}

// Sends all attacks to PHP
function sendAttacks() {
    var isDead = false;
    var attacksInfoVar = "";
    var failedVar = "";
    var finalVar = "";

    attackQueue = shared.utility.removeDuplicates(attackQueue);

    // Adds to failedVar message if attack wasn't valid
    attackQueue.forEach(element => {
        console.log(`[Processing] ${element}`);
        var stats = shared.core.getStats(element);
        var failed = false;

        if (stats.health <= 0) {
            console.log(`[HP <= 0] ${element}`)
            failedVar += `:x: <@${element}> ***YOU ARE DYING. YOU DO NOT BELONG IN THIS FIGHT.***\n`;
            failed = true;
        } else if (stats.stamina <= 0) {
            console.log(`[STAM <= 0] ${element}`)
            failedVar += `:x: <@${element}> ***HA! PUNY TRAVELER DOESN'T HAVE ENOUGH STAMINA.***\n`;    
            failed = true;
        } else {
            console.log(`[OK] HP: ${stats.health}, STAM: ${stats.stamina}`);
        }

        if (failed) {
            console.log("[Removed] " + attackQueue.splice(attackQueue.findIndex(uID => uID === element), 1))
        }
    });

    // Performs attack & parses them to readable info
    if (attackQueue.length > 0) {
        console.log("[Attack Queue] " + attackQueue);
        var playerIDs = "";

        attackQueue.forEach(element => {
            console.log("[AddXP] " + shared.progression.addXP(element, 1));
            playerIDs += element + "|";
        });
        
        playerIDs = playerIDs.substring(0, playerIDs.length - 1);
        // array empty or does not exist
        var results = String(dataRequest.sendAttackData("sendAllAttacks", playerIDs, hostileType));
        if (results !== '[]') console.log("RESULTS: " + results)
        var attackResults = JSON.parse(results);
        attackQueue = [];
        var lastHealth = 0;
        var lastMaxHealth = 0;

        for (var i = 0; i < attackResults.length; i++) {
            //document.write("<br><br>array index: " + i);
            var obj = attackResults[i];
            for (var key in obj) {
                var value = obj[key];
                //document.write("<br> - " + key + ": " + value);
                //testVar += key + ": " + value + "\n";

                switch(key) {
                    case "hostileHealth":
                        var enemyHealth = Math.floor(value.split("|")[0]);
                        var enemyMaxHealth = Math.floor(value.split("|")[1]);
                        //testVar += healthbar2(enemyHealth,enemyMaxHealth) + "\n";
                        break;
                    case "atkDamage":
                        attacksInfoVar += ":crossed_swords: ***" + value + "*** DAM ";
                    break;
                    case "id":
                        attacksInfoVar += "<@" + value + "> | ";
                        break;
                    case "hitback":
                        const hitback = client.emojis.find(emoji => emoji.name === "hitback");
                        if (value > 0) {
                            attacksInfoVar += `${hitback} ***` + value + "*** DAM ";
                        } else {
                            attacksInfoVar += `${hitback} ***MISS*** `;
                        }
                        break;
                    case "userHealth":
                        var userHealth = Math.floor(value.split("|")[0]);
                        var userMaxHealth = Math.floor(value.split("|")[1]);
                        attacksInfoVar += "(" + userHealth + "/" + userMaxHealth + ") ";
                        break;
                    case "dead":
                        if (value) {
                            isDead = true;
                        }
                        break;
                }
            }
            attacksInfoVar += "\n";
        }
    }

    // Displays attack if there's any results
    if (failedVar.length > 0 || attacksInfoVar.length > 0) {
        // Adds failed
        finalVar += failedVar;

        // Adds attack info along with HP bar if exists
        if (attacksInfoVar.length > 0)
            finalVar += attacksInfoVar + healthbar2(enemyHealth, enemyMaxHealth) + "\n"; 

        shared.messaging.sendMessage(client, process.env.DEADLANDS_CHANNEL_ID, finalVar);
    }

    // Sends dead message if dead
    if (isDead) {
        console.log("[Dead] Ravager has now been killed.");
        ravagerTurnOffline(process.env.DEADLANDS_CHANNEL_ID);
        embedDetails(process.env.DEADLANDS_CHANNEL_ID, 1);
    }
}

// Sends details of last Ravager
function details(channelID, addCrystals) {
    var hostile = String(dataRequest.loadServerData("lastHostileActive"));
    console.log("lastHostileActive: " + hostile);
    var testVar = "";
    var testVar2;
    var totalCrystals = 0;
    var hostileInfo = dataRequest.sendServerData("getDamageDistribution", hostile, undefined, addCrystals);
    if (hostileInfo == "fled") {
        client.channels.get(channelID).send("***THE ENEMY RAVAGER FLED. NO KILL WAS MADE.***" );
    } else {
        var hostileData = JSON.parse(hostileInfo);
        console.log(JSON.stringify(hostileData, null, 4));
        for (var i = 0; i < hostileData.length; i++) {
            var obj = hostileData[i];
            for (var key in obj) {
                var value = obj[key];
                switch(key) {
                    case "id":
                        testVar += "<@" + value + ">\n";
                    break;
                    case "totalDamage":
                        testVar += "```TOTAL DAM: " + value + " ";
                    break;
                    case "damagePercent":
                        testVar += "(" + value + "%) | ";
                    break;
                    case "crystalsReceived":
                        testVar += "EARNED: " + value + " crystals.```\n\n";
                        totalCrystals += value;
                    break;
                }
            }
            testVar2 = "***THE LAST RAVAGER DROPPED A STASH OF " + totalCrystals + " CRYSTALS...***\n\n" + testVar;
        }
        client.channels.get(channelID).send(testVar2);
    }
}

// Sends embed details of last Ravager
function embedDetails(channelID, addCrystals) {
    let member = client.guilds.get(process.env.SANCTUM_ID).members.get(client.user.id);
    let detailsEmbed = new Discord.RichEmbed()
        .setAuthor(member.displayName, member.user.avatarURL)
        .setColor(member.displayColor)
        .setFooter("Use !details to view the details of the previous Ravager.")

    var hostile = String(dataRequest.loadServerData("lastHostileActive"));
    console.log("lastHostileActive: " + hostile);

    var detailsMessage = "***DETAILS...***";
    var totalCrystals = 0;
    var hostileInfo = dataRequest.sendServerData("getDamageDistribution", hostile, undefined, addCrystals);
    if (hostileInfo == "fled") {
        client.channels.get(channelID).send("***THE ENEMY RAVAGER FLED. NO KILL WAS MADE.***" );
    } else {
        // Message variables
        let userTag = "";
        let totalDamage = "";
        let damagePercent = "";
        let crystalsReceived = "";

        let detailsContent = "";

        var hostileData = JSON.parse(hostileInfo);
        console.log(JSON.stringify(hostileData, null, 4));
        for (var i = 0; i < hostileData.length; i++) {
            var obj = hostileData[i];
            for (var key in obj) {
                var value = obj[key];
                switch(key) {
                    case "id":
                        userTag = "<@" + value + ">";
                        break;
                    case "totalDamage":
                        totalDamage = "```TOTAL DAM: " + value + " ";
                        break;
                    case "damagePercent":
                        damagePercent = "(" + value + "%) | ";
                        break;
                    case "crystalsReceived":
                        crystalsReceived = "EARNED: " + value + " crystals.```";
                        totalCrystals += value;
                        break;
                }
            }
            console.log(`hostileData.length: ${hostileData.length} "${userTag}" "${totalDamage}" "${damagePercent}" "${crystalsReceived}"`);
            detailsContent += `${userTag}${totalDamage}${damagePercent}${crystalsReceived}\n`;
        }
        detailsMessage = `***THE LAST RAVAGER DROPPED A STASH OF ${totalCrystals} CRYSTALS...***\n\n`;
        detailsEmbed.setDescription(detailsMessage + detailsContent);

        client.channels.get(channelID).send(detailsEmbed);
    }
}


function getDialog(dialogTag, data = "",data2 = "") {
    switch(dialogTag) {
        case "onTheProwl":
            var dialogOptions = [
            'THE AIR SMELLS OF BLOOD.',
            'LOOKS LIKE MEAT\'S BACK ON THE MENU BOYS.',
            'FRESH MEAAAATTTT.',
            'TONIGHT WE DINE ON TRAVELER FLESSHHHH.',
            'SKULL CRUSHING IS MY FAVORITE SPORT.',
            'HUNGRY...',
            'TRAVELERS MAKE GOOD MEEEAAAAT!',
            'PUNY TRAVELER THINKS THEY CAN FIGHT?!',
            'HUNT THEM ALL DOWN.',
            'I HUNGER FOR THE TASTE OF FLESH.'
            ];
            var randomNumber = Math.floor(Math.random()*dialogOptions.length);
            return "***" + dialogOptions[randomNumber] + "***";
    
        case "ravagerHit":
            var dialogOptions = [
            'STAGGERS BACK',
            'FALLS BACKWARDS',
            'CHARGES FORWARD CONFUSED',
            'LOOKS FOR THE SOURCE OF THE HIT',
            'FALLS FORWARDS',
            'BLOCKS ITS FACE',
            'STUMBLES BACKWARDS IN CONFUSION',
            'LUNGES FORWARD DISTRACTED',
            'BITES AT IT\'S ATTACKER',
            'CHECKS IT\'S WOUND'
            ];
            var randomNumber = Math.floor(Math.random()*dialogOptions.length);
            return "***" + dialogOptions[randomNumber] + "***";
    }
}

// Log our bot in (change the token by looking into the .env file)
client.login(process.env.RAVAGER_TOKEN);