import { GamePreviewDto } from '@app/game-store/dto/game-preview.dto';
import { successResponse } from '@app/utils/socket-response/socket-response.util';
import { GameStoreEvents } from '@common/constants/game-store-events';
import { Injectable, UsePipes, ValidationPipe } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
@UsePipes(new ValidationPipe({ transform: true }))
@WebSocketGateway({
    cors: true,
})
@Injectable()
export class GameStoreGateway {
    @WebSocketServer()
    private server: Server;

    emitGameCreated(dto: GamePreviewDto): void {
        this.server.emit(GameStoreEvents.GameCreated, successResponse(dto));
    }

    emitGameUpdated(dto: GamePreviewDto): void {
        this.server.emit(GameStoreEvents.GameUpdated, successResponse(dto));
    }

    emitGameDeleted(id: string): void {
        this.server.emit(GameStoreEvents.GameDeleted, successResponse({ id }));
    }

    emitGameVisibilityToggled(id: string, visibility: boolean): void {
        this.server.emit(GameStoreEvents.GameVisibilityToggled, successResponse({ id, visibility }));
    }
}
