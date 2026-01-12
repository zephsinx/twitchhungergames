const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const NoitaGame = require("./game");

const config = JSON.parse(
  fs.readFileSync(path.join(__dirname, "config.json"), "utf8")
);
const eventsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "events.json"), "utf8")
);
const itemsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "items.json"), "utf8")
);
const materialsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "materials.json"), "utf8")
);
const eventHandlers = require("../event-handlers.js");

const dbPath = path.join(__dirname, "data");
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

const db = new Database(path.join(dbPath, "noita-games.db"));

db.exec(`
    CREATE TABLE IF NOT EXISTS player_stats (
        user_id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        wins INTEGER DEFAULT 0,
        kills INTEGER DEFAULT 0,
        deaths INTEGER DEFAULT 0,
        max_days INTEGER DEFAULT 0,
        total_days INTEGER DEFAULT 0,
        games_played INTEGER DEFAULT 0,
        max_kills_single_game INTEGER DEFAULT 0
    )
`);

// Migration: Add max_kills_single_game column if it doesn't exist
try {
  db.exec(
    `ALTER TABLE player_stats ADD COLUMN max_kills_single_game INTEGER DEFAULT 0`
  );
  console.log("Added max_kills_single_game column to existing database");
} catch (e) {
  // Column already exists, ignore error
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const adjectives = [
  "Iron",
  "Silver",
  "Golden",
  "Dusky",
  "Silent",
  "Swift",
  "Fierce",
  "Mystic",
  "Crimson",
  "Shadow",
];
const nouns = [
  "Wolf",
  "Raven",
  "Phoenix",
  "Dragon",
  "Saber",
  "Viper",
  "Falcon",
  "Stalker",
  "Hunter",
  "Wraith",
];

function randomName() {
  return (
    adjectives[Math.floor(Math.random() * adjectives.length)] +
    nouns[Math.floor(Math.random() * nouns.length)] +
    Math.floor(Math.random() * 1000)
  );
}

function initPlayerStats(userId, username) {
  const stmt = db.prepare("SELECT user_id FROM player_stats WHERE user_id = ?");
  const existing = stmt.get(userId);

  if (!existing) {
    const insert = db.prepare(`
            INSERT INTO player_stats (user_id, username, wins, kills, deaths, max_days, total_days, games_played, max_kills_single_game)
            VALUES (?, ?, 0, 0, 0, 0, 0, 0, 0)
        `);
    insert.run(userId, username);
  } else {
    const update = db.prepare(
      "UPDATE player_stats SET username = ? WHERE user_id = ?"
    );
    update.run(username, userId);
  }
}

function updatePlayerStats(userId, updates) {
  const existing = db
    .prepare("SELECT * FROM player_stats WHERE user_id = ?")
    .get(userId);
  if (!existing) return;

  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key === "increment") {
      for (const [field, amount] of Object.entries(value)) {
        fields.push(`${field} = ${field} + ?`);
        values.push(amount);
      }
    } else if (key === "set") {
      for (const [field, val] of Object.entries(value)) {
        fields.push(`${field} = ?`);
        values.push(val);
      }
    }
  }

  if (fields.length > 0) {
    const sql = `UPDATE player_stats SET ${fields.join(", ")} WHERE user_id = ?`;
    values.push(userId);
    db.prepare(sql).run(...values);
  }
}

let currentGame = null;
let joinedPlayers = new Map();
let joinTimer = null;
let gameRunning = false;
let recruitingPlayers = false;
let startImmediately = false;

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Auto-start a game immediately on startup
  if (startImmediately) await autoStartGames();

  // Schedule games to start at the top of every hour
  function scheduleNextHourlyGame() {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    const msUntilNextHour = nextHour - now;

    setTimeout(async () => {
      if (!gameRunning && !recruitingPlayers && joinedPlayers.size === 0) {
        await autoStartGames();
      }
      scheduleNextHourlyGame(); // Schedule the next one
    }, msUntilNextHour);
  }

  scheduleNextHourlyGame();
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase().trim();

  if (content === ".startgames") {
    await handleStartGames(message);
  } else if (content === ".join") {
    await handleJoin(message);
  } else if (content === ".stopgames") {
    await handleStopGames(message);
  } else if (content === ".players") {
    await handlePlayerList(message);
  } else if (content === ".addfake" || content === ".fakewitches") {
    await handleAddFake(message);
  } else if (content.startsWith(".leaderboard") || content.startsWith(".lb")) {
    await handleLeaderboard(message);
  } else if (content.startsWith(".ngstats")) {
    await handleStats(message);
  }
});

