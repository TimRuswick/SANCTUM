require('dotenv').config({path: '../.env'});

module.exports = {
	activity: "for the signal.",
	type: "WATCHING",
	token: process.env.LIBRARIAN_TOKEN,
}