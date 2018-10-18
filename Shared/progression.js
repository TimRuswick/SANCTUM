exports = module.exports = {};

/*
function addXP(userID, amount) {
	var response = String(dataRequest.sendServerData("addXP", amount, userID));
}

function getLevelUp(userID) {
	const server = client.guilds.get(process.env.SANCTUM_ID);
	const member = server.members.get(userID);
	if (client.user.username == "Kamala, Obsidian Vice President"   && !member.roles.has(process.env.GROUP_A_ROLE)) return;
	if (client.user.username == "Captain Montgomery"				 && !member.roles.has(process.env.GROUP_B_ROLE)) return;
	if (client.user.username == "Dairo, High Prophet of The Hand"   && !member.roles.has(process.env.GROUP_C_ROLE)) return;

	//const user = server.members.get(userID);
	var response = String(dataRequest.sendServerData("getLevelUp", 0, userID));
	var responseMessage = String(response.split(",")[0]);
	var lvl = Math.floor(parseFloat(response.split(",")[1]));
	var statPoints = parseFloat(response.split(",")[2]);

	var attacker = String(dataRequest.loadServerData("userStats", userID));
	var chests = parseFloat(attacker.split(",")[11]);

	console.log(response.split(","));
	
	majorLevelUp(lvl, server, userID);

	if (responseMessage == "levelup") {
	//if (true) {
		console.log("Chests: " + chests)
		checkinLevelUp(userID, lvl, statPoints, chests);
	}
}

async function majorLevelUp(level, server, userID) {
	const user = server.members.get(userID);

	var newChannel = "";

	var levels = [
		// Role, Level
		[server.roles.find(role => role.name === "LVL 1+"), 1, process.env.CRYSTAL_SHORES_CHANNEL_ID],
		[server.roles.find(role => role.name === "LVL 15+"), 15, process.env.SEA_OF_FOG_CHANNEL_ID],
		[server.roles.find(role => role.name === "LVL 30+"), 30, process.env.DEADLANDS_CHANNEL_ID]
	]

	// Shrinking level
	if (level < 30) {
		level = 15;
	} else if (level < 15) {
		level = 1;
	}

	// Rank Level Up
	var levelRole = server.roles.find(role => role.name === `LVL ${level}+`);
	if (levelRole) {
		var memberRole = user.roles.has(levelRole.id);
		if (!memberRole) {
			user.addRole(levelRole).catch(console.error);
			for (let i = 0; i < levels.length; i++) {
				const element = levels[i];
				if (element[1] !== level) {
					await user.removeRole(element[0]);
				}
			}
			if (user !== undefined) {// && newChannel !== undefined) {
				var levelMarks = [1, 15, 30];

				for (let i = 0; i < levelMarks.length; i++) {
					const element = levelMarks[i];
					// Gets channel of array
					newChannel = client.channels.get(levels[levels.findIndex(level => level[1] === element)][2]);
					if (level === element) 
						newChannel.send(dialog.getDialog("level" + level, user, newChannel));
				}
			}
		}
	}
}

function checkinLevelUp(userID, lvl, statPoints, chests) {
	const guild = client.guilds.get(process.env.SANCTUM_ID);
	if (lvl === 30) {
		//Post level cap level up!
		sendMessage(userID, getFactionChannel(guild.members.get(userID)), dialog.getDialog("levelUpLevelCap", userID, lvl, chests));
	} else {
		//regular level up
		sendMessage(userID, getFactionChannel(guild.members.get(userID)), dialog.getDialog("levelUp", userID, lvl, statPoints));
	}
	//sendMessage(testChannelID, dialog.getDialog("levelUp", userID, lvl, statPoints));
}
*/