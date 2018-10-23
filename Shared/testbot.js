// .env Variables
require('dotenv').config({path: '../.env'});

let shared = require("./shared.js");

let Discord = require("discord.js");
let client = new Discord.Client();

//message handler
client.on("ready", function() {
	console.log("Logged in as " + client.user.tag);
});

client.on("reconnecting", function() {
	console.log("Reconnecting...");
});

client.on("disconnect", function() {
	console.log("Disconnected");
});

client.on("message", function(msg) {
	//only react to commands
	if (msg.content.slice(0, 1) !== process.env.PREFIX) {
		return;
	}

	//get the command
	let command = msg.content.slice(1).split(" ")[0];
	let args = msg.content.slice(1 + command.length).trim();

	//handle command
	switch(command) {
		//used for debugging
		case "create":
			shared.ChangeFaction(client, process.env.GROUP_A_ROLE, "bot-spam", msg.member);
			break;

		case "xp":
			shared.AddXP(client, msg.author, parseInt(args));
			break;

		case "levelup":
			shared.LevelUp(client, msg.member);
			break;

		case "rankup":
			shared.RankUp(client, msg.member, parseInt(args));
			break;
	}
});

//DEBUGGING: eventually be require("./dialog.json")
let dialogJson = {
	"hello": [
		"Hi there {1} {2} {3}!",
		"Howdy {1} {3}, of the {3} clan!"
	],
	"goodbye": "See ya!"
}

let dialog = shared.GenerateDialogFunction(dialogJson);
console.log(dialog("hello", "Kayne", "Matthew", "Ruse"));

//actually log in
client.login(process.env.DEVELOPER_TOKEN);

//TODO: change usernames to tags throughout the shared library
//FIXME: The server currently queries chest count, which is not in the database.

