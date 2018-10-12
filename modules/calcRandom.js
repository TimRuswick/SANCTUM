module.exports = {
    // Changed it from exclusive high to inclusive high
    random: function(low, high) { 
        return Math.floor(Math.random() * (high - low + 1) + low);
    },

    randomExc: function(low, high) {
        return Math.floor(Math.random() * (high - low) + low);
    },
    
    // Random generation by %
    gamble: function(percentage) {
        // I found out that it wasn't acutally entirely accurate (0.1 difference)
        // So I changed it to be 1 to 100, and have a <= instead of <
        // I calculated it with PineTools and a small JS script to calculate it.
        // Feel free to change it!
        var winState = Math.floor(module.exports.random(1, 100));
        //var winState = Math.floor(module.exports.random(0, 101));

        if (winState <= percentage) {
        // if (winState < percentage)
            return true;
        } else {
            return false;
        }
    }
}