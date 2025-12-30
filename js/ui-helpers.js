function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(text) {
  if (typeof text !== "string") return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
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
  const globalStats = window.globalStats || {};
  const g = globalStats[u] || {
    wins: 0,
    kills: 0,
    deaths: 0,
    totalDays: 0,
    maxDays: 0,
  };
  return `Run Stats:\nKills: ${runKills}\nDays Survived: ${runDays}\n---\nGlobal Stats:\nWins: ${g.wins}\nKills: ${g.kills}\nDeaths: ${g.deaths}\nMax Days: ${g.maxDays}\nTotal Days: ${g.totalDays}`;
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
  dayDisplay.style.color = "#aaa";
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
    wrap.className = "avatarWrap";
    const img = document.createElement("img");
    img.src = p.avatar;
    img.className = "dead";
    const nmC = document.createElement("div");
    nmC.className = "tooltip-container text";
    const sp = document.createElement("span");
    sp.textContent = displayName;
    sp.style.color = p.color;
    const tip = document.createElement("div");
    tip.className = "tooltip-box";
    tip.innerText = getUserTooltipText(u, p.kills, day);
    nmC.append(sp, tip);
    wrap.append(img, nmC);
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
  winnerAvatar.src = avatar;
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
    img.src = p.avatar;
    const rank = document.createElement("div");
    rank.className = "rank";
    rank.textContent = `#${i + 1}`;
    const nmC = document.createElement("div");
    nmC.className = "name tooltip-container";
    const sp = document.createElement("span");
    sp.textContent = displayName;
    sp.style.color = p.color;
    const tip = document.createElement("div");
    tip.className = "tooltip-box";
    tip.innerText = getUserTooltipText(
      u,
      p.kills,
      p.deathDay || currentDay - 1
    );
    nmC.append(sp, tip);
    const kc = document.createElement("div");
    kc.className = "kills";
    const killsLabel =
      (window.themeConfig && window.themeConfig.messages.killsLabel) ||
      "Kills:";
    kc.textContent = `${killsLabel} ${p.kills}`;
    wrap.append(img, rank, nmC, kc);
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
    tdName.style.color = globalColors[u] || "#fff";
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

  var color = globalColors[u];
  let r, g, b;
  if (color[0] === "#") {
    if (color.length === 4) {
      r = parseInt(color[1] + color[1], 16);
      g = parseInt(color[2] + color[2], 16);
      b = parseInt(color[3] + color[3], 16);
    } else {
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    }
  } else if (color.startsWith("rgb")) {
    [r, g, b] = color.match(/\d+/g).map(Number);
  } else {
    // Fallback to white if color format is unexpected
    console.warn(
      `Unexpected color format for player ${u}: ${color}, using white as fallback`
    );
    r = 255;
    g = 255;
    b = 255;
  }
  const brightness = r * 0.299 + g * 0.587 + b * 0.114;

  if (brightness < 60) {
    r = Math.min(255, Math.floor(r * 1.5));
    g = Math.min(255, Math.floor(g * 1.5));
    b = Math.min(255, Math.floor(b * 1.5));
    globalColors[u] = `rgb(${r}, ${g}, ${b})`;
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
  img.src =
    "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/default-user-profile_image-70x70.png";
  fetch(`https://decapi.me/twitch/avatar/${u}`, { mode: "cors" })
    .then((r) => r.text())
    .then((url) => {
      if (url.startsWith("http")) img.src = url;
    });
  const nmC = document.createElement("div");
  nmC.className = "tooltip-container name";
  const sp = document.createElement("span");
  sp.textContent = u;
  sp.style.color = c || "#fff";
  const tip = document.createElement("div");
  tip.className = "tooltip-box";
  tip.innerText = getUserTooltipText(u, 0, 0);
  nmC.append(sp, tip);
  cont.append(btn, img, nmC);
  playersGrid.appendChild(cont);
}

function addFakePlayer(u, c) {
  const globalColors = window.globalColors || {};
  const players = window.players;
  const playersGrid = document.getElementById("playersGrid");
  const btnStart = document.getElementById("startButton");
  const fakeAvatars = window.fakeAvatars || [
    "assets/images/pfp1.png",
    "assets/images/pfp2.png",
    "assets/images/pfp3.png",
    "assets/images/pfp4.png",
    "assets/images/pfp5.png",
    "assets/images/pfp6.png",
  ];

  if (typeof window.initGlobal === "function") {
    window.initGlobal(u);
  }
  globalColors[u] = validateColor(c);

  var color = globalColors[u];
  let r, g, b;
  if (color[0] === "#") {
    if (color.length === 4) {
      r = parseInt(color[1] + color[1], 16);
      g = parseInt(color[2] + color[2], 16);
      b = parseInt(color[3] + color[3], 16);
    } else {
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    }
  } else if (color.startsWith("rgb")) {
    [r, g, b] = color.match(/\d+/g).map(Number);
  } else {
    console.warn(
      `Unexpected color format for player ${u}: ${color}, using white as fallback`
    );
    r = 255;
    g = 255;
    b = 255;
  }
  const brightness = r * 0.299 + g * 0.587 + b * 0.114;

  if (brightness < 60) {
    r = Math.min(255, Math.floor(r * 1.5));
    g = Math.min(255, Math.floor(g * 1.5));
    b = Math.min(255, Math.floor(b * 1.5));
    globalColors[u] = `rgb(${r}, ${g}, ${b})`;
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
  img.src = fakeAvatars[Math.floor(Math.random() * fakeAvatars.length)];
  const nmC = document.createElement("div");
  nmC.className = "tooltip-container name";
  const sp = document.createElement("span");
  sp.textContent = u;
  sp.style.color = c || "#fff";
  const tip = document.createElement("div");
  tip.className = "tooltip-box";
  tip.innerText = getUserTooltipText(u, 0, 0);
  nmC.append(sp, tip);
  cont.append(btn, img, nmC);
  playersGrid.appendChild(cont);
}

window.escapeRegExp = escapeRegExp;
window.escapeHtml = escapeHtml;
window.validateColor = validateColor;
window.getUserTooltipText = getUserTooltipText;
window.getDisplayName = getDisplayName;
window.showFallen = showFallen;
window.showWinner = showWinner;
window.renderLeaderboard = renderLeaderboard;
window.showLeaderboard = showLeaderboard;
window.addPlayer = addPlayer;
window.addFakePlayer = addFakePlayer;
