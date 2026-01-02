if (
  typeof window.applyTheme !== "undefined" &&
  typeof window.themeConfig !== "undefined"
) {
  window.applyTheme(window.themeConfig);
  const deathEventsHeaderEl = document.getElementById("deathEventsHeader");
  if (deathEventsHeaderEl && window.themeConfig.messages.deathEventsHeader) {
    deathEventsHeaderEl.textContent =
      window.themeConfig.messages.deathEventsHeader;
  }
}

const fakeAvatars = [
  "/images/00.png",
  "/images/01.png",
  "/images/02.png",
  "/images/03.png",
  "/images/04.png",
  "/images/05.png",
  "/images/06.png",
  "/images/07.png",
  "/images/10.png",
  "/images/11.png",
  "/images/12.png",
  "/images/13.png",
  "/images/14.png",
  "/images/15.png",
  "/images/16.png",
  "/images/17.png",
  "/images/20.png",
  "/images/21.png",
  "/images/22.png",
  "/images/23.png",
  "/images/24.png",
  "/images/25.png",
  "/images/26.png",
  "/images/27.png",
  "/images/30.png",
  "/images/31.png",
  "/images/32.png",
  "/images/33.png",
  "/images/34.png",
  "/images/35.png",
  "/images/36.png",
  "/images/37.png",
  "/images/40.png",
  "/images/41.png",
  "/images/42.png",
  "/images/43.png",
  "/images/44.png",
  "/images/45.png",
  "/images/46.png",
  "/images/47.png",
  "/images/50.png",
  "/images/51.png",
  "/images/52.png",
  "/images/53.png",
  "/images/54.png",
  "/images/55.png",
  "/images/56.png",
  "/images/57.png",
  "/images/60.png",
  "/images/61.png",
  "/images/62.png",
  "/images/63.png",
  "/images/64.png",
  "/images/65.png",
  "/images/66.png",
  "/images/67.png",
  "/images/70.png",
  "/images/71.png",
  "/images/72.png",
  "/images/73.png",
  "/images/74.png",
  "/images/75.png",
  "/images/76.png",
  "/images/77.png",
];

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

let shuffledAvatars = shuffleArray(fakeAvatars);
let avatarIndex = 0;

function getNextAvatar() {
  const avatar = shuffledAvatars[avatarIndex];
  avatarIndex = (avatarIndex + 1) % shuffledAvatars.length;
  return avatar;
}

window.fakeAvatars = fakeAvatars;
window.getNextAvatar = getNextAvatar;

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
  "Blazing",
  "Frozen",
  "Ancient",
  "Vengeful",
  "Spectral",
  "Hollow",
  "Ashen",
  "Verdant",
  "Obsidian",
  "Azure",
  "Pale",
  "Dark",
  "Wild",
  "Lone",
  "Storm",
  "Night",
  "Void",
  "Grim",
  "Cursed",
  "Feral",
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
  "Serpent",
  "Hawk",
  "Bear",
  "Shade",
  "Specter",
  "Knight",
  "Mage",
  "Reaper",
  "Crow",
  "Lynx",
  "Owl",
  "Jackal",
  "Golem",
  "Warden",
  "Ranger",
  "Blade",
  "Tempest",
  "Flame",
  "Frost",
  "Thorn",
];

function randomName() {
  return (
    adjectives[Math.floor(Math.random() * adjectives.length)] +
    nouns[Math.floor(Math.random() * nouns.length)] +
    Math.floor(Math.random() * 100)
  );
}

const STORAGE_PREFIX =
  (window.themeConfig && window.themeConfig.storagePrefix) || "game";

let globalStats = JSON.parse(
  localStorage.getItem(`${STORAGE_PREFIX}GlobalStats`) || "{}"
);
let globalColors = JSON.parse(
  localStorage.getItem(`${STORAGE_PREFIX}GlobalColors`) || "{}"
);

