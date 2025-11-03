import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, ViewChild, inject} from '@angular/core';
import { ChatComponent } from '@app/components/features/chat/chat.component';
import { CombatOverlayComponent } from '@app/components/features/combat-overlay/combat-overlay.component';
import { GameMapComponent } from '@app/components/features/game-map/game-map.component';
import { GameOverOverlayComponent } from '@app/components/features/game-over-overlay/game-over-overlay.component';
import { PlayerInfoComponent } from '@app/components/features/player-info/player-info.component';
import { PlayersListComponent } from '@app/components/features/players-list/players-list.component';
import { ToastComponent } from '@app/components/features/toast/toast.component';
import { TurnTimerComponent } from '@app/components/features/turn-timer/turn-timer.component';
import { AdminModeService } from '@app/services/admin-mode/admin-mode.service';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { InGameKeyboardEventsService } from '@app/services/in-game-keyboard-events/in-game-keyboard-events.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';
import { MapSize } from '@common/enums/map-size.enum';

@Component({
    selector: 'app-game-session-page',
    imports: [
        CommonModule,
        GameMapComponent,
        PlayerInfoComponent,
        PlayersListComponent,
        TurnTimerComponent,
        CombatOverlayComponent,
        GameOverOverlayComponent,
        ToastComponent,
        ChatComponent,
    ],
    templateUrl: './game-session-page.component.html',
    styleUrl: './game-session-page.component.scss',
    providers: [GameMapService],
})
export class GameSessionPageComponent implements OnInit, OnDestroy {
    @ViewChild(GameMapComponent) gameMapComponent?: GameMapComponent;

    private readonly sessionService = inject(SessionService);
    private readonly gameMapService = inject(GameMapService);
    readonly inGameService = inject(InGameService);
    readonly adminModeService = inject(AdminModeService);
    private readonly keyboardEventsService = inject(InGameKeyboardEventsService);
    private readonly playerService = inject(PlayerService);

    @HostListener('window:keydown', ['$event'])
    onKeyDown(e: KeyboardEvent) {
        if (e.repeat) return;

        const activeElement = document.activeElement as HTMLElement | null;
        const tag = (activeElement?.tagName || '').toLowerCase();
        const typingInField =
            tag === 'input' ||
            tag === 'textarea' ||
            tag === 'select' ||
            activeElement?.isContentEditable;

        if (!typingInField && (e.key === 'd' || e.key === 'D')) {
            this.adminModeService.toggleAdminMode();
        }
    }

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

    get isAdmin(): boolean {
        return this.playerService.isAdmin();
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

    getPlayersCount(): number {
        return Object.keys(this.inGameService.inGameSession().inGamePlayers).length;
    }

    getMapSizeLabel(): string {
        switch (this.mapSizeValue) {
            case MapSize.SMALL: return 'Petite';
            case MapSize.MEDIUM: return 'Moyenne';
            case MapSize.LARGE: return 'Grande';
            default: return 'Inconnue';
        }
    }

    getCurrentPlayerSpeed(): number {
        const session = this.inGameService.inGameSession();
        const activePlayerId = session.currentTurn.activePlayerId;
        const player = session.inGamePlayers[activePlayerId];
        return player?.speed || 0;
    }

    getReachableTilesCount(): number {
        return this.inGameService.reachableTiles().length || 0;
    }

    getDebugInfo(): string {
        const session = this.inGameService.inGameSession();
        const activePlayerId = session.currentTurn.activePlayerId;
        const player = session.inGamePlayers[activePlayerId];

        if (!player) return 'Joueur non trouvé';
        
        return `Pos:(${player.x},${player.y}) Speed:${player.speed}`;
    }

    onAction(): void {
        this.inGameService.activateActionMode();
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

    onLeaveGame(): void {
        this.inGameService.leaveGame();
    }
}
