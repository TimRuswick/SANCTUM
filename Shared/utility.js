// Initialize the exports
exports = module.exports = {};

const Discord = require("discord.js");
const shared = require("./shared");

/**
 * Clones an array for seperate modification
 * @param  {any[]} arg - Array to clone
 */
exports.cloneArray = function(arg) {
	// https://blog.andrewray.me/how-to-clone-a-nested-array-in-javascript/
	let copy;

	if(Array.isArray(arg)) {
		copy = arg.slice(0);
		for(let i = 0; i < copy.length; i++) {
			copy[i] = exports.cloneArray(copy[i]);
		}
		return copy;
	} else if(typeof(arg) === "object") {
		throw "Cannot clone array containing an object!";
	} else {
		return arg;
	}
}

//dialogJson - the json object containing the bot's dialog
//key - Json key
//data (optional) - a number of arguments that are substituted into the resulting string
/**
 * @param  {object} dialogJson
 */
exports.generateDialogFunction = function(dialogJson) {
	return function(key, ...data) {
		let result;

		if (Array.isArray(dialogJson[key])) {
			result = dialogJson[key][Math.floor(Math.random() * dialogJson[key].length)];
		} else {
			result = dialogJson[key];
		}

		if (typeof(result) === "undefined") {
			return "";
		}

		let counter = 0;
		data.map((dat) => {
			counter++;
			result = result.replace(/\{([1-9][0-9]*)\}/g, a => a === "{" + counter + "}" ? dat : a);
		});

		return result;
	}
}

/**
 * Gets footer commands for !stats
 * @param  {} commandArray - Gets an array of commands (ex. ['!checkin', '!stats'])
 * @param  {string} excludeCommand - Command used and to remove from array (ex. '!checkin')
 */
exports.getFooterCommands = function(commandArray, excludeCommand) {
	let filteredCommandList = commandArray.filter(command => command !== excludeCommand);
	let returnText = "";

	// Adds the commands to a string
	filteredCommandList.forEach(command => {
		// If this isn't the first command, prepend the separator to this command
		if (returnText.length !== 0) returnText += " | ";
		returnText += command;
	});

	return returnText;
}

/**
 * Creates an array that splits off into chuncks, nesting them
 * @param  {any[]} arr - The array to split into chunks
 * @param  {number} chunkSize - The size of the chunks in the resulting array
 */
exports.splitArray = function(arr, chunkSize) {
	// http://www.frontcoded.com/splitting-javascript-array-into-chunks.html
	let groups = [];
	for (let i = 0; i < arr.length; i += chunkSize) {
		groups.push(arr.slice(i, i + chunkSize));
	}
	return groups;
}

exports.removeDuplicates = function(arr) {
    let unique_array = [];
    for (let i = 0; i < arr.length; i++) {
        if (unique_array.indexOf(arr[i]) == -1) {
            unique_array.push(arr[i]);
        }
    }
    return unique_array;
}
	

/**
 * Checks if this is the right bot to display bot channel commands only
 * @param  {object} client - Discord client
 * @param  {object|string} member - Discord member object or ID
 * @param  {object|string} channel - Discord channel object or ID
 * @param  {boolean} checkRole - Check the role
 * @param  {object} npcSettings - npcSettings object
 */
exports.checkValidDisplay = function(client, member, channel, checkRole, npcSettings) { // See if the bot should display its message
	// Gets member and channel objects
	member = exports.getMember(client, member);
	channel = exports.getChannel(client, channel);

	// Routine for faction leaders
	if (channel.type == 'dm') return true;
	if (shared.messaging.isFactionBotspam(channel.id)) {
		if (checkRole && npcSettings.botChannel === channel.id && member.roles.has(npcSettings.role)) {
			return true;
		}
		else if (!checkRole && npcSettings.botChannel === channel.id) {
			return true;
		}
		return false;
	} else {
		switch (client.user.username) {
			// Dungeon bot
			case process.env.GHOST_NAME: 
				// JSON
				let rooms = require('../TextAdv/rooms.json'); // TODO: should this be here?
				let roomExists = false;

				// Loops through all rooms
				rooms.rooms.forEach(room => {
					if (channel.id === rooms[room].channel) {
						roomExists = true;
					}
				});

				// If the given room exists
				if (roomExists) return true;

				// DEBUGGING: Test channel
				if (channel.id == process.env.TEST_CHANNEL_ID) return true;

				// Otherwise
				return false;
			default:
				// Don't show in anything that isn't a faction bot channel OR is special
				return false;
		}
	}
}

