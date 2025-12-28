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

function switchTheme(themeName) {
  if (typeof window.gameStarted !== "undefined" && window.gameStarted) {
    return false;
  }

  const config = loadTheme(themeName);
  applyTheme(config);
  localStorage.setItem("selectedTheme", themeName);
  return true;
}

const savedTheme = localStorage.getItem("selectedTheme") || defaultTheme;
const themeConfig = loadTheme(savedTheme);

window.themeConfig = themeConfig;
window.formatMessage = formatMessage;
window.pluralize = pluralize;
window.loadTheme = loadTheme;
window.switchTheme = switchTheme;
window.applyTheme = applyTheme;
window.getAvailableThemes = () =>
  typeof themes !== "undefined" ? Object.keys(themes) : [];
