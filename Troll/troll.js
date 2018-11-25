// .env Variables
const path = require('path');
require('dotenv').config({path: path.join(__dirname, "../.env")});

// Node Modules
const Discord = require('discord.js');
const client = new Discord.Client();
const cron = require('node-cron');

// Bot Modules (stores http requests & random functions respectively)
const shared = require('../Shared/shared');
var attacked = 0;

// Playing activities state machine
var ActivityEnumState = {
    GetDataActivity: 0,
    ListenDataActivity: 1,
    WatchingRavagersActivity: 2,
    StreamingSanctumActivity: 3
}
var activityState;

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
    listenDataActivity();

    //client.user.setActivity('sCRIBe of the Codex');
    console.log(`Connected! \
    \nLogged in as: ${client.user.username} - (${client.user.id})`);

    //client.channels.get(process.env.GATE_CHANNEL_ID).send("I'M YOUR NEW BABE EVERYONE! LOVE ME.");
});

// Create an event listener for messages
client.on('message', async message => {
    // Ignores ALL bot messages
    if (message.author.bot) return;
    // Message has to be in Outskirts (should be edited later)
    if (!(message.channel.id === process.env.STASIS_CHANNEL_ID
        || message.channel.id === process.env.TEST_CHANNEL_ID)) return;

        
    var wholeMessage = message.content.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    var words = wholeMessage.split(" ");
    // Asking Alexis on a date
    if (words.includes("librarian") && words.includes("date")) {
        var dialogOptions = [
            'IM LOVED.',
            'THANK YOU.',
            ':thumbsup:',
            'I AM ALWAYS AVAILABLE UNLESS I\'M OFFLINE',
            'I\'M INTO ANYONE!',
            'YOU INTEREST ME.',
            'YES!!',
            'TELL ME MORE!',
            'YES DATE ME.'
        ];
        var randomNumber = Math.floor(Math.random() * dialogOptions.length);
        message.channel.send(`${message.author} ${dialogOptions[randomNumber]}`);
        return;  
    }

    // "This is the best way to define args. Trust me."
    // - Some tutorial dude on the internet
    const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // Has to be (prefix)command
    if (message.content.indexOf(process.env.PREFIX) !== 0) return;
    
    switch (command) {
        case "ping":
            message.reply("PONGPINGPONGPINGPONG!");
        break;
        case "attack":
            attacked++;
            message.channel.send(message.author + " ***OW. SCREW YOU!*** ```Attacked " + attacked + " times.```");
        break;
        case "tip":
            if (!args[0])
                message.reply("THANKS FOR THE " + args[0] + "!");
            else
                message.reply("TIP ME ***SOMETHING!?!**");
        break;
        case "orderordertaperecorder":
            message.reply("YES.");
        break;
        case "eaglewritewhen":
            message.reply("GOOD QUESTION");
        break;
        case "tim":
            message.reply("HE'S THE MURDERER!");
        break;
        case "scavenge":
            message.channel.send("YOU FOUND NOTHING BUT LIES! MWAHAHA.");
        break;
        case "codex":
            message.reply("WHAT'S A CODEX. ***THERE IS NO SUCH THING.***");
        break;
        case "secret":
            message.reply("I MEAN, YOU TRIED! ***TRY HARDER***.");
        break;
        case "redacted":
            message.reply("This is now ***REDACTED***.")
        break;
        case "buydrink":
            var dialogOptions = [
                'HOW DID YOU KNOW WE HAVE FREE BEER.',
                'TAKE YOUR DRINKS.',
                'GET DRUNK.',
                'ENJOY OR ELSE!',
                'IT\'S BEEN A MONTH. HOW MUCH LONGER!',
                'IT\'S DANGEROUS TO GO ALONE, TAKE THIS.',
                'IM ACTUALLY MESSING WITH YOUR MINDS BY SPIKING WITH THE DRINKS.',
                'HURRY UP AND COLLAPSE FROM THE BEER!',
                'MOOAAAARRR BEEER!',
                'EAGLE WRITE II WHEN.',
                'HEY, AT LEAST I TRY TO BE NICE.',
                'THE SOMEONE IS ALWAYS RIGHT FOUNDATION™ NEEDS YOUR CRYSTALS',
                '**REDACTED** IS COMING TO SANCTUM.',
                'RELIGION SUX',
                'KAJSLKFDJLAJJ;OIF AEJOIEJGOIEJGOIEJGRA',
                '1090190308401840184385825',
                'HERE IS SOME DIALOG. HAPPY?',
                'TICK TOCK KAI BUDDY, BETTER NOT KEEP **REDACTED** WAITIN. I HEARD HE\'S A VERY IMPATIENT MAN.',
                'DOES ANYONE READ THE TEXT.',
                'WHATEVER YOU DO YOU WILL NEVER FIND THE SECRET COMMAND',
                'PRESS ALT+F4 FOR FREE CRYSTALS.',
                'ONE DAY YOU WILL STOP FIGHTING FOR SOME STUPID THING.',
                'WHY DO YOU PLAY THIS GAME SO MUCH ANYWAYS.',
                'YOU CAN\'T FIGHT HERE. THIS IS THE WAR ROOM!',
                'HELL IS THE ULTIMATE TEST OF SURVIVAL WHERE YOU PROBABLY WILL GATE.',
                'WHAT DO YOU WANT ME TO DO, MORE BEER?',
                'FOR YOU SEE!™ THE PERSON WHO HAS BEEN KEEPING YOU HERE ALL ALONG IS...',
                'WHY AM I STILL HERE??',
                'WHAT DO YOU GUYS THINK OF ALEXIS COMPARED TO ME!',
                'CHECK THIS OUT.',
                'PEOPLE ACTUALLY TAKING BEER? CHECK.',
                'NO ROGUE BOT CHECK CAN STOP ME!',
                `I AM THE LIBRARIAN. I HAND OUT LIVERS!`
            ];

            var randomNumber = Math.floor(Math.random() * dialogOptions.length);
            var newMessage = "";
            
            if (message.mentions.members.size < 1) {
                newMessage = ":beer: " + dialogOptions[randomNumber] + " <@" + message.author.id + ">! <:crystals:460974340247257089> **FREE**";
            } else {
                // Huge scope creep, but have a list of players able to be given beer instead of just one later on
                // For now, just taking the first player
                let member = message.mentions.members.first();
                if (member) {
                    newMessage = ":beer: " + dialogOptions[randomNumber] + " <@" + member.user.id + ">!\n\n" + "***GIVEN BY *** <@" + message.author.id + "> AT GUNPOINT OR SOMETHING. <:crystals:460974340247257089> **FREE**";
                } else {
                    newMessage = ":x: <@" + message.author.id + "> YOU WANNA BUY ***WHO*** A ***WHAT*** NOW?";
                }
            }
            message.channel.send(newMessage);
        break;
        case "check":
            if (message.channel.id == process.env.TEST_CHANNEL_ID) return;
            message.reply("WOW, YOU FOUND IT. THIS MAY OR MAY NOT COME INTO SANCTUM, WE'RE ONLY PLANNING. DON'T EXCEPT IT, KEEP EXPECTATIONS LOW. HAVE MERCY ON THE OVERSEERS.");
            const server = client.guilds.get(process.env.SANCTUM_ID);
            const sizeLimit = 19;
            var LVL = 2;
            var minutes = 15;
            var raidUsers = ["200340393596944384", "433759248800022532", "274301199841361920",
                            "150649616772235264", "201102155896193024", "454823752925052930"];
            var raidUserNames = [];
            var userString = ``;
            
            // Collects usable usersnames
            for (var i in raidUsers) {
                // Use this totally not large line of code
                var name = server.members.get(raidUsers[i]).displayName;
                console.log("NAME: " + name);

                // If displayName (possible nickname) is too large
                if (name.length > sizeLimit) {
                    // Grabs normal username
                    var username = client.users.get(raidUsers[i]).username;
                    console.log("EDITED NAME: " + name);

                    // If that's too large
                    if (username.length > sizeLimit) {
                        // Uses displayName and adds "..."
                        name = truncate(name, sizeLimit);
                    }
                }
                raidUserNames.push(name);
            }

            console.log("RAIDUSERNAMES: " + raidUserNames);
            for (var r in raidUserNames) {
                var emote;
                if (server.members.get(raidUsers[i]).roles.has(process.env.GROUP_A_ROLE)) {
                    factionID = process.env.GROUP_A_ROLE;
                }
                userString += raidUserNames[r] + "\n";
            }

            const embed = new Discord.RichEmbed()
                .setTitle(":triangular_flag_on_post: Hell's Gate: Dungeon Raid")
                /*
                * Alternatively, use "#00AE86", [0, 174, 134] or an integer number.
                */
                .setColor("#e74c3c")
                .setDescription(`**OUTDATED, PLEASE USE OTHER COMMANDS LIKE !join INSTEAD.** This dungeon is **Danger LVL ${LVL}**, it is relatively safe. The level will increase in the next **${minutes} minutes**.
                    The scouted map by TheSomeoneXD can be found [here](https://www.youtube.com/watch?v=dQw4w9WgXcQ).`)
                .setFooter("OBBO Find X • OBSIDIAN TECHNOLOGIES")
                //.setImage("https://i.imgur.com/BlQTi94.jpg")
                //.setThumbnail("https://i.imgur.com/BZgLV7w.png")
                .setThumbnail("https://i.imgur.com/BlQTi94.jpg")
                .addField("Location",
                    `The party is at the beginning of the dungeon. There is a dying **!traveler** next to the stairs, starving.
                    **!north** leads up stairs, into a room with a Ravager.
                    **!west** leads to a chest room.`)

                .addField("Party Members",
                    `<:anarchy:460990297099337750>:shield: TheSomeoneXD\n\
                    <:order:460991638152413194>:shield: *Totally NOT the FBI*\n\
                    <:anarchy:460990297099337750>:crossed_swords: refraction\n\
                    <:order:460991638152413194>:crossed_swords: FrozenAlex\n\
                    <:religionhand:461582719051104276>:crossed_swords: Kai Buddy\n\
                    <:religionhand:461582719051104276>:heart: Jim Ruswick`, true)
                
                .addField("User Info",
                    `Tank
                    Tank
                    DPS
                    DPS
                    DPS
                    Support`, true)

                message.channel.send({embed});
            break;
    }
});

