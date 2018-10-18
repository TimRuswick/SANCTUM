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
	if (msg.content.slice(0, 1) != "!") {
		return;
	}

	//get the command
	let command = msg.content.slice(1).split(" ")[0];
	let args = msg.content.slice(1 + command.length).trim();

	//handle command
	switch(command) {
		//used for debugging
		case "ping":
			shared.SendPublicMessage(client, "Ratstail91", "bot-spam", "pong", 3000);
			break;
	}
});

//actually log in
client.login("TOKEN");