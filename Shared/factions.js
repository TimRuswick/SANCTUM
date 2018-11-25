// Initialize the exports
exports = module.exports = {};

const shared = require("./shared");

//CheckFaction
//factionRole - the value to check
exports.checkFaction = function(factionRole) {
	switch(factionRole) {
		case process.env.GROUP_A_ROLE:
		case process.env.GROUP_B_ROLE:
		case process.env.GROUP_C_ROLE:
			return true;
	}
	return false;
}

//GetFactionName
//factionRole - the discord role ID of the faction
exports.getFactionName = function(factionRole) {
	//factionRole must be a faction role
	if (!exports.checkFaction(factionRole)) {
		throw "factionRole is not a faction!";
	}

	switch(factionRole) {
		case process.env.GROUP_A_ROLE:
			return process.env.GROUP_A_NAME;
		case process.env.GROUP_B_ROLE:
			return process.env.GROUP_B_NAME;
		case process.env.GROUP_C_ROLE:
			return process.env.GROUP_C_NAME;
	}
}

/**
 * @param  {} factionRoleID - Discord role ID of Sanctum faction
 */
exports.getFactionChannel = function(factionRoleID, isChatChannel) {
	//factionRole must be a faction role
	if (!exports.checkFaction(factionRoleID)) {
		throw "factionRole is not a faction!";
	}

	if (factionRoleID === process.env.GROUP_A_ROLE) {
		if (isChatChannel) return process.env.GROUP_A_CHAT_ID;
		return process.env.GROUP_A_CHANNEL_ID;
	}
	if (factionRoleID === process.env.GROUP_B_ROLE) {
		if (isChatChannel) return process.env.GROUP_B_CHAT_ID;
		return process.env.GROUP_B_CHANNEL_ID;
	}
	if (factionRoleID === process.env.GROUP_C_ROLE) {
		if (isChatChannel) return process.env.GROUP_C_CHAT_ID;
		return process.env.GROUP_C_CHANNEL_ID;
	}
}

//ChangeFaction
//client - discord.js client
//factionRole - a faction role
//channel - discord.js channel OR channel name
//member - discord.js member
exports.changeFaction = async function(client, factionRole, channel, member, bypassConversionLimit) {
	//factionRole must be a faction role
	if (!exports.checkFaction(factionRole)) {
		throw "factionRole is not a faction!";
	}

	// Handles channel and member strings
	channel = shared.utility.getChannel(client, channel);
	member = shared.utility.getMember(client, member);

	// Already joined this faction
	if (member.roles.has(factionRole)) {
		return "alreadyJoined";
	}
	// Can't change too fast (30 days)
	if (shared.dataRequest.loadServerData("hasConvertedToday", member.user.id) == 1) {
		if (!bypassConversionLimit) return "hasConvertedToday";
	}

	// Creates a new user (returns "userAlreadyExists" if already exists)
	var newUserResponse = String(shared.dataRequest.sendServerData("newUser", "New user.", member.user.id));

	// Joins the new faction
	await member.removeRoles([
		process.env.GROUP_A_ROLE, 
		process.env.GROUP_B_ROLE, 
		process.env.GROUP_C_ROLE
	]);
	await member.addRole(factionRole);

	//send the server the info (for logging)
	shared.dataRequest.sendServerData("conversion", "Converted to " + exports.getFactionName(factionRole), member.user.id);

	if (newUserResponse === "createdUser") {
		// Send the private welcoming message
		return newUserResponse;
	} else {
		// Send the public welcoming message
		return "joined";
	}
}
