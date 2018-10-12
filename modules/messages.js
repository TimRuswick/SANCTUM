// Do not use, no client reference

module.exports = {
    sendMessage: function(userID, channelID, message) {
        // Handle optional first argument (so much for default arugments in node)
        if (message == undefined) {
            message = channelID;
            channelID = userID;
            userID = null;
        }

        // Utility trick (@userID with an optional argument)
        if (userID != null) {
            message = "<@" + userID + "> " + message
        }
        
        // Sends message (needs client var, therefore I think external script won't work)
        client.channels.get(channelID).send(message);
    }
}