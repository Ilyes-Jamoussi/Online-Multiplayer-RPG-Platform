import { Component, OnInit, Signal } from '@angular/core';
import { ChatComponent } from '@app/components/features/chat/chat.component';
import { PlayerCardComponent } from '@app/components/features/player-card/player-card.component';
import { WaitingRoomActionsComponent } from '@app/components/features/waiting-room-actions/waiting-room-actions.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { ROUTES } from '@app/enums/routes.enum';
import { NotificationCoordinatorService } from '@app/services/notification-coordinator/notification-coordinator.service';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';
import { Player } from '@common/interfaces/player.interface';

@Component({
    selector: 'app-waiting-room-page',
    standalone: true,
    imports: [
        UiPageLayoutComponent,
        PlayerCardComponent,
        WaitingRoomActionsComponent,
        ChatComponent,
    ],
    templateUrl: './waiting-room-page.component.html',
    styleUrls: ['./waiting-room-page.component.scss'],
})
export class WaitingRoomPageComponent implements OnInit {
    constructor(
        private readonly playerService: PlayerService,
        private readonly sessionService: SessionService,
        private readonly notificationCoordinatorService: NotificationCoordinatorService,
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

    onBack(): void {
        this.playerService.leaveSession();
    }
}
