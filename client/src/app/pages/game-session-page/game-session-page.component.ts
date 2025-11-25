import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AdminBadgeComponent } from '@app/components/features/admin-badge/admin-badge.component';
import { MessagesZoneComponent } from '@app/components/features/messages-zone/messages-zone.component';
import { CombatOverlayComponent } from '@app/components/features/combat-overlay/combat-overlay.component';
import { GameMapFooterComponent } from '@app/components/features/game-map-footer/game-map-footer.component';
import { GameMapHeaderComponent } from '@app/components/features/game-map-header/game-map-header.component';
import { GameMapComponent } from '@app/components/features/game-map/game-map.component';
import { GameOverOverlayComponent } from '@app/components/features/game-over-overlay/game-over-overlay.component';
import { PlayerInfoComponent } from '@app/components/features/player-info/player-info.component';
import { PlayersListComponent } from '@app/components/features/players-list/players-list.component';
import { SanctuaryOverlayComponent } from '@app/components/features/sanctuary-overlay/sanctuary-overlay.component';
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
        SanctuaryOverlayComponent,
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

    ngOnInit(): void {
        this.inGameService.loadInGameSession();
        this.keyboardEventsService.startListening();
    }

    ngOnDestroy(): void {
        this.keyboardEventsService.stopListening();
        this.inGameService.reset();
    }
}
