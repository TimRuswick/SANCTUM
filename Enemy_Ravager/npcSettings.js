require('dotenv').config({path: '../.env'});

module.exports = {
    name: "ravager",
    activity: "Prowling...",
    type: "PLAYING",
    token: process.env.RAVAGER_TOKEN,
    botChannel: process.env.DEADLANDS_CHANNEL_ID
}
