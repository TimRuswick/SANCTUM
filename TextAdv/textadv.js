// .env Variables
require('dotenv').config({path: '../.env'});

// Node Modules
const Discord = require('discord.js');
const client = new Discord.Client();
const cron = require('node-cron');

// Bot Modules
const dataRequest = require('../modules/dataRequest');
const calcRandom = require('../modules/calcRandom');
const PlayerClass = require('./playerClass');
const DungeonClass = require('./dungeonClass');

// JSON
const rooms = require('./rooms.json');

// Playing dialogs
const nothingMessage = "with locks."

// State Machine
var BotEnumState = {
    NOTHING: 0,
    WAITING_FOR_PLAYERS: 1,
    ACTIVE: 2
}

// Directions
var Directions = {
    NORTH: 0,
    EAST: 1,
    SOUTH: 2,
    WEST: 3
}

// Dungeon State
var DungeonState = {
    WAITING_FOR_USERS: 0,
    INSIDE_DUNGEON: 1,
    FIGHTING: 2,
    BOSS_BATTLE: 3
}

// Modes (these better not be final, me.)
var DungeonModes = {
    HEIRARCHY: 0,   // Uses heirarchy to determine movement
    ANARCHY: 1,     // Anyone can determine movement
    DEMOCRACY: 2    // Voting system
}

// Dungeons
class DungeonRaidInstance {
    constructor(room) {
        this.room = room;
        this.mode = DungeonModes.DEMOCRACY;
        this.players = [];
        this.location;
        this.state = DungeonState.WAITING_FOR_USERS;
        this.dialogObj;
        this.reroutedRooms = [];
        this.items = [];
        this.isTyping;
        this.timer;
        this.startTimer;
        this.crystalsGained = 0;
        this.directionalCollector;
        this.directionalMessageID;
    }
}

// Dungeon collections;
var dungeonCollection = [];

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
    client.user.setStatus('invisible');

    console.log(`Connected! \
    \nLogged in as: ${client.user.username} - (${client.user.id})`);

    //client.guilds.get(process.env.SANCTUM_ID).members.get(client.user.id).setNickname("");
});

// Create an event listener for messages
client.on('message', async message => {
    // Ignores ALL bot messages
    if (message.author.bot) return;
    // Message has to be in test or hell's gate
    if (!(message.channel.id !== process.env.TEST_CHANNEL_ID || message.channel.id !== process.env.HELLS_GATE_CHANNEL_ID)) {
            const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
            const command = args.shift().toLowerCase();
            if (command !== "party") return;
    };
    // Has to be (prefix)command
    if (message.content.indexOf(process.env.PREFIX) !== 0) return;

    // "This is the best way to define args. Trust me."
    // - Some tutorial dude on the internet
    const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    switch (command) {
        case "ping":
            if (isAdmin(message.author.id)) {
                return message.reply("Pong!");
            }
        break;
        case "summonr":
            if (isAdmin(message.author.id)) {
                return NewDungeonSequence(process.env.TEST_CHANNEL_ID);
            }
        break;
        case "vanishr":
            if (isAdmin(message.author.id) && getDungeonPlayer(message.author.id).playerDungeon !== undefined) {
                return BotActive(getDungeonPlayer(message.author.id).playerDungeon);
            }
        break;
        case "help":
            if (args[0] && message.mentions.members.first() !== undefined) {
                if (message.mentions.members.first().id !== client.user.id) break;
                let tempVar = '';
                tempVar += "Here are the commands you can do."
                tempVar += "\n\n"
                tempVar += "!map (!m)\n```Checks your high-tech map about the dungeon.```"
                tempVar += "\n"
                tempVar += "!party (!p)\n```Lists all members in your party.```"
                tempVar += "\n"
                tempVar += "!promote (!pr)\n```If you're the leader, you can promote others to be a party leader with you in order to move around.```"
                tempVar += "\n"
                tempVar += "!demote (!de)\n```If you're the leader, you can demote others if needed if they are a commander.```"
                return sendMessage(message.channel.id, tempVar);
            }
        break;
        case "leave":
            leaveMessage(message);
        break;
    }

    // Scans if player is in the raid collection
    const dungeonPlayer = getDungeonPlayer(message.author.id);
    var isLeader = dungeonPlayer.isLeader;              // Gets if author is leader of raid
    var isCommander = dungeonPlayer.isCommander;        // Gets if userID is commander
    var playerID = dungeonPlayer.playerID;              // Grabs message.author if this is part of raid
    var playerDungeon = dungeonPlayer.playerDungeon;    // Grab's the player's dungeon if joined

    // If user has not joined a party
    /*
    if (!playerID) {
        switch (command) {
            case "join":
                joinMessage(message, getRoomName(args[0]));
            break;
            case "j":
                joinMessage(message, getRoomName(args[0]));
            break;
        }
    }
    */

    // Party member commands only
    if (!playerID) return;

    // Party commands
    switch (command) {
        case "check":
            return sendMessage(message.author.id, message.channel.id, "Please use **!map** for checking the map.");
        case "members":
            if (args[0] !== undefined) {
                var num = Math.floor(parseInt(args[0]));       
                if (Number.isSafeInteger(num) && Math.sign(num) > 0) {
                    return partyMembers(playerDungeon, num);
                }
            } else {
                return partyMembers(playerDungeon);
            }
        break;
        case "party":
            if (args[0] !== undefined) {
                var num = Math.floor(parseInt(args[0]));       
                if (Number.isSafeInteger(num) && Math.sign(num) > 0) {
                    return partyMembers(playerDungeon, num);
                }
            } else {
                return partyMembers(playerDungeon);
            }
        break;
        case "p":
            if (args[0] !== undefined) {
                var num = Math.floor(parseInt(args[0]));       
                if (Number.isSafeInteger(num) && Math.sign(num) > 0) {
                    return partyMembers(playerDungeon, num);
                }
            } else {
                return partyMembers(playerDungeon);
            }
        break;
        case "promote":
            return promoteCommander(message.author, message.mentions.members.first(), isLeader, message.channel.id);
        case "pr":
            return promoteCommander(message.author, message.mentions.members.first(), isLeader, message.channel.id);
        case "demote":
            return demoteCommander(message.author, message.mentions.members.first(), isLeader, message.channel.id);
        case "de":
            return demoteCommander(message.author, message.mentions.members.first(), isLeader, message.channel.id);
        case "transferleadership":
            return transferLeader(message, message.mentions.members.first());
        case "giveleadership":
            return transferLeader(message, message.mentions.members.first());
        case "map":
            return sendEmbedLocation(playerDungeon);
        case "m":
            return sendEmbedLocation(playerDungeon);
        case "location":
            return sendEmbedLocation(playerDungeon);
        case "l":
            return sendEmbedLocation(playerDungeon);
        case "locationtext":
            return sendLocation(playerDungeon, message.author);
        case "lt":
            return sendLocation(playerDungeon, message.author);
        case "pinventory":
            if (args[0] !== undefined) {
                var num = Math.floor(parseInt(args[0]));       
                if (Number.isSafeInteger(num) && Math.sign(num) > 0) {
                    return sendInventory(playerDungeon, num);
                }
            } else {
                return sendInventory(playerDungeon);
            }
        case "pinv":
            if (args[0] !== undefined) {
                var num = Math.floor(parseInt(args[0]));       
                if (Number.isSafeInteger(num) && Math.sign(num) > 0) {
                    return sendInventory(playerDungeon, num);
                }
            } else {
                return sendInventory(playerDungeon);
            }
        case "pi":
            if (args[0] !== undefined) {
                var num = Math.floor(parseInt(args[0]));       
                if (Number.isSafeInteger(num) && Math.sign(num) > 0) {
                    return sendInventory(playerDungeon, num);
                }
            } else {
                return sendInventory(playerDungeon);
            }
        case "timer":
            return sendTimerInChat(playerDungeon);
        case "cleardialog":
            console.log("Clearing player dungeon by command trigger...");
            playerDungeon.dialogObj = undefined;
            return;
        case "debug":
            console.log(playerDungeon.reroutedRooms);
            return;
    }

    // The dungeon has to be active now
    if (playerDungeon.state === DungeonState.WAITING_FOR_USERS) {
        //return sendMessage(message.author.id, message.channel.id, "**Command denied.** Please wait for until the dungeon closes.");
        return;
    }

    // Custom commands from JSON 
    if (playerDungeon.dialogObj === undefined) {
        var newCommand = playerDungeon.location[command];
        customCommands(newCommand, playerDungeon, message.author, command, args);
    // More custom commands that are children from other custom commands
    } else {
        var newCommand = playerDungeon.dialogObj[command];
        customCommands(newCommand, playerDungeon, message.author, command, args);
        return;
    }

    // Leader or commander only commands (movement)
    return;
    switch (command) {
        case "north":
            move(Directions.NORTH, playerDungeon, (isLeader || isCommander), message.author);
        break;
        case "n":
            move(Directions.NORTH, playerDungeon, (isLeader || isCommander), message.author);
        break;
        case "east":
            move(Directions.EAST, playerDungeon, (isLeader || isCommander), message.author);
        break;
        case "e":
            move(Directions.EAST, playerDungeon, (isLeader || isCommander), message.author);
        break;
        case "south":
            move(Directions.SOUTH, playerDungeon, (isLeader || isCommander), message.author);
        break;
        case "s":
            move(Directions.SOUTH, playerDungeon, (isLeader || isCommander), message.author);
        break;
        case "west":
            move(Directions.WEST, playerDungeon, (isLeader || isCommander), message.author);
        break;
        case "w":
            move(Directions.WEST, playerDungeon, (isLeader || isCommander), message.author);
        break;
        case "mode":
            
        break;
        case "m":

        break;
    }
});

