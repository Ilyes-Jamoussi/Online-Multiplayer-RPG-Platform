import { Component, OnInit, Signal, computed } from '@angular/core';
import { ChatComponent } from '@app/components/features/chat/chat.component';
import { PlayerCardComponent } from '@app/components/features/player-card/player-card.component';
import { VirtualPlayerCardComponent } from '@app/components/features/virtual-player-card/virtual-player-card.component';
import { WaitingRoomActionsComponent } from '@app/components/features/waiting-room-actions/waiting-room-actions.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { ROUTES } from '@app/enums/routes.enum';
import { NotificationService } from '@app/services/notification/notification.service';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { Player } from '@common/interfaces/player.interface';

@Component({
    selector: 'app-waiting-room-page',
    standalone: true,
    imports: [UiPageLayoutComponent, PlayerCardComponent, VirtualPlayerCardComponent, WaitingRoomActionsComponent, ChatComponent],
    templateUrl: './waiting-room-page.component.html',
    styleUrls: ['./waiting-room-page.component.scss'],
})
export class WaitingRoomPageComponent implements OnInit {
    readonly showCTFRule = computed(() => this.sessionService.mode() === GameMode.CTF && !this.sessionService.canStartGame());

    get sessionMode(): Signal<GameMode> {
        return this.sessionService.mode;
    }

    constructor(
        private readonly playerService: PlayerService,
        private readonly sessionService: SessionService,
        private readonly notificationCoordinatorService: NotificationService,
    ) {}

    ngOnInit(): void {
        if (!this.playerService.isConnected()) {
            this.notificationCoordinatorService.displayErrorPopup({
                title: 'Session expirée',
                message: 'Veuillez rejoindre une session.',
                redirectRoute: ROUTES.HomePage,
            });
            return;
        }
    }

    get players(): Signal<Player[]> {
        return this.sessionService.players;
    }

    get isRoomLocked(): Signal<boolean> {
        return this.sessionService.isRoomLocked;
    }

    get maxPlayers(): Signal<number> {
        return this.sessionService.maxPlayers;
    }

    isVirtualPlayer(player: Player): boolean {
        return !!player.virtualPlayerType;
    }

    onBack(): void {
        this.playerService.leaveSession();
    }
}
