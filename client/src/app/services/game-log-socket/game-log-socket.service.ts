import { DestroyRef, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SocketService } from '@app/services/socket/socket.service';
import { GameLogEvents } from '@common/enums/game-log-events.enum';
import { GameLogEntry } from '@common/interfaces/game-log-entry.interface';

@Injectable({
    providedIn: 'root',
})
export class GameLogSocketService {
    constructor(
        private readonly socketService: SocketService,
        private readonly destroyRef: DestroyRef,
    ) {}

    onLogEntry(next: (entry: GameLogEntry) => void): void {
        this.socketService
            .onEvent<GameLogEntry>(GameLogEvents.LogEntry)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
                if (res.success) {
                    next(res.data);
                }
            });
    }
}

