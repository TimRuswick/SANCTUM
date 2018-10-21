// .env Variables
require('dotenv').config({path: '../.env'});

// Node Modules
let Discord = require('discord.js');
let client = new Discord.Client();
let cron = require('node-cron');

// Bot Modules
let npcSettings = require('./npcSettings');
let shared = require("../shared/shared");
let dataRequest = require('../modules/dataRequest');
let calcRandom = require('../modules/calcRandom');

//dialog system
let dialog = shared.GenerateDialogFunction(require("./dialog.json"));

//dialog decorator
dialog = function(baseDialog) {
	return function(key, ...data) {
		if ( (key === "help" || key === "lore") && typeof(data[0]) !== "undefined") {
			//force the arg into camelCase
			arg = data[0].toLowerCase();
			arg = arg.charAt(0).toUpperCase() + arg.substr(1);
			key += arg;
		}

		let result = baseDialog(key, ...data);

		if (result === "") {
			return "No result for \"" + key + "\"";
		}
		return result;
	}
}(dialog);

//handle errors
client.on('error', console.error);

// The ready event is vital, it means that your bot will only start reacting to information from Discord _after_ ready is emitted
client.on('ready', async () => {
	// Generates invite link
	try {
		let link = await client.generateInvite(["ADMINISTRATOR"]);
		console.log("Invite Link: " + link);
	} catch(e) {
		console.log(e.stack);
	}

	// You can set status to 'online', 'invisible', 'away', or 'dnd' (do not disturb)
	client.user.setStatus('online');
	
	// Sets your "Playing"
	if (npcSettings.activity) {
		client.user.setActivity(npcSettings.activity, { type: npcSettings.type })
			//DEBUGGING
			.then(presence => console.log("Activity set to " + (presence.game ? presence.game.name : 'none')) )
			.catch(console.error);
	}

	console.log("Logged in as: " + client.user.username + " - " + client.user.id);

	//ADAM updates stamina (1) and health by 1% every 2 min.
	cron.schedule('*/2 * * * *', () => {
		console.log('Updating STAMINA every 2 min.');
		dataRequest.sendServerData("updateStamina");
	});

	//ADAM prints the intros in the gate
	shared.SendPublicMessage(client, client.channels.get(process.env.GATE_CHANNEL_ID), dialog("intro"));
	shared.SendPublicMessage(client, client.channels.get(process.env.GATE_CHANNEL_ID), dialog("introObsidian", process.env.GROUP_A_ROLE));
	shared.SendPublicMessage(client, client.channels.get(process.env.GATE_CHANNEL_ID), dialog("introGenesis", process.env.GROUP_B_ROLE));
	shared.SendPublicMessage(client, client.channels.get(process.env.GATE_CHANNEL_ID), dialog("introHand", process.env.GROUP_C_ROLE));
	shared.SendPublicMessage(client, client.channels.get(process.env.GATE_CHANNEL_ID), dialog("introEnd"));
});

// Create an event listener for messages
client.on('message', async message => {
	// Ignores ALL bot messages
	if (message.author.bot) {
		return;
	}

	//skip the statis channel
	if (message.channel.id === process.env.STASIS_CHANNEL_ID) {
		return;
	}

	//ADAM only - handle the gate
	if (processGateCommands(message)) {
		return;
	}

	// Has to be (prefix)command
	if (message.content.indexOf(process.env.PREFIX) !== 0) {
		return;
	}

	if (processBasicCommands(message)) {
		return;
	}

	//check if can continue (used primarily by the faction leaders)
	if (shared.CheckValidDisplay(client, message.member, message.channel)) {
		return;
	}

	if (processGameplayCommands(message)) {
		return;
	}
});

//Log our bot in
client.login(npcSettings.token);

