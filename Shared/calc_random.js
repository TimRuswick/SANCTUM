//initialize the exports
exports = module.exports = {};

//Random
//low - the inclusive lower bounds of the result
//high - the inclusive higher bounds of the result
exports.Random = function(low, high) {
	//inclusive high
	return Math.floor(Math.random() * (high - low + 1) + low);
}

//Gamble (depreciated)
//percentage - chance of winning as a percentage
exports.Gamble = function(percentage) {
	// Random generation by %
	return exports.Random(1, 100) <= percentage;
}
