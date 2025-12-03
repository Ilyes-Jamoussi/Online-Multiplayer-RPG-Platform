import { ServerEvents } from '@app/enums/server-events.enum';
import { AdminModeToggledDto } from '@app/modules/in-game/dto/admin-mode-toggled.dto';
import { AvailableActionsDto } from '@app/modules/in-game/dto/available-actions.dto';
import { DoorToggledDto } from '@app/modules/in-game/dto/door-toggled.dto';
import { FlagPickedUpDto } from '@app/modules/in-game/dto/flag-picked-up.dto';
import { FlagTransferRequestDto } from '@app/modules/in-game/dto/flag-transfer-request.dto';
import { FlagTransferResultDto } from '@app/modules/in-game/dto/flag-transfer-result.dto';
import { FlagTransferredDto } from '@app/modules/in-game/dto/flag-transferred.dto';
import { OpenSanctuaryDto } from '@app/modules/in-game/dto/open-sanctuary.dto';
import { PlaceableDisabledUpdatedDto } from '@app/modules/in-game/dto/placeable-disabled-updated.dto';
import { PlaceablePositionUpdatedDto } from '@app/modules/in-game/dto/placeable-position-updated.dto';
import { PlayerBoardedBoatDto } from '@app/modules/in-game/dto/player-boarded-boat.dto';
import { PlayerBonusesChangedDto } from '@app/modules/in-game/dto/player-bonuses-changed.dto';
import { PlayerDisembarkedBoatDto } from '@app/modules/in-game/dto/player-disembarked-boat.dto';
import { PlayerMovedDto } from '@app/modules/in-game/dto/player-moved.dto';
import { SanctuaryActionFailedDto } from '@app/modules/in-game/dto/sanctuary-action-failed.dto';
import { SanctuaryActionSuccessDto } from '@app/modules/in-game/dto/sanctuary-action-success.dto';
import { EmptyResponseDto } from '@app/modules/in-game/dto/empty-response.dto';
import { InGameService } from '@app/modules/in-game/services/in-game/in-game.service';
import { errorResponse, successResponse } from '@app/utils/socket-response/socket-response.util';
import { validationExceptionFactory } from '@app/utils/validation/validation.util';
import { InGameEvents } from '@common/enums/in-game-events.enum';
import { NotificationEvents } from '@common/enums/notification-events.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { AvailableAction } from '@common/interfaces/available-action.interface';
import { Player } from '@common/interfaces/player.interface';
import { Position } from '@common/interfaces/position.interface';
import { ReachableTile } from '@common/interfaces/reachable-tile.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { BadRequestException, Injectable, UsePipes, ValidationPipe } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@UsePipes(
    new ValidationPipe({
        transform: true,
        exceptionFactory: validationExceptionFactory,
    }),
)
@WebSocketGateway({})
@Injectable()
export class InGameActionGateway {
    @WebSocketServer() private readonly server: Server;

    constructor(private readonly inGameService: InGameService) {}