async function handleStartGames(message) {
  if (message.channel.id !== config.commandChannelId) return;

  const member = message.member;
  if (
    !member.permissions.has(PermissionFlagsBits.ModerateMembers) &&
    !member.permissions.has(PermissionFlagsBits.Administrator)
  ) {
    await message.reply("You need moderator permissions to start the games.");
    return;
  }

  if (gameRunning || recruitingPlayers || joinTimer || joinedPlayers.size > 0) {
    await message.reply(
      "The Noita Games are already in progress or recruiting players. Use `.stopgames` to cancel it first."
    );
    return;
  }

  recruitingPlayers = true;

  joinedPlayers.clear();

  const arenaChannel = await client.channels.fetch(config.arenaChannelId);
  if (!arenaChannel) {
    await message.reply("Arena channel not found. Check your config.");
    return;
  }

  const announceEmbed = new EmbedBuilder()
    .setTitle("The Noita Games are about to begin!")
    .setDescription(
      `Type '.join' in <#${config.commandChannelId}> to volunteer as a tribute!`
    )
    .setColor(0x9b59b6);

  await arenaChannel.send({ embeds: [announceEmbed] });
  await message.reply(
    "The games have been announced! Waiting for tributes to join..."
  );

  checkForMinPlayers();
}

async function autoStartGames() {
  try {
    recruitingPlayers = true;
    joinedPlayers.clear();

    const arenaChannel = await client.channels.fetch(config.arenaChannelId);
    if (!arenaChannel) {
      console.error("Arena channel not found. Check your config.");
      return;
    }

    const announceEmbed = new EmbedBuilder()
      .setTitle("The Noita Games are about to begin!")
      .setDescription(
        `Type '.join' in <#${config.commandChannelId}> to volunteer as a tribute!`
      )
      .setColor(0x9b59b6);

    await arenaChannel.send({ embeds: [announceEmbed] });
    console.log("Auto-started Noita Games");

    checkForMinPlayers();
  } catch (error) {
    console.error("Error auto-starting games:", error);
    recruitingPlayers = false;
  }
}

function checkForMinPlayers() {
  if (joinedPlayers.size >= config.minPlayers && !joinTimer) {
    startJoinTimer();
  }
}

function startJoinTimer() {
  const timerMs = config.joinTimerSeconds * 1000;

  joinTimer = setTimeout(async () => {
    joinTimer = null;
    await startGame();
  }, timerMs);

  console.log(`Join timer started: ${config.joinTimerSeconds / 60} minutes`);
}

async function startGame() {
  if (joinedPlayers.size < config.minPlayers) {
    const arenaChannel = await client.channels.fetch(config.arenaChannelId);
    const cancelEmbed = new EmbedBuilder()
      .setTitle("Games Cancelled")
      .setDescription(
        `Not enough tributes joined. Need at least ${config.minPlayers} players.`
      )
      .setColor(0xe74c3c);
    await arenaChannel.send({ embeds: [cancelEmbed] });
    resetGameState();
    return;
  }

  gameRunning = true;
  recruitingPlayers = false;

  const participants = Array.from(joinedPlayers.entries()).map(
    ([id, name]) => ({
      id,
      username: name,
      alive: true,
      kills: 0,
      deathDay: null,
    })
  );

  currentGame = new NoitaGame(
    eventsData,
    itemsData,
    materialsData,
    participants
  );

  const arenaChannel = await client.channels.fetch(config.arenaChannelId);
  await runGameLoop(arenaChannel);
}

