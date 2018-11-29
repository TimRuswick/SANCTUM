// .env Variables
const path = require('path');
require('dotenv').config({path: path.join(__dirname, "../.env")});

// Node Modules
const Discord = require('discord.js');
const client = new Discord.Client();

// Bot Modules (stores http requests & random functions respectively)
const shared = require('../Shared/shared');

// Drinks
const drinks = [
    // https://brookstonbeerbulletin.com/beer-tasting-terms/
    ['🍺', 'Beer', 'The clean, classic Traveler\'s Watch drink.', '2'],
    ['🥛', 'Milk', 'An innocent, creamy drink. It is very nutritious.', '2'],
    // http://scotchtasting.info/glossary/
    ['🥃', 'Whiskey', 'A very dignified, rich drink.', '5'],
    // https://en.wikipedia.org/wiki/Wine_tasting_descriptors
    ['🍷', 'Wine', 'An aromatic wine, with a round taste.', '10'],
    // http://richardgpeterson.com/champagne-glossary/
    ['🍾', 'Champagne', 'A brilliant, crisp drink. Share your drink with the tavern!', '20']
]

const playingActivity = '!buydrink | Bartender, Confidant';

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
    client.user.setActivity(playingActivity);
    console.log(`Connected! \
    \nLogged in as: ${client.user.username} - (${client.user.id})`);
});