function saveGlobalStats() {
  localStorage.setItem(
    `${STORAGE_PREFIX}GlobalStats`,
    JSON.stringify(globalStats)
  );
}

function saveGlobalColors() {
  localStorage.setItem(
    `${STORAGE_PREFIX}GlobalColors`,
    JSON.stringify(globalColors)
  );
}

function initGlobal(u) {
  if (!globalStats[u])
    globalStats[u] = { wins: 0, kills: 0, deaths: 0, totalDays: 0, maxDays: 0 };
}

window.globalStats = globalStats;
window.globalColors = globalColors;
window.saveGlobalStats = saveGlobalStats;
window.saveGlobalColors = saveGlobalColors;
window.initGlobal = initGlobal;

let client;
let isConnected = false;
let channelValidationTimeout = null;
let players = new Set();
let participants = [];
let eventsData;
let itemsData;
let materialsData;
let eliminationOrder = [];
let killedThisDay = [];
let deathEventsLog = [];
let revealedDeaths = new Set();
let revealedAlive = new Set();
let currentDay = 1;
let stage = 0;
let daysSinceEvent = 0;
let consecutiveNoDeaths = 0;
let gameStarted = false;
let currentPhaseType = null;
let leaderboardSort = { key: null, asc: true };

window.gameStarted = false;
window.isConnected = isConnected;

window.players = players;
window.participants = participants;
window.eventsData = eventsData;
window.itemsData = itemsData;
window.materialsData = materialsData;
window.eliminationOrder = eliminationOrder;
window.killedThisDay = killedThisDay;
window.deathEventsLog = deathEventsLog;
window.revealedDeaths = revealedDeaths;
window.revealedAlive = revealedAlive;
window.currentDay = currentDay;
window.stage = stage;
window.daysSinceEvent = daysSinceEvent;
window.consecutiveNoDeaths = consecutiveNoDeaths;
window.currentPhaseType = currentPhaseType;
window.leaderboardSort = leaderboardSort;

const chInput = document.getElementById("channelInput");
const btnConnect = document.getElementById("connectButton");
const statusElement = document.getElementById("status");
const btnStart = document.getElementById("startButton");
const btnDebug = document.getElementById("debugButton");
const btnLeaderboard = document.getElementById("leaderboardButton");
const btnScoreboard = document.getElementById("scoreboardButton");
const btnRestart = document.getElementById("restartButton");
const joinPrompt = document.getElementById("joinPrompt");
const procCont = document.getElementById("proceedContainer");
const btnProc = document.getElementById("proceedButton");

const playersGrid = document.getElementById("playersGrid");
const deathEventsHeader = document.getElementById("deathEventsHeader");
const btnNewSame = document.getElementById("newGameSameButton");
const btnNewAll = document.getElementById("newGameAllButton");
const overlay = document.getElementById("leaderboardOverlay");
const closeOverlay = document.getElementById("closeOverlay");
const scoreboardOverlay = document.getElementById("scoreboardOverlay");
const closeScoreboardOverlay = document.getElementById(
  "closeScoreboardOverlay"
);
const btnClearLeaderboard = document.getElementById("clearLeaderboardButton");
const lbHeaders = document.querySelectorAll("#leaderboardTable th");

let eventHandlersLoaded = false;
window.eventHandlersLoaded = eventHandlersLoaded;

const script = document.createElement("script");
script.src = "/js/event-handlers.js";
script.onload = () => {
  if (typeof window.eventHandlers !== "undefined") {
    eventHandlersLoaded = true;
    window.eventHandlersLoaded = true;
  }
};
script.onerror = (err) => console.error("Failed to load event handlers:", err);
document.head.appendChild(script);

let polymorphedPlayers = new Map();
window.polymorphedPlayers = polymorphedPlayers;

