import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GamePreviewDto } from '@app/api/model/gamePreviewDto';
import { UiIconComponent } from '@app/shared/ui/components/icon/icon.component';
import { UiButtonComponent } from '@app/shared/ui/components/button/button.component';

@Component({
    selector: 'app-game-preview-card',
    templateUrl: './game-preview-card.component.html',
    styleUrls: ['./game-preview-card.component.scss'],
    standalone: true,
    imports: [CommonModule, UiIconComponent, UiButtonComponent],
})
export class GamePreviewCardComponent {
    @Input() game!: GamePreviewDto;
    @Input() isAdmin = false;

    @Output() startGame = new EventEmitter<string>();
    @Output() editGame = new EventEmitter<string>();
    @Output() deleteGame = new EventEmitter<string>();
    @Output() toggleVisibility = new EventEmitter<string>();

    onStartGame(): void {
        this.startGame.emit(this.game.id);
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
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    getImageUrl(): string {
        return `http://localhost:3000${this.game.gridPreviewUrl}`;
    }
}
