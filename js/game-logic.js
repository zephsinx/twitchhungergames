const RENDER_DELAY = 10;

if (window.currentPhaseNumber === undefined) {
  window.currentPhaseNumber = 0;
}
if (window.eventsUsedThisPhase === undefined) {
  window.eventsUsedThisPhase = new Set();
}
if (window.recentEventUsage === undefined) {
  window.recentEventUsage = {};
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeEventMessage(msg) {
  if (!msg) return "";
  return msg.replace(/\{[^}]+\}/g, "{*}");
}

function getDecayedWeight(event, baseWeight, currentPhaseNumber) {
  if (!event || !event.msg) {
    return baseWeight;
  }

  const normalizedMsg = normalizeEventMessage(event.msg);
  const currentPhaseSet = window.eventsUsedThisPhase || new Set();
  const recentUsage = window.recentEventUsage || {};

  if (currentPhaseSet.has(normalizedMsg)) {
    return 0;
  }

  const usagePhases = recentUsage[normalizedMsg];
  if (!usagePhases || usagePhases.length === 0) {
    return baseWeight;
  }

  const mostRecentPhase = Math.max(...usagePhases);
  const phasesSinceLastUse = currentPhaseNumber - mostRecentPhase;

  const decayFactor = Math.min(1.0, 0.1 + phasesSinceLastUse * 0.3);

  if (usagePhases.length > 0) {
    const cutoffPhase = currentPhaseNumber - 10;
    recentUsage[normalizedMsg] = usagePhases.filter(
      (phase) => phase > cutoffPhase
    );
    if (recentUsage[normalizedMsg].length === 0) {
      delete recentUsage[normalizedMsg];
    }
  }

  return baseWeight * decayFactor;
}

function getStepType(isDay) {
  const currentDay = window.currentDay || 1;
  const daysSinceEvent = window.daysSinceEvent || 0;

  // Prevent arena or feast on day 1 and night 1 to have a "normal" day after the bloodbath
  if (currentDay === 1) {
    window.daysSinceEvent = (window.daysSinceEvent || 0) + 1;
    return isDay ? "day" : "night";
  }

  if (isDay) {
    const feastChance = Math.min(8 + daysSinceEvent * 3, 30);
    if (Math.random() * 100 < feastChance) {
      window.daysSinceEvent = 0;
      return "feast";
    }
  }

  const arenaChance = Math.min(6 + daysSinceEvent * 2, 25);
  if (Math.random() * 100 < arenaChance) {
    window.daysSinceEvent = 0;
    return "arena";
  }

  window.daysSinceEvent = (window.daysSinceEvent || 0) + 1;
  return isDay ? "day" : "night";
}

async function runPhase(type) {
  const eventLog = document.getElementById("eventLog");
  const phaseDesc = document.getElementById("phaseDesc");
  const dayDisplay = document.getElementById("dayDisplay");
  const eventsData = window.eventsData;
  const currentDay = window.currentDay || 1;

  window.currentPhaseNumber = (window.currentPhaseNumber || 0) + 1;
  window.eventsUsedThisPhase = new Set();

  eventLog.innerHTML = "";
  let step = type;
  if (type === "day" || type === "night") {
    window.currentPhaseType = getStepType(type === "day");
    step = window.currentPhaseType;
  } else {
    window.currentPhaseType = type;
  }
  if (step === "feast") {
    if (!window.usedFeastIndices) {
      window.usedFeastIndices = [];
    }
    const feastEvents = Array.isArray(eventsData.feast)
      ? eventsData.feast
      : [eventsData.feast];
    let availableFeastIndices = feastEvents
      .map((_, idx) => idx)
      .filter((idx) => !window.usedFeastIndices.includes(idx));

    if (availableFeastIndices.length === 0) {
      window.usedFeastIndices = [];
      availableFeastIndices = feastEvents.map((_, idx) => idx);
    }

    const randomIndex =
      availableFeastIndices[
        Math.floor(Math.random() * availableFeastIndices.length)
      ];
    window.usedFeastIndices.push(randomIndex);
    const ev = feastEvents[randomIndex];
    phaseDesc.textContent = ev.description;
    dayDisplay.textContent = ev.title;
    const eventColor = ev.color || "#ffffff";
    dayDisplay.style.color = window.ensureContrast
      ? window.ensureContrast(eventColor, "#121212", 3.0)
      : eventColor;
    await runEvents(ev);
  } else if (step === "arena") {
    if (!window.usedArenaIndices) {
      window.usedArenaIndices = [];
    }
    let availableArenaIndices = eventsData.arena
      .map((_, idx) => idx)
      .filter((idx) => !window.usedArenaIndices.includes(idx));

    if (availableArenaIndices.length === 0) {
      window.usedArenaIndices = [];
      availableArenaIndices = eventsData.arena.map((_, idx) => idx);
    }

    const randomIndex =
      availableArenaIndices[
        Math.floor(Math.random() * availableArenaIndices.length)
      ];
    window.usedArenaIndices.push(randomIndex);
    const ev = eventsData.arena[randomIndex];
    phaseDesc.textContent = ev.description;
    dayDisplay.textContent = ev.title;
    const eventColor = ev.color || "#ffffff";
    dayDisplay.style.color = window.ensureContrast
      ? window.ensureContrast(eventColor, "#121212", 3.0)
      : eventColor;
    await runEvents(ev);
  } else {
    const ev = eventsData[step];
    phaseDesc.textContent = ev.description || "";
    dayDisplay.textContent = ev.title.replace(
      "{0}",
      step === "bloodbath" ? "" : currentDay
    );
    let eventColor;
    if (step === "night") {
      eventColor = window.themeConfig?.nightPhaseColor || "#88ccff";
    } else {
      eventColor = ev.color || "#ffffff";
    }
    dayDisplay.style.color = window.ensureContrast
      ? window.ensureContrast(eventColor, "#121212", 3.0)
      : eventColor;
    await runEvents(ev);
  }
  const killedThisDay = window.killedThisDay || [];
  window.consecutiveNoDeaths =
    killedThisDay.length === 0 ? (window.consecutiveNoDeaths || 0) + 1 : 0;
}

