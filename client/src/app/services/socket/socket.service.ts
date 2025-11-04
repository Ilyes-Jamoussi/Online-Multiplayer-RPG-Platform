import { DestroyRef, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GameStoreEvents } from '@common/enums/game-store-events.enum';
import { InGameEvents } from '@common/enums/in-game-events.enum';
import { SessionEvents } from '@common/enums/session-events.enum';
import { SocketResponse } from '@common/types/socket-response.type';
import { fromEvent, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ENVIRONMENT } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService {
    private readonly socket: Socket;

    constructor(private readonly destroyRef: DestroyRef) {
        this.socket = io(ENVIRONMENT.socketUrl);
    }

    emit<T>(event: SessionEvents | GameStoreEvents | InGameEvents, data: T): void {
        this.socket.emit(event, data);
    }

    onEvent<T>(event: SessionEvents | GameStoreEvents | InGameEvents): Observable<SocketResponse<T>> {
        return fromEvent<SocketResponse<T>>(this.socket, event);
    }

    onSuccessEvent<T>(event: SessionEvents | GameStoreEvents | InGameEvents, next: (data: T) => void): void {
        this.onEvent<T>(event)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
                if (res.success) {
                    next(res.data);
                }
            });
    }

    onErrorEvent(event: SessionEvents | GameStoreEvents | InGameEvents, next: (message: string) => void): void {
        this.onEvent<never>(event)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
                if (!res.success) {
                    next(res.message);
                }
            });
    }
}