// Create an event listener for messages
client.on('message', async message => {
    // Message has to be in Tavern or Test
    if (!(message.channel.id === process.env.TAVERN_CHANNEL_ID
        || message.channel.id === process.env.TEST_CHANNEL_ID)) return;

    var sentMessageFlag = false;
    
    // Ignores ALL bot messages with exceptions
    if (message.author.bot) {
        // If bot is Mori
        if (message.author.id === process.env.MORI_ID) {
            if (shared.utility.randomPercent(33)) {
                var dialogOptions = [
                    'Aww, do you have to rez \'em all?',
                    'I feel like you should skip some of \'em.',
                    'We don\'t say it enough, but we all appreciate what you do, honey.',
                    'I\'m sure everyone is thankful, they\'re just occupied.',
                    'Hey now, yer not gonna\' get no thanks with an attitude like that.',
                    'Are ya\' really in this for the glory though?',
                    'Thanks, hun.',
                    'You are very much appreciated.',
                    'I\'m sure it\'s not on purpose.',
                    'Travelers got a lot on their minds. But you\'re very needed, Sugar.'
                ];
                var randomNumber = Math.floor(Math.random() * dialogOptions.length);
                
                message.channel.startTyping();
                setTimeout(() => {
                    message.channel.send("<@" + message.author.id + "> " + dialogOptions[randomNumber]);
                    message.channel.stopTyping(true);
                }, shared.utility.random(2500, 6000));
                sentMessageFlag = true;
            }
        }
        return;
    }
    
    var wholeMessage = message.content.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    var words = wholeMessage.split(" ");
    console.log("wholeMessage: " + wholeMessage + "\nWords: " + words)
    // Hearts message with "alexis" and not "date"
    if (words.includes("alexis") && !words.includes("date") && sentMessageFlag === false) {
        if (shared.utility.randomPercent(33)) {
            setTimeout(function() {
                message.react("❤")
            }, shared.utility.random(1500,4000));
            sentMessageFlag = true;
            return;
        }
    }

    // Hey message
    if (words.includes("hey") && sentMessageFlag === false) {
        sayHey(message.channel, message.author.id);
        sentMessageFlag = true;
        return;
    }
    
    // Saying Alexis is your friend basically
    if (words.includes("alexis") && words.includes("friend") && !words.includes("date") && sentMessageFlag === false) {
        if (shared.utility.randomPercent(45)) {
            var dialogOptions = [
                `<@276538857174990858> is my girl.`,
                `<${process.env.REY_ID}>'s been out a long while, but when she gets back I hope she stops by.`,
                `Me 'n <${process.env.REY_ID}> are pretty close.`,
                `Well I can tell ya' who's not my friend. <${process.env.MORI_ID}>. No offense hun.`,
                `That <@163770616581718017> character is mighty strange. But <@276538857174990858> fancies him so he must be alright.`,
                `You don't tip enough to call me a friend sweetie.`,
                `Listen here. I'd love to chat but <@276538857174990858> 'n <${process.env.REY_ID}> have plans in a bit.`,
                `We're all friends when we drink together.`,
                `Ol' Jakey never came back. Nice guy. Probably made a nice meal for a Ravager.`,
                `There's friends, and then there's family. Me 'n <@276538857174990858> are like that.`
            ];
            typeRandomDialog(dialogOptions, message.channel);
            sentMessageFlag = true;
            return;
        }
    }
    
    // Asking Alexis on a date
    if (words.includes("alexis") && words.includes("date") && sentMessageFlag === false) {
        if (shared.utility.randomPercent(33)) {
            var dialogOptions = [
                'Honey yer a darling, but not gonna happen.',
                'Just because yer cute doesn\'t mean you get an auto-yes.',
                ':thumbsdown:',
                'Hey now, what makes you think I\'m even available?',
                'Calm yer britches and go ask Rey. She\'s into ones like you.',
                'Nah, but thank you honey. It was sweet of ya\'',
                'Listen here. I\'d love to chat but I\'d be lyin\' if I said I was interested.',
                'Sweetie I try to be nice, but sometimes there\'s no nice way to say ***no***.',
                'Yer gonna have to try harder than that now.',
                'How about I give you a big fat maybe?'
            ];
            typeRandomDialog(dialogOptions, message.channel, message.author.id);
            sentMessageFlag = true;
            return;
        }
    }

    // Ravager topic
    if (words.includes("ravager") || words.includes("ravagers") && sentMessageFlag === false) {
        if (shared.utility.randomPercent(33)) {
            var dialogOptions = [
                'never seen one in person.',
                'Are they really big and scary? Only seen pictures on the \'net.',
                'Fight any big ones lately?',
                'What do you think they are? Like...they\'re angry that\'s for sure, but...like...why?',
                'You ever got bit?',
                'I hear they\'re mean \'n nasty.',
                'Hope I never see one face ta face',
                'You big strong travelers you. Keepin\' me safe an\' all :heart:',
                'I dunno what I\'d do if one broke into the city here.',
                'Just make sure you keep \'em away from ***The Watch*** ya\' hear?'
            ];
            typeRandomDialog(dialogOptions, message.channel, message.author.id);
            sentMessageFlag = true;
            return;
          }
    }
  
    // Bar fights
    if (words.includes("fight") || words.includes("attack") || words.includes("fighting") || words.includes("barfight") || words.includes("fite") && sentMessageFlag === false) {
        if (shared.utility.randomPercent(33)) {
            var dialogOptions = [
                'Don\'t be startin\' no brawlers in here, ya\' hear?',
                'Don\'t even think about it.',
                'Don\'t make me give _Ghost_ a ping on the com.',
                'In here is drinkin\' time. Out there in the deadlands is fightin\' time. Learn the difference.',
                'You forget the rules or somethin\'?',
                'Honey, just because I\'m sweet doesn\'t mean I can\'t kick your ass out the door.',
                'You fight in here, you drink somewhere else.',
                'Whatever pissing contest you\'re try\'na win, win it elsewhere.',
                'Don\'t be actin\' all tuff here. Everybody knows what happened with you and that _Ravager_.',
                'The first rule of drink club, no fightin\'.'
            ];
            typeRandomDialog(dialogOptions, message.channel, message.author.id);
            sentMessageFlag = true;
            return;
        }
    }

    // Good nights
    if (words.includes("gn") || words.includes("night") || words.includes("goodnight") || words.includes("sleep") && sentMessageFlag === false) {
        if (shared.utility.randomPercent(33)) {
            var dialogOptions = [
                'Night hun.',
                'Goodnight sweety. You comin\' back tomorrow?',
                'Have yerself a goodnight now ya\' hear?',
                'Sweet dreams.',
                'Nighty night.',
                'Gn. See ya tomorrow?',
                'Yer leavin\' already?',
                'Have yerself a good rest now.',
                'Sleep tight. I\' see ya\' tomorrow.',
                'Don\' let the bed bugs bite. They\'re the size of ravagers here on New Eden.'
            ];
            typeRandomDialog(dialogOptions, message.channel, message.author.id);
            sentMessageFlag = true;
            return;
        }
    }
    
    // Has to be (prefix)command
    if (message.content.indexOf(process.env.PREFIX) !== 0) return;

    let [command, args, guild] = shared.utility.getCommandArgsGuild(client, message);

    switch (command) {
        case "ping":
            if (shared.utility.isAdmin(message.author.id, guild))
                message.reply("Pong!");
            break;
        case "buydrink":
            payDrinks(message, args[0], args);
            break;

        case "tip":
            if (args == "") {
                newMessage = `:x: I appreciate the gesture, but how much did you wanna tip, ${message.author}?`;
                message.channel.send(newMessage);
            } else {
                var crystalCost = Math.floor(parseFloat(args));
                if (crystalCost > 0) {
                //if (crystalCost > -1) {
                    // Valid number
                    var stats = shared.core.getStats(message.author.id);
                    if (stats.wallet > crystalCost) {
                        var upgradeResponse = shared.dataRequest.sendServerData("buyDrink", crystalCost, message.author.id);
                        var dialogOptions = [
                            'Well ain\'t you sweet. Much appreciated.',
                            'Awww that\'s mighty nice of ya\' :heart:',
                            'Thank you sweet heart. Very generous of ya\'',
                            'I appreciate that very much! And look forward to seein\' yer face more often. :wink:',
                            'Well now, you are just too kind.',
                            'You\' a sweet heart aren\'t ya. Thank you.',
                            'Sweety I just can\'t take how kind you are. :heart: Thank you very much.',
                            'For me? Aww, ya\' shouldn\'t have.',
                            'That is very much appreciated and you are welcome back to ***The Watch*** anytime.',
                            'Well darn, that\'s nice of ya. Thank you sweety.'
                        ];

                        var randomNumber = Math.floor(Math.random() * dialogOptions.length);
                        newMessage = `${dialogOptions[randomNumber]}\n${message.author} ${shared.utility.getEmote(client, "crystals")} **-${crystalCost}**`;
                        message.channel.send(newMessage);

                        //Send PM (defunct)
                        //if (crystalCost >= 0) {
                        /*
                        if (crystalCost >= 50) {
                            var dialogOptions2 = [
                                'Hey so...not 100% on this but heard it through the grape vine. ',
                                'Ya\' know, the walls have ears around my place and occasionally I hear stuff. ',
                                'I ain\'t supposed to be tellin\' ya this, and I ain\'t sure how true it it...but...',
                                'So I probably shouldn\' get involved but I overheard some people talkin\'. Don\'t know if they spoke the truth, but...',
                                'Yer a generous tipper. So am I. Not solid on the info, but I got a tip for ya\'. ',
                                'So I hear things, and for generous people like yourself I might repeat \'em. Don\'t mean they\'re true. But...',
                                'I heard somethin\' I probably shouldn\'t repeat. Obviously can\'t confirm this. ',
                                'Things pass through my ears and I can\'t help but pass \'em on. ',
                                'Hey there. A fello traveler told me something ya\' should hear. Don\'t know the accuracy, just know what I heard. ',
                                'Ok so, don\'t know if this is up to date info, but I got somethin\' for ya. '
                            ];

                            var dialogOptions3 = [
                                'Looks like The Order might actually be ahead in crystals this week.',
                                'I think The Anarchy is winning this week. Although can\'t say by how much.',
                                'Pretty sure The Religion has the most crystals in their bank right about now.',
                                'I heard that The Order is behind on crystals in the bank.',
                                'Someone mentioned that The Anarchy was a bit behind on crystals this week.',
                                'Been hearin\' that the Religion is last place in crystals this week, but they always have tricks up their sleeves.'
                            ];

                            var randomNumber2 = Math.floor(Math.random() * dialogOptions2.length);
                            var randomNumber3 = Math.floor(Math.random() * dialogOptions3.length);
                            newMessage = dialogOptions2[randomNumber2] + dialogOptions3[randomNumber3];
                            //sendDM(message.author.id, newMessage);
                            message.author.send(newMessage);
                        }
                        */
                    } else {
                        message.channel.send(`:x: ${message.author} Looks like ya' ain't got the ${shared.utility}. Don't make a girl a promise that ya' can't keep.`);
                    }
                } else {
                    //Not a number
                    message.channel.send(`:x: Doesn't seem like a tip I could use, but I appreciate the thought, ${message.author}!`);
                }
            }
            break;
    }
});

