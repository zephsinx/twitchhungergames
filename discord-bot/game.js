const eventHandlers = require("../event-handlers");

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

class NoitaGame {
  constructor(eventsData, itemsData, materialsData, participants) {
    this.eventsData = eventsData;
    this.itemsData = itemsData;
    this.materialsData = materialsData;
    this.participants = participants;

    this.eliminationOrder = [];
    this.killedThisPhase = [];
    this.currentDay = 1;
    this.stage = 0;
    this.daysSinceEvent = 0;
    this.consecutiveNoDeaths = 0;
    this.lastPhaseHadDeaths = false;
    this.currentPhaseType = null;

    this.gameState = {
      polymorphedPlayers: new Map(),
    };

    this.types = [
      "weapon_blunt",
      "weapon_cutting",
      "weapon_piercing",
      "weapon_wand",
      "weapon_projectile",
      "weapon_fire",
      "weapon_explosive",
      "weapon_electricity",
      "sand_bad",
      "sand_good",
      "sand_neutral",
      "liquid_water",
      "liquid_poison",
      "liquid_good",
      "liquid_bad",
      "liquid_neutral",
      "food_good",
      "food_neutral",
      "food_bad",
    ];
  }

  getAliveCount() {
    return this.participants.filter((p) => p.alive).length;
  }

  getSurvivors() {
    return this.participants.filter((p) => p.alive);
  }

  getPlacements() {
    const survivors = this.getSurvivors();
    const eliminated = this.eliminationOrder.slice().reverse();

    const finalOrder =
      survivors.length === 1
        ? [
            survivors[0],
            ...eliminated.map((u) =>
              this.participants.find((p) => p.username === u)
            ),
          ]
        : eliminated.map((u) =>
            this.participants.find((p) => p.username === u)
          );

    return finalOrder.filter((p) => p);
  }

  getFallenThisPhase() {
    return this.killedThisPhase.slice();
  }

  shouldShowFallen() {
    return this.lastPhaseHadDeaths;
  }

  getDisplayName(username) {
    if (
      eventHandlers &&
      eventHandlers.polymorph &&
      this.gameState.polymorphedPlayers &&
      this.gameState.polymorphedPlayers.has(username)
    ) {
      return eventHandlers.polymorph.getDisplayName(username, this.gameState);
    }
    return username;
  }

  getNextPhaseInfo() {
    let phaseKey, phaseData;

    switch (this.stage) {
      case 0:
        phaseData = this.eventsData.bloodbath;
        return {
          title: phaseData.title || "The Bloodbath",
          description:
            phaseData.description ||
            "As the witches stand on their podiums, the music machine sounds.",
          color: phaseData.color || "#c70000",
        };
      case 1:
        this.currentPhaseType = this.getStepType(true);
        if (this.currentPhaseType === "feast") {
          phaseData = this.eventsData.feast;
          return {
            title: phaseData.title,
            description: phaseData.description,
            color: phaseData.color,
          };
        } else if (this.currentPhaseType === "arena") {
          const arenaEvents = this.eventsData.arena;
          const ev =
            arenaEvents[Math.floor(Math.random() * arenaEvents.length)];
          return {
            title: ev.title,
            description: ev.description,
            color: ev.color,
          };
        }
        phaseData = this.eventsData.day;
        return {
          title: phaseData.title.replace("{0}", this.currentDay),
          description: phaseData.description,
          color: phaseData.color || "#f9eb0f",
        };
      case 2:
        phaseData = this.eventsData.night;
        return {
          title: phaseData.title.replace("{0}", this.currentDay),
          description: phaseData.description,
          color: "#88ccff",
        };
      default:
        return { title: "Unknown", description: "", color: "#ffffff" };
    }
  }