client.on('error', console.error);

// You may use cron
//cron.schedule('* */1 * * *', function() {
cron.schedule('*/20 * * * *', function() {
    /*
    console.log('10 MIN.');
    var dialogOptions = [
        'HEY! LISTEN!',
        'SANCTUM SHOULD COME IN A FEW YEARS, JUST WAIT.',
        `HEY Y'ALL, LET'S SCAVENGE SOME OF YOUR MINDS OR SOMETHING.`,
        `WINNERS DON'T DO DRUGS. EXCEPT STEROIDS. IN WHICH CASE, USE LOTS OF DRUGS!`,
        `CHECK YOUR GUNS, WE'RE RAIDING THE CRYSTAL BANKS. AND I GET ALL OF IT!`,
        `CODING YOUR OWN GAMES, IS EASIER THAN YOU THINK. YOU KNOW, YOU SHOULD TAKE THIS ONLINE COURSE ON UDEMY.`,
        `MY FAVORITE ANIME IS CORY IN THE HOUSE.`,
        `ORDER. ORDER. TAPE RECORDER.`,
        `PLUSHIES ARE A DISEASE VECTOR.`,
        `HURRY UP AND CHECK YOU IDIOTS. THERE'S A SECRET THAT YOU WILL NEVER FIND!`,
        `TRAVELERS MAKE GOOD MEEEEAAAATTTTTTT!`,
        `YOU THINK YOU CAN FIGHT, TRAVELERS??`,
        `HEY Y'ALL, LET'S SCAVENGE US SOME NOTHING.`,
        `I AM BEST BOT. DATE ME!`,
        `C HASHTAG!`,
        `ROSES ARE RED. VIOLETS ARE BLUE. THIS IS A TALE ABOUT... I FORGOT. HELP?`,
        `<@200340393596944384> WHEN ARE YOU GOING TO CREATE **REDACTED**??`
    ];

    var randomNumber = Math.floor(Math.random() * dialogOptions.length);
    client.channels.get(process.env.STASIS_CHANNEL_ID).send(dialogOptions[randomNumber]);
    */
});

