require('dotenv').config({path: '../.env'});

module.exports = {
    activity: "Automated Data Analysis Machine.",
    type: "PLAYING",
    token: process.env.ADAM_TOKEN,
    botChannel: "default"
}
