// .env Variables
require('dotenv').config({path: '../.env'});

// Node Modules
let Discord = require('discord.js');
let client = new Discord.Client();
let cron = require('node-cron');

// Bot Modules
let npcSettings = require('./npcSettings');
let shared = require("../shared/shared");
let core = require("../shared/core/core");
let dataRequest = require('../modules/dataRequest');

//dialog system
let dialog = shared.GenerateDialogFunction(require("./dialog.json"));

//ADAM dialog decorator
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

	if (processBasicCommands(client, message)) {
		return;
	}

	//check if can continue (used primarily by the faction leaders)
	if (!shared.CheckValidDisplay(client, message.member, message.channel)) {
		return;
	}

	//TODO: remove this from ADAM
	if (core.ProcessGameplayCommands(client, message, dialog)) {
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

	//if laying out the intro
	if (command.substr(0, 5) === "intro") {
		return false;
	}

	//if they haven't chosen a faction
	if (!(command === "obsidian" || command === "genesis" || command === "hand")) {
		message.reply("Please choose one of the factions by typing your desired faction shown above (!genesis, !obsidian, or !hand).")
			.then(msg => msg.delete(10000)) //remove the error message
			.catch(console.error);
	}

	message.delete(100); //remove the user's input to keep the gate clean
	return false; //TODO: set to true once the faction change commands have been assigned to other bots
}

function processBasicCommands(client, message) {
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
			return core.ProcessFactionChangeAttempt(client, message, process.env.GROUP_A_ROLE, dialog, "Obsidian");

		case "genesis": //TODO: move this to the other bots
			return core.ProcessFactionChangeAttempt(client, message, process.env.GROUP_B_ROLE, dialog, "Genesis");

		case "hand": //TODO: move this to the other bots
			return core.ProcessFactionChangeAttempt(client, message, process.env.GROUP_C_ROLE, dialog, "Hand");

		//ADAM and the faction leaders print the intros in the gate
		//TODO: prune the unneeded intros from each bot
		case "intro":
			if (shared.IsAdmin(client, message.author)) {
				shared.SendPublicMessage(client, client.channels.get(process.env.GATE_CHANNEL_ID), dialog("intro"));
				message.delete(1000);
			}
			return true;

		case "introobsidian":
			if (shared.IsAdmin(client, message.author)) {
				shared.SendPublicMessage(client, client.channels.get(process.env.GATE_CHANNEL_ID), dialog("introObsidian", process.env.GROUP_A_ROLE));
				message.delete(1000);
			}
			return true;

		case "introgenesis":
			if (shared.IsAdmin(client, message.author)) {
				shared.SendPublicMessage(client, client.channels.get(process.env.GATE_CHANNEL_ID), dialog("introGenesis", process.env.GROUP_B_ROLE));
				message.delete(1000);
			}
			return true;

		case "introhand":
			if (shared.IsAdmin(client, message.author)) {
				shared.SendPublicMessage(client, client.channels.get(process.env.GATE_CHANNEL_ID), dialog("introHand", process.env.GROUP_C_ROLE));
				message.delete(1000);
			}
			return true;

		case "introend":
			if (shared.IsAdmin(client, message.author)) {
				shared.SendPublicMessage(client, client.channels.get(process.env.GATE_CHANNEL_ID), dialog("introEnd"));
				message.delete(1000);
			}
			return true;

		case "help":
		case "lore":
			shared.SendPublicMessage(client, message.author, message.channel, dialog(command, args[0]));
			return true;

		//DEBUGGING
		case "debugxp":
			shared.AddXP(client, message.author, args[0]);
			return true;
	}

	return false;
}

