require('dotenv').config({path: '../.env'});

module.exports = {
    activity: "for !obsidian recruits.",
    type: "WATCHING",
    token: process.env.KAMALA_OBSIDIAN_TOKEN,
    botChannel: process.env.GROUP_A_BOT_ID
}