function loadGameData(themeName) {
  btnStart.disabled = true;
  if (statusElement) {
    statusElement.textContent = "Loading data...";
    statusElement.style.color =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--status-warning")
        .trim() || "#ff9800";
  }

  if (typeof window.loadThemeData === "undefined") {
    console.error("loadThemeData function not available");
    if (statusElement) {
      statusElement.textContent = "Error: Theme system not loaded";
      statusElement.style.color =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--status-error")
          .trim() || "#f44336";
    }
    return Promise.reject(new Error("Theme system not loaded"));
  }

  return window
    .loadThemeData(themeName)
    .then(({ eventsData: e, itemsData: w, materialsData: m }) => {
      eventsData = e;
      itemsData = w;
      materialsData = m;
      window.eventsData = eventsData;
      window.itemsData = itemsData;
      window.materialsData = materialsData;
      btnStart.disabled = false;
      if (statusElement) {
        statusElement.textContent = "";
        statusElement.style.color = "";
      }
    })
    .catch((err) => {
      console.error("Failed to load game data:", err);
      btnStart.disabled = true;
      if (statusElement) {
        statusElement.textContent = `Error: ${err.message}`;
        statusElement.style.color =
          getComputedStyle(document.documentElement)
            .getPropertyValue("--status-error")
            .trim() || "#f44336";
      }
      throw err;
    });
}

function initializeData() {
  const saved = localStorage.getItem("twitchChannel");
  if (saved) {
    chInput.value = saved;
    connect(saved);
  }

  const currentTheme =
    localStorage.getItem("selectedTheme") ||
    (typeof window.defaultTheme !== "undefined"
      ? window.defaultTheme
      : "fridge");
  loadGameData(currentTheme).catch((err) => {
    console.error("Initial data load failed:", err);
  });

  const useTwitchAvatarsToggle = document.getElementById("useTwitchAvatars");
  if (useTwitchAvatarsToggle) {
    const storedValue = localStorage.getItem("useTwitchAvatars");
    useTwitchAvatarsToggle.checked =
      storedValue === null ? true : storedValue === "true";
    useTwitchAvatarsToggle.addEventListener("change", (e) => {
      localStorage.setItem("useTwitchAvatars", e.target.checked);
      let updatePromise = Promise.resolve();
      if (typeof window.updateAllAvatars === "function") {
        updatePromise = window.updateAllAvatars(e.target.checked);
      }
    });
  }

  const allowCustomUsernamesToggle = document.getElementById(
    "allowCustomUsernames"
  );
  if (allowCustomUsernamesToggle) {
    allowCustomUsernamesToggle.checked =
      localStorage.getItem("allowCustomUsernames") === "true";
    allowCustomUsernamesToggle.addEventListener("change", (e) => {
      localStorage.setItem("allowCustomUsernames", e.target.checked);
      updateJoinPrompt();
    });
    updateJoinPrompt();
  }

  updateHeaderForGameState();
}

if (document.readyState === "loading") {
  window.addEventListener("load", initializeData);
} else {
  initializeData();
}

btnConnect.addEventListener("click", () => {
  if (isConnected) {
    disconnect();
  } else {
    const ch = chInput.value.trim().toLowerCase();
    if (!ch) return;
    localStorage.setItem("twitchChannel", ch);
    connect(ch);
  }
});

