import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';

@Component({
    selector: 'app-game-map-footer',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './game-map-footer.component.html',
    styleUrl: './game-map-footer.component.scss',
})
export class GameMapFooterComponent {
    constructor(
        private readonly playerService: PlayerService,
        private readonly inGameService: InGameService,
    ) {}

    get remainingMovements(): number {
        return this.playerService.speed();
    }

    get availableActionsCount(): number {
        return this.inGameService.availableActions().length;
    }

    get isMyTurn(): boolean {
        return this.inGameService.isMyTurn();
    }

    get isGameStarted(): boolean {
        return this.inGameService.isGameStarted();
    }

    get hasUsedAction(): boolean {
        return this.inGameService.hasUsedAction();
    }

    isActionDisabled(): boolean {
        return (
            !this.isMyTurn ||
            !this.isGameStarted ||
            this.hasUsedAction ||
            !this.hasAvailableActions()
        );
    }

    hasAvailableActions(): boolean {
        return this.inGameService.availableActions().length > 0;
    }

    onAction(): void {
        this.inGameService.activateActionMode();
    }
}

