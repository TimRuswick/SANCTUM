module.exports = class PlayerClass {
    constructor (userID, factionID, combatClass, badge, leader) {
        this.userID = userID;
        this.factionID = factionID;
        this.combatClass = combatClass;
        this.badge = badge;
        this.leader = leader;
        this.commander;
    }

    get factionEmote() {
        //server.members.get(factionID).roles.has(process.env.GROUP_A_ROLE)
        // Obsidian Tech
        if (this.factionID === process.env.GROUP_A_ROLE) {
            return "<:anarchy:460990297099337750>"
        // Genesis Command
        } else if (this.factionID === process.env.GROUP_B_ROLE) {
            return "<:order:460991638152413194>";
        // The Hand
        } else if (this.factionID === process.env.GROUP_C_ROLE) {
            return "<:religionhand:461582719051104276>"
        // No faction
        } else if (this.factionID === "none") {
            return ":beginner:";
        // Unknown
        } else {
            return ":grey_question:";
        }
    }  

    // Combat Class emote
    get combatClassEmote() {
        if (this.combatClass.toLowerCase() === "tank") {
            return ":shield:";
        } else if (this.combatClass.toLowerCase() === "rogue") {
            return ":dagger:";
        } else if (this.combatClass.toLowerCase() === "dps melee") {
            return ":crossed_swords:";
        } else if (this.combatClass.toLowerCase() === "support") {
            return ":heart:";
        } else if (this.combatClass.toLowerCase() === "dps range") {
            return ":bow_and_arrow:";
        } else {
            return ":grey_question:";
        }
    }

    get isLeaderText() {
        if (this.leader) {
            return "(Leader)";
        } else if (this.commander) {
            return "(Commander)";
        } else {
            return "";
        }
    }
} 