async function runEvents(evObj) {
  const participants = window.participants || [];
  const eventsData = window.eventsData;
  const itemsData = window.itemsData;
  const materialsData = window.materialsData;
  const currentDay = window.currentDay || 1;
  const stage = window.stage || 0;
  const consecutiveNoDeaths = window.consecutiveNoDeaths || 0;
  const eventHandlersLoaded = window.eventHandlersLoaded || false;
  const polymorphedPlayers = window.polymorphedPlayers || new Map();
  const globalStats = window.globalStats || {};
  const killedThisDay = window.killedThisDay || [];
  const eliminationOrder = window.eliminationOrder || [];
  const deathEventsLog = window.deathEventsLog || [];
  const eventLog = document.getElementById("eventLog");

  const aliveSet = new Set(participants.filter((p) => p.alive));
  const base = Math.floor(Math.random() * 3) + 1.25;
  const factor = base + consecutiveNoDeaths + (stage === 0 ? 1 : 0);
  const msgs = [];

  const genericEvents = eventsData.generic || { nonfatal: [], fatal: [] };
  const currentPhaseType = window.currentPhaseType || "";
  const isArenaEvent = currentPhaseType === "arena";
  const isFeastEvent = currentPhaseType === "feast";
  const isBloodbathEvent = currentPhaseType === "bloodbath";
  const PHASE_EVENT_WEIGHT_MULTIPLIER = 3.0;

  while (aliveSet.size > 0) {
    const roll = Math.floor(Math.random() * 11);
    const useFatal =
      roll < factor && participants.filter((p) => p.alive).length > 1;
    const phasePool = (useFatal ? evObj.fatal : evObj.nonfatal) || [];
    const genericPool =
      (useFatal ? genericEvents.fatal : genericEvents.nonfatal) || [];

    const phasePoolSet = new Set(phasePool);
    let pool = [...phasePool, ...genericPool];
    pool = pool.filter((a) => a.tributes <= aliveSet.size);
    if (!pool.length) break;

    let totalWeight = 0;
    const currentPhaseNumber = window.currentPhaseNumber || 0;
    pool.forEach((action) => {
      let baseWeight = action.weight !== undefined ? action.weight : 1;
      if (
        phasePoolSet.has(action) &&
        (isArenaEvent || isFeastEvent || isBloodbathEvent)
      ) {
        baseWeight *= PHASE_EVENT_WEIGHT_MULTIPLIER;
      }
      const decayedWeight = getDecayedWeight(
        action,
        baseWeight,
        currentPhaseNumber
      );
      if (decayedWeight <= 0) {
        action._effectiveWeight = 0;
      } else {
        action._effectiveWeight = decayedWeight;
      }
      totalWeight += action._effectiveWeight;
    });

    if (totalWeight <= 0) {
      console.error("All events have zero or negative weight");
      break;
    }

    const random = Math.random() * totalWeight;
    let cumulative = 0;
    let action = null;

    for (const candidate of pool) {
      cumulative += candidate._effectiveWeight;
      if (random <= cumulative) {
        action = candidate;
        break;
      }
    }

    if (!action) {
      action = pool[0];
    }

    if (action && action.msg) {
      const normalizedMsg = normalizeEventMessage(action.msg);
      const currentPhaseNumber = window.currentPhaseNumber || 0;

      if (!window.eventsUsedThisPhase) {
        window.eventsUsedThisPhase = new Set();
      }
      window.eventsUsedThisPhase.add(normalizedMsg);

      if (!window.recentEventUsage) {
        window.recentEventUsage = {};
      }
      if (!window.recentEventUsage[normalizedMsg]) {
        window.recentEventUsage[normalizedMsg] = [];
      }
      if (
        !window.recentEventUsage[normalizedMsg].includes(currentPhaseNumber)
      ) {
        window.recentEventUsage[normalizedMsg].push(currentPhaseNumber);
      }
    }

    pool.forEach((a) => {
      if (a._effectiveWeight !== undefined) {
        delete a._effectiveWeight;
      }
    });
    const pick = [];
    const avail = Array.from(aliveSet);
    for (let i = 0; i < action.tributes; i++) {
      const idx = Math.floor(Math.random() * avail.length);
      pick.push(avail.splice(idx, 1)[0]);
      aliveSet.delete(pick[pick.length - 1]);
    }

    let txt = action.msg;
    for (let i = 0; i < pick.length; i++) {
      const displayName = window.getDisplayName(pick[i].username);
      txt = txt.replace(new RegExp(`\\{${i}\\}`, "g"), displayName);
    }

    const killsCount = Array.isArray(action.killed) ? action.killed.length : 0;

    if (
      action.customHandler &&
      eventHandlersLoaded &&
      window.eventHandlers &&
      window.eventHandlers[action.customHandler] &&
      typeof window.eventHandlers[action.customHandler].execute === "function"
    ) {
      window.eventHandlers[action.customHandler].execute(
        {
          picks: pick,
          currentRound: currentDay,
        },
        { polymorphedPlayers }
      );
    }
    const types =
      (window.themeConfig && window.themeConfig.itemCategories) ||
      Object.keys(itemsData).concat(Object.keys(materialsData));

    const prefixGroups = new Map();
    types.forEach((cat) => {
      const underscoreIndex = cat.indexOf("_");
      if (underscoreIndex > 0) {
        const prefix = cat.substring(0, underscoreIndex + 1);
        if (!prefixGroups.has(prefix)) {
          prefixGroups.set(prefix, []);
        }
        prefixGroups.get(prefix).push(cat);
      }
    });

    const dynamicAnyCategories = [];
    prefixGroups.forEach((categories, prefix) => {
      if (categories.length > 1) {
        const prefixName = prefix.slice(0, -1);
        dynamicAnyCategories.push(`${prefixName}_any`);
      }
    });

    const specialAnyCategories = ["item_any", "material_any"];

    [...types, ...specialAnyCategories, ...dynamicAnyCategories].forEach(
      (cat) => {
        let placeholder = `{${cat}}`;
        let list;

        if (cat === "item_any") {
          list = types.flatMap((c) => itemsData[c] || []);
        } else if (cat === "material_any") {
          list = types.flatMap((c) => materialsData[c] || []);
        } else if (cat === "weapon_any") {
          list = types
            .flatMap((c) => itemsData[c] || [])
            .filter((w) => w.max_kills >= killsCount);
        } else if (cat.endsWith("_any")) {
          const prefix = cat.slice(0, -4) + "_";
          const prefixCategories = types.filter((c) => c.startsWith(prefix));

          const hasItems = prefixCategories.some(
            (c) => itemsData[c] && itemsData[c].length > 0
          );
          const hasMaterials = prefixCategories.some(
            (c) => materialsData[c] && materialsData[c].length > 0
          );

          if (hasItems) {
            list = prefixCategories
              .flatMap((c) => itemsData[c] || [])
              .filter((w) => w.max_kills >= killsCount);
          } else if (hasMaterials) {
            list = prefixCategories.flatMap((c) => materialsData[c] || []);
          } else {
            list = [];
          }
        } else if (cat.startsWith("weapon_")) {
          list = (itemsData[cat] || []).filter(
            (w) => w.max_kills >= killsCount
          );
        } else if (
          cat.startsWith("material_") ||
          cat.startsWith("liquid_") ||
          cat.startsWith("sand_") ||
          cat.startsWith("food_") ||
          cat.startsWith("hazard_")
        ) {
          list = materialsData[cat] || [];
        } else {
          list = itemsData[cat] || [];
        }

        if (txt.includes(placeholder)) {
          const candidates = list;
          const pick =
            candidates[Math.floor(Math.random() * candidates.length)];
          const chosen = candidates.length
            ? pick.name !== undefined
              ? pick.name
              : pick
            : placeholder;
          const safeChosen = window.escapeHtml(String(chosen));
          txt = txt.replace(
            new RegExp(window.escapeRegExp(placeholder), "g"),
            safeChosen
          );
        }
      }
    );

    msgs.push({
      picks: pick,
      text: txt,
      killed: action.killed || [],
      killer: action.killer || [],
      hidden: action.hidden === true,
    });
  }

  for (const m of msgs) {
    if (m.killed.length) {
      m.killer.forEach((kr) => {
        const kp = m.picks[kr];
        kp.kills += m.killed.length;
        if (typeof window.initGlobal === "function") {
          window.initGlobal(kp.username);
        }
        if (!globalStats[kp.username]) {
          globalStats[kp.username] = {
            wins: 0,
            kills: 0,
            deaths: 0,
            totalDays: 0,
            maxDays: 0,
          };
        }
        globalStats[kp.username].kills += m.killed.length;
      });
      m.killed.forEach((idx) => {
        const v = m.picks[idx];
        if (v && v.alive) {
          v.alive = false;
          v.deathDay = currentDay;
          killedThisDay.push(v.username);
          eliminationOrder.push(v.username);
          if (typeof window.initGlobal === "function") {
            window.initGlobal(v.username);
          }
          if (!globalStats[v.username]) {
            globalStats[v.username] = {
              wins: 0,
              kills: 0,
              deaths: 0,
              totalDays: 0,
              maxDays: 0,
            };
          }
          globalStats[v.username].deaths++;
        }
      });
      if (typeof window.saveGlobalStats === "function") {
        window.saveGlobalStats();
      }
      if (typeof window.renderScoreboard === "function") {
        const scoreboardOverlay = document.getElementById("scoreboardOverlay");
        if (scoreboardOverlay && scoreboardOverlay.style.display === "flex") {
          window.renderScoreboard(false);
        }
      }
    }
    if (m.killed.length && !m.hidden) {
      const tempContainer = document.createElement("div");
      let remainingText = m.text;
      const pickMap = new Map();
      m.picks.forEach((p) => {
        const displayName = window.getDisplayName(p.username);
        if (!pickMap.has(displayName)) {
          pickMap.set(displayName, []);
        }
        pickMap.get(displayName).push(p);
      });

      const sortedNames = Array.from(pickMap.keys()).sort(
        (a, b) => b.length - a.length
      );
      const replacements = [];

      for (const displayName of sortedNames) {
        const picks = pickMap.get(displayName);
        let searchIndex = 0;
        while (true) {
          const index = remainingText.indexOf(displayName, searchIndex);
          if (index === -1) break;
          replacements.push({
            index: index,
            length: displayName.length,
            displayName: displayName,
            pick: picks[0],
          });
          searchIndex = index + 1;
        }
      }

      replacements.sort((a, b) => {
        if (a.index !== b.index) return a.index - b.index;
        return b.length - a.length;
      });

      const nonOverlapping = [];
      let lastEnd = 0;
      replacements.forEach((repl) => {
        if (repl.index >= lastEnd) {
          nonOverlapping.push(repl);
          lastEnd = repl.index + repl.length;
        }
      });

      let currentIndex = 0;
      nonOverlapping.forEach((repl) => {
        if (repl.index > currentIndex) {
          const textNode = document.createTextNode(
            remainingText.substring(currentIndex, repl.index)
          );
          tempContainer.appendChild(textNode);
        }

        const p = repl.pick;
        let safeColor = window.validateColor(p.color);
        if (window.ensureContrast) {
          safeColor = window.ensureContrast(safeColor, "#121212", 4.5);
        }
        const nameSpan = document.createElement("span");
        nameSpan.style.color = safeColor;
        nameSpan.textContent = repl.displayName;
        tempContainer.appendChild(nameSpan);

        currentIndex = repl.index + repl.length;
      });

      if (currentIndex < remainingText.length) {
        const textNode = document.createTextNode(
          remainingText.substring(currentIndex)
        );
        tempContainer.appendChild(textNode);
      }

      deathEventsLog.push(tempContainer.innerHTML);
    }
    if (!m.hidden) {
      const evEl = document.createElement("div");
      const avs = document.createElement("div");
      evEl.className = "event";
      avs.className = "avatars";
      m.picks.forEach((p) => {
        const wrap = document.createElement("div");
        wrap.className = "avatarWrap";
        if (!p.alive) {
          wrap.classList.add("has-dead");
        }
        const img = document.createElement("img");
        img.alt = `${window.getDisplayName(p.username)} avatar`;
        if (!p.alive) {
          img.className = "dead";
        }
        const imgTooltipContainer = document.createElement("div");
        imgTooltipContainer.className = "tooltip-container";
        const imgTooltipBox = document.createElement("div");
        imgTooltipBox.className = "tooltip-box";
        imgTooltipBox.textContent = window.getUserTooltipText(
          p.username,
          p.kills,
          currentDay
        );
        imgTooltipContainer.appendChild(img);
        imgTooltipContainer.appendChild(imgTooltipBox);
        wrap.append(imgTooltipContainer);
        if (window.setupImageLoading) {
          window.setupImageLoading(img, imgTooltipContainer);
        }
        img.src = p.avatar;
        avs.appendChild(wrap);
      });
      const txtEl = document.createElement("div");
      txtEl.className = "text";
      let remainingText = m.text;
      const pickMap = new Map();
      m.picks.forEach((p) => {
        const displayName = window.getDisplayName(p.username);
        if (!pickMap.has(displayName)) {
          pickMap.set(displayName, []);
        }
        pickMap.get(displayName).push(p);
      });

      const sortedNames = Array.from(pickMap.keys()).sort(
        (a, b) => b.length - a.length
      );
      const replacements = [];

      for (const displayName of sortedNames) {
        const picks = pickMap.get(displayName);
        let searchIndex = 0;
        while (true) {
          const index = remainingText.indexOf(displayName, searchIndex);
          if (index === -1) break;
          replacements.push({
            index: index,
            length: displayName.length,
            displayName: displayName,
            pick: picks[0],
          });
          searchIndex = index + 1;
        }
      }

      replacements.sort((a, b) => {
        if (a.index !== b.index) return a.index - b.index;
        return b.length - a.length;
      });

      const nonOverlapping = [];
      let lastEnd = 0;
      replacements.forEach((repl) => {
        if (repl.index >= lastEnd) {
          nonOverlapping.push(repl);
          lastEnd = repl.index + repl.length;
        }
      });

      let currentIndex = 0;
      nonOverlapping.forEach((repl) => {
        if (repl.index > currentIndex) {
          const textNode = document.createTextNode(
            remainingText.substring(currentIndex, repl.index)
          );
          txtEl.appendChild(textNode);
        }

        const p = repl.pick;
        let safeColor = window.validateColor(p.color);
        if (window.ensureContrast) {
          safeColor = window.ensureContrast(safeColor, "#121212", 4.5);
        }
        const tooltipContainer = document.createElement("span");
        tooltipContainer.className = "tooltip-container";
        const nameSpan = document.createElement("span");
        nameSpan.style.color = safeColor;
        nameSpan.textContent = repl.displayName;
        const tooltipBox = document.createElement("div");
        tooltipBox.className = "tooltip-box";
        tooltipBox.textContent = window.getUserTooltipText(
          p.username,
          p.kills,
          currentDay
        );
        tooltipContainer.appendChild(nameSpan);
        tooltipContainer.appendChild(tooltipBox);
        txtEl.appendChild(tooltipContainer);

        currentIndex = repl.index + repl.length;
      });

      if (currentIndex < remainingText.length) {
        const textNode = document.createTextNode(
          remainingText.substring(currentIndex)
        );
        txtEl.appendChild(textNode);
      }
      evEl.append(avs, txtEl);

      const killedUsernames = m.killed
        .map((idx) => m.picks[idx]?.username)
        .filter(Boolean);
      evEl.dataset.killedUsernames = JSON.stringify(killedUsernames);

      const participantUsernames = m.picks
        .map((p) => p?.username)
        .filter(Boolean);
      evEl.dataset.participantUsernames = JSON.stringify(participantUsernames);

      evEl.addEventListener("click", (e) => {
        if (!evEl.classList.contains("revealed")) {
          evEl.classList.add("revealed");
          const killed = JSON.parse(evEl.dataset.killedUsernames || "[]");
          const participants = JSON.parse(
            evEl.dataset.participantUsernames || "[]"
          );
          if (window.revealedDeaths) {
            killed.forEach((username) => window.revealedDeaths.add(username));
          }
          if (window.revealedAlive) {
            const aliveParticipants = participants.filter(
              (u) => !killed.includes(u)
            );
            aliveParticipants.forEach((username) =>
              window.revealedAlive.add(username)
            );
          }
          if (typeof window.renderScoreboard === "function") {
            const scoreboardOverlay =
              document.getElementById("scoreboardOverlay");
            if (
              scoreboardOverlay &&
              scoreboardOverlay.style.display === "flex"
            ) {
              window.renderScoreboard(false);
            }
          }
          e.stopPropagation();
        }
      });

      eventLog.appendChild(evEl);
      await sleep(RENDER_DELAY);
    }
  }

  window.killedThisDay = killedThisDay;
  window.eliminationOrder = eliminationOrder;
  window.deathEventsLog = deathEventsLog;
}

