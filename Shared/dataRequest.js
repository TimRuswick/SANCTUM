// Initialize the exports
exports = module.exports = {};

const path = require('path');
require('dotenv').config({path: path.join(__dirname, "../.env")});
const request = require("sync-request");

/**
 * Loads server data from PHP
 * @param  {string} dataType
 * @param  {any} usersID=""
 */
exports.loadServerData = function(dataType, usersID = "") {
	let link = `${process.env.SERVER_ADDRESS}/getData.php?pk=${process.env.SERVER_PASS_KEY}&dataType=${dataType}&userid=${usersID}`;
	let response = request("GET", link);
	console.log("[LoadSData] " + link);
	return response.getBody();
}

// Has to be kept in this order for simplicity with PHP for now
/**
 * @param  {string} dataType
 * @param  {any} dataToSend=""
 * @param  {any} usersID=""
 * @param  {any} dataToSend2=""
 */
exports.sendServerData = function(dataType, dataToSend = "", usersID = "", dataToSend2 = "") {
	let link = `${process.env.SERVER_ADDRESS}/sendData.php?pk=${process.env.SERVER_PASS_KEY}&dataType=${dataType}&userid=${usersID}&dataToSend=${dataToSend}&dataToSend2=${dataToSend2}`;
	let response = request("GET", link);
	console.log("[SendSData] " + link);
	return response.getBody();
}

// Send Post Data is a different PHP file, but has many similarities
exports.sendAttackData = function(dataType, dataToSend, dataToSend2 = '') {
	let link = `${process.env.SERVER_ADDRESS}/sendPostData.php?pk=${process.env.SERVER_PASS_KEY}&dataType=${dataType}&dataToSend=${dataToSend}&dataToSend2=${dataToSend2}`;
    let response = request('GET', link);
	console.log("[SendAData] " + link);
    return response.getBody();
}