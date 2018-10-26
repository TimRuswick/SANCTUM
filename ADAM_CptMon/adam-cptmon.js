// .env Variables
require('dotenv').config({path: '../.env'});

// Node Modules
let discord = require('discord.js');
let client = new discord.Client();

// Bot Modules
let core = require("../ADAM/core");
let npcSettings = require('./npcSettings');
let shared = require("../Shared/shared");

//dialog system
let dialog = shared.GenerateDialogFunction(require("./dialog.json"));

//handle errors
client.on('error', console.error);

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
	if (message.author.bot) {
		return;
	}

	//skip the statis channel
	if (message.channel.id === process.env.STASIS_CHANNEL_ID) {
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

	//handle gameplay commands
	if (core.ProcessGameplayCommands(client, message, dialog)) {
		return;
	}
});

//Log our bot in
client.login(npcSettings.token);

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

		case "genesis":
			return core.ProcessFactionChangeAttempt(client, message, process.env.GROUP_B_ROLE, dialog, "Genesis");

		//ADAM and the faction leaders print the intros in the gate
		case "introgenesis":
			if (shared.IsAdmin(client, message.author)) {
				shared.SendPublicMessage(client, client.channels.get(process.env.GATE_CHANNEL_ID), dialog("introGenesis", process.env.GROUP_B_ROLE));
				message.delete(1000);
			}
			return true;
	}

	return false;
}