client.on('error', console.error);
client.on('warn', console.warn);

// Gets if user has an Overseers rank
function isAdmin(userID) {
    var guild = client.guilds.get(process.env.SANCTUM_ID);
    return guild.members.get(userID).roles.find(role => role.name === "Overseers");
}

// Creates an array that creates multiple different arrays inside of that array -> [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
// http://www.frontcoded.com/splitting-javascript-array-into-chunks.html
var createGroupedArray = function(arr, chunkSize) {
    var groups = [], i;
    for (i = 0; i < arr.length; i += chunkSize) {
        groups.push(arr.slice(i, i + chunkSize));
    }
    return groups;
}

// Gets the user's role by member
function getFactionID(member) {
    var playerRole;
    var isGroupA = member.roles.has(process.env.GROUP_A_ROLE);
    var isGroupB = member.roles.has(process.env.GROUP_B_ROLE);
    var isGroupC = member.roles.has(process.env.GROUP_C_ROLE);

    if (isGroupA) playerRole = process.env.GROUP_A_ROLE;
    else if (isGroupB) playerRole = process.env.GROUP_B_ROLE;
    else if (isGroupC) playerRole = process.env.GROUP_C_ROLE;
    else playerRole = "none";

    return playerRole;
}
  
// Gets the Combat Class name by role
function getCombatClassName(member) {
    var combatClass;
    var isTank      = member.roles.find(role => role.name === "🛡️ Tank");
    var isRogue     = member.roles.find(role => role.name === "🗡️ Rogue");
    var isDPSMelee  = member.roles.find(role => role.name === "⚔️ DPS Melee");
    var isDPSRange  = member.roles.find(role => role.name === "🏹 DPS Range");
    var isSupport   = member.roles.find(role => role.name === "❤️ Support");

    if (isTank)             combatClass = "Tank";
    else if (isRogue)       combatClass = "Rogue";
    else if (isDPSMelee)    combatClass = "DPS Melee";
    else if (isDPSRange)    combatClass = "DPS Range";
    else if (isSupport)     combatClass = "Support";
    else                    combatClass = "None";

    return combatClass;
}

// Returns JSON room data by room name
function getRoomName(name) {
    if (name !== undefined) {
        if (name.toLowerCase() === "hellsgate") 
            return rooms.hellsgate;
    } else {
        name = "";
    }

    return { "undefined": name };
}

// Updates Player data in Dungeon Collection
function updatePlayers() {
    // Scans if player is in the raid collection
    // Totally seemingly not intensive test of for loops (Wish I knew)
    if (dungeonCollection !== undefined) {
        // Loops through every dungeon active
        for (let index = 0; index < dungeonCollection.length; index++) {
            const dungeonElement = dungeonCollection[index];

            // Loops through every player in that dungeon
            for (let index = 0; index < dungeonElement.players.length; index++) {
                const playerElement = dungeonElement.players[index];
                const thisGuild = client.guilds.get(process.env.SANCTUM_ID);
                const newMember = thisGuild.members.get(playerElement.userID);
                // If user is in one of the dungeon
                if (newMember) {
                    // Start updating
                    playerElement.factionID = getFactionID(newMember);
                    playerElement.combatClass = getCombatClassName(newMember);
                    //playerElement.badgeEmote;
                }
            }         
        }
    }
}

// Collects usable username for !party
function playerName(userID) {
    const server = client.guilds.get(process.env.SANCTUM_ID);
    const sizeLimit = 19;
    var name = server.members.get(userID).displayName;

    if (name.length > sizeLimit) {
        name = truncate(name, sizeLimit);
    }
    return name;
}

// Truncates super long text that is way too lon...
function truncate(string, amount) {
    if (string.length > amount)
        return string.substring(0, amount - 3) + '...';
    else
        return string;
}; 

// Gets dungeon player by userID
function getDungeonPlayer(userID) {
    // Scans if player is in the raid collection
    var isLeader = false;       // Gets if author is leader of raid
    var isCommander = false;    // Gets if user is commander
    var playerID;               // Grabs userID if this is part of raid
    var playerDungeon;          // Grabs the player's dungeon if joined
    var player;                 // Gets player class

    // Totally seemingly not intensive test of for loops (Wish I knew)
    if (dungeonCollection !== undefined) {
        // Loops through every dungeon active
        for (let index = 0; index < dungeonCollection.length; index++) {
            const dungeonElement = dungeonCollection[index];
            //console.log("dungeonElement | " + dungeonElement);

            // Loops through every player in that dungeon
            for (let index = 0; index < dungeonElement.players.length; index++) {
                const playerElement = dungeonElement.players[index];
                //console.log("playerElement | " + playerElement);
                
                // If user is in one of the dungeon
                if (userID === playerElement.userID) {
                    playerID = userID;
                    player = playerElement;
                    playerDungeon = dungeonElement;     // Sets player's dungeon to this
                    
                    if (playerElement.leader) {
                        isLeader = true;
                    }

                    if (playerElement.commander) {
                        isCommander = true;
                    }
                }
            }         
        }
    } else { console.log("UNDEFINED DUNGEON COLLECTION" + dungeonCollection) }

    return { isLeader, isCommander, playerID, playerDungeon, player };
}

// Async Waiting
function sleep(time) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, time);
    });
}

// Checks for if custom command is valid
async function customCommands(newCommand, playerDungeon, author, command, args) {
    function items() {
        var array = [];
        newCommand.pickup.forEach(element => {
            array.push(element);
        });
    }

    // Grabs the object if it exists
    console.log(`[Custom Commands] Type I  | newCommand exists: ${newCommand !== undefined}`)
    if (newCommand !== undefined && newCommand.command) {
        if (playerDungeon.state === DungeonState.WAITING_FOR_USERS) return;
        console.log(`[Custom Commands] Type II | internal: ${newCommand.internal} | command: ${command}`);
        // If command is meant to be an internal, inscript command
        if (newCommand.internal) {
            if (newCommand.pickup)
                pickupItem(playerDungeon, newCommand, author, newCommand.pickup);
        } else {
            playerDungeon.dialogObj = newCommand;
            typingDialog(playerDungeon, newCommand, author);
        }        
    }
}

// Executes custom commands by emote text
function customCommandEmoteProcessor(playerDungeon, newCommand, author, returnElement, newMessage) {
    //console.log("[Emote Processor] Emote reaction custom command: " + JSON.stringify(returnElement, null, 4));
    //console.log("[Emote Processor] newCommand: " + JSON.stringify(newCommand, null, 4));
    console.log("[Emote Processor] newCommand.type = " + newCommand.type);
    switch (newCommand.type) {
        case "chest":
            switch (returnElement.emote) {
                // JSON : chest.options.unlock
                case "🔓":
                    openChest(playerDungeon, newCommand[returnElement.command], author, false, newMessage, newCommand.embed)
                    break;
                case "🔐":
                    openChest(playerDungeon, newCommand[returnElement.command], author, true, newMessage, newCommand.embed);
                    break;
                case "🔏":
                    lockpickChest(playerDungeon, newCommand, author, newMessage, newCommand.embed);
                    break;
                case "❌":
                    leaveObject(playerDungeon, newCommand[returnElement.command], author);
                    break;
            }            
            break;
    
        case "door":
            switch (returnElement.emote) {
                case "🔐":
                    openDoor(playerDungeon, newCommand[returnElement.command], author, returnElement, newMessage, newCommand.embed);
                    break;
                case "🔏":
                    lockpickDoor(playerDungeon, newCommand, author, newMessage, newCommand.embed);
                    break;
                case "❌":
                    leaveObject(playerDungeon, newCommand[returnElement.command], author);
                    break;
            }
            break;
    }
}

// Adds item to inventory
function addItem(playerDungeon, item, amount) {
    // If item exists in inventory
    console.log("[Add Item] " + amount);
    var i = playerDungeon.items.findIndex(i => i.name === item.name);
    console.log("[Item Amount Item Exists] i Equals " + i);

    // Item is internally handled
    if (item.internal) {
        switch (item.name.toLowerCase()) {
            case "crystals":
                addCrystalsToPartyMember(playerDungeon, amount);
                break;
        
            default:
                break;
        }
    }

    // If there is an item that exists in inventory
    if (i !== -1) {
        console.log("[Item Amount Start] " + playerDungeon.items[i].amount);
        playerDungeon.items[i].amount += item.amount;    // Increments amount value
        console.log("[Item Amount Finish] " + playerDungeon.items[i].amount);
    // Disallows adding objects such as crystals
    } else if (!item.internal) {
        console.log("[Item Amount Wait] Created item for the first time.");
        var clonedItem = JSON.parse(JSON.stringify(item));  // Clones item in order to not actually increment the rooms.js item JSON data
        playerDungeon.items.push(clonedItem);
    }
}

// Removes item from party inventory (TODO: multi item stacks & only take one item)
function removeItem(playerDungeon, item, amount) {
    let i = playerDungeon.items.findIndex( i => i.name === item.name );
    console.log("[Remove Item] i Equals " + i + ` | For item: ${item.name}`);
    if (i !== -1) {
        if (playerDungeon.items[i].amount > 2) {
            console.log("[Item Amount Start] " + playerDungeon.items[i].amount);
            playerDungeon.items[i].amount -= item.amount;   // Decrements amount value
            console.log("[Item Amount Finish] " + playerDungeon.items[i].amount);
        }
        else {
            console.log("[Item Amount Wait] Destroying item:\n" + playerDungeon.items.length);
            playerDungeon.items.splice(i, 1);
            console.log("[Item Amount Done] Finished Destroying item:\n" + playerDungeon.items.length);
        }

        console.log("[Remove Item] Successfully removed item " + item.name + " from " + playerDungeon.room.name)
        return true;
    }
    console.log("[Remove Item] Couldn't remove item!");
    return false;
}

