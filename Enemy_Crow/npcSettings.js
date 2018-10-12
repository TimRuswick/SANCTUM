require('dotenv').config({path: '../.env'});

module.exports = {
    id: "crow",
    activity: "Cawing in the distance...",
    type: "PLAYING",
    token: process.env.CROW_TOKEN,
    botChannel: process.env.CRYSTAL_SHORES
}