const themeSelector = document.getElementById("themeSelector");
if (themeSelector) {
  if (typeof window.getAvailableThemes === "function") {
    const availableThemes = window.getAvailableThemes();
    if (
      availableThemes.length > 0 &&
      availableThemes.length !== themeSelector.options.length
    ) {
      themeSelector.innerHTML = "";
      availableThemes.forEach((themeKey) => {
        const option = document.createElement("option");
        option.value = themeKey;
        try {
          const config = window.loadTheme ? window.loadTheme(themeKey) : null;
          option.textContent =
            config && config.title
              ? config.title
                  .replace(" Simulator", "")
                  .replace(" Hunger Games", "")
              : themeKey.charAt(0).toUpperCase() + themeKey.slice(1);
        } catch (e) {
          option.textContent =
            themeKey.charAt(0).toUpperCase() + themeKey.slice(1);
        }
        themeSelector.appendChild(option);
      });
    }
  }
  let currentTheme =
    localStorage.getItem("selectedTheme") ||
    (typeof window.defaultTheme !== "undefined"
      ? window.defaultTheme
      : "fridge");
  if (themeSelector.querySelector(`option[value="${currentTheme}"]`)) {
    themeSelector.value = currentTheme;
  }

  themeSelector.addEventListener("change", async (e) => {
    const newTheme = e.target.value;
    const previousTheme = currentTheme;
    if (window.switchTheme) {
      const switched = await window.switchTheme(newTheme);
      if (!switched) {
        themeSelector.value = previousTheme;
        alert("Cannot change theme during an active game.");
      } else {
        try {
          await loadGameData(newTheme);
          currentTheme = newTheme;
          if (
            deathEventsHeader &&
            window.themeConfig &&
            window.themeConfig.messages.deathEventsHeader
          ) {
            deathEventsHeader.textContent =
              window.themeConfig.messages.deathEventsHeader;
          }
        } catch (err) {
          themeSelector.value = previousTheme;
          if (window.switchTheme) {
            await window.switchTheme(previousTheme);
          }
          alert(`Failed to load theme data: ${err.message}`);
        }
      }
    }
  });
}

function updateConnectButton() {
  if (btnConnect) {
    btnConnect.textContent = isConnected ? "Disconnect" : "Connect";
  }
}

function disconnect() {
  if (channelValidationTimeout) {
    clearTimeout(channelValidationTimeout);
    channelValidationTimeout = null;
  }
  if (client) {
    client.disconnect();
  }
  isConnected = false;
  window.isConnected = false;
  statusElement.textContent = "";
  statusElement.style.color = "";
  joinPrompt.style.display = "none";
  updateConnectButton();
}

