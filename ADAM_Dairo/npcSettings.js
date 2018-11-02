require('dotenv').config({path: '../.env'});

module.exports = {
	activity: "for !hand recruits.",
	type: "WATCHING",
	token: process.env.DAIRO_HAND_TOKEN,
	botChannel: process.env.GROUP_C_BOT_ID
}
