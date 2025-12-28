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

const themeConfigRaw = {
  title: "Noita Hunger Games Simulator",
  appName: "Noita Games",

  terminology: {
    playerSingular: "tribute",
    playerPlural: "witches",
    fallenPlayers: "Fallen Witches",
    deathSound: "nuke",
  },

  messages: {
    startButtonText: "Start Noita Games",
    debugButtonText: "Add Fake Witches",
    minPlayersRequired: "Add at least one tribute.",
    winnerMessage: "{username} won the Noita Games!",
    noSurvivors: "No one survived the Noita Games!",
    fallenPlayers: "Fallen Witches {day}",
    deathSound: "{count} {sound} can be heard going off.",
  },

  fonts: {
    primary: {
      family: "NoitaPixel",
      file: "./NoitaPixel.ttf",
    },
    decorative: {
      family: "NoitaBlackletter",
      file: "./NoitaBlackletter-Regular.ttf",
    },
  },

  itemCategories: [
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
  ],

  storagePrefix: "noita",
};

const themeConfig = validateConfig(themeConfigRaw);

window.themeConfig = themeConfig;
window.formatMessage = formatMessage;
window.pluralize = pluralize;
