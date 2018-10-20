//initialize the exports
exports = module.exports = {};

/*
// Adds item to inventory
exports.AddItem = function(userID, item, amount) {
	// If item exists in inventory
	console.log("[Add Item] " + amount);
	var i = userItems.findIndex(i => i.name === item.name);
	console.log("[Item Amount Item Exists] i Equals " + i);

	// If there is an item that exists in inventory
	if (i !== -1) {
		console.log("[Item Amount Start] " + userItems[i].amount);
		userItems[i].amount += amount;	// Increments amount value
		console.log("[Item Amount Finish] " + userItems[i].amount);
	// Disallows adding objects such as crystals
	} else {
		console.log("[Item Amount Wait] Created item for the first time.");
		var clonedItem = JSON.parse(JSON.stringify(item));  // Clones item in order to not actually increment the rooms.js item JSON data
		userItems.push(clonedItem);
		addItem(userID, item, amount - 1);
	}
}

// Sends inventory into chat
async function sendInventory(message, pageNum, newMessage) {
	var items = "";
	var groupedArr = createGroupedArray(userItems, 5);
	
	// Sets a default page num, or makes it human readable
	if (pageNum === undefined) pageNum = 1; else {
		if (pageNum < 1) pageNum = 1;
		if (groupedArr.length < pageNum) pageNum = groupedArr.length;
	}

	// Checks if page number is valid
	if (pageNum > groupedArr.length) {
		// If it's longer than actual length, but isn't just an empty inventory
		if (!groupedArr.length === 0) return;  
	}

	//console.log(pageNum);

	// Grabs item in loop, parses it, then adds it to "items" variable
	if (groupedArr[pageNum - 1]) {
		for (let index = 0; index < groupedArr[pageNum - 1].length; index++) {
			// Grabs an item, from a page index
			const element = groupedArr[pageNum - 1][index];

			// Makes if there is an emote, it'll add an extra space
			var emoteText = "";
			if (element.emote) emoteText = element.emote + " ";

			// Adds it in
			items += `> ${emoteText}**${element.name}** [${element.amount}x] ${element.info}\n`; 
		}  
	}

	// No items message to fill field
	if (items === "") items = "There are no items in the party's inventory.";

	// To make the message of "Page 1/0" with no items in !inventory not happen
	var moddedLength = groupedArr.length;
	if (moddedLength < 1) moddedLength = 1;
	var moddedPageNum = pageNum;
	if (moddedPageNum < 1) moddedPageNum = 1;

	const footer = getFooterCommands("!inventory");

	// Creates embed & sends it
	const inv = new Discord.RichEmbed()
		.setAuthor(`${message.member.displayName}`, message.author.avatarURL)
		.setColor(message.member.displayColor)
		.setDescription("I can appraise your items with `!item [ITEM NAME]`, traveler.")
		.addField(`Items (Page ${moddedPageNum}/${moddedLength})`, items)
		.setFooter(`Commands: ${footer}`)

	var invMessage;
	if (!newMessage)
		invMessage = await message.channel.send({embed: inv});
	else {
		invMessage = newMessage;
		await invMessage.edit({embed: inv});
	}
	
	// Collector for emotes
	const emotes = ['⬅', '❌', '➡'];
	const collector = invMessage.createReactionCollector(
		(reaction, user) => emotes.includes(reaction.emoji.name) && user.id !== client.user.id & message.author.id === user.id, { time: 15 * 1000 });
	var react = "";
	var endedOnReact;
	
	// Sends reactions
	if (!newMessage) {
		for (let i = 0; i < emotes.length; i++) {
			const element = emotes[i];
			console.log(element);
			await invMessage.react(element);   
		}
	}

	// Collects reactions
	collector.on("collect", async reaction => {
		var user = reaction.users.last();
		react = reaction.emoji.name;
		if (react !== '❌') { reaction.remove(user); }
		endedOnReact = true;
		collector.stop();
	});

	// Clears reactions
	collector.once("end", async collecter => {
		console.log("[Reaction Options] Ended collector, clearing emotes and sending timing out message if needed.");

		if (!endedOnReact) {
			invMessage.clearReactions();
			return message.channel.send(":x: **Timed Out**: The emote reaction request timed out after 15 seconds.");
		}
		if (react === '❌') {
			invMessage.clearReactions();
			return invMessage.edit(invMessage.content);
		}

		var pageNumModifier = 0;
		if (react === emotes[0]) pageNumModifier -= 1;
		if (react === emotes[2]) pageNumModifier += 1;
		console.log(pageNum + " | " + pageNumModifier);
		sendInventory(message, pageNum + pageNumModifier, invMessage);
	});
}

// Appraise an item
async function appraiseItem(message) {
	const itemName = message.content.replace("!item", "").trim().toLowerCase();
	console.log("[Item Appraisal] " + `<< ${itemName} >>`);

	// Show if no parameter is given
	if (itemName === "" || !itemName) {
		message.channel.send(`:x: ${message.author} Please tell me the item name from your inventory, or I won't know which item you want me to look at.`);
		return;
	}

	var i = userItems.findIndex(i => i.name.toLowerCase() === itemName);
	console.log("[Item Amount Item Exists] i Equals " + i);

	// If there is an item that exists in inventory
	if (i !== -1) {
		console.log(`[Item Appraisal] Found item in inventory!`);
		const embed = new Discord.RichEmbed()
			.setAuthor(`${message.member.displayName}`, message.author.avatarURL)
			.setColor(message.member.displayColor)
			.setTitle(userItems[i].name)
			.setDescription(userItems[i].info)

		if (userItems[i].type.subtype)
			embed.addField("Type", `${userItems[i].type.type}\n> ${userItems[i].type.subtype}`, true)
		else
			embed.addField("Type", `${userItems[i].type.type}`, true)

		if (userItems[i].type.stats) {
			console.log(JSON.stringify(userItems[i].type.stats, null, 4))
			var itemStats = "There are no stats avaliable.";
			var resetItemStats = false;
			userItems[i].type.stats.forEach(element => {
				if (element) {
					if (!resetItemStats) {
						resetItemStats = true;
						itemStats = "";
					}
					const types = [
						"attack",
						"defence",
						"speed",
						"healing"
					];

					types.forEach(type => {
						if (element[type]) {
							switch (type) {
								case "attack":
									itemStats += `ATK: ${element.attack}\n`;
									break;
								case "defence":
									itemStats += `DEF: ${element.defence}\n`;
									break;
								case "speed":
									itemStats += `SPD: ${element.speed}\n`;
									break;
								case "healing":
									itemStats += `Healing: ${element.healing} HP\n`;
									break;
							}
						}
					});
				}
			});
		}
		
		embed.addField("Stats", `${itemStats}`, true);

		message.channel.send(embed);

	// Disallows adding objects such as crystals
	} else {
		console.log("[Item Appraisal] Couldn't find item in inventory.");
		message.channel.send(`:x: ${message.author} I'm unable to find "${itemName}" in your inventory.`);
	}
}

*/