// Adds crystals to EACH player dungeon players (GAMBLE IS BEING USED TO ADD)
function addCrystalsToPartyMember(playerDungeon, amount) {
    playerDungeon.players.forEach(element => {
        dataRequest.sendServerData("gambleWon", amount, element.userID); 
        playerDungeon.crystalsGained += amount;
    });
}

// Pickup Item
async function pickupItem(playerDungeon, newCommand, author, items) { 
    // Loops through all the items in array, and adds them into the item string
    var itemString = "";
    console.log("[Pickup Item] JSON Data:\n" + JSON.stringify(items, null, 4));
    for (let i = 0; i < items.length; i++) {
        const element = items[i].item;
        const item = rooms.items[element];  
        console.log("[Pickup Item] " + element + "\nJSON:\n" + JSON.stringify(item, null, 4));
        // Emote processing
        var emoteText = "";
        if (item.emote !== undefined && item.emote !== "") emoteText = `${item.emote} `;

        // Adds to item string & inventory
        var amount = 1;
        // Generates random number if array
        if (Array.isArray(items[i].amount))
            amount = calcRandom.random(items[i].amount[0], items[i].amount[1]);
        // Treats it as an int instead
        else {
            // If amount variables exists, set it to so
            if (items[i].amount) amount = items[i].amount;
        }

        var newAmount;
        switch (element) {
            // Meant to have each player get a set amount of crystals
            case "crystals":
                newAmount = amount * playerDungeon.players.length;
                break;
            // Normal handling
            default:
                newAmount = amount;
                break;
        }

        itemString += `> **${emoteText}${item.name}** [${newAmount}x]\n`;
        addItem(playerDungeon, item, amount);
    }

    // Sends embed
    const embed = new Discord.RichEmbed()
        .setAuthor("Ghost", client.user.avatarURL)
        .setColor(playerDungeon.room.color)
        .setTitle("Item Get!")
        .setDescription(`You picked up...\n${itemString}You can find it in the party's **!pinventory**.\nAny collected crystals or materials will be distributed evenly.`)
    
    client.channels.get(playerDungeon.room.channel).send({embed});

    // Debug
    // console.log("DEBUG JSON DATA: " + JSON.stringify(item. null, 4));

    await sleep(2500);
    playerDungeon.dialogObj = newCommand;
    playerDungeon.reroutedRooms.push([newCommand.moveFrom, newCommand.moveTo]);
    move(newCommand.moveTo, playerDungeon, true, author);
    playerDungeon.dialogObj = undefined;
}

// Lock picks a chest
async function lockpickChest(playerDungeon, newCommand, author, newMessage, embedData) {
    var random = calcRandom.gamble(50);
    var channel = client.channels.get(playerDungeon.room.channel);
    var successMessage = `:lock_with_ink_pen: **You have successfully lockpicked the chest!** The party has saved a key.`;
    var failedMessage  = `:lock_with_ink_pen: **The unlock has failed.** Better luck next time!`;
    if (random) {
        if (!embedData) {
            if (!newMessage)
                channel.send(successMessage);
        } else {
            var dungeonName = embedData.setAuthor.title.replace("${dungeon.room.name}", playerDungeon.room.name);
            var newImage = embedData.setAuthor.image.replace("${profile_pic}", client.user.avatarURL);
            const embed = new Discord.RichEmbed()
                .setAuthor("Ghost", newImage)
                .setColor(playerDungeon.room.color)
                .setTitle(embedData.setTitle)
                .setDescription("...")

            await newMessage.edit({embed});
            embed.description = successMessage;
            newMessage.edit({embed});
        }
        await sleep(2500);
        var dungeonName = embedData.setAuthor.title.replace("${dungeon.room.name}", playerDungeon.room.name);
        var newImage = embedData.setAuthor.image.replace("${profile_pic}", client.user.avatarURL);
        const embed = new Discord.RichEmbed()
            .setAuthor("Ghost", newImage)
            .setColor(playerDungeon.room.color)
            .setTitle(embedData.setTitle)
            .setDescription("...")

        await newMessage.edit({embed});
        lootChest(playerDungeon, newCommand.unlock, author, newMessage, embedData);
    } else {
        if (!embedData)
            channel.send(failedMessage);
        else {
            var dungeonName = embedData.setAuthor.title.replace("${dungeon.room.name}", playerDungeon.room.name);
            var newImage = embedData.setAuthor.image.replace("${profile_pic}", client.user.avatarURL);
            const embed = new Discord.RichEmbed()
                .setAuthor("Ghost", newImage)
                .setColor(playerDungeon.room.color)
                .setTitle(embedData.setTitle)
                .setDescription("...")

            await newMessage.edit({embed});
            embed.description = failedMessage;
            newMessage.edit({embed});
        }
        await sleep(2500);

        playerDungeon.dialogObj = newCommand.lockpick;
        move(newCommand.lockpick.moveToFail, playerDungeon, true, author);
        playerDungeon.dialogObj = undefined;
    }
}

// Opens the chest
async function openChest(playerDungeon, newCommand, author, useKey, newMessage, embedData) {
    var successMessage = `${author} used the **:key: Key** to open the chest.`;
    var failedMessage  = "The party does not have a **:key: Key** to :closed_lock_with_key: unlock this chest.";

    console.log("[Open Chest] " + successMessage + " | " + failedMessage);

    if (useKey && playerDungeon.dialogObj.removeItem) {
        // Checks for key in inventory
        let removeKey = playerDungeon.items.findIndex( i => i.name === "Key" );
        console.log("[Remove Key] " + removeKey);

        // If key exist
        if (removeKey !== -1) {
            removeItem(playerDungeon, rooms.items["key"]);
            if (!embedData)
                sendMessage(author.id, playerDungeon.room.channel, successMessage)
            else {
                var dungeonName = embedData.setAuthor.title.replace("${dungeon.room.name}", playerDungeon.room.name);
                var newImage = embedData.setAuthor.image.replace("${profile_pic}", client.user.avatarURL);
                const embed = new Discord.RichEmbed()
                    .setAuthor("Ghost", newImage)
                    .setColor(playerDungeon.room.color)
                    .setTitle(embedData.setTitle + ": Unlocking")
                    .setDescription("...")
                
                await newMessage.edit({embed});
                embed.description = successMessage;
                newMessage.edit({embed});
                await sleep(2500);
            }
        } else {
            if (!embedData)
                sendMessage(author.id, playerDungeon.room.channel, failedMessage);
            else {
                var dungeonName = embedData.setAuthor.title.replace("${dungeon.room.name}", playerDungeon.room.name);
                var newImage = embedData.setAuthor.image.replace("${profile_pic}", client.user.avatarURL);
                const embed = new Discord.RichEmbed()
                    .setAuthor("Ghost", newImage)
                    .setColor(playerDungeon.room.color)
                    .setTitle(embedData.setTitle)
                    .setDescription("...")
            
                await newMessage.edit({embed});
                embed.description = failedMessage;
                newMessage.edit({embed});
                await sleep(2500);
            }

            return typingDialog(playerDungeon, playerDungeon.dialogObj, author);
        }
    } else {
        var dungeonName = embedData.setAuthor.title.replace("${dungeon.room.name}", playerDungeon.room.name);
        var newImage = embedData.setAuthor.image.replace("${profile_pic}", client.user.avatarURL);
        const embed = new Discord.RichEmbed()
            .setAuthor("Ghost", newImage)
            .setColor(playerDungeon.room.color)
            .setTitle(embedData.setTitle)
            .setDescription("...")

        await newMessage.edit({embed});
    }

    // Open chest
    lootChest(playerDungeon, newCommand, author, newMessage, embedData);
}

// Lockpicks door (lockpickChest IS VERY SIMILAR)
async function lockpickDoor(playerDungeon, newCommand, author, newMessage, embedData) {
    var random = calcRandom.gamble(50);
    var channel = client.channels.get(playerDungeon.room.channel);
    var successMessage = `:lock_with_ink_pen: **You have successfully lockpicked the door!** The party has saved a key.`;
    var failedMessage  = `:lock_with_ink_pen: **The unlock has failed.** Better luck next time!`;
    if (random) {
        if (!embedData) {
            if (!newMessage)
                channel.send(successMessage);
        } else {
            var dungeonName = embedData.setAuthor.title.replace("${dungeon.room.name}", playerDungeon.room.name);
            var newImage = embedData.setAuthor.image.replace("${profile_pic}", client.user.avatarURL);
            const embed = new Discord.RichEmbed()
                .setAuthor("Ghost", newImage)
                .setColor(playerDungeon.room.color)
                .setTitle(embedData.setTitle)
                .setDescription("...")
                

            await newMessage.edit({embed});
            embed.description = successMessage;
            newMessage.edit({embed});
        }
        await sleep(2500);
        var dungeonName = embedData.setAuthor.title.replace("${dungeon.room.name}", playerDungeon.room.name);
        var newImage = embedData.setAuthor.image.replace("${profile_pic}", client.user.avatarURL);
        const embed = new Discord.RichEmbed()
            .setAuthor("Ghost", newImage)
            .setColor(playerDungeon.room.color)
            .setTitle(embedData.setTitle)
            .setDescription("...")
            

        await newMessage.edit({embed});
        actualOpenDoor(playerDungeon, newCommand.unlock, author, newMessage, embedData);
    } else {
        if (!embedData)
            channel.send(failedMessage);
        else {
            var dungeonName = embedData.setAuthor.title.replace("${dungeon.room.name}", playerDungeon.room.name);
            var newImage = embedData.setAuthor.image.replace("${profile_pic}", client.user.avatarURL);
            const embed = new Discord.RichEmbed()
                .setAuthor("Ghost", newImage)
                .setColor(playerDungeon.room.color)
                .setTitle(embedData.setTitle)
                .setDescription("...")
                

            await newMessage.edit({embed});
            embed.description = failedMessage;
            newMessage.edit({embed});
        }
        await sleep(2500);

        playerDungeon.dialogObj = newCommand.lockpick;
        move(newCommand.lockpick.moveToFail, playerDungeon, true, author);
        playerDungeon.dialogObj = undefined;
    }
}

