require('dotenv').config({path: '../.env'});

module.exports = {
    isBotChannel: function(channelID) {
        // Insert new channels here
        var botChannels = [
            process.env.GROUP_A_BOT_ID,
            process.env.GROUP_B_BOT_ID,
            process.env.GROUP_C_BOT_ID,
            process.env.TEST_CHANNEL_ID
        ];

        // Apparently Outskirts was in the discord.io code, add that if needed
        
        for (let index = 0; index < botChannels.length; index++) {
            const element = botChannels[index];
            if (channelID == element) return true;
        }
        
        return false;
    },

    isRaidChannel: function(channelID) {
        // Insert new channels here
        var raidChannels = [
            process.env.HELLS_GATE_CHANNEL_ID
        ];

        for (let index = 0; index < raidChannels.length; index++) {
            const element = raidChannels[index];
            if (channelID == element) return true;
        }
    }
}