/**
 * Creates time text with m:ss
 * @param  {number} s - Seconds
 */
exports.formatMSS = function(s){
	// https://stackoverflow.com/questions/3733227/javascript-seconds-to-minutes-and-seconds
	return (s - (s %= 60)) / 60 + (9 < s ? ':' : ':0') + s;
}

/**
 * Checks for if the user has the Admin role specified in .env
 * @param  {string} userID - Discord user ID to read from
 * @param  {object} guild	- Discord server/guild to get role from
 */
exports.isAdmin = function(userID, guild) {
    return guild.members.get(userID).roles.find(role => role.name === process.env.ADMIN_ROLE);
}

/**
 * Generates a random integer using the params
 * @param  {number} low - Lowest int it can generate
 * @param  {number} high - Highest int it can generate (exclusive by default)
 * @param  {boolean} inclusive - Makes the high value inclusive
 */
exports.random = function(low, high, inclusive) {
	if (inclusive) 	return Math.floor(Math.random() * (high - low) + low);
	else 			return Math.floor(Math.random() * (high - low + 1) + low);
},

/**
 * Gives a random boolean value, influenced by percentage
 * @param  {number} percentage - Chance percentage of it succeeding
 */
exports.randomPercent = function(percentage) {
	var winState = Math.floor(module.exports.random(1, 100));
	
	if (winState <= percentage) {
		return true;
	} else {
		return false;
	}
}

/**
 * Async waiting timer
 * @param  {number} time - Time in ms to sleep on
 */
exports.sleep = function(time) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, time);
    });
}

/**
 * TODO: ADD MATH.SIGN CHANGING
 * @param  {string} arg
 */
exports.parsePageNumFromArgs = function(arg) {
	if (arg) {
		var num = Math.floor(parseInt(arg));       
		if (Number.isSafeInteger(num) && Math.sign(num) >= 0) {
			return num;
		}
	} else {
		return undefined;
	}
}

/**
 * Returns an embed template using its name and avatar, and its color
 * @param  {object} client - Discord client
 * @param  {object|string} bot - Discord bot ID or member
 */
exports.embedTemplate = function(client, bot) {
	let botMember = exports.getMember(client, bot);
	let embed = new Discord.RichEmbed()
		.setAuthor(botMember.displayName, botMember.user.avatarURL)
		.setColor(botMember.displayColor)
	return embed;
};
  
/**
 * Gets emote from client by name or ID
 * @param  {object} client - Discord client
 * @param  {object|string} emote - Discord emote name or ID
 */
exports.getEmote = function(client, emote) {
	if (typeof(emote) === "string") {
		emote = client.emojis.find(e => e.name === emote || e.id === emote);
		if (!emote) return undefined;
	}
	return emote;
}

/**
 * Gets member from Sanctum guild by ID (or returns member object if is one)
 * @param  {object} client - Discord client
 * @param  {object|string} member - Discord member name or ID
 */
exports.getMember = function(client, member) {
	if (typeof(member) === "string") { 
		let user = client.users.find(user => user.id === member);
		let guild = client.guilds.get(process.env.SANCTUM_ID);
		if (!guild) return undefined;
		return guild.members.get(user.id);
	}
	return member;
}

/**
 * Gets user from client by ID (or returns user object if is one)
 * @param  {object} client - Discord client
 * @param  {object|string} user - Discord user ID
 */
exports.getUser = function(client, user) {
	if (typeof(user) === "string") {
		user = client.users.find(u => u.id === user);
		if (!user) return undefined;
	}
	return user;
}

/**
 * Gets channel from client by name or ID (or returns channel object if is one)
 * @param  {object} client - Discord client
 * @param  {object|string} channel - Discord channel name or ID
 */
exports.getChannel = function(client, channel) {
	if (typeof(channel) === "string") {
		channel = client.channels.find(item => item.name === channel || item.id === channel);
		if (!channel) return undefined;
	}
	return channel;
}

/**
 * Gets the command string, args array, and guild objects
 * @param  {object} client
 * @param  {object} message
 */
exports.getCommandArgsGuild = function(client, message) {
	// "This is the best way to define args. Trust me."
	// - Some tutorial dude on the internet
	const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
	const guild = client.guilds.get(process.env.SANCTUM_ID);
	const command = args.shift().toLowerCase();

	return [command, args, guild];
}