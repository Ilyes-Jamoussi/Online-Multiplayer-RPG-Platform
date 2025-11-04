import { Component } from '@angular/core';
import { UiButtonComponent } from '@app/components/ui/button/button.component';
import { UiInputComponent } from '@app/components/ui/input/input.component';

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [UiButtonComponent, UiInputComponent],
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent {}
