// Theme Registry

const themes = {
  hungergames: {
    name: "Hunger Games",
    config: {
      title: "Hunger Games Simulator",
      appName: "Games",

      terminology: {
        playerSingular: "tribute",
        playerPlural: "tributes",
        fallenPlayers: "Fallen Tributes",
        deathSound: "signal",
      },

      messages: {
        startButtonText: "Start Games",
        debugButtonText: "Add Fake Players",
        minPlayersRequired: "Add at least one player.",
        winnerMessage: "{username} won the Games!",
        noSurvivors: "No one survived the Games!",
        fallenPlayers: "Fallen Tributes {day}",
        deathSound: "{count} {sound} can be heard going off.",
        deathEventsHeader: "Death Events:",
        killsLabel: "Kills:",
      },

      fonts: {
        primary: {
          family: "Lexend",
          file: "",
        },
        decorative: {
          family: "Lexend",
          file: "",
        },
      },

      itemCategories: [
        "weapon_blunt",
        "weapon_cutting",
        "weapon_piercing",
        "weapon_projectile",
        "weapon_fire",
        "weapon_poison",
        "weapon_trap",
        "weapon_explosive",
        "liquid_good",
        "liquid_bad",
        "liquid_neutral",
        "food_good",
        "food_bad",
        "food_neutral",
        "hazard_natural",
        "hazard_weather",
        "hazard_creature",
      ],

      nightPhaseColor: "#88ccff",

      storagePrefix: "hungergames",

      dataFiles: {
        events: "data/hungergames-events.json",
        items: "data/hungergames-items.json",
        materials: "data/hungergames-materials.json",
      },
    },
  },
  fridge: {
    name: "Fridge Survival",
    config: {
      title: "Fridge Survival Simulator",
      appName: "Fridge Games",

      terminology: {
        playerSingular: "survivor",
        playerPlural: "survivors",
        fallenPlayers: "Fallen Survivors",
        deathSound: "crack",
      },

      messages: {
        startButtonText: "Open the Fridge",
        debugButtonText: "Add Test Survivors",
        minPlayersRequired: "Add at least one tiny survivor.",
        winnerMessage: "{username} survived the fridge!",
        noSurvivors: "No one survived the fridge!",
        fallenPlayers: "Fallen Survivors {day}",
        deathSound: "{count} {sound} can be heard echoing through the shelves.",
        deathEventsHeader: "Death Events:",
        killsLabel: "Kills:",
      },

      fonts: {
        primary: {
          family: "Lexend",
          file: "",
        },
        decorative: {
          family: "Lexend",
          file: "",
        },
      },

      itemCategories: [
        "weapon_blunt",
        "weapon_cutting",
        "weapon_piercing",
        "weapon_projectile",
        "weapon_fire",
        "weapon_cold",
        "weapon_chemical",
        "weapon_explosive",
        "liquid_good",
        "liquid_bad",
        "liquid_neutral",
        "food_good",
        "food_bad",
        "food_neutral",
        "hazard_cold",
        "hazard_slippery",
      ],

      nightPhaseColor: "#88ccff",

      storagePrefix: "fridge",

      dataFiles: {
        events: "data/fridge-events.json",
        items: "data/fridge-items.json",
        materials: "data/fridge-materials.json",
      },
    },
  },
};

const defaultTheme = "hungergames";

export { themes, defaultTheme };
