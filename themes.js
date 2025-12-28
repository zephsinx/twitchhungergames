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
};

const defaultTheme = "noita";
