import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { GameLogSocketService } from '@app/services/game-log-socket/game-log-socket.service';
import { PlayerService } from '@app/services/player/player.service';
import { ResetService } from '@app/services/reset/reset.service';
import { GameLogEntry } from '@common/interfaces/game-log-entry.interface';
import { generateGameLogId } from '@common/utils/game-log.util';

@Injectable({
    providedIn: 'root',
})
export class GameLogService {
    private readonly _entries = signal<GameLogEntry[]>([]);
    private readonly _filterByMe = signal<boolean>(false);

    readonly entries = this._entries.asReadonly();
    readonly filterByMe = this._filterByMe.asReadonly();

    private _filteredEntries!: Signal<GameLogEntry[]>;

    constructor(
        private readonly playerService: PlayerService,
        private readonly gameLogSocketService: GameLogSocketService,
    ) {
        this._filteredEntries = computed(() => {
            const allEntries = this.entries();
            if (!this.filterByMe()) {
                return allEntries;
            }
            const myId = this.playerService.id();
            return allEntries.filter((entry) => entry.involvedPlayerIds.includes(myId));
        });
        inject(ResetService).reset$.subscribe(() => this.reset());
        this.initListeners();
    }

    private initListeners(): void {
        this.gameLogSocketService.onLogEntry((entry) => {
            this._entries.update((entries) => [...entries, entry]);
        });
    }

    addEntry(entry: Omit<GameLogEntry, 'id' | 'timestamp'>): void {
        const newEntry: GameLogEntry = {
            ...entry,
            id: generateGameLogId(),
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

    getFilteredEntries(): Signal<GameLogEntry[]> {
        return this._filteredEntries;
    }
}
