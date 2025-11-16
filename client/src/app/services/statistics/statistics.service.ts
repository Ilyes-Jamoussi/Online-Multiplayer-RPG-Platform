import { inject, Injectable, signal } from '@angular/core';
import { GameStatisticsDto } from '@app/dto/game-statistics-dto';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';
import { ResetService } from '@app/services/reset/reset.service';

@Injectable({
    providedIn: 'root',
})
export class StatisticsService {
    private readonly _gameStatistics = signal<GameStatisticsDto | null>(null);
    readonly gameStatistics = this._gameStatistics.asReadonly();

    constructor(private readonly inGameSocketService: InGameSocketService) {
        inject(ResetService).reset$.subscribe(() => this.resetGameStatistics());
        this.initListeners();
    }

    loadGameStatistics(sessionId: string): void {
        this.inGameSocketService.loadGameStatistics(sessionId);
    }

    setGameStatistics(statistics: GameStatisticsDto): void {
        this._gameStatistics.set(statistics);
    }

    private resetGameStatistics(): void {
        this._gameStatistics.set(null);
    }

    private initListeners(): void {
        this.inGameSocketService.onLoadGameStatistics((data) => {
            this.setGameStatistics(data);
        });
    }
}