  getStepType(isDay) {
    const fc = 100 * (this.daysSinceEvent ** 2 / 55) + 9 / 55;
    if (isDay && Math.random() * 100 < fc) {
      this.daysSinceEvent = 0;
      return "feast";
    }
    if (this.daysSinceEvent > 0 && Math.floor(Math.random() * 20) === 0) {
      this.daysSinceEvent = 0;
      return "arena";
    }
    this.daysSinceEvent++;
    return isDay ? "day" : "night";
  }

  runPhase() {
    this.killedThisPhase = [];
    this.lastPhaseHadDeaths = false;

    let evObj;
    switch (this.stage) {
      case 0:
        evObj = this.eventsData.bloodbath;
        break;
      case 1:
        const stepType = this.currentPhaseType || "day";
        if (stepType === "feast") {
          evObj = this.eventsData.feast;
        } else if (stepType === "arena") {
          const arenaEvents = this.eventsData.arena;
          evObj = arenaEvents[Math.floor(Math.random() * arenaEvents.length)];
        } else {
          evObj = this.eventsData.day;
        }
        break;
      case 2:
        evObj = this.eventsData.night;
        break;
      default:
        evObj = this.eventsData.day;
    }

    const events = this.runEvents(evObj);

    this.lastPhaseHadDeaths = this.killedThisPhase.length > 0;
    this.consecutiveNoDeaths =
      this.killedThisPhase.length === 0 ? this.consecutiveNoDeaths + 1 : 0;

    return events;
  }

  runEvents(evObj) {
    const aliveSet = new Set(this.participants.filter((p) => p.alive));
    const base = Math.floor(Math.random() * 3) + 1;
    const factor = base + this.consecutiveNoDeaths + (this.stage === 0 ? 1 : 0);
    const events = [];

    const genericEvents = this.eventsData.generic || {
      nonfatal: [],
      fatal: [],
    };
    const isArenaEvent = evObj.title && evObj.title.startsWith("Arena Event");
    const isFeastEvent = evObj.title && evObj.title === "The Feast";
    const isBloodbathEvent = evObj.title && evObj.title === "The Bloodbath";

    while (aliveSet.size > 0) {
      const roll = Math.floor(Math.random() * 11);
      const useFatal =
        roll < factor && this.participants.filter((p) => p.alive).length > 1;

      const phasePool = (useFatal ? evObj.fatal : evObj.nonfatal) || [];
      const genericPool =
        (useFatal ? genericEvents.fatal : genericEvents.nonfatal) || [];

      let pool;
      if (isArenaEvent || isFeastEvent || isBloodbathEvent) {
        const multiplier =
          phasePool.length > 0 && genericPool.length > 0
            ? Math.ceil((3 * genericPool.length) / phasePool.length)
            : 1;
        const weightedPhasePool = Array(multiplier)
          .fill(null)
          .flatMap(() => phasePool);
        pool = [...weightedPhasePool, ...genericPool];
      } else {
        pool = [...phasePool, ...genericPool];
      }
      pool = pool.filter((a) => a.tributes <= aliveSet.size);

      if (!pool.length) break;

      const weightedPool = [];
      pool.forEach((action) => {
        const weight = action.weight !== undefined ? action.weight : 1;
        for (let i = 0; i < weight; i++) {
          weightedPool.push(action);
        }
      });

      const action =
        weightedPool[Math.floor(Math.random() * weightedPool.length)];
      const pick = [];
      const avail = Array.from(aliveSet);

      for (let i = 0; i < action.tributes; i++) {
        const idx = Math.floor(Math.random() * avail.length);
        pick.push(avail.splice(idx, 1)[0]);
        aliveSet.delete(pick[pick.length - 1]);
      }

      let txt = action.msg;
      for (let i = 0; i < pick.length; i++) {
        let mention;
        if (
          eventHandlers &&
          eventHandlers.polymorph &&
          this.gameState.polymorphedPlayers &&
          this.gameState.polymorphedPlayers.has(pick[i].username)
        ) {
          mention = eventHandlers.polymorph.getDisplayMention(
            pick[i].username,
            this.gameState
          );
        } else {
          mention = pick[i].id.startsWith("fake_")
            ? pick[i].username
            : `<@${pick[i].id}>`;
        }
        txt = txt.replace(new RegExp(`\\{${i}\\}`, "g"), mention);
      }

      const killsCount = Array.isArray(action.killed)
        ? action.killed.length
        : 0;
      txt = this.replacePlaceholders(txt, killsCount);

      if (
        action.customHandler &&
        eventHandlers &&
        eventHandlers[action.customHandler] &&
        typeof eventHandlers[action.customHandler].execute === "function"
      ) {
        eventHandlers[action.customHandler].execute(
          {
            picks: pick,
            currentRound: this.currentDay,
          },
          this.gameState
        );
      }

      if (action.killed && action.killed.length > 0) {
        if (action.killer) {
          action.killer.forEach((kr) => {
            const kp = pick[kr];
            if (kp) {
              kp.kills += action.killed.length;
            }
          });
        }

        action.killed.forEach((idx) => {
          const v = pick[idx];
          if (v && v.alive) {
            v.alive = false;
            v.deathDay = this.currentDay;
            this.killedThisPhase.push(v.username);
            this.eliminationOrder.push(v.username);
          }
        });
      }

      events.push({
        picks: pick,
        text: txt,
        killed: action.killed || [],
        killer: action.killer || [],
        hidden: action.hidden === true,
        fatal: action.killed && action.killed.length > 0,
        order: action.order !== undefined ? action.order : 0,
      });
    }

    events.sort((a, b) => a.order - b.order);

    return events;
  }

