import { Component } from '@angular/core';
import { SessionService } from '@app/services/session/session.service';

const TOOLTIP_DURATION = 2000;

@Component({
    selector: 'app-room-code',
    standalone: true,
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