async function runGameLoop(arenaChannel) {
  const eventDelay = config.eventDelaySeconds * 1000;
  const phaseTitleDelay = config.phaseTitleDelaySeconds * 1000;
  const phaseDelay = config.phaseDelaySeconds * 1000;

  while (currentGame.getAliveCount() > 1 && gameRunning) {
    const phaseInfo = currentGame.getNextPhaseInfo();

    const phaseEmbed = new EmbedBuilder()
      .setTitle(phaseInfo.title)
      .setDescription(phaseInfo.description)
      .setColor(parseInt(phaseInfo.color.replace("#", ""), 16));

    await arenaChannel.send({ embeds: [phaseEmbed] });
    await sleep(phaseTitleDelay);

    const events = currentGame.runPhase();

    for (const event of events) {
      if (event.hidden) continue;

      const eventEmbed = new EmbedBuilder()
        .setDescription(event.text)
        .setColor(event.fatal ? 0xe74c3c : 0x3498db);

      await arenaChannel.send({ embeds: [eventEmbed] });
      await sleep(eventDelay);
    }

    const fallen = currentGame.getFallenThisPhase();
    if (fallen.length > 0 && currentGame.shouldShowFallen()) {
      const fallenEmbed = new EmbedBuilder()
        .setTitle(`Fallen Witches`)
        .setDescription(
          `${fallen.length} nuke${fallen.length !== 1 ? "s" : ""} can be heard going off in the distance.\n\n${fallen.map((name) => `- ${currentGame.getDisplayName(name)}`).join("\n")}`
        )
        .setColor(0x95a5a6);

      await arenaChannel.send({ embeds: [fallenEmbed] });
      await sleep(eventDelay);
    }

    currentGame.advancePhase();

    if (currentGame.getAliveCount() > 1) {
      await sleep(phaseDelay);
    }
  }

  await showResults(arenaChannel);
}

async function showResults(arenaChannel) {
  const survivors = currentGame.getSurvivors();
  const placements = currentGame.getPlacements();

  placements.forEach((p, index) => {
    const days = p.deathDay || currentGame.currentDay;
    const userId = p.id;

    if (!userId.startsWith("fake_")) {
      initPlayerStats(userId, p.username);

      const existing = db
        .prepare(
          "SELECT max_days, max_kills_single_game FROM player_stats WHERE user_id = ?"
        )
        .get(userId);

      const updates = {
        increment: {
          games_played: 1,
          total_days: days,
          kills: p.kills,
        },
      };

      if (days > existing.max_days) {
        updates.set = { max_days: days };
      }

      if (p.kills > (existing.max_kills_single_game || 0)) {
        if (!updates.set) updates.set = {};
        updates.set.max_kills_single_game = p.kills;
      }

      if (p.alive) {
        updates.increment.wins = 1;

        if (
          eventHandlers &&
          eventHandlers.polymorph &&
          currentGame.gameState.polymorphedPlayers &&
          currentGame.gameState.polymorphedPlayers.has(p.username)
        ) {
          const polymorph = currentGame.gameState.polymorphedPlayers.get(
            p.username
          );
          if (
            polymorph &&
            polymorph.newFormId &&
            !polymorph.newFormId.startsWith("fake_")
          ) {
            const newFormPlayer = currentGame.participants.find(
              (player) => player.id === polymorph.newFormId
            );
            if (newFormPlayer) {
              initPlayerStats(polymorph.newFormId, polymorph.newForm);
              const newFormUpdates = { increment: { wins: 1 } };
              updatePlayerStats(polymorph.newFormId, newFormUpdates);
            }
          }
        }
      } else {
        updates.increment.deaths = 1;
      }

      updatePlayerStats(userId, updates);
    }
  });

  let title, description;
  if (survivors.length === 1) {
    if (
      eventHandlers &&
      eventHandlers.polymorph &&
      currentGame.gameState.polymorphedPlayers &&
      currentGame.gameState.polymorphedPlayers.has(survivors[0].username)
    ) {
      title = eventHandlers.polymorph.getWinnerMessagePlain(
        survivors[0].username,
        currentGame.gameState
      );
    } else {
      title = `${survivors[0].username} won the Noita Games!`;
    }
    description = `After ${currentGame.currentDay} days of battle, a winner emerges!`;
  } else {
    title = "No one survived the Noita Games!";
    description = "All tributes have perished.";
  }

  const placementText = placements
    .slice(0, 10)
    .map(
      (p, i) =>
        `**#${i + 1}** ${currentGame.getDisplayName(p.username)} - ${p.kills} kill${p.kills !== 1 ? "s" : ""}`
    )
    .join("\n");

  const resultsEmbed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .addFields({
      name: "Top Placements",
      value: placementText || "No placements",
    })
    .setColor(0xf1c40f)
    .setTimestamp();

  await arenaChannel.send({ embeds: [resultsEmbed] });

  resetGameState();
}