    @SubscribeMessage(InGameEvents.PlayerMove)
    playerMove(socket: Socket, payload: { sessionId: string; orientation: Orientation }): void {
        try {
            this.inGameService.movePlayer(payload.sessionId, socket.id, payload.orientation);
        } catch (error) {
            socket.emit(NotificationEvents.ErrorMessage, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.PlayerTeleport)
    playerTeleport(socket: Socket, payload: { sessionId: string; x: number; y: number }): void {
        try {
            this.inGameService.teleportPlayer(payload.sessionId, socket.id, { x: payload.x, y: payload.y });
            const session = this.inGameService.getSession(payload.sessionId);
            const player = session.inGamePlayers[socket.id];
            this.server.to(session.inGameId).emit(InGameEvents.PlayerTeleported, successResponse({ playerId: socket.id, x: player.x, y: player.y }));
            this.inGameService.getReachableTiles(payload.sessionId, socket.id);
        } catch (error) {
            socket.emit(NotificationEvents.ErrorMessage, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.ToggleDoorAction)
    toggleDoorAction(socket: Socket, payload: { sessionId: string; x: number; y: number }): void {
        try {
            this.inGameService.toggleDoorAction(payload.sessionId, socket.id, { x: payload.x, y: payload.y });
        } catch (error) {
            socket.emit(NotificationEvents.ErrorMessage, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.ToggleAdminMode)
    handleToggleAdminMode(socket: Socket, sessionId: string): void {
        try {
            const session = this.inGameService.toggleAdminMode(sessionId, socket.id);
            this.server
                .to(session.inGameId)
                .emit(InGameEvents.AdminModeToggled, successResponse<AdminModeToggledDto>({ isAdminModeActive: !!session.isAdminModeActive }));
        } catch (error) {
            socket.emit(NotificationEvents.ErrorMessage, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.PlayerBoardBoat)
    playerBoardBoat(socket: Socket, payload: { sessionId: string; x: number; y: number }): void {
        try {
            this.inGameService.boardBoat(payload.sessionId, socket.id, { x: payload.x, y: payload.y });
        } catch (error) {
            socket.emit(InGameEvents.PlayerBoardBoat, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.PlayerDisembarkBoat)
    playerDisembarkBoat(socket: Socket, payload: { sessionId: string; x: number; y: number }): void {
        try {
            this.inGameService.disembarkBoat(payload.sessionId, socket.id, { x: payload.x, y: payload.y });
        } catch (error) {
            socket.emit(InGameEvents.PlayerDisembarkBoat, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.PlayerSanctuaryRequest)
    playerSanctuaryRequest(socket: Socket, payload: { sessionId: string; x: number; y: number; kind: PlaceableKind }): void {
        try {
            if (payload.kind !== PlaceableKind.HEAL && payload.kind !== PlaceableKind.FIGHT) {
                throw new BadRequestException('Invalid sanctuary kind');
            }
            this.inGameService.sanctuaryRequest(payload.sessionId, socket.id, { x: payload.x, y: payload.y }, payload.kind);
        } catch (error) {
            socket.emit(InGameEvents.PlayerSanctuaryRequest, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.PlayerSanctuaryAction)
    playerSanctuaryAction(socket: Socket, payload: { sessionId: string; x: number; y: number; kind: PlaceableKind; double?: boolean }): void {
        try {
            this.inGameService.performSanctuaryAction(payload.sessionId, socket.id, { x: payload.x, y: payload.y }, payload.double);
        } catch (error) {
            socket.emit(InGameEvents.PlayerSanctuaryAction, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.PickUpFlag)
    pickUpFlag(socket: Socket, payload: { sessionId: string; x: number; y: number }): void {
        try {
            this.inGameService.pickUpFlag(payload.sessionId, socket.id);
        } catch (error) {
            socket.emit(NotificationEvents.ErrorMessage, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.FlagTransferRequest)
    flagTransferRequest(socket: Socket, payload: { sessionId: string; x: number; y: number }): void {
        try {
            this.inGameService.requestFlagTransfer(payload.sessionId, socket.id, { x: payload.x, y: payload.y });
        } catch (error) {
            socket.emit(NotificationEvents.ErrorMessage, errorResponse(error.message));
        }
    }

    @SubscribeMessage(InGameEvents.FlagTransferResponse)
    flagTransferResponse(socket: Socket, payload: { sessionId: string; fromPlayerId: string; accepted: boolean }): void {
        try {
            this.inGameService.respondToFlagTransfer(payload.sessionId, socket.id, payload.fromPlayerId, payload.accepted);
        } catch (error) {
            socket.emit(NotificationEvents.ErrorMessage, errorResponse(error.message));
        }
    }

    @OnEvent(ServerEvents.PlayerMoved)
    handlePlayerMoved(payload: { session: InGameSession; playerId: string; x: number; y: number; speed: number; boatSpeed: number }) {
        this.server.to(payload.session.inGameId).emit(
            InGameEvents.PlayerMoved,
            successResponse<PlayerMovedDto>({
                playerId: payload.playerId,
                x: payload.x,
                y: payload.y,
                speed: payload.speed,
                boatSpeed: payload.boatSpeed,
            }),
        );
    }

    @OnEvent(ServerEvents.PlayerUpdated)
    handlePlayerUpdated(payload: { sessionId: string; player: Player }) {
        const session = this.inGameService.getSession(payload.sessionId);
        this.server.to(session.inGameId).emit(InGameEvents.PlayerUpdated, successResponse(payload.player));
    }

    @OnEvent(ServerEvents.PlayerReachableTiles)
    handlePlayerReachableTiles(payload: { playerId: string; reachable: ReachableTile[] }) {
        this.server.to(payload.playerId).emit(InGameEvents.PlayerReachableTiles, successResponse(payload.reachable));
    }

    @OnEvent(ServerEvents.PlayerAvailableActions)
    handlePlayerAvailableActions(payload: { session: InGameSession; playerId: string; actions: AvailableAction[] }) {
        const response = successResponse<AvailableActionsDto>({ availableActions: payload.actions });
        this.server.to(payload.playerId).emit(InGameEvents.PlayerAvailableActions, response);
    }

    @OnEvent(ServerEvents.DoorToggled)
    handleDoorToggled(payload: { session: InGameSession; playerId: string; x: number; y: number; isOpen: boolean }) {
        this.server
            .to(payload.session.inGameId)
            .emit(InGameEvents.DoorToggled, successResponse<DoorToggledDto>({ x: payload.x, y: payload.y, isOpen: payload.isOpen }));
        this.server.to(payload.playerId).emit(InGameEvents.PlayerActionUsed, successResponse<EmptyResponseDto>({}));
    }

    @OnEvent(ServerEvents.PlayerBoardedBoat)
    handlePlayerBoardedBoat(payload: { session: InGameSession; playerId: string; boatId: string }) {
        this.server
            .to(payload.session.inGameId)
            .emit(InGameEvents.PlayerBoardedBoat, successResponse<PlayerBoardedBoatDto>({ playerId: payload.playerId, boatId: payload.boatId }));
    }

    @OnEvent(ServerEvents.PlayerDisembarkedBoat)
    handlePlayerDisembarkedBoat(payload: { session: InGameSession; playerId: string }) {
        const response = successResponse<PlayerDisembarkedBoatDto>({ playerId: payload.playerId });
        this.server.to(payload.session.inGameId).emit(InGameEvents.PlayerDisembarkedBoat, response);
    }

    @OnEvent(ServerEvents.PlaceableUpdated)
    handlePlaceableUpdated(payload: { sessionId: string; placeable: Placeable }): void {
        const session = this.inGameService.getSession(payload.sessionId);
        const placeableDto: PlaceablePositionUpdatedDto = {
            ...payload.placeable,
            _id: payload.placeable._id?.toString(),
        };
        this.server.to(session.inGameId).emit(InGameEvents.PlaceableUpdated, successResponse<PlaceablePositionUpdatedDto>(placeableDto));
    }

    @OnEvent(ServerEvents.PlaceableDisabledUpdated)
    handlePlaceableDisabledUpdated(payload: { sessionId: string; placeableId: string; positions: Position[]; turnCount: number }): void {
        const session = this.inGameService.getSession(payload.sessionId);
        const dto: PlaceableDisabledUpdatedDto = {
            placeableId: payload.placeableId,
            positions: payload.positions,
            turnCount: payload.turnCount,
        };
        this.server.to(session.inGameId).emit(InGameEvents.PlaceableDisabledUpdated, successResponse<PlaceableDisabledUpdatedDto>(dto));
    }

    @OnEvent(ServerEvents.OpenSanctuaryDenied)
    handleOpenSanctuaryDenied(payload: { session: InGameSession; playerId: string; message: string }): void {
        const response = errorResponse(payload.message);
        this.server.to(payload.playerId).emit(InGameEvents.OpenSanctuary, response);
    }

    @OnEvent(ServerEvents.OpenSanctuary)
    handleOpenSanctuary(payload: { session: InGameSession; playerId: string; kind: PlaceableKind; x: number; y: number }): void {
        const response = successResponse<OpenSanctuaryDto>({ kind: payload.kind, x: payload.x, y: payload.y });
        this.server.to(payload.playerId).emit(InGameEvents.OpenSanctuary, response);
    }

    @OnEvent(ServerEvents.SanctuaryActionFailed)
    handleSanctuaryActionFailed(payload: { session: InGameSession; playerId: string }): void {
        const response = successResponse<SanctuaryActionFailedDto>({ message: 'Sanctuary action failed' });
        this.server.to(payload.playerId).emit(InGameEvents.SanctuaryActionFailed, response);
    }

    @OnEvent(ServerEvents.SanctuaryActionSuccess)
    handleSanctuaryActionSuccess(payload: {
        session: InGameSession;
        playerId: string;
        kind: PlaceableKind;
        x: number;
        y: number;
        addedHealth?: number;
        addedDefense?: number;
        addedAttack?: number;
    }): void {
        const response = successResponse<SanctuaryActionSuccessDto>({
            kind: payload.kind,
            x: payload.x,
            y: payload.y,
            success: true,
            addedHealth: payload.addedHealth,
            addedDefense: payload.addedDefense,
            addedAttack: payload.addedAttack,
        });
        this.server.to(payload.playerId).emit(InGameEvents.SanctuaryActionSuccess, response);
    }

    @OnEvent(ServerEvents.PlayerBonusesChanged)
    handlePlayerBonusesChanged(payload: { session: InGameSession; playerId: string; attackBonus: number; defenseBonus: number }) {
        const response = successResponse<PlayerBonusesChangedDto>({
            attackBonus: payload.attackBonus,
            defenseBonus: payload.defenseBonus,
        });
        this.server.to(payload.playerId).emit(InGameEvents.PlayerBonusesChanged, response);
    }

    @OnEvent(ServerEvents.FlagPickedUp)
    handleFlagPickedUp(payload: { session: InGameSession; playerId: string }): void {
        this.server.to(payload.session.inGameId).emit(InGameEvents.FlagPickedUp, successResponse<FlagPickedUpDto>({ playerId: payload.playerId }));
    }

    @OnEvent(ServerEvents.FlagTransferRequested)
    handleFlagTransferRequested(payload: { session: InGameSession; fromPlayerId: string; toPlayerId: string; fromPlayerName: string }): void {
        this.server.to(payload.toPlayerId).emit(
            InGameEvents.FlagTransferRequested,
            successResponse<FlagTransferRequestDto>({
                fromPlayerId: payload.fromPlayerId,
                toPlayerId: payload.toPlayerId,
                fromPlayerName: payload.fromPlayerName,
            }),
        );
    }

    @OnEvent(ServerEvents.FlagTransferResult)
    handleFlagTransferResult(payload: { sessionId: string; fromPlayerId: string; toPlayerId: string; accepted: boolean }): void {
        this.server.to(payload.fromPlayerId).emit(
            InGameEvents.FlagTransferResult,
            successResponse<FlagTransferResultDto>({
                toPlayerId: payload.toPlayerId,
                accepted: payload.accepted,
            }),
        );
    }

    @OnEvent(ServerEvents.FlagTransferred)
    handleFlagTransferred(payload: { session: InGameSession; fromPlayerId: string; toPlayerId: string }): void {
        this.server
            .to(payload.session.inGameId)
            .emit(
                InGameEvents.FlagTransferred,
                successResponse<FlagTransferredDto>({ fromPlayerId: payload.fromPlayerId, toPlayerId: payload.toPlayerId }),
            );
    }

    @OnEvent(ServerEvents.FlagTransferRequestsCleared)
    handleFlagTransferRequestsCleared(payload: { session: InGameSession; affectedPlayerIds: string[] }): void {
        payload.affectedPlayerIds.forEach((playerId) => {
            this.server.to(playerId).emit(InGameEvents.FlagTransferRequestsCleared, successResponse({}));
        });
    }
}
