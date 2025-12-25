import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiButtonComponent } from '@app/components/ui/button/button.component';
import { UiIconComponent } from '@app/components/ui/icon/icon.component';
import { GamePreviewDto } from '@app/dto/game-preview-dto';
import { GameMode } from '@common/enums/game-mode.enum';
import { MAP_SIZE_LABELS } from '@common/constants/game.constants';
import { ENVIRONMENT } from '@src/environments/environment';

@Component({
    selector: 'app-game-preview-card',
    templateUrl: './game-preview-card.component.html',
    styleUrls: ['./game-preview-card.component.scss'],
    standalone: true,
    imports: [CommonModule, UiIconComponent, UiButtonComponent],
})
export class GamePreviewCardComponent {
    @Input({ required: true }) game: GamePreviewDto;
    @Input() isAdmin = false;

    @Output() startGame = new EventEmitter<GamePreviewDto>();
    @Output() editGame = new EventEmitter<string>();
    @Output() deleteGame = new EventEmitter<string>();
    @Output() toggleVisibility = new EventEmitter<string>();

    get imageUrl(): string {
        const baseUrl = ENVIRONMENT.socketUrl;
        return `${baseUrl}${this.game.gridPreviewUrl}`;
    }

    get mapSizeLabel(): string {
        return MAP_SIZE_LABELS[this.game.size] || `${this.game.size}x${this.game.size}`;
    }

    get isCTF(): boolean {
        return this.game.mode === GameMode.CTF;
    }

    get modeLabel(): string {
        return this.isCTF ? 'Capture the Flag' : 'Classic';
    }

    get modeIcon(): string {
        return this.isCTF ? '🚩' : '⚔️';
    }

    onStartGame(): void {
        this.startGame.emit(this.game);
    }

    onEditGame(): void {
        this.editGame.emit(this.game.id);
    }

    onDeleteGame(): void {
        this.deleteGame.emit(this.game.id);
    }

    onToggleVisibility(): void {
        this.toggleVisibility.emit(this.game.id);
    }

    formatDate(date: Date | string): string {
        return new Date(date).toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }
}
