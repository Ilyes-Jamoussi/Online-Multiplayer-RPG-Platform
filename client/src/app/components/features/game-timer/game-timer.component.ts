import { Component, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InGameService } from '@app/services/in-game/in-game.service';

@Component({
    selector: 'app-game-timer',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './game-timer.component.html',
    styleUrl: './game-timer.component.scss'
})
export class GameTimerComponent {
    constructor(private readonly inGameService: InGameService) {}

    get timeRemaining(): Signal<number> {
        return this.inGameService.timeRemaining;
    }

    get isMyTurn(): Signal<boolean> {
        return this.inGameService.isMyTurn;
    }

    get isTransitioning(): Signal<boolean> {
        return this.inGameService.isTransitioning;
    }

    get isGameStarted(): Signal<boolean> {
        return this.inGameService.isGameStarted;
    }

    get timerLabel(): string {
        if (this.isTransitioning()) return 'Transition';
        if (this.isMyTurn()) return 'Votre tour';
        return 'Tour adverse';
    }

    get timerClass(): string {
        if (this.isTransitioning()) return 'transition';
        if (this.isMyTurn()) return 'my-turn';
        return 'other-turn';
    }

    get shouldShowTimer(): boolean {
        return this.isGameStarted() && this.timeRemaining() > 0;
    }
}
