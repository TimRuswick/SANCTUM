// .env Variables
const path = require('path');
require('dotenv').config({path: path.join(__dirname, "../.env")});

// Node Modules
const Discord = require('discord.js');
const client = new Discord.Client();

// Bot Modules
let npcSettings = require('./npcSettings');
let shared = require("../Shared/shared");

// Dialog system
let dialog = shared.utility.generateDialogFunction(require("./dialog.json"));

// Dialog decorator
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
			return; //dialog("noResult", key);
		}
		return result;
	}
}(dialog);

// The ready event is vital, it means that your bot will only start reacting to information from discord _after_ ready is emitted
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
});

// Create an event listener for messages
client.on('message', async message => {
	// Ignores ALL bot messages
	if (message.author.bot) return;

	// Skips the stasis channel
	if (message.channel.id === process.env.STASIS_CHANNEL_ID) return;

	// Has to be (prefix)command
	if (message.content.indexOf(process.env.PREFIX) !== 0) return;
	
	if (processBasicCommands(client, message)) return;

	// Check if can continue (used primarily by the faction leaders)
	if (!shared.utility.checkValidDisplay(client, shared.utility.getMember(client, message.author.id), message.channel, false, npcSettings)) return;

	if (processBotChannelCommands(client, message)) return;

	// Handles gameplay commands (!stats, !checkin, etc.)
	if (shared.core.processGameplayCommands(client, message, dialog)) return;
});

// Handles errors
client.on('error', console.error);

// Testing a bug-fix for when Discord doesn't recover Playing status
client.on('resume', () => {
    console.log("RESUME: setting playing activity to...");
    if (npcSettings.activity) {
		client.user.setActivity(npcSettings.activity, { type: npcSettings.type })
			//DEBUGGING
			.then(presence => console.log("Activity set to " + (presence.game ? presence.game.name : 'none')) )
			.catch(console.error);
	}
});

// Log our bot in (change the token by looking into the .env file)
client.login(npcSettings.token);

function processBasicCommands(client, message) {
	let [command, args, guild] = shared.utility.getCommandArgsGuild(client, message);

	switch (command) {
		case "ping":
			if (shared.utility.isAdmin(message.author.id, guild)) {
				message.reply("Pong!");
			}
			return true;
		case npcSettings.factionShorthand.toLowerCase():
			// Failsafe in case the user leaves the server and joins again
			// This will bypass the faction join cooldown, so they can join a faction again once they leave
			// TODO: Read faction alliances and re-join them back in there possibly
			var bypassConversionLimit = false;
			if (message.channel.id === process.env.GATE_CHANNEL_ID || message.channel.id === process.env.TEST_CHANNEL_ID) {
				bypassConversionLimit = true;
			}
			if (message.channel.id === process.env.STASIS_CHANNEL_ID) return;
			return shared.core.processFactionChangeAttempt(client, message, npcSettings.role, dialog, npcSettings.factionShorthand, bypassConversionLimit);
		
		// ADAM and the faction leaders print the intros in the gate
		case `intro${npcSettings.factionShorthand.toLowerCase()}`:
			if (shared.utility.isAdmin(message.author.id, guild) && message.channel.id == process.env.GATE_CHANNEL_ID) {
				client.channels.get(process.env.GATE_CHANNEL_ID).send(dialog(`intro${npcSettings.factionShorthand}`, npcSettings.role));
				message.delete(1000);
			}
			return true;
	}

	return false;
}

function processBotChannelCommands(client, message) {
	let [command, args, guild] = shared.utility.getCommandArgsGuild(client, message);
	switch (command) {
		case "help":
		case "lore":
			// Skip the gate channel
			if (message.channel.id === process.env.GATE_CHANNEL_ID) {
				return true;
			}

			let moddedArgs = args[0];
			let userMentions = message.mentions.users;
			if (userMentions.size > 0) moddedArgs = shared.utility.getMember(client, userMentions.first().id).displayName;
			let newDialog = dialog(command, moddedArgs);
			if (newDialog) message.channel.send(message.author + " " + newDialog);
			return true;
	}

	return false;
}