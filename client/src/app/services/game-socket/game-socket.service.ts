import { Injectable } from '@angular/core';
import { GamePreviewDto } from '@app/dto/game-preview-dto';
import { SocketService } from '@app/services/socket/socket.service';
import { GameStoreEvents } from '@common/enums/game-store-events.enum';
import { GameIdPayload } from '@common/interfaces/game-id-payload.interface';

@Injectable({ providedIn: 'root' })
export class GameSocketService {
    constructor(private readonly socket: SocketService) {}

    onGameCreated(callback: (game: GamePreviewDto) => void): void {
        this.socket.onSuccessEvent(GameStoreEvents.GameCreated, callback);
    }

    onGameUpdated(callback: (game: GamePreviewDto) => void): void {
        this.socket.onSuccessEvent(GameStoreEvents.GameUpdated, callback);
    }

    onGameDeleted(callback: (data: GameIdPayload) => void): void {
        this.socket.onSuccessEvent(GameStoreEvents.GameDeleted, callback);
    }

    onGameVisibilityToggled(callback: (data: GameIdPayload) => void): void {
        this.socket.onSuccessEvent(GameStoreEvents.GameVisibilityToggled, callback);
    }
}
