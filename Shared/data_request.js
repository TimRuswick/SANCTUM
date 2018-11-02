//initialize the exports
exports = module.exports = {};

require("dotenv").config({path: "../.env"});
let request = require("sync-request");

exports.LoadServerData = function(dataType, usersID = "") {
	let response = request("GET", `${process.env.SERVER_ADDRESS}/getData.php?pk=${process.env.SERVER_PASS_KEY}&dataType=${dataType}&userid=${usersID}`);
//	console.log(response.getBody());
	return response.getBody();
}

exports.SendServerData = function(dataType, usersID = "", dataToSend="", dataToSend2 = ""){
	let response = request("GET", `${process.env.SERVER_ADDRESS}/sendData.php?pk=${process.env.SERVER_PASS_KEY}&dataType=${dataType}&userid=${usersID}&dataToSend=${dataToSend}&dataToSend2=${dataToSend2}`);
//	console.log(response.getBody());
	return response.getBody();
}
