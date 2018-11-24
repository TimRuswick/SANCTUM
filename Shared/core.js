// Initialize the exports
exports = module.exports = {};

const dataRequest = require("./dataRequest");
const Discord = require("discord.js");
const shared = require("./shared");
const commandArray = ['!checkin', '!stats', '!give', '!upgrade', '!heal'];

/**
 * Processes the main gameplay commands
 * @param  {object} client - Discord client
 * @param  {object} message - Discord message object
 * @param  {any} dialog - Dialog function
 */
exports.processGameplayCommands = function(client, message, dialog) {
	let [command, args, guild] = shared.utility.getCommandArgsGuild(client, message);

	switch (command) {
		case "checkin":
			let checkinAmount = shared.utility.random(4, 9);
			let checkInResponse = String(dataRequest.sendServerData("checkin", checkinAmount, message.author.id));
			if (checkInResponse === "1") {
				message.channel.send(message.author + " " + dialog("checkin", checkinAmount));
				shared.progression.addXP(message.author, 1); //1XP
				exports.handleLevelUp(client, message.member, message.channel, dialog);
			} else {
				message.channel.send(dialog("checkinLocked", message.author.id, checkInResponse));
			}
			return true;

		case "give": //TODO: fold this code into a function
			let amount = Math.floor(parseFloat(args[0]));

			if (isNaN(amount)) {
				message.channel.send(dialog("giveFailed", message.author.id));
				return true;
			}

			// If not enough
			if (amount <= 0) {
				message.channel.send(dialog("giveNotAboveZero", message.author.id));
				return true;
			}

			// If in DMs
			if (message.channel.type == 'dm') {
				message.channel.send(dialog("giveFailed", message.author.id));
				return true;
			}

			// If didn't mention anyone
			if (message.mentions.members.size == 0) {
				message.channel.send(dialog("giveInvalidUser", message.author.id));
				return true;
			}

			let targetMember = message.mentions.members.first();

			// Stops giving to yourself
			if (targetMember.id === message.author.id) {
				message.channel.send(dialog("giveInvalidUserSelf", message.author.id));
				return true;
			}

			let accountBalance = dataRequest.loadServerData("account", message.author.id);

			// Checks if not enough crystals in account
			if (accountBalance < amount) {
				message.channel.send(dialog("giveNotEnoughInAccount", message.author.id));
				return true;
			}

			// Attempts to send crystals
			if (String(dataRequest.sendServerData("transfer", targetMember.id, message.author.id, amount)) !== "1") {
				message.channel.send(dialog("giveFailed", message.author.id));
				return true;
			}

			// Shows success message
			message.channel.send(message.author + " " + dialog("giveSuccessful", targetMember.id, amount));
			return true;

		case "stats":
			exports.processStatsCommand(client, shared.utility.getMember(client, message.author.id), message.channel, dialog);
			return true;
	}

	// Didn't process it
	return false;
}

/**
 * Tries to change the faction of a user
 * @param  {object} client - Discord client
 * @param  {object} message - Discord message object
 * @param  {object} factionRole - New Faction's Discord role
 * @param  {object} dialog - Dialog function
 * @param  {string} factionShorthand - The shorthand name of the new faction (TEMPORARY)
 */
exports.processFactionChangeAttempt = function(client, message, factionRole, dialog, factionShorthand, bypassConversionLimit) {
	//tailor this for each faction leader?
	shared.factions.changeFaction(client, factionRole, message.channel, shared.utility.getMember(client, message.author.id), bypassConversionLimit)
		.then(result => {
			switch (result) {
				case "alreadyJoined":
					message.channel.send(dialog("alreadyJoined" + factionShorthand, message.author.id));
					break;
				case "hasConvertedToday":
					message.channel.send(dialog("conversionLocked", message.author.id));
					break;
				case "createdUser":
					let channel = shared.utility.getChannel(client, shared.factions.getFactionChannel(factionRole));
					channel.send(message.author + " " + dialog("newUserPublicMessage", shared.factions.getFactionName(factionRole), shared.factions.getFactionChannel(factionRole)));
					shared.messaging.sendDM(client, message.author, dialog("newUserPrivateMessage", dialog("newUserPrivateMessageRemark" + factionShorthand)));
					break;
				case "joined":
					message.channel.send(message.author + " " + dialog("join" + factionShorthand))
					.then(msg => {
						if (message.channel.id === process.env.GATE_CHANNEL_ID)
							msg.delete(10000)
					});
					break;
				default:
					//DEBUGGING
					console.log("processFactionChangeAttempt failed:" + result);
			}
		})
		.catch(console.error);
	return true;
}