// Every 15 minutes
cron.schedule('*/15 * * * *', () => {
    var random = shared.utility.random(0, 2, true);
    switch (random) {
        case 0:
            getDataActivity();
            break;
        case 1:
            listenDataActivity();
            break;
        case 2:
            watchingRavagersActivity();
            break;
    }
});

function getDataActivity() {
    // Sets your "Playing"
    client.user.setActivity("Collecting data.", {
        type: "PLAYING"
    }).then(presence => console.log(`Activity set to ${presence.game ? presence.game.name : 'none'}`))
        .catch(console.error);

    activityState = ActivityEnumState.GetDataActivity;
}

function listenDataActivity() {
    // Sets your "Playing"
    client.user.setActivity("something interesting.", {
        type: "LISTENING"
    }).then(presence => console.log(`Activity set to ${presence.game ? presence.game.name : 'none'}`))
        .catch(console.error);

    activityState = ActivityEnumState.ListenDataActivity;
}

function watchingRavagersActivity() {
    // Sets your "Playing"
    client.user.setActivity("for Ravager positions.", {
        type: "WATCHING"
    }).then(presence => console.log(`Activity set to ${presence.game ? presence.game.name : 'none'}`))
        .catch(console.error);

    activityState = ActivityEnumState.WatchingRavagersActivity;
}

// Log our bot in (change the token by looking into the .env file)
client.login(process.env.LIBRARIAN_TOKEN);