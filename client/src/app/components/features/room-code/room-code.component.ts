import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SessionService } from '@app/services/session/session.service';

const TOOLTIP_DURATION = 2000; // 2 seconds

@Component({
    selector: 'app-room-code',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './room-code.component.html',
    styleUrls: ['./room-code.component.scss'],
})
export class RoomCodeComponent {
    readonly roomCode = this.sessionService.id();
    showCopiedTooltip: boolean = false;

    constructor(private readonly sessionService: SessionService) {}

    copyToClipboard(): void {
        navigator.clipboard.writeText(this.roomCode);
        this.showCopiedTooltip = true;

        setTimeout(() => {
            this.showCopiedTooltip = false;
        }, TOOLTIP_DURATION);
    }
}
