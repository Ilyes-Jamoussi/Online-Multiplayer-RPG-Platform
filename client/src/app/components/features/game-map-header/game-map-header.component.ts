import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { InGameService } from '@app/services/in-game/in-game.service';
import { TurnTimerComponent } from '@app/components/features/turn-timer/turn-timer.component';

@Component({
    selector: 'app-game-map-header',
    standalone: true,
    imports: [CommonModule, TurnTimerComponent],
    templateUrl: './game-map-header.component.html',
    styleUrl: './game-map-header.component.scss',
})
export class GameMapHeaderComponent {
    constructor(private readonly inGameService: InGameService) {}

    get turnNumber(): number {
        return this.inGameService.turnNumber();
    }

    get isMyTurn(): boolean {
        return this.inGameService.isMyTurn();
    }

    get isGameStarted(): boolean {
        return this.inGameService.isGameStarted();
    }

    onEndTurn(): void {
        this.inGameService.endTurn();
    }
}

