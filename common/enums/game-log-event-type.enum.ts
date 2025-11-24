export enum GameLogEventType {
    TurnStart = 'turnStart',
    CombatStart = 'combatStart',
    CombatEnd = 'combatEnd',
    CombatResult = 'combatResult',
    DoorToggle = 'doorToggle',
    BoatEmbark = 'boatEmbark',
    BoatDisembark = 'boatDisembark',
    SanctuaryUse = 'sanctuaryUse',
    Teleport = 'teleport',
    DebugModeToggle = 'debugModeToggle',
    GameAbandon = 'gameAbandon',
    GameOver = 'gameOver',
}
