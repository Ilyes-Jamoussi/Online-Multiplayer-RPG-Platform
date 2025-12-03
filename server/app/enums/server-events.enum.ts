export enum ServerEvents {
    SessionAvailabilityChanged = 'session-availability-changed',
    SessionAutoLocked = 'session-auto-locked',

    CombatStarted = 'combat-started',
    CombatTimerRestart = 'combat-timer-restart',
    CombatVictory = 'combat-victory',
    CombatNewRound = 'combat-new-round',
    CombatPostureSelected = 'combat-posture-selected',
    CombatTimerLoop = 'combat-timer-loop',

    PlayerCombatResult = 'player-combat-result',
    PlayerHealthChanged = 'player-health-changed',
    PlayerCombatCountChanged = 'player-combat-count-changed',
    PlayerCombatWinsChanged = 'player-combat-wins-changed',
    PlayerCombatLossesChanged = 'player-combat-losses-changed',
    PlayerCombatDrawsChanged = 'player-combat-draws-changed',

    PlayerBonusesChanged = 'player-bonuses-changed',

    PlayerBoardedBoat = 'player-boarded-boat',
    PlayerDisembarkedBoat = 'player-disembarked-boat',

    TurnStarted = 'turn-started',
    TurnEnded = 'turn-ended',
    TurnTransition = 'turn-transition',
    TurnManualEnd = 'turn-manual-end',
    TurnForceStopTimer = 'turn-force-stop-timer',

    VirtualPlayerTurn = 'virtual-player-turn',

    PlayerMoved = 'player-moved',
    Teleported = 'teleported',
    PlayerReachableTiles = 'player-reachable-tiles',
    PlayerUpdated = 'player-updated',
    PlayerAvailableActions = 'player-available-actions',
    DoorToggled = 'door-toggled',
    AdminModeToggled = 'admin-mode-toggled',
    PlayerAbandon = 'player-abandon',

    GameOver = 'game-over',

    OpenSanctuary = 'open-sanctuary',
    OpenSanctuaryDenied = 'open-sanctuary-denied',
    SanctuaryActionFailed = 'sanctuary-action-failed',
    SanctuaryActionSuccess = 'sanctuary-action-success',

    PlaceableUpdated = 'placeable-updated',
    PlaceableDisabledUpdated = 'placeable-disabled-updated',

    SessionUpdated = 'session-updated',

    FlagPickedUp = 'flag-picked-up',
    FlagTransferRequest = 'flag-transfer-request',
    FlagTransferRequested = 'flag-transfer-requested',
    FlagTransferResponse = 'flag-transfer-response',
    FlagTransferResult = 'flag-transfer-result',
    FlagTransferred = 'flag-transferred',
    FlagTransferRequestsCleared = 'flag-transfer-requests-cleared',

    VirtualPlayerCombatStarted = 'virtual-player-combat-started',
    VirtualPlayerCombatVictory = 'virtual-player-combat-victory',
    VirtualPlayerFlagTransferRequested = 'virtual-player-flag-transfer-requested',
}
