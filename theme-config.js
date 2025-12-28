// Theme Configuration
// This file contains all theme-specific configuration for the Hunger Games Simulator

function formatMessage(template, values) {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}

function pluralize(word, count) {
  return count !== 1 ? word + "s" : word;
}

function validateConfig(config) {
  const defaults = {
    title: "Hunger Games Simulator",
    appName: "Games",
    terminology: {
      playerSingular: "player",
      playerPlural: "players",
      fallenPlayers: "Fallen Players",
      deathSound: "signal",
    },
    messages: {
      startButtonText: "Start Games",
      debugButtonText: "Add Fake Players",
      minPlayersRequired: "Add at least one player.",
      winnerMessage: "{username} won the Games!",
      noSurvivors: "No one survived the Games!",
      fallenPlayers: "Fallen Players {day}",
      deathSound: "{count} {sound} can be heard going off.",
      deathEventsHeader: "Death Events:",
      killsLabel: "Kills:",
    },
    fonts: {
      primary: {
        family: "Arial",
        file: "",
      },
      decorative: {
        family: "Arial",
        file: "",
      },
    },
    itemCategories: [],
    storagePrefix: "game",
  };

  if (!config.dataFiles) {
    throw new Error(
      "Theme config must include dataFiles with events, items, and materials properties"
    );
  }

  if (
    !config.dataFiles.events ||
    typeof config.dataFiles.events !== "string" ||
    config.dataFiles.events.trim() === ""
  ) {
    throw new Error("Theme config dataFiles.events must be a non-empty string");
  }

  if (
    !config.dataFiles.items ||
    typeof config.dataFiles.items !== "string" ||
    config.dataFiles.items.trim() === ""
  ) {
    throw new Error("Theme config dataFiles.items must be a non-empty string");
  }

  if (
    !config.dataFiles.materials ||
    typeof config.dataFiles.materials !== "string" ||
    config.dataFiles.materials.trim() === ""
  ) {
    throw new Error(
      "Theme config dataFiles.materials must be a non-empty string"
    );
  }

  const merged = {
    title: config.title || defaults.title,
    appName: config.appName || defaults.appName,
    terminology: { ...defaults.terminology, ...config.terminology },
    messages: { ...defaults.messages, ...config.messages },
    fonts: {
      primary: { ...defaults.fonts.primary, ...config.fonts?.primary },
      decorative: { ...defaults.fonts.decorative, ...config.fonts?.decorative },
    },
    itemCategories: config.itemCategories || defaults.itemCategories,
    storagePrefix: config.storagePrefix || defaults.storagePrefix,
    dataFiles: {
      events: config.dataFiles.events,
      items: config.dataFiles.items,
      materials: config.dataFiles.materials,
    },
  };

  return merged;
}

function loadTheme(themeName) {
  if (typeof themes === "undefined") {
    console.error("themes.js not loaded");
    return validateConfig({});
  }
  const theme = themes[themeName] || themes[defaultTheme];
  return validateConfig(theme.config);
}

function injectFonts(config) {
  const oldStyles = document.querySelectorAll("style[data-theme-fonts]");
  oldStyles.forEach((s) => s.remove());

  // Create new style element with data attribute
  const style = document.createElement("style");
  style.setAttribute("data-theme-fonts", "true");
  style.textContent = `
    @font-face {
      font-family: '${config.fonts.primary.family}';
      src: url('${config.fonts.primary.file}') format('truetype');
    }
    @font-face {
      font-family: '${config.fonts.decorative.family}';
      src: url('${config.fonts.decorative.file}') format('truetype');
    }
  `;
  document.head.appendChild(style);

  document.documentElement.style.setProperty(
    "--theme-font-primary",
    config.fonts.primary.family
  );
  document.documentElement.style.setProperty(
    "--theme-font-decorative",
    config.fonts.decorative.family
  );
}

// Apply theme configuration to the page
function applyTheme(config) {
  injectFonts(config);

  document.title = config.title;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      const startBtn = document.getElementById("startButton");
      const debugBtn = document.getElementById("debugButton");
      if (startBtn) startBtn.textContent = config.messages.startButtonText;
      if (debugBtn) debugBtn.textContent = config.messages.debugButtonText;
    });
  } else {
    const startBtn = document.getElementById("startButton");
    const debugBtn = document.getElementById("debugButton");
    if (startBtn) startBtn.textContent = config.messages.startButtonText;
    if (debugBtn) debugBtn.textContent = config.messages.debugButtonText;
  }

  window.themeConfig = config;
}

function loadThemeData(themeName) {
  return new Promise((resolve, reject) => {
    if (typeof themes === "undefined") {
      reject(new Error("themes.js not loaded"));
      return;
    }

    const theme = themes[themeName] || themes[defaultTheme];
    if (!theme || !theme.config) {
      reject(new Error(`Theme "${themeName}" not found`));
      return;
    }

    const config = validateConfig(theme.config);
    const { events, items, materials } = config.dataFiles;

    Promise.all([
      fetch(events)
        .then((r) => {
          if (!r.ok)
            throw new Error(
              `Failed to load ${events}: ${r.status} ${r.statusText}`
            );
          return r.json();
        })
        .catch((err) => {
          throw new Error(
            `Failed to load events file "${events}": ${err.message}`
          );
        }),
      fetch(items)
        .then((r) => {
          if (!r.ok)
            throw new Error(
              `Failed to load ${items}: ${r.status} ${r.statusText}`
            );
          return r.json();
        })
        .catch((err) => {
          throw new Error(
            `Failed to load items file "${items}": ${err.message}`
          );
        }),
      fetch(materials)
        .then((r) => {
          if (!r.ok)
            throw new Error(
              `Failed to load ${materials}: ${r.status} ${r.statusText}`
            );
          return r.json();
        })
        .catch((err) => {
          throw new Error(
            `Failed to load materials file "${materials}": ${err.message}`
          );
        }),
    ])
      .then(([eventsData, itemsData, materialsData]) => {
        resolve({ eventsData, itemsData, materialsData });
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function switchTheme(themeName) {
  if (typeof window.gameStarted !== "undefined" && window.gameStarted) {
    return Promise.resolve(false);
  }

  try {
    const config = loadTheme(themeName);
    applyTheme(config);
    localStorage.setItem("selectedTheme", themeName);
    return Promise.resolve(true);
  } catch (err) {
    console.error("Failed to switch theme:", err);
    return Promise.resolve(false);
  }
}

const savedTheme = localStorage.getItem("selectedTheme") || defaultTheme;
const themeConfig = loadTheme(savedTheme);

window.themeConfig = themeConfig;
window.formatMessage = formatMessage;
window.pluralize = pluralize;
window.loadTheme = loadTheme;
window.loadThemeData = loadThemeData;
window.switchTheme = switchTheme;
window.applyTheme = applyTheme;
window.getAvailableThemes = () =>
  typeof themes !== "undefined" ? Object.keys(themes) : [];
