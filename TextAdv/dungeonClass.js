// Dungeons
module.exports = class DungeonRaidInstance {
    constructor(room, players) {
        this.room = room;
        this.players = players;
        this.location;
        this.state = DungeonState.WAITING_FOR_USERS;
        this.dialogObj;
        this.isTyping;
    }
}