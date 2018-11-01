# ![SANCTUM Logo](https://i.imgur.com/yZI3Am9.png) SANCTUM
[![SANCTUM Discord](https://img.shields.io/badge/sanctum-discord-%237289DA.svg?logo=discord)](https://discord.gg/D7dyrVn)
[![SANCTUM Developers](https://img.shields.io/badge/sanctum-developers-%237289DA.svg?logo=discord)](https://discord.gg/mP98ZYv)
# What is SANCTUM?
SANCTUM is an open-source Discord MMO, with 200+ players.

## Useful Links
- [Sanctum Offical Game Server](https://discord.gg/D7dyrVn)
- [Sanctum Testing Server](https://discord.gg/S7zyhu6)
- [Sanctum Developer's Discord](https://discord.gg/mP98ZYv)
- [Trello Project Board](https://trello.com/invite/b/CFq8uUP4/b306a7335528325ce2b412146de7e4b9/sanctum-developer-board)
- [Sanctum Wiki](https://sanctum-discord.wikia.com/wiki/Sanctum_Wiki)
- [Game Design Document](https://docs.google.com/document/d/10MfsbZ1tsGXD2Pg9y6c3JygSEUY1V-VsseY508HAhME/)
# Run the Bots
## Requirements:
You will need:
- [Node.js](https://nodejs.org/en/) (recommended v8.12.0 LTS)

Install this first before going through the steps!

## Steps
1. Clone the repo. 

    You can use programs like [Git](https://git-scm.com/), [SourceTree](https://www.sourcetreeapp.com/) or simply download the project, although you won't be able to submit changes as easily.

    ```bash
    # With Git installed, you can do this command
    git clone https://github.com/TimRuswick/SANCTUM
    ```

2. Rename the `.envdev` file to `.env`, and fill out tokens and channels. 

    On Windows, you will get an error message about having to give the .env file a name. You can circumvent it by adding an extra period to the file name. 
    
    **RENAME IT TO `.env.` WITH AN EXTRA PERIOD**, and Windows will automatically remove it for you! Poof, it's like magic.

    Don't place any of your tokens in `.envdev`, and push them to GitHub! If you do though, consider them compromised and then reset them. 

3. Navigate via command-line to a bot's folder, install dependencies, and run it!

    Make sure you're in the project folder!
    On Windows, you can hold Shift and Right Click the folder to get the option of a command prompt, inside that folder.
    ```bash
    cd "SANCTUM"    # Navigate to project folder
    npm i           # For modules dependencies
    cd "ADAM"   # Choose a bot
    npm i           # Install dependencies
    node adam.js    # Run the bot
    ```

4. ???

5. Profit! You did it, unless something has happened along the way. ~~Developer luck says yes.~~

## Quality of Life

We recommend [nodemon](https://nodemon.io/) for reloading bots automatically, instead of `Ctrl+C`ing in and out of bots when you need a restart. Totally optional, and you can use whatever workflow you like.

# Join the SANCTUM Development Team
We're looking for:
- Discord.js programmers
- Artists 
- Writers
- Designers
- Producers
- and Testers! 

Join the [SANCTUM Developers](https://discord.gg/mP98ZYv) Discord for more info!

# Common Errors
> Cannot find module 'dotenv'

> Cannot find module 'sync-request'

You need to run `npm i` in order to have npm install the modules for you, according to the package.json in the folder. Run this command in two places.

1. The bot folder you're trying to run it from (should fix dotenv error)
2. The root folder of the repo (should fix sync-request error)

> UnhandledPromiseRejectionWarning: Error: An invalid token was provided.

This may likely be that you didn't rename `.envdev` to `.env`. Scroll up for instructions on how to do so on Windows, and avoid the error message when not giving a name to a file.

Make sure you also fill in your tokens and fields too!


## Any questions or problems?
Feel free to join the [SANCTUM Developers](https://discord.gg/mP98ZYv) Discord for help on how to setup the bots, we won't bite! I think. You can also use the Issues tab here on GitHub!
