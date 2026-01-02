function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(text) {
  if (typeof text !== "string") return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function colorToRgb(color) {
  if (!color || typeof color !== "string") return [255, 255, 255];
  color = color.trim();

  if (color[0] === "#") {
    if (color.length === 4) {
      const r = parseInt(color[1] + color[1], 16);
      const g = parseInt(color[2] + color[2], 16);
      const b = parseInt(color[3] + color[3], 16);
      return [r, g, b];
    } else if (color.length === 7) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return [r, g, b];
    }
  }

  const rgbMatch = color.match(
    /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/
  );
  if (rgbMatch) {
    const r = Math.max(0, Math.min(255, parseInt(rgbMatch[1])));
    const g = Math.max(0, Math.min(255, parseInt(rgbMatch[2])));
    const b = Math.max(0, Math.min(255, parseInt(rgbMatch[3])));
    return [r, g, b];
  }

  return [255, 255, 255];
}

function getRelativeLuminance(rgb) {
  const [r, g, b] = rgb.map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function calculateContrastRatio(color1, color2) {
  const rgb1 = colorToRgb(color1);
  const rgb2 = colorToRgb(color2);
  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function isAccessibleContrast(textColor, backgroundColor, isLargeText = false) {
  const ratio = calculateContrastRatio(textColor, backgroundColor);
  return isLargeText ? ratio >= 3.0 : ratio >= 4.5;
}

function ensureContrast(textColor, backgroundColor, minRatio = 4.5) {
  const bgRgb = colorToRgb(backgroundColor);
  const textRgb = colorToRgb(textColor);
  const currentRatio = calculateContrastRatio(textColor, backgroundColor);

  if (currentRatio >= minRatio) {
    return textColor;
  }

  const bgLum = getRelativeLuminance(bgRgb);
  const isDarkBg = bgLum < 0.5;

  let [r, g, b] = textRgb;
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    const ratio = calculateContrastRatio(
      `rgb(${r}, ${g}, ${b})`,
      backgroundColor
    );
    if (ratio >= minRatio) {
      if (typeof textColor === "string" && textColor[0] === "#") {
        const toHex = (val) => Math.round(val).toString(16).padStart(2, "0");
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      }
      return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }

    if (isDarkBg) {
      r = Math.min(255, r + 10);
      g = Math.min(255, g + 10);
      b = Math.min(255, b + 10);
    } else {
      r = Math.max(0, r - 10);
      g = Math.max(0, g - 10);
      b = Math.max(0, b - 10);
    }
    attempts++;
  }

  return isDarkBg ? "#ffffff" : "#000000";
}

function validateColor(color) {
  if (!color || typeof color !== "string") return "#fff";
  color = color.trim();
  if (/^#[0-9A-Fa-f]{3}$/.test(color) || /^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color;
  }
  const rgbMatch = color.match(
    /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/
  );
  if (rgbMatch) {
    const r = Math.max(0, Math.min(255, parseInt(rgbMatch[1])));
    const g = Math.max(0, Math.min(255, parseInt(rgbMatch[2])));
    const b = Math.max(0, Math.min(255, parseInt(rgbMatch[3])));
    return `rgb(${r}, ${g}, ${b})`;
  }
  return "#fff";
}

function getUserTooltipText(u, runKills, runDays) {
  if (typeof window.initGlobal === "function") {
    window.initGlobal(u);
  }
  const displayName = getDisplayName(u);
  const globalStats = window.globalStats || {};
  const g = globalStats[u] || {
    wins: 0,
    kills: 0,
    deaths: 0,
    totalDays: 0,
    maxDays: 0,
  };
  return `${displayName}\n---\nRun Stats:\nKills: ${runKills}\nDays Survived: ${runDays}\n---\nGlobal Stats:\nWins: ${g.wins}\nKills: ${g.kills}\nDeaths: ${g.deaths}\nMax Days: ${g.maxDays}\nTotal Days: ${g.totalDays}`;
}

function getDisplayName(username) {
  const eventHandlersLoaded = window.eventHandlersLoaded || false;
  const polymorphedPlayers = window.polymorphedPlayers || new Map();
  if (
    eventHandlersLoaded &&
    window.eventHandlers &&
    window.eventHandlers.polymorph &&
    polymorphedPlayers.has(username)
  ) {
    return window.eventHandlers.polymorph.getDisplayName(username, {
      polymorphedPlayers,
    });
  }
  return username;
}

function setupImageLoading(img, container) {
  container.classList.remove("loading");

  const srcBeforeSetup = img.src;
  container.classList.add("loading");

  const handleLoad = () => {
    container.classList.remove("loading");
    img.classList.add("loaded");
  };

  const handleError = () => {
    container.classList.remove("loading");
  };

  img.addEventListener("load", handleLoad, { once: true });
  img.addEventListener("error", handleError, { once: true });

  if (img.complete && img.naturalHeight !== 0 && img.src === srcBeforeSetup) {
    container.classList.remove("loading");
  }
}

function showFallen(day) {
  const eventLog = document.getElementById("eventLog");
  const dayDisplay = document.getElementById("dayDisplay");
  const phaseDesc = document.getElementById("phaseDesc");
  const killedThisDay = window.killedThisDay || [];
  const participants = window.participants || [];

  eventLog.innerHTML = "";
  dayDisplay.textContent = window.formatMessage(
    window.themeConfig.messages.fallenPlayers,
    { day }
  );
  dayDisplay.style.color = "#cccccc";
  phaseDesc.textContent = "";
  const n = killedThisDay.length;
  const txt = document.createElement("div");
  txt.className = "text";
  const deathSound = window.themeConfig.terminology.deathSound || "signal";
  const pluralizedSound = n !== 1 ? deathSound + "s" : deathSound;
  txt.textContent = window.formatMessage(
    window.themeConfig.messages.deathSound,
    { count: n, sound: pluralizedSound }
  );
  const grid = document.createElement("div");
  grid.className = "avatars";
  killedThisDay.forEach((u) => {
    const p = participants.find((x) => x.username === u);
    const displayName = getDisplayName(u);
    const wrap = document.createElement("div");
    wrap.className = "avatarWrap has-dead";
    const img = document.createElement("img");
    img.alt = `${displayName} avatar`;
    img.className = "dead";
    const imgTooltipContainer = document.createElement("div");
    imgTooltipContainer.className = "tooltip-container";
    const imgTooltipBox = document.createElement("div");
    imgTooltipBox.className = "tooltip-box";
    imgTooltipBox.textContent = getUserTooltipText(u, p.kills, day);
    imgTooltipContainer.appendChild(img);
    imgTooltipContainer.appendChild(imgTooltipBox);
    setupImageLoading(img, imgTooltipContainer);
    img.src = p.avatar;
    const nmC = document.createElement("div");
    nmC.className = "text";
    const sp = document.createElement("span");
    sp.textContent = displayName;
    let playerColor = window.validateColor(p.color);
    if (window.ensureContrast) {
      playerColor = window.ensureContrast(playerColor, "#121212", 4.5);
    }
    sp.style.color = playerColor;
    nmC.append(sp);
    wrap.append(imgTooltipContainer, nmC);
    grid.appendChild(wrap);
  });
  eventLog.append(txt, grid);
  window.killedThisDay = [];
}

function showWinner() {
  const procCont = document.getElementById("proceedContainer");
  const eventLog = document.getElementById("eventLog");
  const dayDisplay = document.getElementById("dayDisplay");
  const phaseDesc = document.getElementById("phaseDesc");
  const winnerScreen = document.getElementById("winnerScreen");
  const winnerAvatar = document.getElementById("winnerAvatar");
  const winnerText = document.getElementById("winnerText");
  const placementsGrid = document.getElementById("placementsGrid");
  const deathLogEl = document.getElementById("deathLog");

  const participants = window.participants || [];
  const currentDay = window.currentDay || 1;
  const eliminationOrder = window.eliminationOrder || [];
  const deathEventsLog = window.deathEventsLog || [];
  const eventHandlersLoaded = window.eventHandlersLoaded || false;
  const polymorphedPlayers = window.polymorphedPlayers || new Map();
  const globalStats = window.globalStats || {};

  procCont.style.display = "none";
  eventLog.innerHTML = "";
  dayDisplay.textContent = "";
  phaseDesc.textContent = "";

  participants.forEach((p) => {
    const days = p.deathDay || currentDay - 1;
    if (typeof window.initGlobal === "function") {
      window.initGlobal(p.username);
    }
    if (!globalStats[p.username]) {
      globalStats[p.username] = {
        wins: 0,
        kills: 0,
        deaths: 0,
        totalDays: 0,
        maxDays: 0,
      };
    }
    globalStats[p.username].totalDays += days;
    if (days > globalStats[p.username].maxDays)
      globalStats[p.username].maxDays = days;
    globalStats[p.username].wins += p.alive ? 1 : 0;

    if (
      p.alive &&
      eventHandlersLoaded &&
      window.eventHandlers &&
      window.eventHandlers.polymorph &&
      polymorphedPlayers.has(p.username)
    ) {
      const polymorph = polymorphedPlayers.get(p.username);
      if (polymorph && polymorph.newForm) {
        if (typeof window.initGlobal === "function") {
          window.initGlobal(polymorph.newForm);
        }
        if (!globalStats[polymorph.newForm]) {
          globalStats[polymorph.newForm] = {
            wins: 0,
            kills: 0,
            deaths: 0,
            totalDays: 0,
            maxDays: 0,
          };
        }
        globalStats[polymorph.newForm].wins += 1;
      }
    }
  });
  if (typeof window.saveGlobalStats === "function") {
    window.saveGlobalStats();
  }

  const surv = participants.filter((p) => p.alive);
  let title,
    avatar = "";
  if (surv.length === 1) {
    if (
      eventHandlersLoaded &&
      window.eventHandlers &&
      window.eventHandlers.polymorph &&
      polymorphedPlayers.has(surv[0].username)
    ) {
      title = window.eventHandlers.polymorph.getWinnerMessage(
        surv[0].username,
        { polymorphedPlayers }
      );
    } else {
      title = window.formatMessage(window.themeConfig.messages.winnerMessage, {
        username: surv[0].username,
      });
    }
    avatar = surv[0].avatar;
  } else {
    title = window.themeConfig.messages.noSurvivors;
  }

  if (
    !winnerAvatar.parentElement ||
    !winnerAvatar.parentElement.classList.contains("tooltip-container")
  ) {
    const winnerTooltipContainer = document.createElement("div");
    winnerTooltipContainer.className = "tooltip-container";
    const winnerTooltipBox = document.createElement("div");
    winnerTooltipBox.className = "tooltip-box";
    if (surv.length === 1) {
      winnerTooltipBox.textContent = getUserTooltipText(
        surv[0].username,
        surv[0].kills,
        currentDay - 1
      );
    } else {
      winnerTooltipBox.textContent = getUserTooltipText("", 0, 0);
    }
    winnerAvatar.parentNode.insertBefore(winnerTooltipContainer, winnerAvatar);
    winnerTooltipContainer.appendChild(winnerAvatar);
    winnerTooltipContainer.appendChild(winnerTooltipBox);
  } else {
    const existingTooltip =
      winnerAvatar.parentElement.querySelector(".tooltip-box");
    if (existingTooltip) {
      if (surv.length === 1) {
        existingTooltip.textContent = getUserTooltipText(
          surv[0].username,
          surv[0].kills,
          currentDay - 1
        );
      } else {
        existingTooltip.textContent = getUserTooltipText("", 0, 0);
      }
    }
  }

  if (avatar) {
    const winnerTooltipContainer =
      winnerAvatar.parentElement?.classList.contains("tooltip-container")
        ? winnerAvatar.parentElement
        : null;
    if (winnerTooltipContainer) {
      setupImageLoading(winnerAvatar, winnerTooltipContainer);
    }
    winnerAvatar.src = avatar;
  }

  winnerText.textContent = title;
  placementsGrid.innerHTML = "";

  const finalOrder =
    surv.length === 1
      ? [surv[0].username, ...eliminationOrder.slice().reverse()]
      : eliminationOrder.slice().reverse();

  finalOrder.forEach((u, i) => {
    const p = participants.find((x) => x.username === u);
    if (!p) return;
    const displayName = getDisplayName(u);
    const wrap = document.createElement("div");
    wrap.className = "placement" + (p.alive ? "" : " dead");
    const img = document.createElement("img");
    img.alt = `${displayName} avatar`;
    const imgTooltipContainer = document.createElement("div");
    imgTooltipContainer.className = "tooltip-container";
    const imgTooltipBox = document.createElement("div");
    imgTooltipBox.className = "tooltip-box";
    imgTooltipBox.textContent = getUserTooltipText(
      u,
      p.kills,
      p.deathDay || currentDay - 1
    );
    imgTooltipContainer.appendChild(img);
    imgTooltipContainer.appendChild(imgTooltipBox);
    setupImageLoading(img, imgTooltipContainer);
    img.src = p.avatar;
    const rank = document.createElement("div");
    rank.className = "rank";
    rank.textContent = `#${i + 1}`;
    const nmC = document.createElement("div");
    nmC.className = "name";
    const sp = document.createElement("span");
    sp.textContent = displayName;
    let playerColor = window.validateColor(p.color);
    if (window.ensureContrast) {
      playerColor = window.ensureContrast(playerColor, "#121212", 4.5);
    }
    sp.style.color = playerColor;
    nmC.append(sp);
    const kc = document.createElement("div");
    kc.className = "kills";
    const killsLabel =
      (window.themeConfig && window.themeConfig.messages.killsLabel) ||
      "Kills:";
    kc.textContent = `${killsLabel} ${p.kills}`;
    wrap.append(imgTooltipContainer, rank, nmC, kc);
    placementsGrid.appendChild(wrap);
  });

  deathLogEl.textContent = "";
  deathEventsLog.forEach((logEntry, index) => {
    if (index > 0) {
      deathLogEl.appendChild(document.createElement("br"));
    }
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = logEntry;
    while (tempDiv.firstChild) {
      deathLogEl.appendChild(tempDiv.firstChild);
    }
  });
  winnerScreen.style.display = "block";

  const btnRestart = document.getElementById("restartButton");
  if (btnRestart) {
    btnRestart.style.display = "none";
  }
}

function renderLeaderboard() {
  const globalStats = window.globalStats || {};
  const globalColors = window.globalColors || {};
  const leaderboardSort = window.leaderboardSort || { key: null, asc: true };
  const lbTableBody = document.querySelector("#leaderboardTable tbody");
  const overlay = document.getElementById("leaderboardOverlay");

  const list = Object.entries(globalStats);
  const key = leaderboardSort.key;
  if (key) {
    list.sort((a, b) => {
      const va =
        key === "username" ? a[0].localeCompare(b[0]) : a[1][key] - b[1][key];
      return leaderboardSort.asc ? va : -va;
    });
  } else {
    list.sort((a, b) => b[1].wins - a[1].wins || b[1].kills - a[1].kills);
  }
  lbTableBody.innerHTML = "";
  list.forEach(([u, st]) => {
    const tr = document.createElement("tr");
    const tdName = document.createElement("td");
    tdName.textContent = u;
    let playerColor = globalColors[u] || "#fff";
    if (window.ensureContrast) {
      playerColor = window.ensureContrast(playerColor, "#222222", 4.5);
    }
    tdName.style.color = playerColor;
    tr.appendChild(tdName);
    ["wins", "kills", "deaths", "maxDays", "totalDays"].forEach((k) => {
      const td = document.createElement("td");
      td.textContent = st[k];
      tr.appendChild(td);
    });
    lbTableBody.appendChild(tr);
  });
  overlay.style.display = "flex";
}

function showLeaderboard() {
  const lbHeaders = document.querySelectorAll("#leaderboardTable th");
  lbHeaders.forEach((h) => h.classList.remove("sort-asc", "sort-desc"));
  window.leaderboardSort = { key: null, asc: true };
  renderLeaderboard();
}

function clearLeaderboard() {
  if (
    !confirm(
      "Are you sure you want to clear all leaderboard data and restart the game? This action cannot be undone."
    )
  ) {
    return;
  }
  window.globalStats = {};
  if (typeof window.saveGlobalStats === "function") {
    window.saveGlobalStats();
  }
  const overlay = document.getElementById("leaderboardOverlay");
  if (overlay) {
    overlay.style.display = "none";
  }
  if (typeof window.backToJoin === "function") {
    window.backToJoin(false);
  }
}

function renderScoreboard(showOverlay = false) {
  const participants = window.participants || [];
  const overlay = document.getElementById("scoreboardOverlay");
  const aliveList = document.getElementById("aliveList");
  const deadList = document.getElementById("deadList");
  const aliveCountEl = document.getElementById("aliveCount");
  const deadCountEl = document.getElementById("deadCount");

  if (!overlay || !aliveList || !deadList || !aliveCountEl || !deadCountEl) {
    return;
  }

  const alive = participants.filter(
    (p) => p.alive && window.revealedAlive?.has(p.username)
  );
  const dead = participants.filter(
    (p) => !p.alive && window.revealedDeaths?.has(p.username)
  );

  aliveCountEl.textContent = alive.length;
  deadCountEl.textContent = dead.length;

  aliveList.innerHTML = "";
  if (alive.length === 0) {
    const emptyEl = document.createElement("div");
    emptyEl.className = "player-list-item empty";
    emptyEl.textContent = "No players alive";
    aliveList.appendChild(emptyEl);
  } else {
    alive.forEach((p) => {
      const item = document.createElement("div");
      item.className = "player-list-item";
      const displayName = getDisplayName(p.username);
      let playerColor = window.validateColor(p.color);
      if (window.ensureContrast) {
        playerColor = window.ensureContrast(playerColor, "#1e1e1e", 4.5);
      }
      item.style.color = playerColor;
      item.textContent = displayName;
      aliveList.appendChild(item);
    });
  }

  deadList.innerHTML = "";
  if (dead.length === 0) {
    const emptyEl = document.createElement("div");
    emptyEl.className = "player-list-item empty";
    emptyEl.textContent = "No players dead";
    deadList.appendChild(emptyEl);
  } else {
    dead.forEach((p) => {
      const item = document.createElement("div");
      item.className = "player-list-item";
      const displayName = getDisplayName(p.username);
      let playerColor = window.validateColor(p.color);
      if (window.ensureContrast) {
        playerColor = window.ensureContrast(playerColor, "#1e1e1e", 4.5);
      }
      item.style.color = playerColor;
      item.style.opacity = "0.7";
      item.textContent = displayName;
      deadList.appendChild(item);
    });
  }

  if (showOverlay) {
    overlay.style.display = "flex";
  }
}

function showScoreboard() {
  renderScoreboard(true);
}

function addPlayer(u, c) {
  const globalStats = window.globalStats || {};
  const globalColors = window.globalColors || {};
  const players = window.players;
  const playersGrid = document.getElementById("playersGrid");
  const btnStart = document.getElementById("startButton");

  if (typeof window.initGlobal === "function") {
    window.initGlobal(u);
  }

  globalColors[u] = validateColor(c);

  const backgroundColor = "#121212";
  if (!isAccessibleContrast(globalColors[u], backgroundColor, false)) {
    globalColors[u] = ensureContrast(globalColors[u], backgroundColor, 4.5);
    c = globalColors[u];
  }

  if (typeof window.saveGlobalColors === "function") {
    window.saveGlobalColors();
  }
  const cont = document.createElement("div");
  cont.className = "player";
  cont.dataset.username = u;
  const btn = document.createElement("button");
  btn.className = "removeBtn";
  btn.textContent = "x";
  btn.addEventListener("click", () => {
    players.delete(u);
    cont.remove();
    btnStart.disabled = players.size === 0;
  });
  const img = document.createElement("img");
  img.alt = `${u} avatar`;
  const imgTooltipContainer = document.createElement("div");
  imgTooltipContainer.className = "tooltip-container";
  const imgTooltipBox = document.createElement("div");
  imgTooltipBox.className = "tooltip-box";
  imgTooltipBox.textContent = getUserTooltipText(u, 0, 0);
  imgTooltipContainer.appendChild(img);
  imgTooltipContainer.appendChild(imgTooltipBox);

  const useTwitchAvatars = document.getElementById("useTwitchAvatars")?.checked;

  const cachedAvatar = window.getCachedAvatar
    ? window.getCachedAvatar(u, useTwitchAvatars)
    : null;

  if (cachedAvatar !== null) {
    setupImageLoading(img, imgTooltipContainer);
    img.src = cachedAvatar;
  } else if (useTwitchAvatars) {
    img.src =
      "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/default-user-profile_image-70x70.png";
    setupImageLoading(img, imgTooltipContainer);
    if (window.updatePlayerAvatar) {
      window.updatePlayerAvatar(u, true).then((avatarUrl) => {
        setupImageLoading(img, imgTooltipContainer);
        img.src = avatarUrl;
      });
    }
  } else {
    const fakeAvatar = window.assignFakeAvatar
      ? window.assignFakeAvatar(u)
      : window.getNextAvatar
      ? window.getNextAvatar()
      : (window.fakeAvatars || [])[0];
    setupImageLoading(img, imgTooltipContainer);
    img.src = fakeAvatar;
  }
  const nmC = document.createElement("div");
  nmC.className = "name";
  const sp = document.createElement("span");
  sp.textContent = u;
  sp.style.color = globalColors[u] || "#fff";
  nmC.append(sp);
  cont.append(btn, imgTooltipContainer, nmC);
  playersGrid.appendChild(cont);
}

function addFakePlayer(u, c) {
  const globalColors = window.globalColors || {};
  const players = window.players;
  const playersGrid = document.getElementById("playersGrid");
  const btnStart = document.getElementById("startButton");

  if (typeof window.initGlobal === "function") {
    window.initGlobal(u);
  }
  globalColors[u] = validateColor(c);

  const backgroundColor = "#121212";
  if (!isAccessibleContrast(globalColors[u], backgroundColor, false)) {
    globalColors[u] = ensureContrast(globalColors[u], backgroundColor, 4.5);
    c = globalColors[u];
  }

  if (typeof window.saveGlobalColors === "function") {
    window.saveGlobalColors();
  }
  const cont = document.createElement("div");
  cont.className = "player";
  cont.dataset.username = u;
  const btn = document.createElement("button");
  btn.className = "removeBtn";
  btn.textContent = "x";
  btn.addEventListener("click", () => {
    players.delete(u);
    cont.remove();
    btnStart.disabled = players.size === 0;
  });
  const img = document.createElement("img");
  img.alt = `${u} avatar`;
  const imgTooltipContainer = document.createElement("div");
  imgTooltipContainer.className = "tooltip-container";
  const imgTooltipBox = document.createElement("div");
  imgTooltipBox.className = "tooltip-box";
  imgTooltipBox.textContent = getUserTooltipText(u, 0, 0);
  imgTooltipContainer.appendChild(img);
  imgTooltipContainer.appendChild(imgTooltipBox);
  const fakeAvatar = window.assignFakeAvatar
    ? window.assignFakeAvatar(u)
    : window.getNextAvatar
    ? window.getNextAvatar()
    : (window.fakeAvatars || [])[0] || "";
  setupImageLoading(img, imgTooltipContainer);
  img.src = fakeAvatar;
  const nmC = document.createElement("div");
  nmC.className = "name";
  const sp = document.createElement("span");
  sp.textContent = u;
  sp.style.color = globalColors[u] || "#fff";
  nmC.append(sp);
  cont.append(btn, imgTooltipContainer, nmC);
  playersGrid.appendChild(cont);
}

const avatarCache = new Map();

function isTwitchPlaceholder(url) {
  if (!url || typeof url !== "string") return false;
  return url.includes("user-default-pictures");
}

function getCachedAvatar(username, useTwitch) {
  if (!username) return null;

  const cacheKey = useTwitch ? `twitch:${username}` : `fake:${username}`;
  if (!avatarCache.has(cacheKey)) return null;

  const cachedUrl = avatarCache.get(cacheKey);

  if (useTwitch && isTwitchPlaceholder(cachedUrl)) {
    const fallbackAvatar = window.getNextAvatar
      ? window.getNextAvatar()
      : (window.fakeAvatars || [])[0];
    avatarCache.set(cacheKey, fallbackAvatar);
    return fallbackAvatar;
  }

  return cachedUrl;
}

async function fetchTwitchAvatarsBatch(usernames) {
  const results = new Map();
  const fetchPromises = [];

  for (const username of usernames) {
    const cacheKey = `twitch:${username}`;

    if (avatarCache.has(cacheKey)) {
      const cachedUrl = avatarCache.get(cacheKey);
      if (isTwitchPlaceholder(cachedUrl)) {
        const fallbackAvatar = window.getNextAvatar
          ? window.getNextAvatar()
          : (window.fakeAvatars || [])[0];
        avatarCache.set(cacheKey, fallbackAvatar);
        results.set(username, fallbackAvatar);
      } else {
        results.set(username, cachedUrl);
      }
      continue;
    }

    fetchPromises.push(
      fetch(`https://decapi.me/twitch/avatar/${username}`, { mode: "cors" })
        .then((r) => r.text())
        .then((url) => {
          if (url && url.startsWith("http")) {
            if (isTwitchPlaceholder(url)) {
              const fallbackAvatar = window.getNextAvatar
                ? window.getNextAvatar()
                : (window.fakeAvatars || [])[0];
              avatarCache.set(cacheKey, fallbackAvatar);
              results.set(username, fallbackAvatar);
            } else {
              avatarCache.set(cacheKey, url);
              results.set(username, url);
            }
          } else {
            const fallbackAvatar = window.getNextAvatar
              ? window.getNextAvatar()
              : (window.fakeAvatars || [])[0];
            avatarCache.set(cacheKey, fallbackAvatar);
            results.set(username, fallbackAvatar);
          }
        })
        .catch(() => {
          const fallbackAvatar = window.getNextAvatar
            ? window.getNextAvatar()
            : (window.fakeAvatars || [])[0];
          avatarCache.set(cacheKey, fallbackAvatar);
          results.set(username, fallbackAvatar);
        })
    );
  }

  await Promise.all(fetchPromises);
  return results;
}

function updatePlayerAvatar(username, useTwitch) {
  return new Promise((resolve) => {
    if (useTwitch) {
      const cacheKey = `twitch:${username}`;
      if (avatarCache.has(cacheKey)) {
        const cachedUrl = avatarCache.get(cacheKey);
        if (isTwitchPlaceholder(cachedUrl)) {
          const fallbackAvatar = window.getNextAvatar
            ? window.getNextAvatar()
            : (window.fakeAvatars || [])[0];
          avatarCache.set(cacheKey, fallbackAvatar);
          resolve(fallbackAvatar);
          return;
        }
        resolve(cachedUrl);
        return;
      }

      fetch(`https://decapi.me/twitch/avatar/${username}`, { mode: "cors" })
        .then((r) => r.text())
        .then((url) => {
          if (url && url.startsWith("http")) {
            if (isTwitchPlaceholder(url)) {
              const fallbackAvatar = window.getNextAvatar
                ? window.getNextAvatar()
                : (window.fakeAvatars || [])[0];
              avatarCache.set(cacheKey, fallbackAvatar);
              resolve(fallbackAvatar);
            } else {
              avatarCache.set(cacheKey, url);
              resolve(url);
            }
          } else {
            const fallbackAvatar = window.getNextAvatar
              ? window.getNextAvatar()
              : (window.fakeAvatars || [])[0];
            avatarCache.set(cacheKey, fallbackAvatar);
            resolve(fallbackAvatar);
          }
        })
        .catch(() => {
          const fallbackAvatar = window.getNextAvatar
            ? window.getNextAvatar()
            : (window.fakeAvatars || [])[0];
          avatarCache.set(cacheKey, fallbackAvatar);
          resolve(fallbackAvatar);
        });
    } else {
      const cacheKey = `fake:${username}`;
      if (avatarCache.has(cacheKey)) {
        resolve(avatarCache.get(cacheKey));
        return;
      }

      const fakeAvatar = window.getNextAvatar
        ? window.getNextAvatar()
        : (window.fakeAvatars || [])[0];
      avatarCache.set(cacheKey, fakeAvatar);
      resolve(fakeAvatar);
    }
  });
}

window.escapeRegExp = escapeRegExp;
window.escapeHtml = escapeHtml;
window.validateColor = validateColor;
window.calculateContrastRatio = calculateContrastRatio;
window.isAccessibleContrast = isAccessibleContrast;
window.ensureContrast = ensureContrast;
window.getUserTooltipText = getUserTooltipText;
window.getDisplayName = getDisplayName;
window.showFallen = showFallen;
window.showWinner = showWinner;
window.renderLeaderboard = renderLeaderboard;
window.showLeaderboard = showLeaderboard;
window.clearLeaderboard = clearLeaderboard;
window.renderScoreboard = renderScoreboard;
window.showScoreboard = showScoreboard;
function assignFakeAvatar(username) {
  const cacheKey = `fake:${username}`;
  if (avatarCache.has(cacheKey)) {
    return avatarCache.get(cacheKey);
  }
  const fakeAvatar = window.getNextAvatar
    ? window.getNextAvatar()
    : (window.fakeAvatars || [])[0];
  avatarCache.set(cacheKey, fakeAvatar);
  return fakeAvatar;
}

window.addPlayer = addPlayer;
window.addFakePlayer = addFakePlayer;
window.updatePlayerAvatar = updatePlayerAvatar;
window.getCachedAvatar = getCachedAvatar;
window.fetchTwitchAvatarsBatch = fetchTwitchAvatarsBatch;
window.assignFakeAvatar = assignFakeAvatar;
window.setupImageLoading = setupImageLoading;
