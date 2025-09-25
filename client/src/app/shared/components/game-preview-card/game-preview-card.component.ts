import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { GamePreviewDto } from '@app/api/model/gamePreviewDto';
import { ROUTES } from '@app/constants/routes.constants';
import { environment } from '@src/environments/environment';
import { UiButtonComponent } from '@app/shared/ui/components/button/button.component';
import { UiIconComponent } from '@app/shared/ui/components/icon/icon.component';
import { MAP_SIZE_LABELS } from '@common/constants/game.constants';

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

    constructor(
        private readonly router: Router,
    ) {}

    onStartGame(): void {
        this.startGame.emit(this.game.id);
    }

    onEditGame(): void {
        this.router.navigate([ROUTES.gameEditor, this.game.id]);
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
        const baseUrl = environment.socketUrl;
        return `${baseUrl}${this.game.gridPreviewUrl}`;
    }

    getMapSizeLabel(): string {
        return MAP_SIZE_LABELS[this.game.size] || `${this.game.size}x${this.game.size}`;
    }
}
