export enum GameSessionEvents {
    StartTurn = 'game-session:start-turn',
    TurnStarted = 'game-session:turn-started',
    Move = 'game-session:move',
    PlayerMoved = 'game-session:player-moved',
    CombatAction = 'game-session:combat-action',
    CombatResult = 'game-session:combat-result',
    ItemPickup = 'game-session:item-pickup',
    ItemPickedUp = 'game-session:item-picked-up',
    EndTurn = 'game-session:end-turn',
    TurnEnded = 'game-session:turn-ended',
}
