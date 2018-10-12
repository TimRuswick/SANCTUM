// .env Variables
require('dotenv').config({path: '../.env'});

// Node Modules
const Discord = require('discord.js');
const client = new Discord.Client();
const cron = require('node-cron');
const io = require('socket.io-client');

// Make connection
var socket = io.connect('http://localhost:80');

// Bot Modules
const dataRequest = require('../modules/dataRequest');
const calcRandom = require('../modules/calcRandom');

// State Machine
var RavagerState = {
    INACTIVE: 0,
    PROWLING: 1,
    ACTIVE: 2,
    UNCONSCIOUS: 3
}

const prowling = 'Prowling...';

var socketReady = false;
socket.on('spawn', (data) => {
    if (!socketReady) return;

    console.log(JSON.stringify(data, null, 4));
    console.log(`Summoning enemies...`);

    // Spawns 
    summonEnemy(data);
    
});

// The ready event is vital, it means that your bot will only start reacting to information
// from Discord _after_ ready is emitted
client.on('ready', async () => {
    socketReady = true;

    // Generates invite link
    try {
        let link = await client.generateInvite(["ADMINISTRATOR"]);
        console.log("Invite Link: " + link);
    } catch(e) {
        console.log(e.stack);
    }

    // You can set status to 'online', 'invisible', 'away', or 'dnd' (do not disturb)
    client.user.setStatus('invisible');
    // Sets your "Playing"
    client.user.setActivity(prowling);
    console.log(`Connected! \
    \nLogged in as: ${client.user.username} - (${client.user.id})`);
    
    // Corrects Ravager username
    if (client.user.username == "Raveger") {
        const newName = "Ravager";
        console.log("Username is Raveger! Typos are NOT(?) cannon, so better change stuff.\nAttempting rename to " + newName + "...");

        // Set username
        client.user.setUsername(newName)
            .then(user => console.log(`Success! New username is now ${user.username}.`))
            .catch(console.error);

        // Changes nickname
        client.guilds.get(process.env.SANCTUM_ID).members.get(client.user.id).setNickname("");
    }
});

// Create an event listener for messages
client.on('message', async message => {
    // Ignores ALL bot messages
    if (message.author.bot) return;
    // Message has to be in Outskirts (should be edited later)
    if (!(message.channel.id === process.env.DEADLANDS_CHANNEL_ID
        || message.channel.id === process.env.TEST_CHANNEL_ID)) return;
    // Has to be (prefix)command
    if (message.content.indexOf(process.env.PREFIX) !== 0) return;

    // "This is the best way to define args. Trust me."
    // - Some tutorial dude on the internet
    const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    switch (command) {
        case "ping":
            if (isAdmin(message.author.id))
                message.reply("***...MRGRGRGR!***");
            break;
    }
});

client.on('error', console.error);

cron.schedule('*/10 * * * *', function() {
   
});

// Turn online and turn offline
async function summonEnemy(data) {
    // Scans for Ravager already in channel
    /*
    var isRavagerInChannel = false;
    ravagerCollection.forEach(element => {
        if (element.channel === data.channel) {
            console.log("There is already a Ravager in channel " + element.channel);
            isRavagerInChannel = true;
        }
    });
    if (isRavagerInChannel) return;
    */

    // If timer exists, do outpost
    const summonTime = 4;       // 4 is debug, normal is 35
    if (!data.fastSummon) {
        console.log(`Summoning Ravager... waiting for ${summonTime} seconds.`);
        client.user.setStatus('online');
        client.user.setActivity(`Prowling...`);

        // Sets prowling states on the Ravagers
        for (let i = 0; i < data.enemies.length; i++) {
            const element = data.enemies[i];
            element.state = RavagerState.PROWLING;
        }

        // Notification code
        // TODO

        await sleep(summonTime * 1000);
    }
    console.log("Enemy has spawned!");

    // Goes thru all enemies in array
    for (let i = 0; i < data.enemies.length; i++) {
        const element = data.enemies[i];
        const hostileStats = `LVL: ${element.level} | HP: ${element.health} | STR: ${element.strength} | SPD: ${element.speed}`;

        const ravagerMember = client.guilds.get(process.env.SANCTUM_ID).members.get(client.user.id);
        const appearanceEmbed = new Discord.RichEmbed()
            .setAuthor(ravagerMember.displayName, client.user.avatarURL)
            .setColor(ravagerMember.displayColor)
            .setDescription(`${healthbar(element.health, element.health)}\n` + "```" + hostileStats + "```")
    
        var newMessage = await client.channels.get(data.channel).send(getDialog("onTheProwl"), {embed: appearanceEmbed});
        await client.user.setStatus('online');
        await client.user.setActivity(hostileStats);
        
        for (let i = 0; i < data.enemies.length; i++) {
            const element = data.enemies[i];
            element.state = RavagerState.ACTIVE;
        }
        enemyTimer(element, data, data.channel, element.fleeTime, newMessage);   
    }
}