// Opens the door (TODO: ADD NO EMOTE COMPATIBILITY,    AND REMOVE KEY)
async function openDoor(playerDungeon, newCommand, author, returnElement, newMessage, embedData) {
    var hasAllItems = true;
    const noneString = "**> [None]**\n";
    var itemsHasString = noneString;
    var itemsNotHaveString = noneString;
    console.log("[Open Door] JSON Data: " + JSON.stringify(newCommand, null, 4) + "\nreturnElement: " + JSON.stringify(returnElement, null, 4));
    // Loops over all items
    for (let i = 0; i < newCommand.required.length; i++) {
        // Element = item object
        const objData = newCommand.required[i];     // Contains data from rooms.json
        const item = rooms.items[objData.item];
    
        // Checks for key in inventory
        let itemRemove = playerDungeon.items.findIndex( i => i.name === item.name );
        console.log("[Remove Item Door] " + "itemRemove = " + itemRemove);

        // If item exist
        var failed;
        if (itemRemove !== -1) {
            if (removeItem(playerDungeon, item, objData.amount)) {
                if (itemsHasString === noneString) itemsHasString = ""; // Erases None string
                itemsHasString += `**> ${item.emote} ${item.name} [${objData.amount}x]**\n`;
            }
            else {
                console.log(`[Remove Item Door] Remove fail at removeItem().`) 
                failed = true;
            }
        } else {
            console.log(`[Remove Item Door] Couldn't find item name.`) 
            failed = true;
        }

        if (failed) {
            hasAllItems = false;
            if (itemsNotHaveString === noneString) itemsNotHaveString = ""; // Erases None string
            itemsNotHaveString += `**> ${item.emote} ${item.name} [${objData.amount}x]**\n`;
        }
    }

    // Variables        
    var successMessage = `${author} used:\n${itemsHasString} to open the door.`;
    var failedMessage  = `The party does have:\n${itemsHasString}However, the party does not have:\n${itemsNotHaveString}\n...in order to :closed_lock_with_key: unlock the door.`;
    console.log("[Open Door] " + successMessage + " | " + failedMessage);
    
    // If no items needed
    if (hasAllItems) {
        var dungeonName = embedData.setAuthor.title.replace("${dungeon.room.name}", playerDungeon.room.name);
        var newImage = embedData.setAuthor.image.replace("${profile_pic}", client.user.avatarURL);
        const embed = new Discord.RichEmbed()
            .setAuthor("Ghost", newImage)
            .setColor(playerDungeon.room.color)
            .setTitle(embedData.setTitle + ": Unlocking")
            .setDescription("...")
        
        await newMessage.edit({embed});
        embed.description = successMessage;
        newMessage.edit({embed});
        await sleep(2500);
    } else {
        // Send fail message
        if (!embedData)
            sendMessage(author.id, playerDungeon.room.channel, failedMessage);
        else {
            var dungeonName = embedData.setAuthor.title.replace("${dungeon.room.name}", playerDungeon.room.name);
            var newImage = embedData.setAuthor.image.replace("${profile_pic}", client.user.avatarURL);
            const embed = new Discord.RichEmbed()
                .setAuthor("Ghost", newImage)
                .setColor(playerDungeon.room.color)
                .setTitle(embedData.setTitle)
                .setDescription("...")
        
            await newMessage.edit({embed});
            embed.description = failedMessage;
            newMessage.edit({embed});
            await sleep(2500);
        }

        return typingDialog(playerDungeon, playerDungeon.dialogObj, author);
    }

    actualOpenDoor(playerDungeon, newCommand, author, newMessage, embedData);
}

function actualOpenDoor(playerDungeon, newCommand, author, newMessage, embedData) {
    if (newMessage) {
        var dungeonName = embedData.setAuthor.title.replace("${dungeon.room.name}", playerDungeon.room.name);
        var newImage = embedData.setAuthor.image.replace("${profile_pic}", client.user.avatarURL);
        const embed = new Discord.RichEmbed()
            .setAuthor("Ghost", newImage)
            .setColor(playerDungeon.room.color)
            .setTitle(embedData.setTitle + ": Unlocking")
            .setDescription(`:unlock: The door has been opened!`)
    
        newMessage.edit({embed}); 
    }

    playerDungeon.dialogObj = newCommand;
    playerDungeon.reroutedRooms.push([newCommand.moveFrom, newCommand.moveTo]);
    move(newCommand.moveTo, playerDungeon, true, author);
    playerDungeon.dialogObj = undefined;
}

// Loots the chest (TODO: REMOVE GAMBLWON ON SENDSERVERDATA)
async function lootChest(playerDungeon, newCommand, author, newMessage, embedData) {
    var channel = client.channels.get(playerDungeon.room.channel);
    var content = `:lock: **Opening chest.`;
    var openMessage = `:unlock: **You obtained :wind_blowing_face: Air!** This item will be distributed through the party at random.`;
    // Generates a random item drop group
    //console.log(JSON.stringify(newCommand, null, 4));
    var randomDropGroup = calcRandom.random(0, newCommand.objects.length - 1);
    var randomItemGroup = calcRandom.random(0, newCommand.objects[randomDropGroup].length - 1)

    /*
    console.log("newCommand.objects: " + JSON.stringify(newCommand.objects, null, 4));
    console.log("newCommand.objects.length: " + newCommand.objects.length);
    console.log("newCommand.objects[randomDropGroup]: " + JSON.stringify(newCommand.objects[randomDropGroup], null, 4));=
    console.log("newCommand.objects[0][0]: " + JSON.stringify(newCommand.objects[0][0], null, 4));
    console.log("IF THIS DOESNT WORK, AHHH: " + newCommand.objects[0][0].name)
    */

    console.log("[RNG] " + randomDropGroup + " " + randomItemGroup + " | " + newCommand.objects[randomDropGroup].length);
    var randomItem = newCommand.objects[randomDropGroup][randomItemGroup];

    switch (randomItem.name) {
        case "crystals":
            if (randomItem["amount"]) {
                var amount = calcRandom.random(randomItem["amount"][0], randomItem["amount"][1]);
                openMessage = `:unlock: **You obtained <:crystals:460974340247257089> ${amount * playerDungeon.players.length} Crystals!** This item will be distributed through the party evenly.`;
                addCrystalsToPartyMember(playerDungeon, amount);
            }
            break;
    
        case "materials":
            openMessage = `:unlock: **You obtained materials that I have implemented!**`;
            break;

        default:
            console.warn("Message not in switch statement: " + randomItem.name)
            break;
    }

    if (!embedData || !newMessage) {
        var message = await channel.send(content + "**").catch(console.error);
    } else {
        var dungeonName = embedData.setAuthor.title.replace("${dungeon.room.name}", playerDungeon.room.name);
        var newImage = embedData.setAuthor.image.replace("${profile_pic}", client.user.avatarURL);
        const embed = new Discord.RichEmbed()
            .setAuthor("Ghost", newImage)
            .setColor(playerDungeon.room.color)
            .setTitle(embedData.setTitle + ": Unlocking")
            .setDescription(content + "**")

        newMessage.edit({embed});
    }

    for (let index = 1; index < 3; index++) {
        var stringOfDots = "";
        
        for (let i = 0; i < index; i++) {
            console.log("[Loot Chest] | Number of dots: " + index);
            stringOfDots += ".";            
        }
        
        await sleep(750);  
        console.log("[Loot Chest] " + content + stringOfDots + " | " + index);
        if (!embedData)
            await message.edit(content + stringOfDots + "**");
        else {
            var dungeonName = embedData.setAuthor.title.replace("${dungeon.room.name}", playerDungeon.room.name);
            var newImage = embedData.setAuthor.image.replace("${profile_pic}", client.user.avatarURL);
            const embed = new Discord.RichEmbed()
                .setAuthor("Ghost", newImage)
                .setColor(playerDungeon.room.color)
                .setTitle(embedData.setTitle + ": Unlocking")
                .setDescription(content + stringOfDots + "**")

            await newMessage.edit({embed})
        }
    }

    await sleep(750);
    if (!embedData)
        message.edit(openMessage);
    else {
        var dungeonName = embedData.setAuthor.title.replace("${dungeon.room.name}", playerDungeon.room.name);
        var newImage = embedData.setAuthor.image.replace("${profile_pic}", client.user.avatarURL);
        const embed = new Discord.RichEmbed()
            .setAuthor("Ghost", newImage)
            .setColor(playerDungeon.room.color)
            .setTitle(embedData.setTitle + ": Unlocked")
            .setDescription(openMessage)

        newMessage.edit({embed});
    }
    await sleep(2500);
    
    // Moves user to empty chest room
    playerDungeon.dialogObj = newCommand;
    //console.log(JSON.stringify(newCommand, null, 4));
    playerDungeon.reroutedRooms.push([newCommand.moveFrom, newCommand.moveTo]);
    move(newCommand.moveTo, playerDungeon, true, author);
    playerDungeon.dialogObj = undefined;
}

// Leaves the chest alone
async function leaveObject(playerDungeon, newCommand, author) {
    playerDungeon.dialogObj = newCommand;
    move(newCommand.moveTo, playerDungeon, true, author);
    playerDungeon.dialogObj = undefined;
}

