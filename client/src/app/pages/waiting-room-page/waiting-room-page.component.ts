import { CommonModule } from '@angular/common';
import { Component, Signal } from '@angular/core';
import { ChatComponent } from '@app/components/features/chat/chat.component';
import { PlayerCardComponent } from '@app/components/features/player-card/player-card.component';
import { RoomCodeComponent } from '@app/components/features/room-code/room-code.component';
import { WaitingRoomActionsComponent } from '@app/components/features/waiting-room-actions/waiting-room-actions.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';
import { Player } from '@common/models/player.interface';

@Component({
    selector: 'app-waiting-room-page',
    standalone: true,
    imports: [
        CommonModule,
        UiPageLayoutComponent,
        ChatComponent,
        PlayerCardComponent,
        RoomCodeComponent,
        WaitingRoomActionsComponent
    ],
    templateUrl: './waiting-room-page.component.html',
    styleUrls: ['./waiting-room-page.component.scss'],
})
export class WaitingRoomPageComponent {
    constructor(
        private readonly sessionService: SessionService,
        private readonly playerService: PlayerService
    ) {}

    get players(): Signal<Player[]> {
        return this.sessionService.players;
    }

    get isRoomLocked(): Signal<boolean> {
        return this.sessionService.isRoomLocked;
    }

    get maxPlayers(): Signal<number> {
        return this.sessionService.maxPlayers;
    }

    // onStartGame(): void {
    //     this.sessionService.startGameSession();
    // }

    onBack(): void {
        this.sessionService.leaveSession();
        this.playerService.resetPlayer();
    }
}
