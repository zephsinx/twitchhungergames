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
  "assets/images/pfp1.png",
  "assets/images/pfp2.png",
  "assets/images/pfp3.png",
  "assets/images/pfp4.png",
  "assets/images/pfp5.png",
  "assets/images/pfp6.png",
];
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

window.fakeAvatars = fakeAvatars;

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
let players = new Set();
let participants = [];
let eventsData;
let itemsData;
let materialsData;
let eliminationOrder = [];
let killedThisDay = [];
let deathEventsLog = [];
let currentDay = 1;
let stage = 0;
let daysSinceEvent = 0;
let consecutiveNoDeaths = 0;
let gameStarted = false;
let currentPhaseType = null;
let leaderboardSort = { key: null, asc: true };

window.gameStarted = false;

window.players = players;
window.participants = participants;
window.eventsData = eventsData;
window.itemsData = itemsData;
window.materialsData = materialsData;
window.eliminationOrder = eliminationOrder;
window.killedThisDay = killedThisDay;
window.deathEventsLog = deathEventsLog;
window.currentDay = currentDay;
window.stage = stage;
window.daysSinceEvent = daysSinceEvent;
window.consecutiveNoDeaths = consecutiveNoDeaths;
window.currentPhaseType = currentPhaseType;
window.leaderboardSort = leaderboardSort;

const chInput = document.getElementById("channelInput");
const btnConnect = document.getElementById("connectButton");
const status = document.getElementById("status");
const btnStart = document.getElementById("startButton");
const btnDebug = document.getElementById("debugButton");
const btnLeaderboard = document.getElementById("leaderboardButton");
const joinPrompt = document.getElementById("joinPrompt");
const procCont = document.getElementById("proceedContainer");
const btnProc = document.getElementById("proceedButton");
const playersGrid = document.getElementById("playersGrid");
const deathEventsHeader = document.getElementById("deathEventsHeader");
const btnNewSame = document.getElementById("newGameSameButton");
const btnNewAll = document.getElementById("newGameAllButton");
const overlay = document.getElementById("leaderboardOverlay");
const closeOverlay = document.getElementById("closeOverlay");
const lbHeaders = document.querySelectorAll("#leaderboardTable th");

let eventHandlersLoaded = false;
window.eventHandlersLoaded = eventHandlersLoaded;

const script = document.createElement("script");
script.src = "js/event-handlers.js";
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
  if (status) {
    status.textContent = "Loading data...";
    status.style.color =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--status-warning")
        .trim() || "#ff9800";
  }

  if (typeof window.loadThemeData === "undefined") {
    console.error("loadThemeData function not available");
    if (status) {
      status.textContent = "Error: Theme system not loaded";
      status.style.color =
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
      if (status) {
        status.textContent = "";
        status.style.color = "";
      }
    })
    .catch((err) => {
      console.error("Failed to load game data:", err);
      btnStart.disabled = true;
      if (status) {
        status.textContent = `Error: ${err.message}`;
        status.style.color =
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
    (typeof window.defaultTheme !== "undefined" ? window.defaultTheme : "noita");
  loadGameData(currentTheme).catch((err) => {
    console.error("Initial data load failed:", err);
  });
}

if (document.readyState === "loading") {
  window.addEventListener("load", initializeData);
} else {
  initializeData();
}

btnConnect.addEventListener("click", () => {
  const ch = chInput.value.trim().toLowerCase();
  if (!ch) return;
  localStorage.setItem("twitchChannel", ch);
  connect(ch);
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
    (typeof window.defaultTheme !== "undefined" ? window.defaultTheme : "noita");
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

function connect(ch) {
  if (client) client.disconnect();
  players.clear();
  playersGrid.innerHTML = "";
  status.textContent = "";
  gameStarted = false;
  window.gameStarted = false;
  joinPrompt.style.display = "block";

  client = new tmi.Client({ channels: [ch] });
  client
    .connect()
    .then(() => {
      status.textContent = "Connected";
      status.style.color =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--status-success")
          .trim() || "#4caf50";
    })
    .catch(() => {
      status.textContent = "Error";
      status.style.color =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--status-error")
          .trim() || "#f44336";
    });

  client.on("message", (_, tags, msg) => {
    if (gameStarted) return;
    if (msg.trim().toLowerCase() === "!play") {
      const u = tags.username;
      if (!players.has(u)) {
        players.add(u);
        window.addPlayer(u, tags.color);
        btnStart.disabled = players.size === 0;
      }
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
  currentPhaseType = null;

  window.participants = participants;
  window.eliminationOrder = eliminationOrder;
  window.currentDay = currentDay;
  window.stage = stage;
  window.daysSinceEvent = daysSinceEvent;
  window.consecutiveNoDeaths = consecutiveNoDeaths;
  window.killedThisDay = killedThisDay;
  window.deathEventsLog = deathEventsLog;
  window.currentPhaseType = currentPhaseType;

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

btnProc.addEventListener("click", () => window.nextPhase());
btnLeaderboard.addEventListener("click", window.showLeaderboard);
closeOverlay.addEventListener("click", () => (overlay.style.display = "none"));
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
