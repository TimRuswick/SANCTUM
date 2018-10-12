require('dotenv').config({path: '../.env'});

module.exports = {
    activity: "for !genesis recruits.",
    type: "WATCHING",
    token: process.env.MONTGOMERY_GENESIS_TOKEN,
    botChannel: process.env.GROUP_B_BOT_ID
}