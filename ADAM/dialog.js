require('dotenv').config({path: '../.env'});

module.exports = {
    getDialog: function(dialogTag, data = "", data2 = "", data3 = "") {
        switch(dialogTag) {
            case "checkin":
                return "<@" + data + ">" + " your presence has been noted. I've added " + data2 + " crystals to your account.";
            
            case "checkinLocked":
                return ":x: <@" + data + ">" + " you already checked in with me " + data2 + ". You can check in again tomorrow.";
            
            case "alreadyConvertedToday":
                return ":x: <@" + data + ">" + " as anxious as you may be, please don't attempt to change factions so quickly. You can only change once every 30 days.";
            
            case "depositSuccessful":
                //codexLogEvent(data + " deposited " + data2 + " crystals.");
                return "<@" + data + ">" + " your deposit of " + data2 + " crystals has been successful. Good luck.";
            
            case "depositFailed":
                return ":x: <@" + data + ">" + " I can't make the deposit at the moment. I apologize for the inconvenience.";
            
            case "giveSuccessful":
                //codexLogEvent(data + " gave " + data2 + " " + data3 + " crystals.");
                return "<@" + data + ">" + " I've transferred " + data3 + " crystals to <@" + data2 + "> as per your request.";
            
            case "giveFailed":
                return ":x: <@" + data + ">" + " I can't make that transfer at the moment. I apologize for the inconvenience.";
            
            case "giveNotEnoughInAccount":
                return ":x: <@" + data + ">" + " You don't have that many crystals in your account. As such, I can't complete the transfer.";
            
            case "giveNotAboveZero":
                return ":x: <@" + data + ">" + " In order for me to complete the transfer I need an amount above zero.";
            
            case "giveInvalidUser":
                return ":x: <@" + data + ">" + " I can't find that traveler. Sorry.";
            
            case "giveInvalidUserSelf":
                return ":x: <@" + data + ">" + " You can\'t send crystals to yourself. Sorry.";
            
            case "levelUp":
                var dialogOptions = [
                'I appreciate all of your help.',
                'Thank you for doing so much for the city.',
                'The other travelers are very grateful for your help.',
                'Your assistance is very much appreciated.',
                'Together we\'ve taken out most of the threats to city.',
                'The citizens of The Sanctum are most grateful.',
                'I cannot thank you enough for your help defending the city.'
                ];
                var randomNumber = Math.floor(Math.random() * dialogOptions.length);
                var wordToUse = "it";
                if (data3 > 1) { var wordToUse = "them";}
                return "You just hit **level " + data2 + "**! " + dialogOptions[randomNumber] + " I\'ve added a <:cannister:462046687058198530> **Nanotech Cannister** to your inventory so that you can upgrade your skills. You now have **" + data3 + "** total (you can check this any time with !stats). Use " + wordToUse + " wisely.";
            
            case "levelUpLevelCap":
                var dialogOptions = [
                'I appreciate all of your help.',
                'Thank you for doing so much for the city.',
                'The other travelers are very grateful for your help.',
                'Your assistance is very much appreciated.',
                'Together, we\'ve taken out most of the threats to city.',
                'The citizens of The Sanctum are most grateful.',
                'I cannot thank you enough for your help defending the city.'
                ];
                var randomNumber = Math.floor(Math.random() * dialogOptions.length);
                return "You\'re currently at **level " + data2 + "** which is the current level cap! " + dialogOptions[randomNumber] + " I\'ve added a <:cyphercrate:464135029036154950> **Cypher Crate** to your inventory. Hopefully it contains something useful for you on your journey. You now have **" + data3 + "** total (you can check this any time with !stats). Good luck. ";
            
            case "help":
                var temp = "*This world is strange and mysterious. And while I cannot help you on your journey or join your faction, I am here to help travelers to the best of my ability.* \n\nHere is what I can do for you:";
                temp += "\n\n";
                temp += "!checkin\n```Once per day, you may come see me for a daily sum in exchange for your help around the city.```";
                temp += "\n";
                temp += "!stats\n```I can share all of your stats and your crystal count information.```";
                temp += "\n";
                temp += "!give [AMOUNT] [@USER]\n```I can transfer some of your crystals to another traveler's account. Just make sure you have enough.```";
                temp += "\n";
                temp += "!help [@NAME]\n```I can tell you a little bit about some of the other people with us here on New Eden.```";
                temp += "\n";
                temp += "I hope this helps you on your journey, traveler.";
                return temp;
            
            case "helpMori":
                var temp = "*Mori is our resident head of the medbay. He can tend to your wounds and get you back on your feet. Here's what he can do:*";
                temp += "\n\n";
                temp += "!heal\n```Shows you Mori\'s available procedures for healing.```";
                temp += "\n";
                temp += "!heal [ITEM]\n```Purchases a procedure directly from him, and with his nanotech, takes effect immediately.```";
                return temp;
            
            case "helpGraze":
                var temp = "*Graze is our loveable augmentation expert. He can help you upgrade your skills and boost your abilities. Here's what he can do:*";
                temp += "\n\n";
                temp += "!upgrade\n```Shows you the available upgrades that Graze can provide with your Nanotech Cannisters.```";
                temp += "\n";
                temp += "!upgrade [STAT]\n```Upgrades this specific stat permanently.```";
                return temp;
            
            case "helpMosiah":
                var temp = `*Mosiah was exiled from our great city for many counts of misconduct, but it\'s been said he\'s been seen at <#${process.env.TAVERN_CHANNEL_ID}>. I recommend you not deal with him at all, but should you need to, here\'s what he can do:*`;
                temp += "\n\n";
                temp += "!wager [AMOUNT]\n```Wagers your crystals in a primative coin flip bet. Winner takes all.```";
                return temp;
            
            case "helpRavager":
                var temp = `*The Ravagers have been hunting us since crashing here on New Eden. They roam this planet and will attack travelers on sight. But you can defend yourself:*`;
                temp += "\n\n";
                temp += "!attack\n```Sends your weapon towards an active Ravager. If you win the fight, you can loot their corpse for crystals. But be careful: they bite back.```";
                temp += "\n";
                temp += "!details\n```Shows you the details of the last Ravager fight to take place as well as the crystal distribution.```";
                return temp;
            
            case "helpSonya":
                var temp = "*Professor Sonya is our resident archeologist, and she is fascinated by this world. Scavenge for some artifacts in the outskirts of the city, and she will apy you handsomely.*";
                temp += "\n\n";
                temp += "!scavenge\n```In #🌘the-outskirts, this allows you to look for rare artifacts for the professor.```";
                temp += "\n";
                temp += "!artifacts\n```Shows you the current artifacts that you have in your inventory.```";
                temp += "\n";
                temp += "!artifacts sell\n```Shows you the current prices that the professor is willing to pay for any artifacts that you may find.```";
                temp += "\n";
                temp += "!artifacts sell [TYPE]\n```Sells all of the artifacts that you have of that type to the professor, at current prices.```";
                return temp;
            
            case "helpRey":
                var temp = "*Rey is a master of finding things that we need around the city. Resources are scarce, so anything you can help her find in <#462382076927148054> would be most helpful.*";
                temp += "\n\n";
                temp += "!scavenge\n```In #🌘the-outskirts, this allows you to look for materials and resources with Rey.```";
                temp += "\n";
                temp += "!materials\n```Shows you the current materials that you have in your inventory.```";
                return temp;
            
            case "helpAlexis":
                var temp = "*Alexis is our top-of-the-line chemist who uses her talents to reward travelers with a nice and relaxing space. She\'d be happy to have or provide you with some company.*";
                temp += "\n\n";
                temp += "!buydrink\n```In #🍺travelers-watch, this allows you to buy a drink and relax.```";
                temp += "\n";
                temp += "!buydrink [@NAME]\n```In #🍺travelers-watch, you can buy a drink for a friend.```";
                temp += "\n";
                temp += "!tip [AMOUNT]\n```In #🍺travelers-watch, you can tip her for her great service. She might just give you a tip back.```";
                return temp;
            
            //Status commands
            case "accountCheck":
                return "<@" + data + ">" + " you currently have " + data2 + " crystals in your account.";
            
            case "bankCheck":
                return "Currently, " + data + " has " + data2 + " crystals total in their bank.";
            
            case "victors":
                return "Currently, " + data + " controls the fate of the codex.";
            
            case "noVictors":
                return "The fate of the codex is still undetermined.";
            
            // Obsidian Technologies (Former Order)
            case "orderAlreadyJoined":
                return ":x: <@" + data + ">" + " The Obsidian Technologies already has your allegiance. There's no need to request a change.";
            case "orderJoin":
                //codexLogEvent(data + " joined Genesis Command.");
                return "<@" + data + ">" + " you have joined the Obsidian Technologies. May peace reign upon your cause.";
    
            // Genesis Command (Former Anarchy)
            case "anarchyAlreadyJoined":
                return ":x: <@" + data + ">" + " The Genesis Command has already begun their chaos with you by their side. There's no need to request a change.";
            case "anarchyJoin":
                //codexLogEvent(data + " joined Obsidian Technologies.");
                return "<@" + data + ">" + " you have joined the Genesis Command. May chaos come to those who oppose you."; 
            
            // The Hand (Former Religion)
            case "religionAlreadyJoined":
                return ":x: <@" + data + ">" + " The Hand is happy to have you in their congregation already. There's no need to request a change.";
            case "religionJoin":
                //codexLogEvent(data + " joined The Hand.");
                return "<@" + data + ">" + " you have joined The Hand. May the gods look favorably upon you.";
    
            //Onboarding
            case "newUserWelcome":
                messageToSend = "<@" + data + ">" + " welcome to " + data2 + ". If you need me for anything, you can contact me via this secure channel. Just use **!help** for a list of things I can do for you.";
                messageToSend += "\n\nAnd don\'t forget to say hello to fellow travelers in ";
                if (data2 == "Genesis Command") {
                    messageToSend += `${process.env.GROUP_B_BOT_ID}.`;
                }
                if (data2 == "Obsidian Technologies") {
                    messageToSend += `${process.env.GROUP_A_BOT_ID}.`;
                }
                if (data2 == "The Hand") {
                    messageToSend += `${process.env.GROUP_C_BOT_ID}.`;
                }
                return messageToSend;
            case "newUserPM":
                var messageToSend = '';
                messageToSend = "_Traveler, welcome to The Sanctum.";
                messageToSend += "\n\n";
        
                if (data2 == "Genesis Command") {
                    messageToSend += "I see that you've joined **Genesis Command**. The least reckless of the 3 factions, I can see why you'd pick them. You clearly understand that The Codex is a very powerful book, and should you be victorious, no one will have access to it\'s secrets. ";
                }
                if (data2 == "Obsidian Technologies") {
                    messageToSend += "I see that you've joined **Obsidian Technologies**. While they are the most chaotic of the 3 factions, I can see why you'd pick them. The Codex is a very powerful book, and should you be victorious, everyone will have equal access to it\'s secrets. ";
                }
                if (data2 == "The Hand") {
                    messageToSend += "I see that you've joined **The Hand**. While they are certainly the most suspicious of the 3 factions, I can see why you'd pick them. The Codex is a very powerful book, and should you be victorious, it is your job to guide the rest of the city using it\'s secrets.";
                }
                messageToSend += "\n\n";
                messageToSend += "I'll get you patched up and give you access to our team to upgrade skills and meet the others. There's just a few things I need you to take care of around the city:_";
                messageToSend += "\n\n";
                messageToSend += "**!checkin** with me daily.\n```Once a day I'll give you your daily allotment of crystals in exchange for some help around the city.```";
                messageToSend += "\n";
                messageToSend += "**!attack** any Ravagers in #the-deadlands.\n```With the constant bombardment from the enemies of the city, It\'s hard to keep us safe. I need your help```";
                messageToSend += "\n";
                messageToSend += "_Good luck. I'll be around if you need me._";
                return messageToSend;
            //Lore
            case "intro":
                var tempLore = '';
                tempLore = "_Hello weary traveler.";
                tempLore += "\n\n";
                tempLore += "My name is A.D.A.M. and I would like to offer you the amenities of The Sanctum. However, I cannot come to your aid until you choose a faction. I am dearly sorry to be so blunt and put trivial human rules in place over your sustenance and safety, but this is the only way to protect The Codex. But the Codex no longer exists since the Librarian destroyed it, so make something up, player.";
                tempLore += " Your choices are as follows:_";
                return tempLore;
            case "introHand":
                var tempLore = "<:religionhand:461582719051104276> **<@&" + process.env.GROUP_C_ROLE + ">** - !hand\n```Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum eu aliquet mauris, id congue nisi. Integer et lobortis tellus. Sed bibendum a metus quis volutpat. Mauris faucibus quam at euismod scelerisque. Vestibulum a elit auctor, venenatis augue in, rhoncus nisi. Mauris sagittis sit amet ante eget luctus. Maecenas id malesuada elit. Vestibulum nec ante nec justo venenatis tincidunt.```";
                return tempLore;
            case "introGenesis":
                var tempLore = "<:order:460991638152413194> **<@&" + process.env.GROUP_B_ROLE + ">** - !genesis\n```Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum eu aliquet mauris, id congue nisi. Integer et lobortis tellus. Sed bibendum a metus quis volutpat. Mauris faucibus quam at euismod scelerisque. Vestibulum a elit auctor, venenatis augue in, rhoncus nisi. Mauris sagittis sit amet ante eget luctus. Maecenas id malesuada elit. Vestibulum nec ante nec justo venenatis tincidunt. ```";
                return tempLore;
            case "introObsidian":
                var tempLore = "<:anarchy:460990297099337750> **<@&" + process.env.GROUP_A_ROLE + ">** - !obsidian\n```Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum eu aliquet mauris, id congue nisi. Integer et lobortis tellus. Sed bibendum a metus quis volutpat. Mauris faucibus quam at euismod scelerisque. Vestibulum a elit auctor, venenatis augue in, rhoncus nisi. Mauris sagittis sit amet ante eget luctus. Maecenas id malesuada elit. Vestibulum nec ante nec justo venenatis tincidunt.```";
                return tempLore;
            case "introEnd":
                var tempLore = "_Choose wisely._";
                return tempLore;
            case "level1":
                var tempLore = '';
                tempLore += `Congratulations ${data}, you have reached **${data2}**! Travelers defend the city from Ravagers here, and you can earn some crystals.`
                return tempLore;
            case "level15":
                var tempLore = '';
                tempLore += `Congratulations ${data}, you have reached **${data2}**, where there are more dangerous enemies, lurking in the fog.`
                return tempLore;
            case "level30":
                var tempLore = '';
                tempLore += `Congratulations ${data}, you have reached **${data2}**, the area most teeming with the strongest Ravagers. Watch your back, and good luck!`
                return tempLore;
            case "lore":
                var tempLore = '';
                switch(data) {
                    case "backstory":
                        tempLore = "‘_Mother Earth had failed us. ";
                        tempLore += "\n\n";
                        tempLore += "In her dying breath, she bore a starship, **The Genesis**, to save the last of humankind. But the **travelers** aboard were not prepared for the unwelcoming winds of barren space.";
                        tempLore += "\n\n";
                        tempLore += "On the brink of extinction our forefathers landed here, but this was no earth. The desolate landscape of **The Deadlands** traded our starvation for thirst, our isolation for open and empty space. But despite our struggles, we could breathe again.";
                        tempLore += "\n\n";
                        tempLore += "We walked for many days and many nights in **The Deadlands**, consuming only the native **crystals** climbing from the ground for sustenance. Leaving the shelter of our vessel behind for the hope of a new home. Many withered away under the scorching heat of the twin suns and the constant attacks from **Ravagers**, but Mother Earth kept her promise.";
                        tempLore += "\n\n";
                        tempLore += "In our darkest hour, we laid eyes on **The Sanctum**, a city of the gods. Complete with a vault full of our edible crystals, and more than enough room for the entire population; A city with human amenities in the middle of an inhuman world, bestowed upon a dying nation in need. This place was truly a divine gift.";
                        tempLore += "\n\n";
                        tempLore += "At the highest point of the city in the tower that touched the clouds, we found **The Librarian**. A meticulous mechanical record keeper hovering over his book, the great **Codex Arcana**. This was a book written in detail to record the actions of every man, woman, and child that lived among us. But it was far too powerful, and the secrets it contained proved lethal in the wrong hands.";
                        tempLore += "\n\n";
                        tempLore += "And so began the **factions**, vying for control over the Codex._'";
                        tempLore += "\n\n";
                        tempLore += "- Excerpt from the **Teachings of Tiberius**. March 22, 2630.";
                    break;
                    case "genesis":
                        tempLore = "Sorry. I recognize the term but am unable to process the request. There is a corruption in my cognitive core. Try again soon.";
                    break;
                    case "travelers":
                        tempLore = "Sorry. I recognize the term but am unable to process the request. There is a corruption in my cognitive core. Try again soon.";
                    break;
                    case "deadlands":
                        tempLore = "Sorry. I recognize the term but am unable to process the request. There is a corruption in my cognitive core. Try again soon.";
                    break;
                    case "ravager":
                        tempLore = "Sorry. I recognize the term but am unable to process the request. There is a corruption in my cognitive core. Try again soon.";
                    break;
                    case "Sanctum":
                        tempLore = "Sorry. I recognize the term but am unable to process the request. There is a corruption in my cognitive core. Try again soon.";
                    break;
                    case "librarian":
                        tempLore = "Sorry. I recognize the term but am unable to process the request. There is a corruption in my cognitive core. Try again soon.";
                    break;
                    case "codex":
                        tempLore = "Sorry. I recognize the term but am unable to process the request. There is a corruption in my cognitive core. Try again soon.";
                    break;
                    case "factions":
                        tempLore = "Sorry. I recognize the term but am unable to process the request. There is a corruption in my cognitive core. Try again soon.";
                    break;
                    default:
                        tempLore = "Here is the lore that is available in my database. ```!lore backstory```"
                    break
                }
                console.log("TEMPLORE: " + tempLore);
                return tempLore;
        }
    }
}
