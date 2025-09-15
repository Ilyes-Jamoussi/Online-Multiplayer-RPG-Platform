import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/socket/socket.service';
import { GameStoreEvents } from '@common/constants/game-store-events';
import { GamePreviewDto } from '@app/api/model/models';

@Injectable({ providedIn: 'root' })
export class GameStoreSocketService {
    constructor(private socket: SocketService) {}

    onGameCreated(callback: (game: GamePreviewDto) => void): void {
        this.socket.onSuccessEvent(GameStoreEvents.GameCreated, callback);
    }

    onGameUpdated(callback: (game: GamePreviewDto) => void): void {
        this.socket.onSuccessEvent(GameStoreEvents.GameUpdated, callback);
    }

    onGameDeleted(callback: (data: { id: string }) => void): void {
        this.socket.onSuccessEvent(GameStoreEvents.GameDeleted, callback);
    }

    onGameVisibilityToggled(callback: (data: { id: string }) => void): void {
        this.socket.onSuccessEvent(GameStoreEvents.GameVisibilityToggled, callback);
    }
}
