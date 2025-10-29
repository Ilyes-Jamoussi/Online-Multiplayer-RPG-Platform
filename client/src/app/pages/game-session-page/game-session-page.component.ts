import { CombatOverlayComponent } from '@app/components/features/combat-overlay/combat-overlay.component';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { GameInfoComponent } from '@app/components/features/game-info/game-info.component';
import { GameMapComponent } from '@app/components/features/game-map/game-map.component';
import { GameTimerComponent } from '@app/components/features/game-timer/game-timer.component';
import { PlayerInfoComponent } from '@app/components/features/player-info/player-info.component';
import { PlayersListComponent } from '@app/components/features/players-list/players-list.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { InGameKeyboardEventsService } from '@app/services/in-game-keyboard-events/in-game-keyboard-events.service';
import { SessionService } from '@app/services/session/session.service';
import { MapSize } from '@common/enums/map-size.enum';

@Component({
    selector: 'app-game-session-page',
    imports: [
        CommonModule,
        UiPageLayoutComponent,
        GameMapComponent,
        GameInfoComponent,
        PlayerInfoComponent,
        PlayersListComponent,
        GameTimerComponent,
        CombatOverlayComponent,
    ],
    templateUrl: './game-session-page.component.html',
    styleUrl: './game-session-page.component.scss',
    providers: [GameMapService],
})
export class GameSessionPageComponent implements OnInit, OnDestroy {
    @ViewChild(GameMapComponent) gameMapComponent?: GameMapComponent;

    constructor(
        private readonly sessionService: SessionService,
        private readonly gameMapService: GameMapService,
        readonly inGameService: InGameService,
        private readonly keyboardEventsService: InGameKeyboardEventsService,
    ) {}

    get gameId(): string {
        return this.sessionService.gameId();
    }

    get mapSize() {
        return this.gameMapService.size();
    }

    get activePlayer(): string {
        return this.inGameService.activePlayer?.name || 'En attente...';
    }

    get transitionMessage(): string {
        return this.inGameService.turnTransitionMessage;
    }

    get disableStartButton(): boolean {
        return !this.inGameService.isMyTurn() || this.inGameService.isGameStarted();
    }

    get isMyTurn(): boolean {
        return this.inGameService.isMyTurn();
    }

    get isGameStarted(): boolean {
        return this.inGameService.isGameStarted();
    }

    get mapSizeValue(): MapSize {
        return this.inGameService.mapSize();
    }

    get mode(): string {
        return this.inGameService.mode();
    }

    get turnNumber(): number {
        return this.inGameService.turnNumber();
    }

    get timeRemaining(): number {
        return this.inGameService.timeRemaining();
    }

    get isTransitioning(): boolean {
        return this.inGameService.isTransitioning();
    }

    isActionDisabled(): boolean {
        return !this.isMyTurn || 
               !this.isGameStarted || 
               this.hasUsedAction || 
               !this.hasAvailableActions();
    }

    get hasUsedAction(): boolean {
        return this.inGameService.hasUsedAction();
    }

    hasAvailableActions(): boolean {
        return this.inGameService.availableActions().length > 0;
    }

    getInGamePlayersCount(): number {
        return Object.keys(this.inGameService.inGameSession().inGamePlayers).length;
    }

    getCurrentPlayerMovementPoints(): number {
        const session = this.inGameService.inGameSession();
        const activePlayerId = session.currentTurn.activePlayerId;
        const player = session.inGamePlayers[activePlayerId];
        return player?.movementPoints || 0;
    }

    getReachableTilesCount(): number {
        return this.inGameService.reachableTiles().length || 0;
    }

    getDebugInfo(): string {
        const session = this.inGameService.inGameSession();
        const activePlayerId = session.currentTurn.activePlayerId;
        const player = session.inGamePlayers[activePlayerId];
        
        if (!player) return 'Joueur non trouvé';
        
        return `Pos:(${player.x},${player.y}) MP:${player.movementPoints}`;
    }

    ngOnInit(): void {
        this.inGameService.loadInGameSession();
        this.keyboardEventsService.startListening();
    }

    ngOnDestroy(): void {
        this.keyboardEventsService.stopListening();
        this.inGameService.reset();
    }

    onStartGame(): void {
        this.inGameService.startGame();
    }

    onEndTurn(): void {
        this.inGameService.endTurn();
    }

    onAction(): void {
        this.inGameService.activateActionMode();
    }

    onLeaveGame(): void {
        this.inGameService.leaveGame();
    }
}
