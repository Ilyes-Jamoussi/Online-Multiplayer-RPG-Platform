import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UiButtonComponent } from '@app/components/ui/button/button.component';
import { UiInputComponent } from '@app/components/ui/input/input.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { ROUTES } from '@app/constants/routes.constants';
import { SESSION_ACCESS_CODE_LENGTH } from '@app/constants/validation.constants';
import { NotificationService } from '@app/services/notification/notification.service';
import { PlayerService } from '@app/services/player/player.service';
import { SessionSocketService } from '@app/services/session-socket/session-socket.service';
import { SessionService } from '@app/services/session/session.service';
@Component({
    selector: 'app-join-session-page',
    imports: [CommonModule, UiPageLayoutComponent, UiButtonComponent, UiInputComponent],
    templateUrl: './join-session-page.component.html',
    styleUrl: './join-session-page.component.scss',
})
export class JoinSessionPageComponent {

    constructor(
        private readonly sessionSocketService: SessionSocketService,
        private readonly playerService: PlayerService,
        private readonly sessionService: SessionService,
        private readonly notificationService: NotificationService,
        private readonly router: Router,
    ) {}
    readonly sessionAccessCodeLength = SESSION_ACCESS_CODE_LENGTH;
    sessionAccessCode = '';

    onSessionAccessCodeChange(value: string): void {
        this.sessionAccessCode = value;
    }

    onSubmit(): void {
        this.handleSessionJoin();
    }

    private handleSessionJoin(): void {
        const sessionId = this.sessionAccessCode;
        this.sessionSocketService.joinAvatarSelection({ sessionId });

        this.sessionSocketService.onAvatarSelectionJoined((data) => {
            this.playerService.updatePlayer({ id: data.playerId, isAdmin: false });
            this.sessionService.updateSession({ id: sessionId });
            this.router.navigate([ROUTES.characterCreationPage]);
            this.notificationService.displaySuccess({
                title: 'Session rejointe',
                message: 'Vous avez rejoint la session avec succès !',
            });
        });

        this.sessionSocketService.onAvatarSelectionJoinError((msg) => {
            this.notificationService.displayError({
                title: 'Erreur de connexion',
                message: msg,
            });
        });
    }
}
