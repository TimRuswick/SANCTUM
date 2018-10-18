//initialize the exports
exports = module.exports = {};

//GetFactionName
//factionID - the discord role ID of the faction
exports.GetFactionName = function(factionID) {
	switch(factionID) {
		case process.env.GROUP_A_ROLE:
			return process.env.GROUP_A_NAME;
		case process.env.GROUP_B_ROLE:
			return process.env.GROUP_B_NAME;
		case process.env.GROUP_C_ROLE:
			return process.env.GROUP_C_NAME;
		default:
			return "Unknown";
	}
}

//GetFactionChannel
//user - discord.js user
exports.GetFactionChannel = function(user) {
	if (user.roles.has(process.env.GROUP_A_ROLE)) {
		return process.env.GROUP_A_BOT_ID;
	}
	if (user.roles.has(process.env.GROUP_B_ROLE)) {
		return process.env.GROUP_B_BOT_ID;
	}
	if (user.roles.has(process.env.GROUP_C_ROLE)) {
		return process.env.GROUP_C_BOT_ID;
	}
	return null;
}

/*
// Change Faction
exports.ChangeFaction = async function(factionID, channelID, userID, member, botChannelID) {
	if (member.roles.has(factionID)) {
		if (factionID === process.env.GROUP_A_ROLE)
			sendMessage(channelID, dialog.getDialog("orderAlreadyJoined", userID));
		else if (factionID === process.env.GROUP_B_ROLE)
			sendMessage(channelID, dialog.getDialog("anarchyAlreadyJoined", userID));
		else if (factionID === process.env.GROUP_C_ROLE)
			sendMessage(channelID, dialog.getDialog("religionAlreadyJoined", userID));
	} else {
		if (dataRequest.loadServerData("hasConvertedToday", userID) == 1) {
			sendMessage(channelID, dialog.getDialog("alreadyConvertedToday", userID));
		} else {
			// Creates new user
			var response = String(dataRequest.sendServerData("newUser", "New user.", userID));
			
			//var response = "createdUser"
			// Obsidian Tech.
			if (factionID === process.env.GROUP_A_ROLE) {
				await member.removeRole(process.env.GROUP_B_ROLE);
				await member.removeRole(process.env.GROUP_C_ROLE);
				await member.addRole(process.env.GROUP_A_ROLE);

				dataRequest.sendServerData("conversion", "Converted to The Order.", userID);
				
				if (response == "createdUser") {
					client.users.get(userID).send(dialog.getDialog("newUserPM", userID, getFactionName(factionID)));
					sendMessage(botChannelID, dialog.getDialog("newUserWelcome", userID, `<#${getFactionName(factionID)}>`));	
				} else {
					sendMessage(channelID, dialog.getDialog("orderJoin", userID));
				}

			// Genesis Command
			} else if (factionID === process.env.GROUP_B_ROLE) {
				await member.removeRole(process.env.GROUP_C_ROLE);
				await member.removeRole(process.env.GROUP_A_ROLE);
				await member.addRole(process.env.GROUP_B_ROLE);

				dataRequest.sendServerData("conversion", "Converted to the Anarchy.", userID);
				
				if (response == "createdUser") {
					client.users.get(userID).send(dialog.getDialog("newUserPM", userID, getFactionName(factionID)));
					sendMessage(botChannelID, dialog.getDialog("newUserWelcome", userID, `<#${getFactionName(factionID)}>`));	
				} else {
					sendMessage(channelID, dialog.getDialog("anarchyJoin", userID));
				}
			
			// The Hand
			} else if (factionID === process.env.GROUP_C_ROLE) {
				await member.removeRole(process.env.GROUP_A_ROLE);
				await member.removeRole(process.env.GROUP_B_ROLE);
				await member.addRole(process.env.GROUP_C_ROLE);

				dataRequest.sendServerData("conversion", "Converted to The Religion.", userID);
	
				if (response == "createdUser") {
					client.users.get(userID).send(dialog.getDialog("newUserPM", userID, getFactionName(factionID)));
					sendMessage(botChannelID, dialog.getDialog("newUserWelcome", userID, `<#${getFactionName(factionID)}>`));	 
				} else {
					sendMessage(channelID, dialog.getDialog("religionJoin", userID));
				}
			}
		}
	}
}
*/