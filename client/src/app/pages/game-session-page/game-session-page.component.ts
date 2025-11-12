import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AdminBadgeComponent } from '@app/components/features/admin-badge/admin-badge.component';
import { MessagesZoneComponent } from '@app/components/features/messages-zone/messages-zone.component';
import { CombatOverlayComponent } from '@app/components/features/combat-overlay/combat-overlay.component';
import { GameMapFooterComponent } from '@app/components/features/game-map-footer/game-map-footer.component';
import { GameMapHeaderComponent } from '@app/components/features/game-map-header/game-map-header.component';
import { GameMapComponent } from '@app/components/features/game-map/game-map.component';
import { GameOverOverlayComponent } from '@app/components/features/game-over-overlay/game-over-overlay.component';
import { PlayerInfoComponent } from '@app/components/features/player-info/player-info.component';
import { PlayersListComponent } from '@app/components/features/players-list/players-list.component';
import { ToastNotificationDisplayComponent } from '@app/components/features/toast-notification-display/toast-notification-display.component';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { InGameKeyboardEventsService } from '@app/services/in-game-keyboard-events/in-game-keyboard-events.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { SessionService } from '@app/services/session/session.service';
import { MapSize } from '@common/enums/map-size.enum';

@Component({
    selector: 'app-game-session-page',
    imports: [
        CommonModule,
        GameMapComponent,
        GameMapFooterComponent,
        GameMapHeaderComponent,
        PlayerInfoComponent,
        PlayersListComponent,
        CombatOverlayComponent,
        GameOverOverlayComponent,
        ToastNotificationDisplayComponent,
        MessagesZoneComponent,
        AdminBadgeComponent,
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

    get mapSizeValue(): MapSize {
        return this.inGameService.mapSize();
    }

    get mode(): string {
        return this.inGameService.mode();
    }

    get timeRemaining(): number {
        return this.inGameService.timeRemaining();
    }

    get isTransitioning(): boolean {
        return this.inGameService.isTransitioning();
    }

    getPlayersCount(): number {
        return Object.keys(this.inGameService.inGameSession().inGamePlayers).length;
    }

    getMapSizeLabel(): string {
        switch (this.mapSizeValue) {
            case MapSize.SMALL:
                return 'Petite';
            case MapSize.MEDIUM:
                return 'Moyenne';
            case MapSize.LARGE:
                return 'Grande';
            default:
                return 'Inconnue';
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

        return `Pos:(${player.x},${player.y}) Vitesse:${player.speed}`;
    }

    ngOnInit(): void {
        this.inGameService.loadInGameSession();
        this.keyboardEventsService.startListening();
    }

    ngOnDestroy(): void {
        this.keyboardEventsService.stopListening();
        this.inGameService.reset();
    }
}