function connect(ch) {
  if (client) client.disconnect();

  if (channelValidationTimeout) {
    clearTimeout(channelValidationTimeout);
    channelValidationTimeout = null;
  }

  isConnected = false;
  window.isConnected = false;
  players.clear();
  playersGrid.innerHTML = "";
  statusElement.textContent = "";
  gameStarted = false;
  window.gameStarted = false;
  joinPrompt.style.display = "none";
  updateConnectButton();

  let channelValidated = false;
  let isChannelNotFound = false;
  const channelName = `#${ch}`;

  client = new tmi.Client({ channels: [ch] });

  const removeSpinner = () => {
    const spinner = statusElement.querySelector(".spinner");
    if (spinner) {
      spinner.remove();
    }
  };

  const validateChannelJoin = () => {
    if (channelValidated) return;
    channelValidated = true;

    if (channelValidationTimeout) {
      clearTimeout(channelValidationTimeout);
      channelValidationTimeout = null;
    }

    removeSpinner();
    isConnected = true;
    window.isConnected = true;
    statusElement.textContent = "Connected";
    statusElement.style.color =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--status-success")
        .trim() || "#4caf50";
    if (!gameStarted) {
      joinPrompt.style.display = "block";
    }
    updateConnectButton();
  };

  client.on("join", (channel, username, self) => {
    if (self && channel.toLowerCase() === channelName.toLowerCase()) {
      validateChannelJoin();
    }
  });

  client.on("roomstate", (channel) => {
    if (channel.toLowerCase() === channelName.toLowerCase()) {
      validateChannelJoin();
    }
  });

  client.on("names", (channel) => {
    if (channel.toLowerCase() === channelName.toLowerCase()) {
      validateChannelJoin();
    }
  });

  client.on("disconnected", () => {
    if (channelValidationTimeout) {
      clearTimeout(channelValidationTimeout);
      channelValidationTimeout = null;
    }
    removeSpinner();
    isConnected = false;
    window.isConnected = false;
    // Don't clear status if we're showing a channel-not-found error
    if (!isChannelNotFound) {
      statusElement.textContent = "";
      statusElement.style.color = "";
    }
    joinPrompt.style.display = "none";
    updateConnectButton();
  });

  client.on("error", (err) => {
    console.error("TMI Error:", err);
    if (channelValidationTimeout) {
      clearTimeout(channelValidationTimeout);
      channelValidationTimeout = null;
    }
    removeSpinner();
    isConnected = false;
    window.isConnected = false;
    statusElement.textContent = "Connection Error";
    statusElement.style.color =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--status-error")
        .trim() || "#f44336";
    joinPrompt.style.display = "none";
    updateConnectButton();
  });

  client
    .connect()
    .then(() => {
      // Show connecting spinner
      statusElement.innerHTML = '<span class="spinner"></span>Connecting...';
      statusElement.style.color =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--status-info")
          .trim() || "#2196f3";

      channelValidationTimeout = setTimeout(() => {
        if (!channelValidated) {
          channelValidationTimeout = null;
          isChannelNotFound = true;
          removeSpinner();
          isConnected = false;
          window.isConnected = false;
          statusElement.textContent = "Channel not found";
          statusElement.style.color =
            getComputedStyle(document.documentElement)
              .getPropertyValue("--status-error")
              .trim() || "#f44336";
          joinPrompt.style.display = "none";
          updateConnectButton();

          if (client) {
            client.disconnect();
          }
        }
      }, 3000);
    })
    .catch(() => {
      if (channelValidationTimeout) {
        clearTimeout(channelValidationTimeout);
        channelValidationTimeout = null;
      }
      removeSpinner();
      isConnected = false;
      window.isConnected = false;
      statusElement.textContent = "Connection Failed";
      statusElement.style.color =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--status-error")
          .trim() || "#f44336";
      joinPrompt.style.display = "none";
      updateConnectButton();
    });

  client.on("message", (_, tags, msg) => {
    if (gameStarted) return;
    const allowCustomUsernames =
      document.getElementById("allowCustomUsernames")?.checked || false;

    if (allowCustomUsernames) {
      const trimmedMsg = msg.trim();
      const lowerMsg = trimmedMsg.toLowerCase();
      if (lowerMsg.startsWith("!play")) {
        const usernameParam = trimmedMsg.substring(5).trim();
        const u = usernameParam || tags.username;
        if (!players.has(u)) {
          players.add(u);
          window.addPlayer(u, tags.color);
          btnStart.disabled = players.size === 0;
        }
      }
    } else {
      if (msg.trim().toLowerCase() === "!play") {
        const u = tags.username;
        if (!players.has(u)) {
          players.add(u);
          window.addPlayer(u, tags.color);
          btnStart.disabled = players.size === 0;
        }
      }
    }
  });
}

function updateJoinPrompt() {
  const joinPrompt = document.getElementById("joinPrompt");
  const allowCustomUsernames =
    document.getElementById("allowCustomUsernames")?.checked || false;
  if (joinPrompt) {
    if (allowCustomUsernames) {
      joinPrompt.textContent = "!play or !play [username] to join";
    } else {
      joinPrompt.textContent = "!play to join";
    }
  }
}

