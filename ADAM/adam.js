// .env Variables
const path = require('path');
require('dotenv').config({path: path.join(__dirname, "../.env")});

// Node Modules
const Discord = require('discord.js');
const client = new Discord.Client();
const cron = require('node-cron');

// Bot Modules
const npcSettings = require('./npcSettings');
const shared = require("../Shared/shared");

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
			return dialog("noResult", key);
		}
		return result;
	}
}(dialog);

// The ready event is vital, it means that your bot will only start reacting to information
// from Discord _after_ ready is emitted
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

	// ADAM only - handle the gate
	if (processGateCommands(message)) return;

	// Has to be (prefix)command
	if (message.content.indexOf(process.env.PREFIX) !== 0) return;

	if (processBasicCommands(client, message)) return;
});

// Handles errors
client.on('error', console.error);

// Testing a bug-fix for when Discord doesn't recover Playing status
client.on('resume', () => {
	// Sets your "Playing"
	if (npcSettings.activity) {
		client.user.setActivity(npcSettings.activity, { type: npcSettings.type })
			//DEBUGGING
			.then(presence => console.log("[RESUME] Activity set to " + (presence.game ? presence.game.name : 'none')) )
			.catch(console.error);
	}
});

// Log our bot in (change the token by looking into the .env file)
client.login(npcSettings.token);

// ADAM updates stamina (1) and health by 1% every 2 min.
cron.schedule('*/2 * * * *', () => {
	console.log('Updating STAMINA every 2 min.');
	shared.dataRequest.sendServerData("updateStamina");
});

function processGateCommands(message) {
	// If it's not the gate
	if (message.channel.id !== process.env.GATE_CHANNEL_ID) {
		return false; //not processed
	}

	//TODO: parse function for commands to hide these ugly lines
	const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	// WARNING: string constants used here
	// If laying out the intro
	if (command.substr(0, 5) === "intro") {
		return false;
	}

	// If they haven't chosen a faction
	if (!(command === "obsidian" || command === "genesis" || command === "hand")) {
		message.reply("Please choose one of the factions by typing your desired faction shown above (!obsidian, !genesis, or !hand).")
			.then(msg => msg.delete(10000)) //remove the error message
			.catch(console.error);
	}

	message.delete(100); // Remove the user's input to keep #the-gate clean
	return true;
}

function processBasicCommands(client, message) {
	// "This is the best way to define args. Trust me."
	// - Some tutorial dude on the internet
	const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();
	const guild = client.guilds.get(process.env.SANCTUM_ID);

	switch (command) {
		case "ping":
			if (shared.utility.isAdmin(message.author.id, guild)) {
				message.reply("Pong!");
			}
			return true;

		// ADAM and the faction leaders print the intros in the gate
		// TODO: prune the unneeded intros from each bot
		case "intro":
			if (shared.utility.isAdmin(message.author.id, guild) && message.channel.id == process.env.GATE_CHANNEL_ID) {
				shared.messaging.sendMessage(client, client.channels.get(process.env.GATE_CHANNEL_ID), dialog("intro"));
				message.delete(1000);
			}
			return true;

		case "introend":
			if (shared.utility.isAdmin(message.author.id, guild) && message.channel.id == process.env.GATE_CHANNEL_ID) {
				shared.messaging.sendMessage(client, client.channels.get(process.env.GATE_CHANNEL_ID), dialog("introEnd"));
				message.delete(1000);
			}
			return true;
			
		case "xp":
			if (!shared.utility.isAdmin(message.author.id, guild)) return;
			shared.progression.addXP(message.author.id, shared.utility.parsePageNumFromArgs(args[0]));
			break;
	}

	return false;
}