import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { UiButtonComponent } from '@app/components/ui/button/button.component';
import { UiInputComponent } from '@app/components/ui/input/input.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { SESSION_ACCESS_CODE_LENGTH } from '@app/constants/validation.constants';

@Component({
    selector: 'app-join-session-page',
    imports: [CommonModule, UiPageLayoutComponent, UiButtonComponent, UiInputComponent],
    templateUrl: './join-session-page.component.html',
    styleUrl: './join-session-page.component.scss',
})
export class JoinSessionPageComponent {
    readonly sessionAccessCodeLength = SESSION_ACCESS_CODE_LENGTH;
    accessCode = '';

    onCodeChange(value: string): void {
        this.accessCode = value;
    }
}
