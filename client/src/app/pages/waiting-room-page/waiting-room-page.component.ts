import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ChatComponent } from '@app/components/features/chat/chat.component';
import { PlayersListComponent } from '@app/components/features/players-list/players-list.component';
import { RoomCodeComponent } from '@app/components/features/room-code/room-code.component';
import { WaitingRoomActionsComponent } from '@app/components/features/waiting-room-actions/waiting-room-actions.component';

@Component({
    selector: 'app-waiting-room-page',
    standalone: true,
    imports: [CommonModule, ChatComponent, PlayersListComponent, RoomCodeComponent, WaitingRoomActionsComponent],
    templateUrl: './waiting-room-page.component.html',
    styleUrls: ['./waiting-room-page.component.scss'],
})
export class WaitingRoomPageComponent {}