function updateHeaderForGameState() {
  const isGameStarted = window.gameStarted === true;

  const themeSelectorEl = document.getElementById("themeSelector");
  const chInputEl = document.getElementById("channelInput");
  const btnConnectEl = document.getElementById("connectButton");
  const btnRestartEl = document.getElementById("restartButton");
  const btnDebugEl = document.getElementById("debugButton");
  const btnScoreboardEl = document.getElementById("scoreboardButton");
  const useTwitchAvatarsLabel =
    document.getElementById("useTwitchAvatars")?.parentElement;
  const allowCustomUsernamesLabel = document.getElementById(
    "allowCustomUsernames"
  )?.parentElement;

  if (themeSelectorEl) {
    themeSelectorEl.style.display = isGameStarted ? "none" : "block";
  }
  if (chInputEl) {
    chInputEl.style.display = isGameStarted ? "none" : "inline-block";
  }
  if (btnConnectEl) {
    btnConnectEl.style.display = isGameStarted ? "none" : "inline-block";
  }
  if (btnRestartEl) {
    btnRestartEl.style.display = isGameStarted ? "inline-block" : "none";
  }
  if (btnDebugEl) {
    btnDebugEl.style.display = isGameStarted ? "none" : "inline-block";
  }
  if (btnScoreboardEl) {
    btnScoreboardEl.style.display = isGameStarted ? "inline-block" : "none";
  }
  if (useTwitchAvatarsLabel) {
    useTwitchAvatarsLabel.style.display = "flex";
  }
  if (allowCustomUsernamesLabel) {
    allowCustomUsernamesLabel.style.display = isGameStarted ? "none" : "flex";
  }
}

window.updateHeaderForGameState = updateHeaderForGameState;

function refreshPlayersGrid() {
  const playersGrid = document.getElementById("playersGrid");
  if (!playersGrid) return;

  const playerElements = playersGrid.querySelectorAll("[data-username]");
  const useTwitchAvatars =
    document.getElementById("useTwitchAvatars")?.checked || false;

  if (typeof window.updatePlayerAvatar !== "function") return;

  playerElements.forEach((playerEl) => {
    const username = playerEl.dataset.username;
    const imgEl = playerEl.querySelector("img");
    if (!imgEl || !username) return;

    window.updatePlayerAvatar(username, useTwitchAvatars).then((avatarUrl) => {
      imgEl.src = avatarUrl;
    });
  });
}

function refreshWinnerScreen() {
  const winnerScreen = document.getElementById("winnerScreen");
  if (!winnerScreen || winnerScreen.style.display !== "block") {
    return;
  }

  if (typeof window.showWinner === "function") {
    window.showWinner();
  }
}

function refreshFallenDisplay() {
  const eventLog = document.getElementById("eventLog");
  if (!eventLog) {
    return;
  }

  const stage = window.stage || 0;
  if (stage !== 2) {
    return;
  }

  const fallenDisplay = eventLog.querySelector(".avatars");
  if (!fallenDisplay) {
    return;
  }

  const currentDay = window.currentDay || 1;
  if (typeof window.showFallen === "function") {
    window.showFallen(currentDay);
  }
}

function refreshEventLog() {
  const eventLog = document.getElementById("eventLog");
  if (!eventLog) {
    return;
  }

  const avatarWraps = eventLog.querySelectorAll(".avatarWrap img");

  const useTwitchAvatars =
    document.getElementById("useTwitchAvatars")?.checked || false;
  const participants = window.participants || [];

  if (typeof window.updatePlayerAvatar !== "function") return;

  avatarWraps.forEach((imgEl) => {
    const avatarWrap = imgEl.closest(".avatarWrap");
    if (!avatarWrap) return;

    const tooltipBox = avatarWrap.querySelector(".tooltip-box");
    if (!tooltipBox) return;

    const tooltipText = tooltipBox.textContent;
    const usernameMatch = tooltipText.match(/^([^\n]+)/);
    if (!usernameMatch) return;

    const displayName = usernameMatch[1];
    const participant = participants.find((p) => {
      const eventHandlersLoaded = window.eventHandlersLoaded || false;
      const polymorphedPlayers = window.polymorphedPlayers || new Map();
      if (
        eventHandlersLoaded &&
        window.eventHandlers &&
        window.eventHandlers.polymorph &&
        polymorphedPlayers.has(p.username)
      ) {
        return (
          window.eventHandlers.polymorph.getDisplayName(p.username, {
            polymorphedPlayers,
          }) === displayName
        );
      }
      return p.username === displayName;
    });

    if (participant) {
      window
        .updatePlayerAvatar(participant.username, useTwitchAvatars)
        .then((avatarUrl) => {
          const container = imgEl.closest(".tooltip-container");
          if (container && window.setupImageLoading) {
            window.setupImageLoading(imgEl, container);
          }
          imgEl.src = avatarUrl;
        });
    }
  });
}