// Handles errors
client.on('error', console.error);

// Testing a bug-fix for when Discord doesn't recover Playing status
client.on('resume', () => {
    console.log("RESUME: setting playing activity to " + playingActivity);
    client.user.setActivity(playingActivity);
});

function sayHey(channel, userID) {
    var dialogOptions = [
        'Howdy',
        'Hey back',
        'Hey yourself',
        'Hi',
        'Hey it\'s you',
        'Hi there',
        'Hay is for horses silly',
        'Well hello',
        'Hey hey hey',
        'Hey stranger'
    ];
    var dialogOptions2 = [
        'How ya\' been?',
        'Whatcha\' up to?',
        'What\'s the weather like out there?',
        'Find any decent sized Ravagers?',
        'Welcome back.',
        'Glad you\'re back. Could use some company.',
        'What are ya\' havin\'?',
        'Whatcha\' drinkin\'?',
        'Retiring for the night? Already?',
        'Welcome to _The Watch!_'
    ];
    var randomNumber = Math.floor(Math.random() * dialogOptions.length);
    var randomNumber2 = Math.floor(Math.random() * dialogOptions2.length);
    var newMessage = dialogOptions[randomNumber] + " <@" + userID + ">!\n" + dialogOptions2[randomNumber] + "\n";

    channel.startTyping();
    setTimeout(function() {
        shared.messaging.sendMessage(client, channel, newMessage);
        channel.stopTyping(true);
    }, shared.utility.random(2500,6000));
}

