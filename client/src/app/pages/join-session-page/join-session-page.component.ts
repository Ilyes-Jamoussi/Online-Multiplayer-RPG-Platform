import { Component } from '@angular/core';
import { UiButtonComponent } from '@app/components/ui/button/button.component';
import { UiInputComponent } from '@app/components/ui/input/input.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { SESSION_ACCESS_CODE_LENGTH } from '@app/constants/validation.constants';
import { PlayerService } from '@app/services/player/player.service';
@Component({
    selector: 'app-join-session-page',
    imports: [UiPageLayoutComponent, UiButtonComponent, UiInputComponent],
    templateUrl: './join-session-page.component.html',
    styleUrl: './join-session-page.component.scss',
})
export class JoinSessionPageComponent {
    constructor(private readonly playerService: PlayerService) {}
    readonly sessionAccessCodeLength = SESSION_ACCESS_CODE_LENGTH;
    sessionAccessCode = '';

    onSessionAccessCodeChange(value: string): void {
        this.sessionAccessCode = value;
    }

    onSubmit(): void {
        this.playerService.joinAvatarSelection(this.sessionAccessCode);
    }
}
