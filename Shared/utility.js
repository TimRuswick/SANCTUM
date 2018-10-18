//initialize the exports
exports = module.exports = {};

//GetFooterCommands - Gets footer commands for botspam channel commands
//commandArray - the array of possible commands to use
//excludeCommand (optional) - the command to filter out
exports.GetFooterCommands = function(commandArray, excludeCommand = null) {
	let filteredCommandList = commandArray.filter(command => command !== excludeCommand);

	let returnText = "";
	filteredCommandList.forEach(command => {
		if (returnText.length !== 0) { //if this isn't the first command, prepend the separator to this command
			returnText += " | ";
		}
		returnText += command;
	});

	return returnText;
}

//IsAdmin
//client - discord.js client
//user - discord.js user OR username
exports.IsAdmin = function(client, user) {
	//handle user strings
	if (typeof(user) === "string") {
		user = client.users.find(item => item.username === user);
	}

	let guild = client.guilds.get(process.env.SANCTUM_ID);

	return guild.members.get(user.id).roles.find(role => role.name === process.env.ADMIN_ROLE) != null;
}

//SplitArray
//arr - 1 dimensional array to split into chunks
//chunkSize - the size of the chunks in the resulting array
exports.SplitArray = function(arr, chunkSize) {
	// http://www.frontcoded.com/splitting-javascript-array-into-chunks.html
	let groups = [];
	for (let i = 0; i < arr.length; i += chunkSize) {
		groups.push(arr.slice(i, i + chunkSize));
	}
	return groups;
}

/*
// See if the bot should display its message
function checkValidDisplay(member, channelID, checkRole) {
	if (client.user.username == "Kamala, Obsidian Vice President"	   && channelID === process.env.GROUP_A_BOT_ID) {
		if (checkRole) { if (member.roles.has(process.env.GROUP_A_ROLE)) return true; } else true;
	}
	else if (client.user.username == "Captain Montgomery"				&& channelID === process.env.GROUP_B_BOT_ID) {
		if (checkRole) { if (member.roles.has(process.env.GROUP_B_ROLE)) return true; } else true;
	}
	else if (client.user.username == "Dairo, High Prophet of The Hand"  && channelID === process.env.GROUP_C_BOT_ID) {
		if (checkRole) { if (member.roles.has(process.env.GROUP_C_ROLE)) return true; } else true;
	}
	else if (client.user.username == "Ghost 5.0.1") {		
		// JSON
		const rooms = require('../TextAdv/rooms.json');
		var roomExists = false;

		// Loops for all rooms
		rooms.rooms.forEach(element => {
			if (channelID === rooms[element].channel) roomExists = true; 
		});

		if (!roomExists) {
			if (channelID === process.env.TEST_CHANNEL_ID) return true;
		} else return true;
	
	}

	return false;
}
*/