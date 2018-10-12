require('dotenv').config({path: '../.env'});

module.exports = {
    id: "wolf",
    activity: "OwOing... Totally not placeholder.",
    type: "PLAYING",
    token: process.env.WOLF_TOKEN,
    botChannel: process.env.SEA_OF_FOG_CHANNEL_ID
}