function resetGameState() {
  gameRunning = false;
  recruitingPlayers = false;
  currentGame = null;
  joinedPlayers.clear();
  if (joinTimer) {
    clearTimeout(joinTimer);
    joinTimer = null;
  }
}

async function handleJoin(message) {
  if (message.channel.id !== config.commandChannelId) return;

  if (gameRunning) {
    await message.reply(
      "The Noita Games are already in progress. Wait for it to finish!"
    );
    return;
  }

  if (!recruitingPlayers) {
    await message.reply(
      "The Noita Games are not currently recruiting tributes, wait for the next games to be announced!"
    );
    return;
  }

  if (joinedPlayers.has(message.author.id)) {
    await message.reply("You have already joined the games!");
    return;
  }

  joinedPlayers.set(
    message.author.id,
    message.author.displayName || message.author.username
  );

  await message.reply("You have volunteered as a tribute! Good luck!");

  const arenaChannel = await client.channels.fetch(config.arenaChannelId);
  if (arenaChannel) {
    const arenaEmbed = new EmbedBuilder()
      .setDescription(
        `**${message.author.displayName || message.author.username}** has volunteered as a tribute! (${joinedPlayers.size} tribute${joinedPlayers.size !== 1 ? "s" : ""} ${joinedPlayers.size !== 1 ? "have" : "has"} joined)`
      )
      .setColor(0x2ecc71);
    await arenaChannel.send({ embeds: [arenaEmbed] });
  }

  checkForMinPlayers();
}

async function handleStopGames(message) {
  if (message.channel.id !== config.commandChannelId) return;

  const member = message.member;
  if (
    !member.permissions.has(PermissionFlagsBits.ModerateMembers) &&
    !member.permissions.has(PermissionFlagsBits.Administrator)
  ) {
    await message.reply("You need moderator permissions to stop the games.");
    return;
  }

  if (!gameRunning && !recruitingPlayers && joinedPlayers.size === 0) {
    await message.reply("No game is currently running or recruiting.");
    return;
  }

  resetGameState();

  await message.reply("The Noita Games have been stopped.");
}

async function handlePlayerList(message) {
  if (message.channel.id !== config.commandChannelId) return;

  if (joinedPlayers.size === 0) {
    await message.reply("No players have joined yet.");
    return;
  }

  const playerNames = Array.from(joinedPlayers.values()).join("\n");
  const listEmbed = new EmbedBuilder()
    .setTitle("Current Tributes")
    .setDescription(playerNames)
    .setFooter({
      text: `${joinedPlayers.size} tribute${joinedPlayers.size !== 1 ? "s" : ""}`,
    })
    .setColor(0x3498db);

  await message.reply({ embeds: [listEmbed] });
}