async function updateAllAvatars(useTwitch) {
  if (!window.getCachedAvatar || !window.fetchTwitchAvatarsBatch) {
    return;
  }

  const playersGrid = document.getElementById("playersGrid");
  const participants = window.participants || [];

  const usernameToElements = new Map();
  const uniqueUsernames = new Set();

  if (playersGrid && playersGrid.style.display !== "none") {
    const playerElements = playersGrid.querySelectorAll("[data-username]");
    playerElements.forEach((playerEl) => {
      const username = playerEl.dataset.username;
      const imgEl = playerEl.querySelector("img");
      if (!imgEl || !username) return;

      uniqueUsernames.add(username);
      if (!usernameToElements.has(username)) {
        usernameToElements.set(username, []);
      }
      usernameToElements.get(username).push({ type: "img", element: imgEl });
    });
  }

  participants.forEach((participant) => {
    uniqueUsernames.add(participant.username);
    if (!usernameToElements.has(participant.username)) {
      usernameToElements.set(participant.username, []);
    }
    usernameToElements.get(participant.username).push({
      type: "participant",
      participant: participant,
    });
  });

  const cachedAvatars = new Map();
  const uncachedUsernames = [];

  for (const username of uniqueUsernames) {
    const cached = window.getCachedAvatar(username, useTwitch);
    if (cached !== null) {
      cachedAvatars.set(username, cached);
    } else {
      uncachedUsernames.push(username);
    }
  }

  for (const [username, avatarUrl] of cachedAvatars) {
    const elements = usernameToElements.get(username) || [];
    elements.forEach((item) => {
      if (item.type === "img") {
        const container = item.element.closest(".tooltip-container");
        if (container && window.setupImageLoading) {
          window.setupImageLoading(item.element, container);
        }
        item.element.src = avatarUrl;
      } else if (item.type === "participant") {
        item.participant.avatar = avatarUrl;
      }
    });
  }

  if (uncachedUsernames.length > 0) {
    if (useTwitch) {
      const fetchedAvatars = await window.fetchTwitchAvatarsBatch(
        uncachedUsernames
      );
      for (const [username, avatarUrl] of fetchedAvatars) {
        const elements = usernameToElements.get(username) || [];
        elements.forEach((item) => {
          if (item.type === "img") {
            const container = item.element.closest(".tooltip-container");
            if (container && window.setupImageLoading) {
              window.setupImageLoading(item.element, container);
            }
            item.element.src = avatarUrl;
          } else if (item.type === "participant") {
            item.participant.avatar = avatarUrl;
          }
        });
      }
    } else {
      for (const username of uncachedUsernames) {
        const fakeAvatar = window.assignFakeAvatar
          ? window.assignFakeAvatar(username)
          : (window.fakeAvatars || [])[0];

        const elements = usernameToElements.get(username) || [];
        elements.forEach((item) => {
          if (item.type === "img") {
            const container = item.element.closest(".tooltip-container");
            if (container && window.setupImageLoading) {
              window.setupImageLoading(item.element, container);
            }
            item.element.src = fakeAvatar;
          } else if (item.type === "participant") {
            item.participant.avatar = fakeAvatar;
          }
        });
      }
    }
  }

  if (participants.length > 0) {
    refreshWinnerScreen();
    refreshFallenDisplay();
    refreshEventLog();
  }
}

window.refreshPlayersGrid = refreshPlayersGrid;
window.refreshWinnerScreen = refreshWinnerScreen;
window.refreshFallenDisplay = refreshFallenDisplay;
window.refreshEventLog = refreshEventLog;
window.updateAllAvatars = updateAllAvatars;

if (btnRestart) {
  btnRestart.addEventListener("click", () => {
    if (
      confirm(
        "Are you sure you want to restart? This will reset the current game."
      )
    ) {
      window.backToJoin(false);
    }
  });
}

