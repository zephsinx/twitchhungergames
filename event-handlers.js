var eventHandlers = {
  polymorph: {
    execute: function (eventData, gameState) {
      const { picks, currentRound } = eventData;

      if (!picks || picks.length < 2) return;

      const originalPlayer = picks[0];
      const newForm = picks[1];

      if (!gameState.polymorphedPlayers) {
        gameState.polymorphedPlayers = new Map();
      }

      gameState.polymorphedPlayers.set(originalPlayer.username, {
        originalName: originalPlayer.username,
        originalId: originalPlayer.id,
        newForm: newForm.username,
        newFormId: newForm.id,
        round: currentRound,
      });
    },

    getDisplayName: function (username, gameState) {
      if (!gameState.polymorphedPlayers) return username;

      const polymorph = gameState.polymorphedPlayers.get(username);
      if (!polymorph) return username;

      return `${polymorph.newForm} (formerly ${polymorph.originalName})`;
    },

    getDisplayMention: function (username, gameState) {
      if (!gameState.polymorphedPlayers) return null;

      const polymorph = gameState.polymorphedPlayers.get(username);
      if (!polymorph) return null;

      const newFormMention =
        polymorph.newFormId && !polymorph.newFormId.startsWith("fake_")
          ? `<@${polymorph.newFormId}>`
          : polymorph.newForm;
      const originalMention =
        polymorph.originalId && !polymorph.originalId.startsWith("fake_")
          ? `<@${polymorph.originalId}>`
          : polymorph.originalName;

      return `${newFormMention} (formerly ${originalMention})`;
    },

    getWinnerMessage: function (username, gameState) {
      if (!gameState.polymorphedPlayers) return null;

      const polymorph = gameState.polymorphedPlayers.get(username);
      if (!polymorph) return null;

      let newFormDisplay, originalDisplay;
      if (polymorph.newFormId && polymorph.originalId) {
        newFormDisplay = !polymorph.newFormId.startsWith("fake_")
          ? `<@${polymorph.newFormId}>`
          : polymorph.newForm;
        originalDisplay = !polymorph.originalId.startsWith("fake_")
          ? `<@${polymorph.originalId}>`
          : polymorph.originalName;
      } else {
        newFormDisplay = polymorph.newForm;
        originalDisplay = polymorph.originalName;
      }

      return `${newFormDisplay} won the Noita Games! wait.. thats not right.. ${originalDisplay} won? what?`;
    },

    getWinnerMessagePlain: function (username, gameState) {
      if (!gameState.polymorphedPlayers) return null;

      const polymorph = gameState.polymorphedPlayers.get(username);
      if (!polymorph) return null;

      return `${polymorph.newForm} won the Noita Games! wait.. thats not right.. ${polymorph.originalName} won? what?`;
    },

    clearRound: function (gameState) {
      if (gameState.polymorphedPlayers) {
        gameState.polymorphedPlayers.clear();
      }
    },
  },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = eventHandlers;
}

if (typeof window !== "undefined") {
  window.eventHandlers = eventHandlers;
}