function typeRandomDialog(dialogOptions, channel, playerID) {
    var randomNumber = Math.floor(Math.random() * dialogOptions.length);

    channel.startTyping();
    setTimeout(function() {
        if (playerID === undefined)
            shared.messaging.sendMessage(client, channel, dialogOptions[randomNumber]);
        else
            shared.messaging.sendMessage(client, channel, "<@" + playerID + "> " + dialogOptions[randomNumber]);
        
        channel.stopTyping(true);
    }, shared.utility.random(2500, 6000));
}

// Buy drink
async function buyDrink(message, args) {
    var randomGreet = [
        `Hey ${message.author}, wanna drink? Here's what I've got!`,
        `Welcome to the tavern, ${message.author}! Care for a drink?`,
        `People have been asking me on dates, ${message.author}. Must've be the alcohol.`,
        `How's the Ravager hunting going, ${message.author}?`
    ];

    var randomNumber = Math.floor(Math.random() * randomGreet.length);

    /*
    message.channel.startTyping();
    await shared.utility.sleep(1500);
    message.channel.stopTyping(true);
    */
    var footerName = message.member.displayName;
    var courtesy = "";
    var tmp = "";

    // Generates drink text.
    for (let index = 0; index < drinks.length; index++) {
        const element = drinks[index];
        tmp += `${element[0]} **${element[1]} ${shared.utility.getEmote(client, "crystals")} ${element[3]}** - ${element[2]}\n`
    }
    
    // If there is a mention
    /*
    if (message.mentions.members.size > 0) {
        footerName = message.mentions.members.first().displayName;
        courtesy = `(Given to ${message.mentions.members.first().displayName}, Courtesy of ${message.member.displayName})`;
    }
    */

    const embed = new Discord.RichEmbed()
        .setAuthor("Alexis", client.user.avatarURL)
        .setColor("#ffcc4d")
        .setTitle("Traveler's Watch Drinks " + courtesy)
        .setDescription(tmp)
        .setFooter(`Hope ya' enjoy your stay, ${footerName}! Buy a drink with !buydrink [DRINK].`, message.author.avatarURL)

    var newMessage = await message.channel.send(randomGreet[randomNumber], {embed});
    /*
    var emoteReaction = "";

    // Collects emotes and reacts upon the reaction (15 seconds)
    const collector = newMessage.createReactionCollector(
        (reaction, user) => (drinks.some(drinkElement => drinkElement[0] === reaction.emoji.name) || reaction.emoji.name === "❌") 
        && user.id !== client.user.id && user.id === message.author.id, { time: 15 * 1000 });
    var endedOnReact = false;
        
    // Reacts
    for (let i = 0; i < drinks.length; i++) {
        const element = drinks[i][0];
        console.log("[Reaction Options] Emote: " + element);
        await newMessage.react(element);
    }
    await newMessage.react("❌");

    // Collect
    collector.once("collect", async reaction => {
        emoteReaction = reaction.emoji.name;
        endedOnReact = true;
        collector.stop();
    });

    // Chose an emote
    collector.once("end", async collector => {
        newMessage.clearReactions();

        // If no choose
        if (!endedOnReact) {
            newMessage.edit(newMessage.content);
        }

        // If cancelled
        if (emoteReaction === "❌") {
            newMessage.edit(newMessage.content);
            return;
        }

        // Gets confirmation by emote
        var index = drinks.findIndex(drink => drink[0] === emoteReaction);
        //console.log(index + "\n" + drinks[index]);

        var confirmationMessage = await message.channel.send(`${message.author} You sure you want to buy the ${drinks[index][0]} **${drinks[index][1]}** for ${shared.utility.getEmote(client, "crystals")} **${drinks[index][3]}**?`);
        await confirmationMessage.react('✅');
        await confirmationMessage.react('❌');

        // Collects emotes and reacts upon the reaction (15 seconds)
        const newCollector = confirmationMessage.createReactionCollector(
            (reaction, user) => (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') 
            && user.id !== client.user.id && user.id === message.author.id, { time: 15 * 1000 });
        var confirmReact = false;
        
        // Collect
        newCollector.once("collect", async reaction => {
            emoteReaction = reaction.emoji.name;
            console.log("confirm: " + emoteReaction);
            confirmReact = true;
            newCollector.stop();
        });

        newCollector.once("end", async collector => {
            confirmationMessage.delete();

            // If no choose
            if (!confirmReact) {
                return;
            }

            if (emoteReaction === "✅") { 
                payDrinks(message, drinks[index]);
            } else {
                confirmationMessage.clearReactions();
            }
        });
    });
    */
}

