export enum InGameEvents {
    PlayerJoinInGameSession = 'playerJoinInGameSession',
    PlayerJoinedInGameSession = 'playerJoinedInGameSession',
    PlayerLeaveInGameSession = 'playerLeaveInGameSession',
    PlayerLeftInGameSession = 'playerLeftInGameSession',
    PlayerMove = 'playerMove',
    PlayerMoved = 'playerMoved',
    PlayerCombatAction = 'playerCombatAction',
    PlayerCombatResult = 'playerCombatResult',

    GameStart = 'gameStart',
    GameStarted = 'gameStarted',
    GameOver = 'gameOver',

    TurnStart = 'turnStart',
    TurnStarted = 'turnStarted',
    TurnEnd = 'turnEnd',
    TurnEnded = 'turnEnded',
    TurnTransitionEnded = 'turnTransitionEnded',

    LeaveInGameSession = 'leaveInGameSession',
    InGameSessionLeft = 'inGameSessionLeft',
}