async function handleLeaderboard(message) {
  const args = message.content.toLowerCase().trim().split(/\s+/);
  let sortBy = "wins";
  let sortField = "wins";

  if (args.length > 1) {
    const validSorts = {
      wins: "wins",
      kills: "kills",
      deaths: "deaths",
      maxdays: "max_days",
      totaldays: "total_days",
      games: "games_played",
      maxkills: "max_kills_single_game",
    };

    const requestedSort = args[1].toLowerCase();
    if (validSorts[requestedSort]) {
      sortBy = requestedSort;
      sortField = validSorts[requestedSort];
    }
  }

  const allStats = db.prepare("SELECT * FROM player_stats").all();

  if (allStats.length === 0) {
    await message.reply("No stats recorded yet.");
    return;
  }

  allStats.sort((a, b) => {
    if (sortField === "wins") {
      return b.wins - a.wins || b.kills - a.kills;
    }
    return b[sortField] - a[sortField];
  });

  const sortNames = {
    wins: "Wins",
    kills: "Total Kills",
    deaths: "Deaths",
    maxdays: "Max Days Survived",
    totaldays: "Total Days",
    games: "Games Played",
    maxkills: "Most Kills (Single Game)",
  };

  const userId = message.author.id;
  const userRank = allStats.findIndex((p) => p.user_id === userId);

  let leaderboardText = "";

  if (userRank === -1) {
    const top10 = allStats.slice(0, 10);
    leaderboardText = top10
      .map((player, i) => {
        const rank = i + 1;
        const name = player.username;
        const value = player[sortField];
        return `**${rank}.** ${name} - ${value} ${sortNames[sortBy].toLowerCase()}`;
      })
      .join("\n");
  } else if (userRank < 10) {
    const top10 = allStats.slice(0, 10);
    leaderboardText = top10
      .map((player, i) => {
        const rank = i + 1;
        const name = player.username;
        const value = player[sortField];
        const isSelf = player.user_id === userId;
        return `**${rank}.** ${isSelf ? "**" : ""}${name} - ${value} ${sortNames[sortBy].toLowerCase()}${isSelf ? "**" : ""}`;
      })
      .join("\n");
  } else {
    const top10 = allStats.slice(0, 10);
    const top10Text = top10
      .map((player, i) => {
        const rank = i + 1;
        const name = player.username;
        const value = player[sortField];
        return `**${rank}.** ${name} - ${value} ${sortNames[sortBy].toLowerCase()}`;
      })
      .join("\n");

    const userEntry = allStats[userRank];
    const aboveEntry =
      userRank > 0 && userRank !== 10 ? allStats[userRank - 1] : null;
    const belowEntry =
      userRank < allStats.length - 1 ? allStats[userRank + 1] : null;

    let contextText = "\n...\n";

    if (aboveEntry) {
      contextText += `**${userRank}.** *${aboveEntry.username} - ${aboveEntry[sortField]} ${sortNames[sortBy].toLowerCase()}*\n`;
    }

    contextText += `**${userRank + 1}.** **${userEntry.username} - ${userEntry[sortField]} ${sortNames[sortBy].toLowerCase()}**\n`;

    if (belowEntry) {
      contextText += `**${userRank + 2}.** *${belowEntry.username} - ${belowEntry[sortField]} ${sortNames[sortBy].toLowerCase()}*`;
    }

    leaderboardText = top10Text + contextText;
  }

  console.log(leaderboardText);

  const leaderboardEmbed = new EmbedBuilder()
    .setTitle(`Noita Games Leaderboard`)
    .setDescription(`**Sorted by: ${sortNames[sortBy]}**\n\n${leaderboardText}`)
    .setColor(0xf1c40f)
    .setFooter({
      text: `Use .leaderboard [wins|kills|deaths|maxdays|totaldays|games|maxkills]`,
    })
    .setTimestamp();

  await message.reply({ embeds: [leaderboardEmbed] });
}