// Passes all the user IDs
function passDungeonUserIDs(playerDungeon) {
    var userIDArray = [];
    playerDungeon.players.forEach(element => {
        userIDArray.push(element.userID);
    });
    console.log(userIDArray);
    return userIDArray;
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

// Creates new dungeon, inits BotWaitingPlayers()
async function NewDungeonSequence(channel) {
    console.log('Attempting to start a raid!');

    // If bot summoning for a dungeon is free
    var newRoomID = rooms.rooms[calcRandom.random(0, rooms.rooms.length - 1)];  // calcRandom.random is inclusive for low + high
    console.log(newRoomID);
    var newRoom = rooms[newRoomID] 

    var newDungeon;
    dungeonCollection.forEach(element => {
        if (element.room.name === newRoom.name) {
            return console.log("Raid already happening.");
        }
    });

    // Decides on new dungeon
    newDungeon = new DungeonRaidInstance(newRoom);
    newDungeon.location = newDungeon.room.entrance;
    dungeonCollection.push(newDungeon);

    // Minutes
    var sleepTime = 2 * 60;
    BotWaitingPlayers(channel, newDungeon, sleepTime);
}

// Shows the join message for the specified dungeon
async function BotWaitingPlayers(channel, dungeon, timer) {
    dungeon.startTimer = timer;

    var decrementTime = 1; // Seconds
    var newMessage;
    var textTimer = `⏰ ${fmtMSS(dungeon.startTimer)} min. left before leaving`;
    var crystalCost = 50;
    const botDialog = `*Psst.* Hey travelers, **${dungeon.room.name}** doesn't have any Ravagers outside guarding it. ` +
                        `I could lockpick it, but it's gunna cost you **<:crystals:460974340247257089> 50**, for each of you.`;
    const description = `In order to join the dungeon, you have to pay **<:crystals:460974340247257089> ${crystalCost}**. \nReact with <:crystals:460974340247257089> to enter, and the crystals will be subtracted from your account.`;

    client.user.setStatus('online');
    client.user.setActivity(`${textTimer} ${dungeon.room.name}.`)
    dungeon.state = DungeonState.WAITING_FOR_USERS;

    const embed = new Discord.RichEmbed()
        .setAuthor("Ghost", client.user.avatarURL)
        .setColor(dungeon.room.color)
        .setDescription(description)
        .setFooter(textTimer  + ".")               
    newMessage = await client.channels.get(channel).send(botDialog, {embed});  

    await newMessage.react('460974340247257089');
    
    // Collector for emotes
    const collector = newMessage.createReactionCollector(
        (reaction, user) => reaction.emoji.name === 'crystals' && user.id !== client.user.id , { time: timer * 1000 });

    // Removes crystals
    collector.on("collect", async reaction => {
        var user = reaction.users.last();
        //console.log(reaction.emoji.name)
        //console.log("Added new user: " + user.username)

        var attacker = String(dataRequest.loadServerData("userStats", user.id));
        var attackerWallet = parseFloat(attacker.split(",")[6]);
        
        if (attackerWallet >= crystalCost) {
            dataRequest.sendServerData("buyDrink", crystalCost, user.id);
            joinMessage(user, channel, dungeon.room);
        } else {
            newMessage.channel.send(`:x: ${user} You don't have enough crystals to pay me. Come back later, when you do. I ain't doing this for free.`);
        }
    });

    // Clears reactions
    collector.once("end", async collecter => {
        console.log("[Reaction Options] Ended collector, clearing emotes and sending timing out message if needed.");
        newMessage.clearReactions();
    });
    
    // Creates description and displays it (join, no-join)
    function timerFunction() {
        setTimeout(async () => {
            if (dungeon.state !== DungeonState.WAITING_FOR_USERS) return;
            const timeInveral = 30;
            var quarterMinuteRemainder = dungeon.startTimer % timeInveral;
            console.log("[Timer Function] timer: " + dungeon.startTimer + " => " + (dungeon.startTimer - decrementTime) + " | " + quarterMinuteRemainder)
 
            // If it's been 30 seconds (divisible without any remainder, & not exactly starting time)
            if (quarterMinuteRemainder == 0 && dungeon.startTimer !== timer) {
                var descriptionString = "";
                var finished = `The travelers entered the dungeon. You can no longer join.`
                var textTimer = `⏰ ${fmtMSS(dungeon.startTimer)} min. left before leaving`;
                var footerText = textTimer + ".";
    
                if (dungeon.startTimer > 0) {
                    descriptionString = description;
                    client.user.setActivity(`${textTimer} ${dungeon.room.name}.`);
                } else {
                    descriptionString = finished;
                    footerText = "⏰ You can no longer join."
                }
    
                const embed = new Discord.RichEmbed()
                    .setAuthor("Ghost", client.user.avatarURL)
                    .setColor(dungeon.room.color)
                    .setDescription(descriptionString)
                    .setFooter(`${footerText}`)
    
                newMessage.edit(botDialog, embed);
            } else if (dungeon.startTimer === timer) {
                console.log("[Debug] " + dungeon.startTimer + " | " + timer);
            }
            dungeon.startTimer -= decrementTime;
            if (dungeon.startTimer > -1) timerFunction(); else {
                if (dungeon.state === DungeonState.WAITING_FOR_USERS && dungeon.players.length > 0) {
                    console.log(dungeon.players.length);
                    BotActive(dungeon);
                } else {
                    BotInactive(dungeon);
                }
            }
        }, decrementTime * 1000);
    }
 
    timerFunction();
}

// Sends closing dungeon messages
async function BotActive(dungeon) {
    //sendMessage(channel, `${dungeon.room.name} has closed, trapping the travelers inside the dungeon. \
    //\n\n***YOU NO LONGER CAN !JOIN***`);
    
    if (dungeon.players.length > 0) {
        await sendEmbedLocation(dungeon);

        client.channels.get(dungeon.room.channel).send(`**<#${dungeon.room.channel}>** got closed behind us. I guess we should start venturing deeper.` +
            `\nUse **!help ${client.user}** to get all the commands you are able to use here, if you need anythin'.`);

        client.user.setStatus('away');
        
        dungeon.state = DungeonState.INSIDE_DUNGEON;
    } else {
        BotInactive(dungeon);
    }
    
    // Starts timer
    var decrementTime = 1000;              // 1 every second

    dungeon.timer = 10 * 60 * 1000;
    sendTimerInChat(dungeon);

    // Decrements dungeon timer and displays it in chat.
    function displayTimer() {
        setTimeout(async () => {
            // Makes sure dungeon is still there
            if (dungeon) {
                if (dungeon.state === DungeonState.INSIDE_DUNGEON) {
                    dungeon.timer -= decrementTime;

                    // Timers
                    if (dungeon.timer > 0) {
                        // Events
                        var oneMinuteRemainder = dungeon.timer % (1 * 60 * 1000);
    
                        if (oneMinuteRemainder == 0) {
                            sendTimerInChat(dungeon);
                            client.user.setActivity(`⏰ ${fmtMSS(dungeon.timer / 1000)} min. left | ${dungeon.room.name}`).then(presence => console.log(`Activity set to ${presence.game ? presence.game.name : 'none'}`))
                                .catch(console.error);
                        }
    
                        // Recursion
                        displayTimer();
                    // Leaves dungeon
                    } else {
                        await sendTimerInChat(dungeon);
                        await client.channels.get(dungeon.room.channel).send("An overwhelming amount of Ravagers came back in," + 
                            " and the party escaped, however not completing the dungeon.\n\n***THE DUNGEON HAS FAILED TO BE COMPLETED IN TIME.***");
                        await client.channels.get(process.env.TEST_CHANNEL_ID).send("Alright travelers, we didn't make it in time, but we managed to get out alive, I guess. Better luck next time.");
                        BotInactive(dungeon);
                    }
                }
            }
        }, decrementTime);
    }

    displayTimer();
}

// Inactive
async function BotInactive(dungeon) {
    // Removes roles
    const guild = client.guilds.get(process.env.SANCTUM_ID);
    if (dungeon.players.length > 0) {
        for (let i = 0; i < dungeon.players.length; i++) {
            const element = dungeon.players[i];

            // Deletes role
            let role = client.guilds.get(process.env.SANCTUM_ID).roles.find(role => role.name === `${dungeon.room.name}: Raid Party`);
            await guild.members.get(element.userID).removeRole(role);
        }
    }

    // Removes dungeon by index
    let removeDungeon = dungeonCollection.findIndex( d => d.room.name === dungeon.room.name );
    dungeonCollection.splice(removeDungeon);

    if (dungeonCollection.length < 1)
        client.user.setStatus('invisible');
}

// Sends timer message
function sendTimerInChat(newDungeon) {
    console.log("[Timer] " + newDungeon.timer + " | " + newDungeon.startTimer);
    const guild = client.guilds.get(process.env.SANCTUM_ID);
    var role = guild.roles.find(role => role.name === `${newDungeon.room.name}: Raid Party`);

    if (newDungeon.state !== DungeonState.WAITING_FOR_USERS)
        return client.channels.get(newDungeon.room.channel).send(`:alarm_clock: ${role} has ${fmtMSS(newDungeon.timer / 1000)} min. left to complete the dungeon.`);
    else
        return client.channels.get(newDungeon.room.channel).send(`:alarm_clock: ${role} has ${fmtMSS(newDungeon.startTimer)} min. left before the dungeon starts.`);
}

// Ends dialog by pausing then sending your location again.
async function endDialog(newCommand, playerDungeon, overrideLastCommand) {
    if (newCommand.lastCommand || overrideLastCommand) {
        console.log("[End Dialog] Doing End Dialog Sequence.")
        playerDungeon.dialogObj = undefined;
        await sleep(1000);

        if (newCommand.lastCommand) sendEmbedLocation(playerDungeon);
    }
}

// Does typing dialog for the NPC
async function typingDialog(playerDungeon, newCommand, author, newMessage) {
    if (playerDungeon.isTyping) { console.log("isTyping true, cancelling"); return false };
    console.log("[Typing Dialog]\n" + JSON.stringify(newCommand, null, 4));
    playerDungeon.isTyping = true;
    var firstTime;
    var range = 250;
    var channel = client.channels.get(playerDungeon.room.channel);

    // Types out all the dialog
    if (newCommand.descriptions) {
        for (let index = 0; index < newCommand.descriptions.length; index++) {
            var temp = "";
            const element = newCommand.descriptions[index];
            if (element.text !== undefined) {
                var title = ""
                if (!firstTime) {
                    title = `**${playerDungeon.dialogObj.name}**\n`; 
                    firstTime = true;
                }
                temp = element.text.replace("${leader}", author);
                var waitTimerRange = calcRandom.random(element.waitBegin - range, element.waitBegin + range);

                // Debug purposes only
                //waitTimerRange = 10;

                sendTypingMessage(channel, title + temp, waitTimerRange);
                await sleep(waitTimerRange + element.waitEnd);
                
                endDialog(newCommand, playerDungeon);
            }
        }
    }
    
    playerDungeon.isTyping = false;
    reactionOptions(playerDungeon, newCommand, author, newMessage);
}

// Does reactions on a message, then uses them as options
async function reactionOptions(playerDungeon, newCommand, author, newMessage) {
    var channel = client.channels.get(playerDungeon.room.channel);
    var range = 250;
    var returnElement = false;

    // Reactions (if they exist via text or have an options JSON field)
    if (newCommand.optionsDescription || newCommand.options) {
        var waitTimerRange;
        var isEmbed = false;
        waitTimerRange = 10;

        // Embed and text varients
        if (!newCommand.embed) {
            waitTimerRange = calcRandom.random(newCommand.optionsDescription.waitBegin - range, newCommand.optionsDescription.waitBegin + range);
            newMessage = await sendTypingMessage(channel, newCommand.optionsDescription.text, waitTimerRange)
        }
        else {
            await sleep(newCommand.embed.waitBegin);

            // Specific formattings
            if (newCommand.embed.formatting === "author_title_image_desc") {
                var newImage = client.user.avatarURL;
                const embed = new Discord.RichEmbed()
                    .setAuthor("Ghost", newImage)
                    .setColor(playerDungeon.room.color)
                    .setTitle(newCommand.embed.setTitle)
                    .setDescription(newCommand.embed.setDescription)

                newMessage = await channel.send({embed});
                channel.stopTyping(true);
            } else {
                console.error("[Reaction Options] Embed was tried, but no vaid formatting!");
            }

            await sleep(newCommand.embed.waitEnd)
        }

        // Reacts
        for (let i = 0; i < newCommand.options.length; i++) {
            const element = newCommand.options[i];
            console.log("[Reaction Options] Emote: " + element.emote + "  | newMessage: " + newMessage);
            await newMessage.react(element.emote);
        }

        // Collects emotes and reacts upon the reaction (120 seconds)
        const collector = newMessage.createReactionCollector(
            (reaction, user) => (getDungeonPlayer(user.id).isLeader || getDungeonPlayer(user.id).isCommander) && 
            (newCommand.options.some(option => option.emote === reaction.emoji.name)), { time: 120 * 1000 });
        var endedOnReact = false;

        // Collect
        collector.once("collect", async reaction => {
            // Solely for players
            if (playerDungeon.dialogObj) {
                const chosen = reaction.emoji.name;
                newCommand.options.forEach(element => {
                    if (element.emote === chosen) {
                        returnElement = element;

                        // Grabs the object if it exists
                        if (playerDungeon.dialogObj[element.command] && playerDungeon.dialogObj[element.command].command) {
                            typingDialog(playerDungeon, playerDungeon.dialogObj[element.command], author, newMessage);
                            console.log("Using grab object if exists");
                            hasAlreadyTriggered = true;
                        }
                    }
                });
            }
            customCommandEmoteProcessor(playerDungeon, newCommand, author, returnElement, newMessage, reaction);
            endedOnReact = true;
            collector.stop();

            /*
            console.log(newMessage.reactions);
            newMessage.reactions.forEach(element => {
                if (element.users.id !== client.user.id) newMessage.reactions.remove(element);
            });
            */
            
            // Debug
            //console.log("[Reaction Options] Return emote from reactionOptions: " + returnElement.emote);
            //console.log("[Reaction Options] newCommand @ reactions function: " + JSON.stringify(newCommand));
            //console.log("[Reaction Options] returnElement: " + JSON.stringify(returnElement));
        });

        // End trigger
        collector.once("end", collecter => {
            console.log("[Reaction Options] Ended collector, clearing emotes and sending timing out message if needed.");
            newMessage.edit(newMessage.content);
            newMessage.clearReactions();
            if (!endedOnReact) {
                sendMessage(playerDungeon.room.channel, ":x: **Timed Out** The emote reaction request timed out after 2 minutes.");
                endDialog(newCommand, playerDungeon, true);
            }
        });
        
    }
}

// Sends messages in periods of time
async function sendTypingMessage(channel, message, waitTimer) {
    channel.startTyping()
    await sleep(waitTimer);
    channel.stopTyping(true);
    
    return channel.send(message);
}

// Just here for placeholder, do not use
async function sendEmbedMessage(channel, embedData, waitTimer) {
    channel.startTyping();
    await sleep(waitTimer);
    channel.stopTyping(true);

    const embed = new Discord.RichEmbed();

    return channel.send(embed);
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

// You may use cron normally
cron.schedule('30 */3 * * *', function() {
    NewDungeonSequence(process.env.TEST_CHANNEL_ID);
});

// Join Message
function joinMessage(user, channel, room) {
    var newDungeon;
    var firstUserGiveLeader = false;
    dungeonCollection.forEach(element => {
        if (element.room === room) newDungeon = element;
    });

    // If dungeon doesn't exist
    if (!newDungeon) {
        if (room.undefined != undefined) {
            if (room.undefined == "") 
                return sendMessage(user.id, channel.id, `:x: You need to specify what dungeon you wish to join.`);
            return sendMessage(user.id, channel.id, `:x: There is no dungeon named ${room.undefined}.`);
        }
        return sendMessage(user.id, channel.id, ":x: This dungeon does not exist.");
    } else {
        if (newDungeon.players.length == 0) {
            firstUserGiveLeader = true;
        }
    }

    if (newDungeon.state !== DungeonState.WAITING_FOR_USERS) {
        return sendMessage(user.id, channel.id, ":x: This dungeon's closed currently.");
    }

    // Find if user is in the Raid Party
    var userExists = newDungeon.players.find( player => player.userID === user.id );

    // If user doesn't exist in the list, join message
    if (!userExists) {
        let member = client.guilds.get(process.env.SANCTUM_ID).members.get(user.id);

        // Adds role to use
        let role = client.guilds.get(process.env.SANCTUM_ID).roles.find(role => role.name === `${newDungeon.room.name}: Raid Party`);
        member.addRole(role);

        // Creates new player for array
        var playerRole = getFactionID(member);
        var className = getCombatClassName(member);
        var newPlayer = new PlayerClass(user.id, playerRole, className, ":new:", firstUserGiveLeader);
        
        newDungeon.players.push(newPlayer);

        // Sends messages confirming it
        client.channels.get(newDungeon.room.channel).send(`<@${user.id}> welcome to the ${newDungeon.room.name} dungeon raid! Use **!party** to check the members.`);
        //message.channel.send(`<@${user.id}> you have **!join**ed the ${newDungeon.room.name} dungeon raid! Use **!party** to check the members.`);
    // Else send error already joined
    } else {
        //client.channels.get(newDungeon).send(`<@${user.id}> you already **!join**ed the ${newDungeon.room.name} dungeon raid. Use **!party** to check the members.`);
    }
}

// Leave Message
async function leaveMessage(message) {
    var dungeonPlayer = getDungeonPlayer(message.author.id);

    // Sends messages confirming it
    if (dungeonPlayer.playerDungeon === undefined) {
        var confirmMessage = await message.channel.send(`<@${message.author.id}> you aren't in a dungeon raid in my books, but are you sure you want to force leave all dungeon raids?\n*This will remove all dungeon raid roles.*`);

        // Reacts
        await confirmMessage.react('✅');
        await confirmMessage.react('❌');

        const collector = confirmMessage.createReactionCollector(
            (reaction, user) => (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id , { time: 15 * 1000 });
        var react = "";

        // Collect
        collector.once("collect", async reaction => {
            endedOnReact = true;
            react = reaction.emoji.name;
            collector.stop();
        });

        // End trigger
        collector.once("end", async collecter => {
            console.log("[Reaction Options] Ended collector, clearing emotes and sending timing out message if needed.");
            confirmMessage.edit(confirmMessage.content);
            confirmMessage.clearReactions();
            if (!endedOnReact) return message.channel.send(":x: **Timed Out**: The emote reaction request timed out after 15 seconds.");
            if (react === '❌') return confirmMessage.edit(`${message.author} Cancelled removing dungeon raid roles.`);

            // Force deletes all dungeons that exist
            for (let i = 0; i < rooms.rooms.length; i++) {
                const element = rooms.rooms[i];
                const name = rooms[element].name;
                let role = client.guilds.get(process.env.SANCTUM_ID).roles.find(role => role.name === `${name}: Raid Party`);
                await message.member.removeRole(role);
            } 

            await confirmMessage.edit(`${message.author} Removed all dungeon raid roles.`)
        });
    } else {
        var confirmMessage = await message.channel.send(`<@${message.author.id}> are you sure you want to leave the ${dungeonPlayer.playerDungeon.room.name} dungeon raid?`);

        // Reacts
        await confirmMessage.react('✅');
        await confirmMessage.react('❌');
        
        // Collects emotes and reacts upon the reaction (15 seconds)
        const collector = confirmMessage.createReactionCollector(
            (reaction, user) => (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id , { time: 15 * 1000 });
        var endedOnReact = false;
        var react = "";

        // Collect
        collector.once("collect", async reaction => {
            // Solely for players
            endedOnReact = true;
            react = reaction.emoji.name;
            collector.stop();
        });

        // End trigger
        collector.once("end", collecter => {
            console.log("[Reaction Options] Ended collector, clearing emotes and sending timing out message if needed.");
            confirmMessage.edit(confirmMessage.content);
            confirmMessage.clearReactions();
            if (!endedOnReact) return sendMessage(message.channel, ":x: **Timed Out**: The emote reaction request timed out after 15 seconds.");
            if (react === '❌') return confirmMessage.edit(`${message.author} Cancelled leaving the ${dungeonPlayer.playerDungeon.room.name}.`);
            
            // Sends confirmation message
            message.channel.send(`${message.author} has left the dungeon.`)

            // Deletes role
            let role = client.guilds.get(process.env.SANCTUM_ID).roles.find(role => role.name === `${dungeonPlayer.playerDungeon.room.name}: Raid Party`);
            message.member.removeRole(role);

            // Removes user from dungeon
            dungeonPlayer.playerDungeon.players = dungeonPlayer.playerDungeon.players.filter(obj => obj.userID !== message.author.id)

            // Chooses random leader if leader left
            console.log("Is there a leader: " + dungeonPlayer.playerDungeon.players.find(l => l.leader) === true);
            if (dungeonPlayer.playerDungeon.players.find(l => l.leader) === undefined) {
                for (let i = 0; i < dungeonPlayer.playerDungeon.players.length; i++) {
                    const element = dungeonPlayer.playerDungeon.players[i];
                    console.log(element);
                    if (element.commander) {
                        element.commander = false;
                        element.leader = true;
                        message.channel.send(`<@${element.userID}> has been promoted to leader!`);
                        break;
                    }
                }
            
                // If there is no commander, promote first person on list
                for (let i = 0; i < dungeonPlayer.playerDungeon.players.length; i++) {
                    const element = dungeonPlayer.playerDungeon.players[i];
                    element.commander = false;
                    element.leader = true;
                    message.channel.send(`<@${element.userID}> has been promoted to leader!`);
                    break;
                } 
            }

            // Destroy dungeon if last player
            if (dungeonPlayer.playerDungeon.players.length === 0) {
                BotInactive(dungeonPlayer.playerDungeon);
            }
        });
    }
}

// Checks if direction can be done (skips anything other than Directions.XXXX)
function checkValidMovement(direction, dungeon, silent) {
    var directionFailure;
    switch (direction) {
        case Directions.NORTH:
            if (dungeon.location.connections.north === undefined) {
                directionFailure = "**north**";
            }
        break;
        case Directions.EAST:
            if (dungeon.location.connections.east === undefined) {
                directionFailure = "**east**";
            }
        break;
        case Directions.SOUTH:
            if (dungeon.location.connections.south === undefined) {
                directionFailure = "**south**";
            }
        break;
        case Directions.WEST:
            if (dungeon.location.connections.west === undefined) {
                directionFailure = "**west**";
            }
        break;
    }

    if (directionFailure) {
        if (!silent) {
            var deniedMessage = `:x: ${user} You can't go ${directionFailure}, please choose a valid path.`;
            client.channels.get(dungeon.room.channel).send(deniedMessage);
        }
        return false;
    }
    return true;
}

// Moves in the dungeon
// TODO ITEM
async function move(direction, dungeon, isPartyLeader, user, moveToOverride) {
    if (dungeon === undefined) return console.log("Dungeon doesn't exist!");
    
    var channel = client.channels.get(dungeon.room.channel);
    var newRoom;

    if (!isPartyLeader) return channel.send(`:x: ${user} You need to be a Party Leader or be **!promoted** to Commander in order to move.`);
    if (!checkValidMovement(direction, dungeon)) return;

    // Says something if command can be done
    switch (direction) {
        case Directions.NORTH:
            if (dungeon.location.connections.north !== undefined) {
                newRoom = dungeon.location.connections.north;
                //channel.send(":white_check_mark: **Command accepted.** Following the party **north**.");
            }
        break;
        case Directions.EAST:
            if (dungeon.location.connections.east !== undefined) {
                newRoom = dungeon.location.connections.east;
                //channel.send(":white_check_mark: **Command accepted.** Following the party **east**.");
            }
        break;
        case Directions.SOUTH:
            if (dungeon.location.connections.south !== undefined) {
                newRoom = dungeon.location.connections.south;
                //channel.send(":white_check_mark: **Command accepted.** Following the party **south**.");
            }
        break;
        case Directions.WEST:
            if (dungeon.location.connections.west !== undefined) {
                newRoom = dungeon.location.connections.west;
                //channel.send(":white_check_mark: **Command accepted.** Following the party **west**.");
            }
        break;
        default:
            // If uses a custom moveTo statement
            if (moveToOverride) {
                newRoom = moveToOverride;
            // Else if no override
            } else if (dungeon.dialogObj.moveTo) {
                newRoom = dungeon.dialogObj.moveTo;
            }
        break;
    }

    // Reroutes rooms
    dungeon.reroutedRooms.forEach(element => {
        console.log("[Move Reroute Rooms] " + element[0] + " " + element[1] + " " + newRoom + " " + (element[0] === newRoom));
        if (element[0] === newRoom) newRoom = element[1];
    });

    console.log("[New Room]: " + newRoom + " | [Old Room]: " + dungeon.location.name);
    switch (newRoom) {
        case "__END":
            await client.channels.get(process.env.TEST_CHANNEL_ID).send(`The **${dungeon.room.name}** dungeon has been completed!`);
            await channel.send(`Congratulations! The party completed the **${dungeon.room.name}** dungeon with **${fmtMSS(dungeon.timer / 1000)} min. left**!`);
            BotInactive(dungeon);
            break;

        default:
            dungeon.location = dungeon.room[newRoom];
            sendEmbedLocation(dungeon);
            break;
    }
    console.log("[New Location]: " + dungeon.location.name);
}

// Movement option text
function movementOptions(dungeon) {
    var temp = "";

    if (dungeon.location.northtext  !== "" && dungeon.location.northtext)
        temp += `:arrow_up: ${dungeon.location.northtext}\n`;
    if (dungeon.location.easttext   !== "" && dungeon.location.easttext)
        temp += `:arrow_right: ${dungeon.location.easttext}\n`;
    if (dungeon.location.southtext  !== "" && dungeon.location.southtext)
        temp += `:arrow_down: ${dungeon.location.southtext}\n`;
    if (dungeon.location.westtext   !== "" && dungeon.location.westtext)
        temp += `:arrow_left: ${dungeon.location.westtext}\n`;
    return temp;
}

async function sendInventory(playerDungeon, pageNum) {
    var items = "";

    // Creates an array that seperates 10 items into seperate arrays each
    var groupedArr = createGroupedArray(playerDungeon.items, 5);

    // Sets a default page num, or makes it human readable
    if (pageNum === undefined) pageNum = 0; else {
        pageNum--;
        if (pageNum < 0) pageNum = 0;
        if (groupedArr.length < pageNum) pageNum = groupedArr.length;
    }
    
    // Checks if page number is valid
    if (pageNum + 1 > groupedArr.length) {
        // If it's longer than actual length, but isn't just an empty inventory
        if (!groupedArr.length === 0) return;  
    }

    // Grabs item in loop, parses it, then adds it to "items" variable
    if (groupedArr[pageNum]) {
        for (let index = 0; index < groupedArr[pageNum].length; index++) {
            // Grabs an item, from a page index
            const element = groupedArr[pageNum][index];

            // Makes if there is an emote, it'll add an extra space
            var emoteText = "";
            if (element.emote) emoteText = element.emote + " ";

            // Adds it in
            items += `> ${emoteText}**${element.name}** [${element.amount}x] ${element.info}\n`; 
        }  
    }

    // No items message to fill field
    if (items === "") items = "There are no items in the party's inventory.";

    // To make the message of "Page 1/0" with no items in !pinventory not happen
    var moddedLength = groupedArr.length;
    if (moddedLength < 1) moddedLength = 1;

    const embed = new Discord.RichEmbed()
        .setAuthor("Ghost", client.user.avatarURL)
        .setColor(playerDungeon.room.color)
        .addField(`Party Inventory (Page ${pageNum + 1}/${moddedLength})`, items, true)
        //.setDescription(`${items}`)

    client.channels.get(playerDungeon.room.channel).send({embed});
}

// Sends location into chat (non-embed)
function sendLocation(dungeon, author) {
    var temp = `Current Room: **${dungeon.location.name}**\n\n`;
    temp += location(dungeon);
    temp += "\n\n";
    temp += movementOptions(dungeon);

    // Sends message
    var channel = client.channels.get(dungeon.room.channel);
    channel.send(author + " " + temp);
}

// Sends location into chat (embed)
async function sendEmbedLocation(dungeon) {
    if (dungeon.directionalMessageID) {
        dungeon.directionalCollector.stop();
    }
    var channel = client.channels.get(dungeon.room.channel);

    // Does image for background (future map)
    const imageEmbed = new Discord.RichEmbed()
        //.setAuthor("Ghost", client.user.avatarURL)
        .setColor(dungeon.room.color)
        .setImage(dungeon.location.image_url)
    await channel.send({embed: imageEmbed});

    // Does text dialog
    const textEmbed = new Discord.RichEmbed()
        .setAuthor("Ghost", client.user.avatarURL)
        .setTitle(`${dungeon.location.name}`)
        .setColor(dungeon.room.color)
        .setDescription(`${location(dungeon)}\n\n${movementOptions(dungeon)}`)
    var newMessage = await channel.send({embed: textEmbed});

    // Collects emotes and reacts upon the reaction (120 seconds)
    var options = ['⬆', '⬇', '⬅', '➡']
    const collector = newMessage.createReactionCollector(
        (reaction, user) => options.includes(reaction.emoji.name) && user.id !== client.user.id);

    // Reacts
    for (let i = 0; i < options.length; i++) {
        const element = options[i];
        console.log("[Reaction Options] Emote: " + element + "  | newMessage: " + newMessage);
        await newMessage.react(element);
    }

    // Collect
    collector.once("collect", async reaction => {
        const user = reaction.users.last();
        var moveSuccessful;
        switch (reaction.emoji.name) {
            case '⬆':
                moveSuccessful = move(Directions.NORTH, dungeon, (getDungeonPlayer(user.id).isLeader || getDungeonPlayer(user.id).isCommander), user, false);
                break;

            case '⬇':
                moveSuccessful = move(Directions.SOUTH, dungeon, (getDungeonPlayer(user.id).isLeader || getDungeonPlayer(user.id).isCommander), user, false);
                break;
            
            case '⬅':
                moveSuccessful = move(Directions.WEST, dungeon, (getDungeonPlayer(user.id).isLeader || getDungeonPlayer(user.id).isCommander), user, false);
                break;

            case '➡':
                moveSuccessful = move(Directions.EAST, dungeon, (getDungeonPlayer(user.id).isLeader || getDungeonPlayer(user.id).isCommander), user, false);
                break;
        }
        collector.stop();
        
    });

    // End trigger
    collector.once("end", collecter => {
        console.log("[Reaction Options] [sendEmbedLocation] Ended collector, clearing emotes and sending timing out message if needed.");
        newMessage.edit(newMessage.content);
    });
}

// Sends location descriptions (Text)
function location(dungeon) {
    var temp = "";

    for (let index = 0; index < dungeon.location.descriptions.length; index++) {
        const element = dungeon.location.descriptions[index];
        if (element.text !== undefined) {
            temp += element.text + " ";
        }
    }

    //console.log(temp);
    return temp;
}

// Sends party members (Embed)
function partyMembers(dungeon, pageNum) {
    // Updates players
    updatePlayers();
    var playerString = "";
    var userInfo = "";

    //console.log("0: " + pageNum);
    if (pageNum === undefined)
        pageNum = 0;
    else
        pageNum--;
    
    //console.log("1: " + pageNum)
    var groupedArr = createGroupedArray(dungeon.players, 9);
    //console.log(groupedArr);
    //console.log("\n\nGROUPEDARR[PAGENUM]: " + groupedArr[pageNum] + "\n\n")

    if (pageNum + 1 > groupedArr.length) return;    // If it's longer than actual length
    if (groupedArr[pageNum] !== undefined) {
        for (let index = 0; index < groupedArr[pageNum].length; index++) {
            //const user = dungeon.players[index];
            const element = groupedArr[pageNum][index];
 
            playerString += `${element.factionEmote}${element.badge} ${playerName(element.userID)}\n`; 
            userInfo += `${element.combatClassEmote} ${element.combatClass} ${element.isLeaderText}\n`;
            //console.log("playerString:\n" + playerString);
            //console.log("userInfo:\n " + userInfo);
        }
    }

    if (playerString == "") playerString = "None.";
    if (userInfo == "") userInfo = "None.";

    const embed = new Discord.RichEmbed()
        .setAuthor("Ghost", client.user.avatarURL)
        //.setTitle("Hell's Gate: Dungeon Raid")
        /*
        * Alternatively, use "#00AE86", [0, 174, 134] or an integer number.
        */
        .setColor(dungeon.room.color)
        .setTitle(`${dungeon.location.name}`)
        .setDescription(`The **!party** is currently on floor ${dungeon.location.floor}. The leader can **!promote** users so they can interact with the dungeon.`)
        //.setImage("https://i.imgur.com/WyI8YuR.png")
        //.setThumbnail("https://i.imgur.com/BZgLV7w.png")
        //.setThumbnail("https://i.imgur.com/BlQTi94.jpg")

        .addField(`Party Members (Page ${pageNum + 1}/${groupedArr.length})`, playerString, true)
        .addField("User Info", `${userInfo}`, true)

    client.channels.get(dungeon.room.channel).send({embed});
}

// Promote user to become leader
function promoteCommander(author, mentionedMember, leader, channelID) {
    if (mentionedMember !== undefined ) {
        if (leader) {
            var dungeonPlayer = getDungeonPlayer(mentionedMember.id);
            if (dungeonPlayer.player) {
                if (author.id !== mentionedMember.id) {
                    if (!dungeonPlayer.isCommander) {
                        sendMessage(channelID, `:white_check_mark: ${author} has been **!promote**d ${mentionedMember} to commander status!`);
                        dungeonPlayer.player.commander = true;
                    } else {
                        sendMessage(channelID, `:x: ${author} **Command denied.** User already has been **!promote**d.`);
                    }
                } else {
                    sendMessage(channelID, `:x: ${author} **Command denied.** You cannot promote yourself.`);
                }
            }
            else
                sendMessage(channelID, `:x: ${author} **Command denied.** The user being promoted has to be in the party.`);
        }
        else 
            sendMessage(channelID, `:x: ${author} **Command denied.** You need to be a leader in order to **!promote** others.`);
    } else {
        temp = author + " !promote (!pr)\n```If you're the leader, you can promote others to be a commander with you in order to move around.```"
        sendMessage(channelID, temp);
    }
}

// Promote user to become leader
function demoteCommander(author, mentionedMember, leader, channelID) {
    if (mentionedMember !== undefined ) {
        if (leader) {
            var dungeonPlayer = getDungeonPlayer(mentionedMember.id);
            if (dungeonPlayer.player) {
                if (author.id !== mentionedMember.id) {
                    if (dungeonPlayer.isCommander) {
                        sendMessage(channelID, `:white_check_mark: ${author} has **!demote**d ${mentionedMember} to normal status.`);
                        dungeonPlayer.player.commander = false;
                    } else {
                        sendMessage(channelID, `:x: ${author} **Command denied.** User already has been **!demote**d.`);
                    }
                } else {
                    sendMessage(channelID, `:x: ${author} **Command denied.** You cannot promote yourself.`);
                }               
            }
            else
                sendMessage(channelID, `:x: ${author} **Command denied.** The user being demoted has to be in the party.`);
        }
        else 
            sendMessage(channelID, `:x: ${author} **Command denied.** You need to be a leader in order to **!demote** others.`);
    } else {
        temp = author + " !demote (!de)\n```If you're the leader, you can demote others if needed if they are a commander.```"
        sendMessage(channelID, temp);
    }
}

// Transfer party leadership
async function transferLeader(message, toUser) {
    // From and to user transfer
    if (toUser === undefined) return message.channel.send(`${message.author} I don't know that user, please try again with someone I can recognize, thanks.`);

    fromUser = getDungeonPlayer(message.author.id);
    newUser = getDungeonPlayer(toUser.id);

    if (newUser.playerDungeon !== undefined && fromUser.playerDungeon !== undefined 
        && newUser.playerDungeon === fromUser.playerDungeon && fromUser.player.leader
        && message.author.id !== toUser.id) {

        // Sends messages confirming it
        var confirmMessage = await message.channel.send(`:warning: <@${message.author.id}> are you sure you want to give leadership to ${toUser}?\n*You'll be given Commander status afterwards.*`);

        // Reacts
        await confirmMessage.react('✅');
        await confirmMessage.react('❌');

        const collector = confirmMessage.createReactionCollector(
            (reaction, user) => (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id , { time: 15 * 1000 });
        var react = "";
        var endedOnReact;

        // Collect
        collector.once("collect", async reaction => {
            endedOnReact = true;
            react = reaction.emoji.name;
            collector.stop();
        });

        // End trigger
        collector.once("end", async collecter => {
            console.log("[Reaction Options] Ended collector, clearing emotes and sending timing out message if needed.");
            confirmMessage.edit(confirmMessage.content);
            confirmMessage.clearReactions();
            if (!endedOnReact) return sendMessage(message.channel, ":x: **Timed Out**: The emote reaction request timed out after 15 seconds.");
            if (react === '❌') return confirmMessage.edit(`:x: ${message.author} Cancelled giving leadership to ${toUser}.`);

            fromUser.player.leader = false;
            fromUser.player.commander = true;
            newUser.player.leader = true;
            newUser.player.commander = false;

            await confirmMessage.edit(`:white_check_mark: ${message.author} has transferred leadership tp ${toUser}!`)
        });
    } else {
        if (newUser.playerDungeon !== fromUser.playerDungeon) {
            return message.channel.send(`:x: ${message.author} The traveler must be in the party, or else I can't do anything about it.`);
        }

        if (!fromUser.player.leader) {
            return message.channel.send(`:x: ${message.author} You need to be a leader, in order to transfer your leadership.`)
        }

        if (message.author.id === toUser.id) {
            return message.channel.send(`:x: ${message.author} You cannot give yourself leadership if you are already the leader.`)
        }
    }
}

// Log our bot in (change the token by looking into the .env file)
client.login(process.env.GHOST_TOKEN);