// Buying drink
function payDrinks(message, drink, args) {
    var newDrink = false;
    drinks.forEach(element => {
        if (element[1].toLowerCase() === drink) newDrink = element; 
    });

    if (!newDrink) {
        if (args[0] && message.mentions.members.size > 0) message.channel.send(`:x: ${message.author} You wanna buy ***WHO*** a ***WHAT*** now?`);
        else buyDrink(message, args);
        return;
    }
    console.log(newDrink);

    // A ton of variables
    var crystalCost = parseFloat(newDrink[3]);
    var emote = newDrink[0];
    var givenIsAlexis = false;
    var success = false;
    var stats = shared.core.getStats(message.author.id);
    console.log("[Pay Drinks] Wallet: " + stats.wallet + " | Crystal Cost: " + crystalCost);

    if (stats.wallet >= crystalCost) {
        shared.dataRequest.sendServerData("buyDrink", crystalCost, message.author.id);

        dialogOptions = [
            'Here\'s a cold one,',
            'Here\'s your drink',
            'Here you go,',
            'Here ya are. Enjoy,',
            'Sliding it your way,',
            'Don\'t go alone, take this,',
            'Drink up,',
            'Don\'t chug it all down now,',
            'Headed in your direction,',
            'Comin\' up,'
        ];

        // Alexis options
        if (message.mentions.members.first() !== undefined) {
            if (message.mentions.members.first().id === client.user.id) {
                var dialogOptions = [
                    `Aww, thanks! :heart:`,
                    `Thanks for the drink! Cheers!`,
                    `Are you trying to make me drunk? Don't even TRY asking me out on a date.`
                ];
                givenIsAlexis = true;
            }
        }

        var randomNumber = Math.floor(Math.random() * dialogOptions.length);
        var newMessage = "";
        
        // Single or multiple user messages
        if (message.mentions.members.size < 1) {
            success = true;
            newMessage = `${emote} ${dialogOptions[randomNumber]} ${message.author}! ${shared.utility.getEmote(client, "crystals")} **-${crystalCost}**`;
        } else {
            // Huge scope creep, but have a list of players able to be given beer instead of just one later on
            // For now, just taking the first player
            let member = message.mentions.members.first();
            if (member) {
                // Displays ping if not Alexis
                var givePingUser = ` ${member.user}!`;
                if (givenIsAlexis) givePingUser = "";
                
                success = true;
                newMessage = `${emote} ${dialogOptions[randomNumber]}${givePingUser}\n\n` + 
                             `***Courtesy of*** ${message.author}. ${shared.utility.getEmote(client, "crystals")} **-${crystalCost}**`;
            } else {
                newMessage = `:x: ${message.author} You wanna buy ***WHO*** a ***WHAT*** now?`;
            }
        }
        message.channel.send(newMessage);

        // Does champagne sharing
        if (success && newDrink[1] === "Champagne") {
            shareDrinks(message, newDrink);
        }

    } else {
        message.channel.send(`:x: ${message.author} Looks like ya' ain't got the ${shared.utility.getEmote(client, "crystals")} **2**. I ain't runnin' a charity here.`);
    }
}

