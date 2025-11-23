import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiButtonComponent } from '@app/components/ui/button/button.component';
import { GAME_MODE_DISPLAY, MAP_SIZE_DISPLAY } from '@app/constants/display.constants';
import { SessionPreviewDto } from '@app/dto/session-preview-dto';

@Component({
    selector: 'app-session-card',
    imports: [UiButtonComponent],
    templateUrl: './session-card.component.html',
    styleUrl: './session-card.component.scss',
})
export class SessionCardComponent {
    @Input({ required: true }) session!: SessionPreviewDto;
    @Output() joinSession = new EventEmitter<string>();

    onJoinClick(): void {
        this.joinSession.emit(this.session.id);
    }

    get formattedMapSize(): string {
        return MAP_SIZE_DISPLAY[this.session.mapSize] || String(this.session.mapSize);
    }

    get formattedGameMode(): string {
        return GAME_MODE_DISPLAY[this.session.gameMode] || String(this.session.gameMode);
    }
}
