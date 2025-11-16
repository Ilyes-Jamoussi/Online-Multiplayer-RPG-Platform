export enum ServerEvents {
    SessionAvailabilityChanged = 'session-availability-changed',
    SessionAutoLocked = 'session-auto-locked',
    LoadMessages = 'load-messages',

    CombatStarted = 'combat-started',
    CombatTimerRestart = 'combat-timer-restart',
    CombatVictory = 'combat-victory',
    CombatNewRound = 'combat-new-round',
    CombatPostureSelected = 'combat-posture-selected',
    CombatTimerLoop = 'combat-timer-loop',

<<<<<<< HEAD
    PlayerCombatResult = 'player-combat-result',
    PlayerHealthChanged = 'player-health-changed',
    PlayerCombatCountChanged = 'player-combat-count-changed',
    PlayerCombatWinsChanged = 'player-combat-wins-changed',
    PlayerCombatLossesChanged = 'player-combat-losses-changed',
    PlayerCombatDrawsChanged = 'player-combat-draws-changed',
=======
    PlayerCombatResult = 'player.combatResult',
    PlayerHealthChanged = 'player.healthChanged',
    PlayerBonusesChanged = 'player.bonusesChanged',
    PlayerCombatCountChanged = 'player.combatCountChanged',
    PlayerCombatWinsChanged = 'player.combatWinsChanged',
    PlayerCombatLossesChanged = 'player.combatLossesChanged',
    PlayerCombatDrawsChanged = 'player.combatDrawsChanged',
    PlayerBoardedBoat = 'player.boardedBoat',
    PlayerDisembarkedBoat = 'player.disembarkedBoat',
>>>>>>> origin/dev

    TurnStarted = 'turn-started',
    TurnEnded = 'turn-ended',
    TurnTransition = 'turn-transition',
    TurnManualEnd = 'turn-manual-end',
    TurnForceStopTimer = 'turn-force-stop-timer',

    VirtualPlayerTurn = 'virtual-player-turn',

    PlayerMoved = 'player-moved',
    PlayerReachableTiles = 'player-reachable-tiles',
    PlayerUpdated = 'player-updated',
    PlayerAvailableActions = 'player-available-actions',
    DoorToggled = 'door-toggled',

<<<<<<< HEAD
    GameOver = 'game-over',
=======
    GameOver = 'game.over',

    OpenSanctuary = 'openSanctuary',
    OpenSanctuaryDenied = 'openSanctuaryDenied',
    SanctuaryActionFailed = 'sanctuaryActionFailed',
    SanctuaryActionSuccess = 'sanctuaryActionSuccess',

    PlaceablePositionUpdated = 'placeable.positionUpdated',
>>>>>>> origin/dev
}
