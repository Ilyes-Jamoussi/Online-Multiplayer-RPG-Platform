import { inject, Injectable, signal } from '@angular/core';
import { PlayerService } from '@app/services/player/player.service';
import { ResetService } from '@app/services/reset/reset.service';
import { GameLogEntry } from '@common/interfaces/game-log-entry.interface';

@Injectable({
    providedIn: 'root',
})
export class GameLogService {
    private readonly _entries = signal<GameLogEntry[]>([]);
    private readonly _filterByMe = signal<boolean>(false);

    readonly entries = this._entries.asReadonly();
    readonly filterByMe = this._filterByMe.asReadonly();

    constructor(private readonly playerService: PlayerService) {
        inject(ResetService).reset$.subscribe(() => this.reset());
    }

    addEntry(entry: Omit<GameLogEntry, 'id' | 'timestamp'>): void {
        const newEntry: GameLogEntry = {
            ...entry,
            id: this.generateId(),
            timestamp: new Date().toISOString(),
        };
        this._entries.update((entries) => [...entries, newEntry]);
    }

    toggleFilter(): void {
        this._filterByMe.update((value) => !value);
    }

    setFilter(filterByMe: boolean): void {
        this._filterByMe.set(filterByMe);
    }

    reset(): void {
        this._entries.set([]);
        this._filterByMe.set(false);
    }

    getFilteredEntries(): GameLogEntry[] {
        const allEntries = this.entries();
        if (!this.filterByMe()) {
            return allEntries;
        }
        const myId = this.playerService.id();
        return allEntries.filter((entry) => entry.involvedPlayerIds.includes(myId));
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
