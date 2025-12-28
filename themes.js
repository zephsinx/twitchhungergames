// Theme Registry

const themes = {
  noita: {
    name: "Noita",
    config: {
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
        deathEventsHeader: "Death Events:",
        killsLabel: "Kills:",
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

      dataFiles: {
        events: "events.json",
        items: "items.json",
        materials: "materials.json",
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
        deathSound: "pop",
      },

      messages: {
        startButtonText: "Open the Fridge",
        debugButtonText: "Add Tiny Survivors",
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
          family: "Arial",
          file: "",
        },
        decorative: {
          family: "Arial",
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

      storagePrefix: "fridge",

      dataFiles: {
        events: "fridge-events.json",
        items: "fridge-items.json",
        materials: "fridge-materials.json",
      },
    },
  },
};

const defaultTheme = "noita";
