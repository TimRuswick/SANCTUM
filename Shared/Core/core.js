exports = module.exports = {};

let shared = require("../shared");
let calcRandom = require('../../modules/calcRandom');

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
			let checkinAmount = calcRandom.random(4, 9);
			let checkInResponse = String(dataRequest.sendServerData("checkin", checkinAmount, message.author.id));
			if (checkInResponse === "available") {
				shared.SendPublicMessage(client, message.author, message.channel, dialog("checkin", checkinAmount));
				shared.AddXP(client, message.author, 1); //1XP
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

			let accountBalance = dataRequest.loadServerData("account",message.author.id);

			//not enough money in account
			if (accountBalance < amount) {
				shared.SendPublicMessage(client, message.channel, dialog("giveNotEnoughInAccount", message.author.id));
				return true;
			}

			//try to send the money
			if (dataRequest.sendServerData("transfer", targetMember.id, message.author.id, amount) != "success") {
				shared.SendPublicMessage(client, message.channel, dialog("giveFailed", message.author.id));
				return true;
			}

			//print the success message
			shared.SendPublicMessage(client, message.author, message.channel, dialog("giveSuccessful", targetMember.id, amount));
			return true;

		case "stats": //TODO: fold this code into a function
			// Sees if the user is supposed to level up
			let levelUp = shared.LevelUp(client, message.member); //TODO: process automatically

			// Grabs all parameters from server
			//TODO: improve this once the server-side has been updated
			let attacker = String(dataRequest.loadServerData("userStats",message.author.id)).split(",");

			if (attacker[0] == "failure") {
				shared.SendPublicMessage(client, message.author, message.channel, "The server returned an error.");
				return true;
			}

			let attackerStrength   = parseFloat(attacker[1]); //TODO: constants representing the player structure instead of [0]
			let attackerSpeed      = parseFloat(attacker[2]);
			let attackerStamina    = parseFloat(attacker[3]);
			let attackerHealth     = parseFloat(attacker[4]);
			let attackerMaxStamina = parseFloat(attacker[5]);
			let attackerMaxHealth  = parseFloat(attacker[6]);
			let attackerWallet     = parseFloat(attacker[7]);
			let attackerXP         = parseFloat(attacker[8]);
			let attackerLVL        = Math.floor(parseFloat(attacker[9]));
			let attackerLvlPercent = parseFloat(attacker[10]);
			let attackerStatPoints = parseFloat(attacker[11]);

			// Forms stats into a string
			var levelText = `:level: **${attackerLVL}**`; //NOTE: I don't like backticks
			var levelProgress = `(${attackerLvlPercent}%)`;
			var crystalText = `:crystals: **${attackerWallet}**`;
			var cannisterText = `:cannister: **${attackerStatPoints}**`;
			var userStats = "```" + `STR: ${attackerStrength} | SPD: ${attackerSpeed} | STAM: ${attackerStamina}/${attackerMaxStamina} | HP: ${attackerHealth}/${attackerMaxHealth}` + "```";

			// Says level is maxed out if it is LVL 30+
			if (attackerLVL >= process.env.RANK_3_THRESHOLD) {
				levelProgress = "(MAX)";
			}

			// Creates embed & sends it
			const embed = new Discord.RichEmbed()
				.setAuthor(`${message.member.displayName}`, message.author.avatarURL)
				.setColor(message.member.displayColor)
				.setDescription(`${levelText} ${levelProgress} | ${crystalText} | ${cannisterText}`)
				.addField("Stats", userStats)
				.setFooter("Commands: !help | !lore | !checkin | !give");

			message.channel.send(embed);

			//handle levelling up
			if (levelUp === "levelUp" || levelUp === "RankUp") {
				if (attackerLVL >= process.env.RANK_3_THRESHOLD) {
					shared.SendPublicMessage(client, message.author, message.channel, dialog("levelUpCap", dialog("levelUpCapRemark"), attackerLVL));
				} else {
					shared.SendPublicMessage(client, message.author, message.channel, dialog("LevelUp", dialog("levelUpRemark"), attackerLVL, attackerStatPoints));
				}
			}

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