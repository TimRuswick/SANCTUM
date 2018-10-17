CREATE TABLE discordbot.userLog (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    discordUserID bigint,
    actionTime TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    actionType varchar(16),
    actionData varchar(255)
);

CREATE TABLE discordbot.users (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    discordUserID bigint,
    timeJoined TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    wallet int,
    speed int NOT NULL DEFAULT 5,
    health int NOT NULL DEFAULT 100,
    maxHealth int NOT NULL DEFAULT 100,
    strength int NOT NULL DEFAULT 5,
    stamina int NOT NULL DEFAULT 5,
    maxStamina int NOT NULL DEFAULT 5,
    xp int NOT NULL DEFAULT 0,
    lvl int NOT NULL DEFAULT 0,
    statPoints int NOT NULL DEFAULT 0
);

CREATE TABLE discordbot.factions (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    discordRoleID bigint,
    discordRoleName varchar(16),
    account int,
    isCurrentVictor bool
);

CREATE TABLE discordbot.hostiles (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    timeCreated TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    hostileName varchar(32),
    hostileType varchar(32),
    maxHealth int NOT NULL DEFAULT 100,
    health varchar(16) NOT NULL DEFAULT 100,
    strength int NOT NULL DEFAULT 10,
    speed int NOT NULL DEFAULT 10,
    stash int NOT NULL DEFAULT 10,
    alive bool NOT NULL DEFAULT 0,
    fled bool NOT NULL DEFAULT 0,
    claimID varchar(4)
);

CREATE TABLE discordbot.attackLog (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    timeAttacked TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    discordUserID bigint,
    hostileID varchar(16),
    damage int NOT NULL DEFAULT 0
);


CREATE TABLE discordbot.artifacts (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    discordUserID bigint,
    scrap int NOT NULL DEFAULT 0,
    common int NOT NULL DEFAULT 0,
    uncommon int NOT NULL DEFAULT 0,
    rare int NOT NULL DEFAULT 0,
    ultrarare int NOT NULL DEFAULT 0
);

CREATE TABLE discordbot.artifactEvents (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    timeStarted TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    eventType varchar(16) NOT NULL DEFAULT "default",
    eventLevel int NOT NULL DEFAULT 0
);



CREATE TABLE discordbot.lootPool (
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    created TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    name varchar(128) NOT NULL DEFAULT "default",
    gearType varchar(16) NOT NULL DEFAULT "weapon",
    subType varchar(16) NOT NULL DEFAULT "melee",
    baseLvl int NOT NULL DEFAULT 0,
    baseAtk int NOT NULL DEFAULT 0,
    baseDef int NOT NULL DEFAULT 0,
    rarity int NOT NULL DEFAULT 0,
    perksAvailable varchar(16) NOT NULL DEFAULT "none",
    eventLevel int NOT NULL DEFAULT 0
);