// Mass buying of a drink
async function shareDrinks(message, drink) {
    const drinkMessage = `${message.author} has bought some ${drink[0]} **${drink[1]}**! Get ya' free drink!`;
    var timer = 30;     // Seconds
    var decrementTime = 10;
    var footerText = `⏰ ${timer} seconds left to get your free drink!`;
    client.user.setActivity(`${footerText}`);

    // Embed
    const embed = new Discord.RichEmbed()
        .setAuthor("Alexis", client.user.avatarURL)
        .setColor("#ffcc4d")
        .setTitle("Free Drinks!")
        .setDescription(drinkMessage)
        .setFooter(footerText)
    
    var embedMessage = await message.channel.send(embed);

    // Message
    message.channel.send("Hmm... I might just take some too, if y'all don't mind. :heart:");

    // Collects emotes and reacts upon the reaction (30 seconds)
    var users = "";
    var numberOfReacts = 0;
    const newCollector = embedMessage.createReactionCollector(
        (reaction, user) => reaction.emoji.name === drink[0]
    , { time: timer * 1000 });

    // Alexis grabbing some
    await embedMessage.react(drink[0]);

    // Collect
    newCollector.on("collect", async reaction => {
        var user = reaction.users.last();
        dialogOptions = [
            `${user} has taken a drink!`,
            `${user} eagerly grabs the ${drink[1]}!`,
            `${user} enjoys the beverage!`,
            `${user} gets a free drink!`,
            `${user} chugs down the ${drink[1]}!`,
            `${user} races to get down the drink the fastest!`
        ];
        var randomNumber = Math.floor(Math.random() * dialogOptions.length);
        users += dialogOptions[randomNumber] + "\n";

        // Embed
        const embed = new Discord.RichEmbed()
            .setAuthor("Alexis", client.user.avatarURL)
            .setColor("#ffcc4d")
            .setTitle("Free Drinks!")
            .setDescription(`${drinkMessage}\n\n` + users)
            .setFooter(footerText)
        
        embedMessage.edit(embed);

        // Counts up if not Alexis
        if (reaction.users.last().id !== client.user.id) numberOfReacts++;
    });

    // Ends collection
    newCollector.once("end", async collector => {
        var number = ""
        if (numberOfReacts === 1) {
            number = numberOfReacts + " traveler";
        } else {
            number = numberOfReacts + " travelers";
        }

        // Embed
        embedMessage.clearReactions();
        const embed = new Discord.RichEmbed()
            .setAuthor("Alexis", client.user.avatarURL)
            .setColor("#ffcc4d")
            .setTitle("Free Drinks!")
            .setDescription(`${message.author}'s ${drink[0]} **${drink[1]}** has been finished. There were a total of ${number} that got the free drink! 🥂\n\n` + users)
            .setFooter("⏰ The drink has been finished!")

        embedMessage.edit(embed);
        message.channel.send(`Everyone, thank ${message.author} for the drink! It was great.`);
    });

    
    function timerFunction() {
        setTimeout(async () => {
            console.log("timer: " + timer + " => " + (timer - decrementTime))
            timer -= decrementTime;

            footerText = `⏰ ${timer} seconds left to get your free drink!`;

            if (timer > 0) {
                client.user.setActivity(`${footerText}`);
                
                // Embed
                const embed = new Discord.RichEmbed()
                    .setAuthor("Alexis", client.user.avatarURL)
                    .setColor("#ffcc4d")
                    .setTitle("Free Drinks!")
                    .setDescription(`${drinkMessage}\n\n` + users)
                    .setFooter(footerText)
                
                embedMessage.edit(embed);
            } else {
                client.user.setActivity(playingActivity)
            }
            
            if (timer > 0) timerFunction();
        }, decrementTime * 1000);
    }

    timerFunction();
}

// Log our bot in
client.login(process.env.ALEXIS_TOKEN);