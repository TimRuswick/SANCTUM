exports = module.exports = {};

let dataRequest = require("../Shared/data_request");
let discord = require('discord.js');
let shared = require("../Shared/shared");
let calcRandom = require('../Shared/calc_random');

//ProcessGameplayCommands
//client - discord.js client
//message - discord.js message
//dialog - the dialog function
exports.ProcessGameplayCommands = function(client, message, dialog) {
	// "This is the best way to define args. Trust me."
	// - Some tutorial dude on the internet
	let args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
	let command = args.shift().toLowerCase();

	switch (command) {
		case "checkin":
			let checkinAmount = calcRandom.Random(4, 9);
			let checkInResponse = String(dataRequest.SendServerData("checkin", message.author.id, checkinAmount));
			if (checkInResponse === "available") {
				shared.SendPublicMessage(client, message.author, message.channel, dialog("checkin", checkinAmount));
				shared.AddXP(client, message.author, 1); //1XP
				exports.HandleLevelUp(client, message.member, message.channel, dialog);
			} else {
				shared.SendPublicMessage(client, message.channel, dialog("checkinLocked", message.author.id, checkInResponse));
			}
			return true;

		case "give": //TODO: fold this code into a function
			let amount = Math.floor(args[0]);

			//not enough
			if (amount <= 0) {
				shared.SendPublicMessage(client, message.channel, dialog("giveNotAboveZero", message.author.id));
				return true;
			}

			//didn't mention anyone
			if (message.mentions.members.size == 0) {
				shared.SendPublicMessage(client, message.channel, dialog("giveInvalidUser", message.author.id));
				return true;
			}

			let targetMember = message.mentions.members.first();

			//can't give to yourself
			if (targetMember.id === message.author.id) {
				shared.SendPublicMessage(client, message.channel, dialog("giveInvalidUserSelf", message.author.id));
				return true;
			}

			let accountBalance = dataRequest.LoadServerData("account", message.author.id);

			//not enough money in account
			if (accountBalance < amount) {
				shared.SendPublicMessage(client, message.channel, dialog("giveNotEnoughInAccount", message.author.id));
				return true;
			}

			//try to send the money
			if (dataRequest.SendServerData("transfer", message.author.id, targetMember.id, amount) != "success") {
				shared.SendPublicMessage(client, message.channel, dialog("giveFailed", message.author.id));
				return true;
			}

			//print the success message
			shared.SendPublicMessage(client, message.author, message.channel, dialog("giveSuccessful", targetMember.id, amount));
			return true;

		case "stats":
			exports.ProcessStatsCommand(client, message.member, message.channel, dialog);

			return true;
	}

	//didn't process it
	return false;
}

//ProcessFactionChangeAttempt
//client - discord.js client
//message - discord.js message
//factionRole - the new faction's role
//dialog - the dialog function
//factionShorthand - the shorthand name of the new faction (TEMPORARY)
exports.ProcessFactionChangeAttempt = function(client, message, factionRole, dialog, factionShorthand) {
	//tailor this for each faction leader?
	shared.ChangeFaction(client, factionRole, message.channel, message.member)
		.then(result => {
			switch (result) {
				case "alreadyJoined":
					shared.SendPublicMessage(client, message.channel, dialog("alreadyJoined" + factionShorthand, message.author.id));
					break;
				case "hasConvertedToday":
					shared.SendPublicMessage(client, message.channel, dialog("conversionLocked", message.author.id));
					break;
				case "createdUser":
					shared.SendPublicMessage(client, message.author, shared.GetFactionChannel(factionRole), dialog("newUserPublicMessage", shared.GetFactionName(factionRole), shared.GetFactionChannel(factionRole)));
					shared.SendPrivateMessage(client, message.author, dialog("newUserPrivateMessage", dialog("newUserPrivateMessageRemark" + factionShorthand)));
					break;
				case "joined":
					shared.SendPublicMessage(client, message.author, message.channel, dialog("join" + factionShorthand));
					break;
				default:
					//DEBUGGING
					console.log("processFactionChangeAttempt failed:" + result);
			}
		})
		.catch(console.error);
	return true;
}