/**
 * Processes !stats command
 * @param  {object} client
 * @param  {object|string} member
 * @param  {object|string} channel
 * @param  {any} dialog - Dialog function
 */
exports.processStatsCommand = function(client, member, channel, dialog) {
	exports.handleLevelUp(client, member, channel, dialog);
	exports.printStats(client, member, channel);
}

/**
 * Gets stats from the user
 * @param  {string} userID - Discord user ID
 */
exports.getStats = function(userID) { 
	// Grabs all parameters from server
	let userStatsResponse = String(dataRequest.loadServerData("userStats", userID)).split(",");
	
	if (userStatsResponse[0] == "failure") {
		throw "Server returned an error to userStats request! (returned 'failure' for userStatsResponse[0])";
	}

	let response	 = userStatsResponse[0];
	let strength     = parseFloat(userStatsResponse[1]);
	let speed        = parseFloat(userStatsResponse[2]);
	let stamina      = parseFloat(userStatsResponse[3]);
	let health       = parseFloat(userStatsResponse[4]);
	let maxStamina   = parseFloat(userStatsResponse[5]);
	let maxHealth    = parseFloat(userStatsResponse[6]);
	let wallet       = parseFloat(userStatsResponse[7]);
	let experience   = parseFloat(userStatsResponse[8]);
	let level        = Math.floor(parseFloat(userStatsResponse[9]));
	let levelPercent = parseFloat(userStatsResponse[10]);
	let statPoints   = parseFloat(userStatsResponse[11]);
	let chests 		 = parseFloat(userStatsResponse[12]);
	
	return {
		response: response,
		strength: strength,
		speed: speed,
		stamina: stamina,
		health: health,
		maxStamina: maxStamina,
		maxHealth: maxHealth,
		wallet: wallet,
		experience: experience,
		level: level,
		levelPercent: levelPercent,
		statPoints: statPoints,
		chests: chests,
	};
}

/**
 * Gets materials from the user
 * @param  {string} userID - Discord user ID
 */
exports.getMaterials = function(userID) {
	let scavengeResponse  = String(dataRequest.loadServerData("artifactsGet", userID));
	
	let items 		 = scavengeResponse.split(",");
	let response 	 = items[0];
	let ultrarare 	 = parseFloat(items[1]);
	let rare 		 = parseFloat(items[2]);
	let uncommon 	 = parseFloat(items[3]);
	let common 		 = parseFloat(items[4]);
	let scrap		 = parseFloat(items[5]);
	let totalQuantity = ultrarare + rare + uncommon + common + scrap;

	return {
		response: response,
		ultrarare: ultrarare,
		rare: rare,
		uncommon: uncommon,
		common: common,
		scrap: scrap,
		totalQuantity: totalQuantity
	}
}