async function handleStats(message) {
  let userId = message.author.id;
  let username = message.author.displayName || message.author.username;

  const args = message.content.trim().split(/\s+/);
  if (args.length > 1) {
    const target = args.slice(1).join(" ");

    if (message.mentions.users.size > 0) {
      const mentionedUser = message.mentions.users.first();
      userId = mentionedUser.id;
      username = mentionedUser.username;
    } else if (/^\d{17,19}$/.test(target)) {
      userId = target;
      const userStats = db
        .prepare("SELECT username FROM player_stats WHERE user_id = ?")
        .get(userId);
      if (userStats) {
        username = userStats.username;
      }
    } else {
      const userStats = db
        .prepare(
          "SELECT user_id, username FROM player_stats WHERE LOWER(username) = LOWER(?)"
        )
        .get(target);
      if (userStats) {
        userId = userStats.user_id;
        username = userStats.username;
      } else {
        await message.reply(
          `Could not find stats for "${target}". Make sure they've played at least one game.`
        );
        return;
      }
    }
  }

  const stats = db
    .prepare("SELECT * FROM player_stats WHERE user_id = ?")
    .get(userId);

  if (!stats) {
    if (args.length > 1) {
      await message.reply(
        `No stats found for that user. They haven't played any games yet.`
      );
    } else {
      await message.reply(
        "You haven't played any games yet! Use '.join' to participate in the next Noita Games."
      );
    }
    return;
  }

  const avgDaysPerGame =
    stats.games_played > 0
      ? (stats.total_days / stats.games_played).toFixed(1)
      : 0;
  const avgKillsPerGame =
    stats.games_played > 0 ? (stats.kills / stats.games_played).toFixed(1) : 0;
  const winRate =
    stats.games_played > 0
      ? ((stats.wins / stats.games_played) * 100).toFixed(1)
      : 0;

  const statsEmbed = new EmbedBuilder()
    .setTitle(`${stats.username}'s Noita Games Stats`)
    .setColor(0x3498db)
    .addFields(
      { name: "Wins", value: stats.wins.toString(), inline: true },
      {
        name: "Games Played",
        value: stats.games_played.toString(),
        inline: true,
      },
      { name: "Win Rate", value: `${winRate}%`, inline: true },
      { name: "Total Kills", value: stats.kills.toString(), inline: true },
      { name: "Deaths", value: stats.deaths.toString(), inline: true },
      {
        name: "Best Kills (Single Game)",
        value: stats.max_kills_single_game.toString(),
        inline: true,
      },
      {
        name: "Max Days Survived",
        value: stats.max_days.toString(),
        inline: true,
      },
      { name: "Total Days", value: stats.total_days.toString(), inline: true },
      { name: "Avg Days/Game", value: avgDaysPerGame, inline: true },
      { name: "Avg Kills/Game", value: avgKillsPerGame, inline: true }
    )
    .setFooter({
      text: "Use .ngstats [@user|username|userid] to view someone else's stats",
    })
    .setTimestamp();

  await message.reply({ embeds: [statsEmbed] });
}

async function handleAddFake(message) {
  if (message.channel.id !== config.commandChannelId) return;

  const member = message.member;
  if (
    !member.permissions.has(PermissionFlagsBits.ModerateMembers) &&
    !member.permissions.has(PermissionFlagsBits.Administrator)
  ) {
    await message.reply("You need moderator permissions to add fake witches.");
    return;
  }

  if (!recruitingPlayers) {
    await message.reply(
      "No game is currently recruiting. A moderator must use '.startgames' first."
    );
    return;
  }

  let addedCount = 0;
  const existingNames = new Set(joinedPlayers.values());

  for (let i = 0; i < 50; i++) {
    let name;
    do {
      name = randomName();
    } while (existingNames.has(name));

    const fakeId = `fake_${Date.now()}_${i}`;
    joinedPlayers.set(fakeId, name);
    existingNames.add(name);
    addedCount++;
  }

  await message.reply(
    `Added ${addedCount} fake witches! Total tributes: ${joinedPlayers.size}`
  );

  checkForMinPlayers();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

process.on("exit", () => {
  db.close();
});

process.on("SIGINT", () => {
  db.close();
  process.exit(0);
});

client.login(config.token);
