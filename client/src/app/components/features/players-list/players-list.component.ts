import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PlayerCardComponent } from '@app/components/features/player-card/player-card.component';
import { SessionService } from '@app/services/session/session.service';

@Component({
    selector: 'app-players-list',
    standalone: true,
    imports: [CommonModule, PlayerCardComponent],
    templateUrl: './players-list.component.html',
    styleUrls: ['./players-list.component.scss'],
})
export class PlayersListComponent {
    readonly players = this.sessionService.players;
    readonly isRoomLocked = this.sessionService.isRoomLocked;

    constructor(private readonly sessionService: SessionService) {}
}