  replacePlaceholders(txt, killsCount) {
    const allCategories = [
      ...this.types,
      "weapon_any",
      "item_any",
      "material_any",
      "liquid_any",
      "sand_any",
      "food_any",
    ];

    for (const cat of allCategories) {
      const placeholder = `{${cat}}`;
      if (!txt.includes(placeholder)) continue;

      let list;
      if (cat === "weapon_any") {
        list = this.types
          .filter((c) => c.startsWith("weapon_"))
          .flatMap((c) => this.itemsData[c] || [])
          .filter((w) => w.max_kills >= killsCount);
      } else if (cat.startsWith("weapon_")) {
        list = (this.itemsData[cat] || []).filter(
          (w) => w.max_kills >= killsCount
        );
      } else if (cat === "material_any") {
        list = this.types.flatMap((c) => this.materialsData[c] || []);
      } else if (cat === "liquid_any") {
        list = this.types
          .filter((c) => c.startsWith("liquid_"))
          .flatMap((c) => this.materialsData[c] || []);
      } else if (cat === "sand_any") {
        list = this.types
          .filter((c) => c.startsWith("sand_"))
          .flatMap((c) => this.materialsData[c] || []);
      } else if (cat === "food_any") {
        list = this.types
          .filter((c) => c.startsWith("food_"))
          .flatMap((c) => this.materialsData[c] || []);
      } else if (
        cat.startsWith("material_") ||
        cat.startsWith("liquid_") ||
        cat.startsWith("sand_") ||
        cat.startsWith("food_")
      ) {
        list = this.materialsData[cat] || [];
      } else if (cat === "item_any") {
        list = this.types.flatMap((c) => this.itemsData[c] || []);
      } else {
        list = this.itemsData[cat] || [];
      }

      if (list && list.length > 0) {
        const pick = list[Math.floor(Math.random() * list.length)];
        const chosen = pick.name !== undefined ? pick.name : pick;
        txt = txt.replace(new RegExp(escapeRegExp(placeholder), "g"), chosen);
      }
    }

    return txt;
  }

  advancePhase() {
    switch (this.stage) {
      case 0:
        this.stage = 1;
        break;
      case 1:
        this.stage = 2;
        break;
      case 2:
        this.currentDay++;
        this.stage = 1;
        break;
    }
  }
}

module.exports = NoitaGame;
