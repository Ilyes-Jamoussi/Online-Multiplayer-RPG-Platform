import { Component, OnInit, Signal } from '@angular/core';
import { SessionCardComponent } from '@app/components/features/session-card/session-card.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { SessionPreviewDto } from '@app/dto/session-preview-dto';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';

@Component({
    selector: 'app-join-session-page',
    imports: [UiPageLayoutComponent, SessionCardComponent],
    templateUrl: './join-session-page.component.html',
    styleUrl: './join-session-page.component.scss',
})
export class JoinSessionPageComponent implements OnInit {
    get availableSessions(): Signal<SessionPreviewDto[]> {
        return this.sessionService.availableSessions;
    }

    constructor(private readonly sessionService: SessionService, private readonly playerService: PlayerService) {}

    ngOnInit(): void {
        this.playerService.setAsGuest();
        this.sessionService.loadAvailableSessions();
    }

    onJoinSession(sessionId: string): void {
        this.sessionService.joinAvatarSelection(sessionId);
    }
}