// Counts down
async function enemyTimer(newRavager, data, channel, fleeTime, newMessage) {
    function addUserToArray(userID) {
        attackingUsers.push(userID);
    }

    async function sendReactions(options) {
        // Sends reactions
        for (let i = 0; i < options.length; i++) {
            const element = options[i];
            //console.log("[Reaction Options] Emote: " + element + "  | newMessage: " + newMessage);
            await newMessage.react(element);
        }
    }

    console.log(`Waiting for the next ${fmtMSS(fleeTime / 1000)} min. to check if Ravager has been killed. ${fleeTime}`);

    const ravagerMember = client.guilds.get(process.env.SANCTUM_ID).members.get(client.user.id);
    const interactionEmbed = new Discord.RichEmbed()
        .setColor(ravagerMember.displayColor)
        .setTitle("Status")
        .setDescription("...")
    
    var isReadyToFlee = false;
    var attackingUsers = [];
    var tempAttackUsers = "";
    var newChannel = client.channels.get(channel);
    var interactionMessage = await newChannel.send({embed: interactionEmbed});

    // Collects emotes and reacts upon the reaction
    const collector = newMessage.createReactionCollector(
        (reaction, user) => options.includes(reaction.emoji.name) && user.id !== client.user.id);
    
    // Possible reaction attacks can go here
    var options = ['🇦', '🇧', '🇨']
    sendReactions(options);
    
    // Collect
    collector.once("collect", async reaction => {
        var user = reaction.users.last();
        tempAttackUsers += `${user} :crossed_swords: 11 DAM | <:hitback:460969716580745236> MISS (150/150)\n`;
        addUserToArray(user.id);
        console.log(tempAttackUsers);
        if (!interactionMessage.deleted) {
            interactionEmbed.setDescription(`${tempAttackUsers}`);
            interactionMessage = await newChannel.edit({embed: interactionEmbed});
        }

        // Send damage.
        
    });

    // Ends
    collector.once("end", async collector => {
        
    });

    // Goes every 4 seconds
    var emoteRefresh = setInterval(async () => {
        await newMessage.clearReactions();
        interactionEmbed.setDescription("...");

        if (isReadyToFlee && newRavager.state !== RavagerState.UNCONSCIOUS) {
            interactionEmbed.setDescription("👣 The Ravager has fled...")
            if (interactionMessage) await interactionMessage.edit({embed: interactionEmbed});
            clearInterval(emoteRefresh);
            collector.stop();
        } else {
            if (interactionMessage) await interactionMessage.edit({embed: interactionEmbed});
            sendReactions(options);
        }

        tempAttackUsers = "";
    }, 5 * 1000);
    

    // Waits to see if killed, and if not send a fleeing message
    await sleep(fleeTime);
    if (newRavager.state === RavagerState.ACTIVE) {
        newChannel.send("**YOU ARE WEAK. THERE IS NO CHALLENGE FOR ME HERE.**\n:bangbang:***ATTEMPTING TO FLEE...***");
        await sleep(20 * 1000);
        
        // If still there despawn
        if (newRavager.state !== RavagerState.UNCONSCIOUS) {
            console.log('Hostile is now able to flee, now awaiting for collector to finish.');
            isReadyToFlee = true;
        }
    }
}

async function flee(newRavager, data, newChannel) {
    newChannel.send("**THE POOR, ILL-EQUIPPED TRAVELERS PUT UP NO FIGHT...**\n:footprints:***RETURNS TO THE WILD. ***");
    socket.emit('fled', {
        data: data,
        ravager: newRavager
    });

    if (data.length < 1) {
        await client.user.setPresence('invisible');
        client.user.setActivity('Prowling...');
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

// Async Waiting
function sleep(time) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, time);
    });
}

// Gets if user has an Overseers rank
function isAdmin(userID) {
    var guild = client.guilds.get(process.env.SANCTUM_ID);
    return guild.members.get(userID).roles.find(role => role.name === "Overseers");
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

function getDialog(dialogTag, data = "", data2 = "") {
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
            var randomNumber = Math.floor(Math.random() * dialogOptions.length);
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
            var randomNumber = Math.floor(Math.random() * dialogOptions.length);
            return `***${dialogOptions[randomNumber]}***`;
    }
}

// Log our bot in (change the token by looking into the .env file)
client.login(process.env.RAVAGER_TOKEN);