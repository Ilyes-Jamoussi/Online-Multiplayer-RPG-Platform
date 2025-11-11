export enum ServerEvents {
    SessionAvailabilityChanged = 'session.availabilityChanged',
    SessionAutoLocked = 'session.autoLocked',
    LoadMessages = 'loadMessages',

    CombatStarted = 'combat.started',
    CombatTimerRestart = 'combat.timerRestart',
    CombatVictory = 'combat.victory',
    CombatNewRound = 'combat.newRound',
    CombatPostureSelected = 'combat.postureSelected',
    CombatTimerLoop = 'combat.timerLoop',

    PlayerCombatResult = 'player.combatResult',
    PlayerHealthChanged = 'player.healthChanged',
    PlayerCombatCountChanged = 'player.combatCountChanged',
    PlayerCombatWinsChanged = 'player.combatWinsChanged',
    PlayerCombatLossesChanged = 'player.combatLossesChanged',
    PlayerCombatDrawsChanged = 'player.combatDrawsChanged',

    TurnStarted = 'turn.started',
    TurnEnded = 'turn.ended',
    TurnTransition = 'turn.transition',
    TurnTimeout = 'turn.timeout',
    TurnForcedEnd = 'turn.forcedEnd',
    TurnManualEnd = 'turn.manualEnd',
    TurnForceStopTimer = 'turn.forceStopTimer',

    VirtualPlayerTurn = 'virtualPlayer.turn',

    PlayerMoved = 'player.moved',
    PlayerReachableTiles = 'player.reachableTiles',
    PlayerUpdated = 'player.updated',
    PlayerAvailableActions = 'player.availableActions',
    DoorToggled = 'door.toggled',

    GameOver = 'game.over',

    OpenSanctuary = 'openSanctuary',
    SanctuaryActionFailed = 'sanctuaryActionFailed',
    SanctuaryActionSuccess = 'sanctuaryActionSuccess',
}