async function nextPhase() {
  const participants = window.participants || [];
  const killedThisDay = window.killedThisDay || [];
  const currentDay = window.currentDay || 1;
  const stage = window.stage || 0;

  if (participants.filter((p) => p.alive).length <= 1) {
    window.showWinner();
    return;
  }
  switch (stage) {
    case 0:
      await runPhase("bloodbath");
      window.stage = 1;
      break;
    case 1:
      await runPhase("day");
      window.stage = 2;
      break;
    case 2:
      if (killedThisDay.length > 0) {
        window.showFallen(currentDay);
        window.stage = 3;
      } else {
        window.stage = 3;
        await nextPhase();
      }
      break;
    case 3:
      await runPhase("night");
      window.currentDay = (window.currentDay || 1) + 1;
      window.stage = 1;
      break;
  }
}

function backToJoin(samePlayers) {
  const winnerScreen = document.getElementById("winnerScreen");
  const procCont = document.getElementById("proceedContainer");
  const eventLog = document.getElementById("eventLog");
  const dayDisplay = document.getElementById("dayDisplay");
  const phaseDesc = document.getElementById("phaseDesc");
  const joinPrompt = document.getElementById("joinPrompt");
  const playersGrid = document.getElementById("playersGrid");
  const btnStart = document.getElementById("startButton");
  const btnDebug = document.getElementById("debugButton");
  const scoreboardOverlay = document.getElementById("scoreboardOverlay");
  const players = window.players;
  const polymorphedPlayers = window.polymorphedPlayers || new Map();

  winnerScreen.style.display = "none";
  procCont.style.display = "none";
  if (scoreboardOverlay) {
    scoreboardOverlay.style.display = "none";
  }
  eventLog.innerHTML = "";
  dayDisplay.textContent = "";
  phaseDesc.textContent = "";
  joinPrompt.style.display = window.isConnected ? "block" : "none";
  playersGrid.style.display = "grid";
  btnStart.style.display = "inline-block";
  btnDebug.style.display = "inline-block";
  btnStart.disabled = !samePlayers && players.size === 0;

  if (!samePlayers) {
    players.clear();
    playersGrid.innerHTML = "";
  }
  window.gameStarted = false;
  window.participants = [];
  window.eliminationOrder = [];
  window.daysSinceEvent = 0;
  window.consecutiveNoDeaths = 0;
  window.killedThisDay = [];
  window.deathEventsLog = [];
  window.revealedDeaths = new Set();
  window.revealedAlive = new Set();
  window.currentPhaseType = null;
  window.usedFeastIndices = [];
  window.usedArenaIndices = [];
  window.currentPhaseNumber = 0;
  window.eventsUsedThisPhase = new Set();
  window.recentEventUsage = {};
  polymorphedPlayers.clear();

  if (typeof window.updateHeaderForGameState === "function") {
    window.updateHeaderForGameState();
  }
}

window.getStepType = getStepType;
window.runPhase = runPhase;
window.runEvents = runEvents;
window.nextPhase = nextPhase;
window.backToJoin = backToJoin;
window.sleep = sleep;