exports.getMaterialsText = function(client, materials) {
	let materialsText = "";

	// Materials
	if (materials.response == "success") {
		if (materials.totalQuantity > 0) {
			if (materials.scrap > 0) {        materialsText += `${shared.utility.getEmote(client, "mscrap")} **${materials.scrap}**`; }
			if (materials.common > 0) {       materialsText += ` | ${shared.utility.getEmote(client, "mcloth")} **${materials.common}**`; }
			if (materials.uncommon > 0) {     materialsText += ` | ${shared.utility.getEmote(client, "mmetal")} **${materials.uncommon}**`; }
			if (materials.rare > 0) {         materialsText += ` | ${shared.utility.getEmote(client, "melectronics")} **${materials.rare}**`; }
			if (materials.ultrarare > 0) {    materialsText += ` | ${shared.utility.getEmote(client, "mgem")} **${materials.ultrarare}**`; }
		} else {console.log("failure2");}
	} else {console.log("failure");}

	return materialsText;
}

/**
 * Displays the stats, including materials
 * @param  {object} client - Discord client
 * @param  {object|string} member - Discord member or user ID
 * @param  {object|string} channel - Discord channel or channel ID
 */
exports.printStats = function(client, member, channel) {
	// Handles member and channel strings
	channel = shared.utility.getChannel(client, channel);
	member = shared.utility.getMember(client, member);
	let stats = exports.getStats(member.id);
	let materials = exports.getMaterials(member.id);

	// Forms stats into a string
	let levelText = `${shared.utility.getEmote(client, "level")} **${stats.level}**`;
	let levelProgress = `(${stats.levelPercent}%)`;
	let crystalText = `${shared.utility.getEmote(client, "crystals")} **${stats.wallet}**`;
	let cannisterText = `${shared.utility.getEmote(client, "cannister")} **${stats.statPoints}**`;
	let cypherCrateText = `${shared.utility.getEmote(client, "cyphercrate")} **${stats.chests}**`;
	let userStats = "```" + `STR: ${stats.strength} | SPD: ${stats.speed} | STAM: ${stats.stamina}/${stats.maxStamina} | HP: ${stats.health}/${stats.maxHealth}` + "```";
	let materialsText = exports.getMaterialsText(client, materials);

	// Says level is maxed out if it is LVL 30+
	if (stats.level >= process.env.RANK_3_THRESHOLD) {
		levelProgress = "(MAX)";
		cypherCrateText += ` (${stats.levelPercent}%)`;
	}

	// Creates embed & sends it
	const embed = new Discord.RichEmbed()
		.setAuthor(member.displayName, member.user.avatarURL)
		.setColor(member.displayColor)
		.setDescription(`${levelText} ${levelProgress} | ${crystalText} | ${cannisterText} | ${cypherCrateText}`)
		.addField("Stats", userStats)
		.addField("Materials", materialsText)
		.setFooter(`Commands: ${shared.utility.getFooterCommands(commandArray, '!stats')}`);

	channel.send({ embed });
}

/**
 * Handles levelling up if it happens
 * @param  {object} client
 * @param  {object|string} member
 * @param  {object|string} channel
 * @param  {any} dialog - Dialog function
 */
exports.handleLevelUp = function(client, member, channel, dialog) {
	// Handle member and channel strings
	member = shared.utility.getMember(client, member);
	channel = shared.utility.getChannel(client, channel);

	// Sees if the user is supposed to level up
	let [levelUpResponse, level, statPoints, chests] = shared.progression.checkLevel(client, member);
	
	// Handle levelling up
	if (levelUpResponse === "levelUp" || levelUpResponse === "RankUp") {
		if (level >= process.env.RANK_3_THRESHOLD) {
			shared.messaging.sendMessage(client, member.user, channel, 
				dialog("levelUpCap", 
					shared.utility.getEmote(client, "level"), level, 
					dialog("levelUpCapRemark"), shared.utility.getEmote(client, "cyphercrate"), chests
				)
			);
		} else {
			shared.messaging.sendMessage(client, member.user, channel, 
				dialog("levelUp", 
					level, dialog("levelUpRemark"),
					shared.utility.getEmote(client, "cannister"), statPoints
				)
			);
		}
	}
}

exports.userExisted = function(client, member) {
	member = shared.utility.getMember(client, member);
	response = exports.getStats(member.id).response;
	console.log(response);
	if (response !== "failure") return true;
	else return false;
}