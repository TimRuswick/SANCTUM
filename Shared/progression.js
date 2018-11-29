// Initialize exports
exports = module.exports = {};

const shared = require('./shared');

/**
 * Adds XP to user
 * @param  {string} userID - Discord user ID
 * @param  {string|number} amount - Amount of XP to add
 */
exports.addXP = function(userID, amount) {
	return shared.dataRequest.sendServerData("addXP", amount, userID);
}
/**
 * Checks the level of someone
 * @param  {object} client - Discord client
 * @param  {object|string} member - Discord member object or ID
 */
exports.checkLevel = function(client, member) {
	// Makes sure member is an object
	member = shared.utility.getMember(client, member);

	let response = String(shared.dataRequest.sendServerData("getLevelUp", null, member.id));
	let responseArray = response.split(",");

	let responseMessage = responseArray[0];
	let level = Math.floor(parseFloat(responseArray[1]));
	let statPoints = parseFloat(responseArray[2]);
	let chests = parseFloat(responseArray[3]);
	let addedChest = responseArray[4];
	let rankUp = exports.rankUp(client, member, level);

	if (rankUp == "rankUp") {
		return [rankUp, level, statPoints, chests, addedChest];
	} else if (responseMessage === "levelup") {
		return ["levelUp", level, statPoints, chests, addedChest];
	} else {
		return ["", level, statPoints, chests, addedChest];
	}
}

/**
 * @param  {object} client - Discord client
 * @param  {object|string} member - Discord member or user ID
 * @param  {number} level - Level of member
 */
exports.rankUp = async function(client, member, level) {
	// Get the guild
	let guild = client.guilds.get(process.env.SANCTUM_ID);

	// Handle member strings
	member = shared.utility.getMember(client, member);

	// Snapping the level variable
	if (level < process.env.RANK_2_THRESHOLD) {
		level = process.env.RANK_1_THRESHOLD;
	} else
	if (level < process.env.RANK_3_THRESHOLD) {
		level = process.env.RANK_2_THRESHOLD;
	} else {
		level = process.env.RANK_3_THRESHOLD;
	}

	// Get the new rank
	let levelRole = guild.roles.find(role => role.name === `LVL ${level}+`); //I don't like constant strings

	// Set the new level
	if (!levelRole) {
		throw "levelRole not found";
	}

	// Return if member has this role already
	if (member.roles.has(levelRole.id)) { 
		return "";
	}

	// The ranks as roles
	let ranks = [
		guild.roles.find(role => role.name === process.env.RANK_1),
		guild.roles.find(role => role.name === process.env.RANK_2),
		guild.roles.find(role => role.name === process.env.RANK_3)
	]

	// Remove all existing roles
	// TODO: INEFFICIENT, NEEDED TO FIGURE OUT MASS REMOVING ROLE FOR DISCORD.JS SOMETIME
	for (let i = 0; i < ranks.length; i++) {
		member.removeRole(ranks[i].id);
	}

	// This will enable the new rooms
	member.addRole(levelRole);

	// Returns the result
	return "rankUp";
}