//ProcessStatsCommand
//client - discord.js client
//member - discord.js member
//channel - discord.js channel
//dialog - dialog function
exports.ProcessStatsCommand = function(client, member, channel, dialog) {
	exports.HandleLevelUp(client, member, channel, dialog);
	let stats = exports.GetStats(member.user);
	exports.PrintStats(client, member, channel, stats);
}

//GetStats
//user - discord.js user OR username
exports.GetStats = function(user) { //Grabs all parameters from server
	//handle user strings
	if (typeof(user) === "string") {
		user = client.users.find(item => item.username === user || item.id === user);
	}

	let userStatsResponse = String(dataRequest.LoadServerData("userStats", user.id)).split(",");

	if (userStatsResponse[0] == "failure") {
		throw "server returned an error to userStats request";
	}

	let strength   = parseFloat(userStatsResponse[1]); //TODO: constants representing the player structure instead of [0]
	let speed      = parseFloat(userStatsResponse[2]);
	let stamina    = parseFloat(userStatsResponse[3]);
	let health     = parseFloat(userStatsResponse[4]);
	let maxStamina = parseFloat(userStatsResponse[5]);
	let maxHealth  = parseFloat(userStatsResponse[6]);
	let wallet     = parseFloat(userStatsResponse[7]);
	let experience = parseFloat(userStatsResponse[8]);
	let level      = Math.floor(parseFloat(userStatsResponse[9]));
	let levelPercent = parseFloat(userStatsResponse[10]);
	let statPoints = parseFloat(userStatsResponse[11]);

	return {
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
		statPoints: statPoints
	};
}

//PrintStats
//client - discord.js client
//member - discord.js member OR username OR id
//channel - discord.js channel OR channel name OR id
//stats - stats generated by GetStats
exports.PrintStats = function(client, member, channel, stats) {
	//handle member strings
	if (typeof(member) === "string") { //TODO: fold these into their own functions EVERYWHERE.
		//get the member
		let user = client.users.find(item => item.username === member || item.id === member);
		member = guild.members.get(user.id);
	}

	//handle channel strings
	if (typeof(channel) === "string") {
		channel = client.channels.find(item => item.name === channel || item.id === channel);
	}

	// Forms stats into a string
	let levelText = `:level: **${stats.level}**`; //NOTE: I don't like backticks
	let levelProgress = `(${stats.levelPercent}%)`;
	let crystalText = `:crystals: **${stats.wallet}**`;
	let cannisterText = `:cannister: **${stats.statPoints}**`;
	let userStats = "```" + `STR: ${stats.strength} | SPD: ${stats.speed} | STAM: ${stats.stamina}/${stats.maxStamina} | HP: ${stats.health}/${stats.maxHealth}` + "```";

	// Says level is maxed out if it is LVL 30+
	if (stats.level >= process.env.RANK_3_THRESHOLD) {
		levelProgress = "(MAX)";
	}

	// Creates embed & sends it
	const embed = new discord.RichEmbed()
		.setAuthor(`${member.user.username}`, member.user.avatarURL)
		.setColor(member.displayColor)
		.setDescription(`${levelText} ${levelProgress} | ${crystalText} | ${cannisterText}`)
		.addField("Stats", userStats)
		.setFooter("Commands: !help | !lore | !checkin | !give");

	channel.send(embed);
}

//HandleLevelUp
//client - discord.js client
//member - discord.js member
//channel - discord.js channel
//dialog - dialog function
exports.HandleLevelUp = function(client, member, channel, dialog) {
	// Sees if the user is supposed to level up
	let [levelUpResponse, level, statPoints] = shared.LevelUp(client, member);

	//handle channel strings
	if (typeof(channel) === "string") {
		channel = client.channels.find(item => item.name === channel || item.id === channel);
	}

	//handle levelling up
	if (levelUpResponse === "levelUp" || levelUpResponse === "RankUp") {
		if (level >= process.env.RANK_3_THRESHOLD) {
			shared.SendPublicMessage(client, member.user, channel, dialog("levelUpCap", dialog("levelUpCapRemark"), level));
		} else {
			shared.SendPublicMessage(client, member.user, channel, dialog("LevelUp", dialog("levelUpRemark"), level, statPoints));
		}
	}
}