btnStart.addEventListener("click", () => {
  if (players.size < 1) {
    alert(window.themeConfig.messages.minPlayersRequired);
    return;
  }
  gameStarted = true;
  window.gameStarted = true;
  updateHeaderForGameState();
  joinPrompt.style.display = "none";
  participants = Array.from(players).map((u) => {
    const el = document.querySelector(`[data-username="${u}"]`);
    if (!el) {
      console.warn(
        `Player element not found for username: ${u}, using defaults`
      );
      return {
        username: u,
        color: globalColors[u] || "#fff",
        avatar:
          "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/default-user-profile_image-70x70.png",
        alive: true,
        kills: 0,
      };
    }
    const nameEl = el.querySelector(".name");
    const imgEl = el.querySelector("img");
    return {
      username: u,
      color: globalColors[u] || nameEl?.style.color || "#fff",
      avatar:
        imgEl?.src ||
        "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/default-user-profile_image-70x70.png",
      alive: true,
      kills: 0,
    };
  });
  eliminationOrder = [];
  currentDay = 1;
  stage = 0;
  daysSinceEvent = 0;
  consecutiveNoDeaths = 0;
  killedThisDay = [];
  deathEventsLog = [];
  revealedDeaths = new Set();
  revealedAlive = new Set();
  currentPhaseType = null;
  const usedFeastIndices = [];
  const usedArenaIndices = [];

  window.participants = participants;
  window.eliminationOrder = eliminationOrder;
  window.currentDay = currentDay;
  window.stage = stage;
  window.daysSinceEvent = daysSinceEvent;
  window.consecutiveNoDeaths = consecutiveNoDeaths;
  window.killedThisDay = killedThisDay;
  window.deathEventsLog = deathEventsLog;
  window.revealedDeaths = revealedDeaths;
  window.revealedAlive = revealedAlive;
  window.currentPhaseType = currentPhaseType;
  window.usedFeastIndices = usedFeastIndices;
  window.usedArenaIndices = usedArenaIndices;

  playersGrid.style.display = "none";
  btnStart.style.display = "none";
  btnDebug.style.display = "none";
  procCont.style.display = "block";
  window.nextPhase();
});

btnDebug.addEventListener("click", () => {
  for (let i = 0; i < 50; i++) {
    let u;
    do {
      u = randomName();
    } while (players.has(u));
    players.add(u);
    window.addFakePlayer(
      u,
      "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0")
    );
    btnStart.disabled = false;
  }
});

btnProc.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  window.nextPhase();
});
btnLeaderboard.addEventListener("click", window.showLeaderboard);
if (btnScoreboard) {
  btnScoreboard.addEventListener("click", window.showScoreboard);
}
closeOverlay.addEventListener("click", () => (overlay.style.display = "none"));
if (closeScoreboardOverlay) {
  closeScoreboardOverlay.addEventListener("click", () => {
    if (scoreboardOverlay) {
      scoreboardOverlay.style.display = "none";
    }
  });
}
if (btnClearLeaderboard) {
  btnClearLeaderboard.addEventListener("click", () => {
    if (typeof window.clearLeaderboard === "function") {
      window.clearLeaderboard();
    }
  });
}
btnNewSame.addEventListener("click", () => window.backToJoin(true));
btnNewAll.addEventListener("click", () => window.backToJoin(false));

lbHeaders.forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.dataset.key;
    if (leaderboardSort.key === key) {
      leaderboardSort.asc = !leaderboardSort.asc;
    } else {
      leaderboardSort.key = key;
      leaderboardSort.asc = key === "username";
    }
    window.leaderboardSort = leaderboardSort;
    lbHeaders.forEach((h) => h.classList.remove("sort-asc", "sort-desc"));
    th.classList.add(leaderboardSort.asc ? "sort-asc" : "sort-desc");
    window.renderLeaderboard();
  });
});