function processGateCommands(message) {
	// If it's not the gate
	if (message.channel.id !== process.env.GATE_CHANNEL_ID) {
		return false; //not processed
	}

	//TODO: parse function for commands to hide these ugly lines
	let args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
	let command = args.shift().toLowerCase();

	//WARNING: string constants used here

	//if they haven't chosen a faction
	if (!(command === "obsidian" || command === "genesis" || command === "hand")) {
		message.reply("Please choose one of the factions by typing your desired faction shown above (!genesis, !obsidian, or !hand).")
			.then(msg => msg.delete(10000)) //remove the error message
			.catch(console.error);
	}

	message.delete(100); //remove the user's input to keep the gate clean
	return false; //TODO: set to true once the faction change commands have been assigned to other bots
}

function processBasicCommands(message) {
	// "This is the best way to define args. Trust me."
	// - Some tutorial dude on the internet
	let args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
	let command = args.shift().toLowerCase();

	switch (command) {
		case "ping":
			if (shared.IsAdmin(client, message.author)) {
				shared.SendPublicMessage(client, message.author, message.channel, "PONG!");
			}
			return true;

		case "obsidian": //TODO: move this to the other bots
			return processFactionChangeAttempt(client, message, process.env.GROUP_A_ROLE, "Obsidian");

		case "genesis": //TODO: move this to the other bots
			return processFactionChangeAttempt(client, message, process.env.GROUP_B_ROLE, "Genesis");

		case "hand": //TODO: move this to the other bots
			return processFactionChangeAttempt(client, message, process.env.GROUP_C_ROLE, "Hand");

		case "help":
		case "lore":
			shared.SendPublicMessage(client, message.author, message.channel, dialog(command, args[0]));
			return true;

		case "xp":
			shared.AddXP(client, message.author, args[0]);
			return true;
	}

	return false;
}

function processGameplayCommands(message) {
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
				shared.SendPublicMessage(client, message.author, message.channel, dialog("checkinLocked", checkInResponse));
			}
			return true;

		case "give": //TODO: fold this code into a function
			let amount = Math.floor(args[0]);

			//not enough
			if (amount <= 0) {
				shared.SendPublicMessage(client, message.author, message.channel, dialog("giveNotAboveZero"));
				return true;
			}

			//didn't mention anyone
			if (message.mentions.members.size == 0) {
				shared.SendPublicMessage(client, message.author, message.channel, dialog("giveInvalidUser"));
				return true;
			}

			let targetMember = message.mentions.members.first();

			//can't give to yourself
			if (targetMember.id === message.author.id) {
				shared.SendPublicMessage(client, message.author, message.channel, dialog("giveInvalidUserSelf"));
				return true;
			}

			let accountBalance = dataRequest.loadServerData("account",message.author.id);

			//not enough money in account
			if (accountBalance < amount) {
				shared.SendPublicMessage(client, message.author, message.channel, dialog("giveNotEnoughInAccount"));
				return true;
			}

			//try to send the money
			let val = dataRequest.sendServerData("transfer", targetMember.id, message.author.id, amount);
			if (val != "success") {
				shared.SendPublicMessage(client, message.author, message.channel, val);
				shared.SendPublicMessage(client, message.author, message.channel, dialog("giveFailed"));
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
				.setFooter("Commands: !help | !lore | !checkin");

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

//tailor this for each faction leader
function processFactionChangeAttempt(client, message, factionRole, factionShorthand) {
	shared.ChangeFaction(client, factionRole, message.channel, message.member)
		.then(result => {
			switch (result) {
				case "alreadyJoined":
					shared.SendPublicMessage(client, message.author, message.channel, dialog("alreadyJoined" + factionShorthand));
					break;
				case "hasConvertedToday":
					shared.SendPublicMessage(client, message.author, message.channel, dialog("conversionLocked"));
					break;
				case "createdUser":
					shared.SendPublicMessage(client, message.author, message.channel, dialog("newUserPublicMessage", shared.GetFactionName(factionRole), "TODO: factionChannel"));
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