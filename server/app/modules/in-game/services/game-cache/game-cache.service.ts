import { ServerEvents } from '@app/enums/server-events.enum';
import { GameMap } from '@app/interfaces/game-map.interface';
import { Game } from '@app/modules/game-store/entities/game.entity';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { Tile } from '@app/modules/game-store/entities/tile.entity';
import { GameDocument } from '@app/types/mongoose-documents.types';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableFootprint, PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileCost, TileKind } from '@common/enums/tile.enum';
import { Player } from '@common/interfaces/player.interface';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
@Injectable()
export class GameCacheService {
    private readonly sessionsGames = new Map<string, Game>();
    private readonly sessionsGameMaps = new Map<string, GameMap>();
    private readonly disabledPlaceables = new Map<string, Map<string, { playerId: string; turnCount: number }>>();

    constructor(
        @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    async fetchAndCacheGame(sessionId: string, gameId: string): Promise<Game> {
        const game = await this.gameModel.findById(gameId).lean();
        if (!game) throw new NotFoundException('Game not found');
        this.sessionsGames.set(sessionId, game);

        const expandedObjects: Placeable[] = [];
        for (const obj of game.objects) {
            if (!obj.placed) {
                continue;
            }

            const footprint = PlaceableFootprint[obj.kind];
            for (let offsetY = 0; offsetY < footprint; offsetY++) {
                for (let offsetX = 0; offsetX < footprint; offsetX++) {
                    expandedObjects.push({
                        ...obj,
                        x: obj.x + offsetX,
                        y: obj.y + offsetY,
                    });
                }
            }
        }

        this.disabledPlaceables.set(sessionId, new Map());

        const tiles = game.tiles.map((tile) => ({ ...tile, playerId: null }));
        for (const channel of game.teleportChannels) {
            if (channel.tiles?.entryA) {
                tiles[channel.tiles.entryA.y * game.size + channel.tiles.entryA.x].kind = TileKind.TELEPORT;
                tiles[channel.tiles.entryA.y * game.size + channel.tiles.entryA.x].teleportChannel = channel.channelNumber;
            }
            if (channel.tiles?.entryB) {
                tiles[channel.tiles.entryB.y * game.size + channel.tiles.entryB.x].kind = TileKind.TELEPORT;
                tiles[channel.tiles.entryB.y * game.size + channel.tiles.entryB.x].teleportChannel = channel.channelNumber;
            }
        }

        this.sessionsGameMaps.set(sessionId, {
            objects: expandedObjects,
            size: game.size,
            tiles,
        });
        return game;
    }

    getTileByPlayerId(sessionId: string, playerId: string): (Tile & { playerId: string | null }) | undefined {
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        return gameMap.tiles.find((tile) => tile.playerId === playerId);
    }

    getGameForSession(sessionId: string): Game {
        const game = this.sessionsGames.get(sessionId);
        if (!game) throw new NotFoundException('Game not found');
        return game;
    }

    getGameMapForSession(sessionId: string): GameMap {
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        return gameMap;
    }

    getTileAtPosition(sessionId: string, x: number, y: number): (Tile & { playerId: string | null }) | undefined {
        const game = this.getGameMapForSession(sessionId);
        const { tiles, size: mapSize } = game;
        const index = y * mapSize + x;
        return tiles[index];
    }

    getTeleportDestination(sessionId: string, x: number, y: number): { x: number; y: number } {
        const game = this.getGameForSession(sessionId);
        const teleportChannel = game.teleportChannels.find(
            (channel) =>
                (channel.tiles?.entryA?.x === x && channel.tiles?.entryA?.y === y) ||
                (channel.tiles?.entryB?.x === x && channel.tiles?.entryB?.y === y),
        );

        if (!teleportChannel?.tiles) {
            throw new NotFoundException('Teleport channel not found');
        }

        const entryA = teleportChannel.tiles.entryA;
        const entryB = teleportChannel.tiles.entryB;
        const isAtEntryA = entryA?.x === x && entryA?.y === y;

        if (isAtEntryA && entryB) {
            return { x: entryB.x, y: entryB.y };
        }
        if (!isAtEntryA && entryA) {
            return { x: entryA.x, y: entryA.y };
        }

        throw new NotFoundException('Teleport channel not found');
    }

    getNextPosition(sessionId: string, currentX: number, currentY: number, orientation: Orientation): { x: number; y: number } {
        const game = this.getGameForSession(sessionId);
        const { size: mapSize } = game;
        if (currentX < 0 || currentX >= mapSize || currentY < 0 || currentY >= mapSize) {
            throw new BadRequestException('Invalid position');
        }

        let nextX: number;
        let nextY: number;

        switch (orientation) {
            case Orientation.N:
                nextX = currentX;
                nextY = currentY - 1;
                break;
            case Orientation.E:
                nextX = currentX + 1;
                nextY = currentY;
                break;
            case Orientation.S:
                nextX = currentX;
                nextY = currentY + 1;
                break;
            case Orientation.W:
                nextX = currentX - 1;
                nextY = currentY;
                break;
        }

        if (nextX < 0 || nextX >= mapSize || nextY < 0 || nextY >= mapSize) {
            throw new BadRequestException('Next position is out of bounds');
        }

        return { x: nextX, y: nextY };
    }

    private getPlaceablesById(sessionId: string, id: string): Placeable[] {
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        return gameMap.objects.filter((obj) => obj.placed && obj._id?.toString() === id);
    }

    getPlaceablesAtPosition(sessionId: string, x: number, y: number): Placeable[] {
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        return gameMap.objects.filter((obj) => obj.placed && obj.x === x && obj.y === y);
    }

    getPlaceableAtPosition(sessionId: string, x: number, y: number): Placeable | undefined {
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        return gameMap.objects.find((obj) => obj.placed && obj.x === x && obj.y === y);
    }

    private getPlaceableKey(placeable: Placeable): string {
        return `${placeable._id?.toString()}-${placeable.x}-${placeable.y}`;
    }

    getMapSize(sessionId: string): number {
        return this.getGameForSession(sessionId).size;
    }

    setTileOccupant(sessionId: string, x: number, y: number, player: Player): void {
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        gameMap.tiles[y * gameMap.size + x].playerId = player.id;
    }

    moveTileOccupant(sessionId: string, x: number, y: number, player: Player): void {
        this.clearTileOccupant(sessionId, player.x, player.y);
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        gameMap.tiles[y * gameMap.size + x].playerId = player.id;
    }

    clearTileOccupant(sessionId: string, x: number, y: number): void {
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        gameMap.tiles[y * gameMap.size + x].playerId = null;
    }

    getTileOccupant(sessionId: string, x: number, y: number): string | null {
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        return gameMap.tiles[y * gameMap.size + x].playerId;
    }

    disablePlaceable(sessionId: string, x: number, y: number, playerId: string): void {
        const object = this.getPlaceableAtPosition(sessionId, x, y);
        if (!object) throw new NotFoundException('Object not found');
        const placeables = this.getPlaceablesById(sessionId, object._id?.toString() || '');

        if (!this.disabledPlaceables.has(sessionId)) {
            this.disabledPlaceables.set(sessionId, new Map());
        }
        const sessionDisabled = this.disabledPlaceables.get(sessionId);
        if (!sessionDisabled) throw new NotFoundException('Session disabled map not found');

        for (const placeable of placeables) {
            const key = this.getPlaceableKey(placeable);
            sessionDisabled.set(key, { playerId, turnCount: 2 });
        }
    }

    isPlaceableDisabled(sessionId: string, x: number, y: number): boolean {
        const object = this.getPlaceableAtPosition(sessionId, x, y);
        if (!object) return false;

        const sessionDisabled = this.disabledPlaceables.get(sessionId);
        if (!sessionDisabled) return false;

        const key = this.getPlaceableKey(object);
        const disabledInfo = sessionDisabled.get(key);
        return disabledInfo !== undefined && disabledInfo.turnCount > 0;
    }

    decrementDisabledPlaceablesTurnCount(sessionId: string): void {
        const sessionDisabled = this.disabledPlaceables.get(sessionId);
        if (!sessionDisabled) return;

        for (const [key, disabledInfo] of sessionDisabled.entries()) {
            disabledInfo.turnCount--;
            if (!disabledInfo.turnCount) {
                sessionDisabled.delete(key);
            }
        }
    }

    reenablePlaceablesForPlayer(sessionId: string, playerId: string): void {
        const sessionDisabled = this.disabledPlaceables.get(sessionId);
        if (!sessionDisabled) return;

        for (const [key, disabledInfo] of sessionDisabled.entries()) {
            if (disabledInfo.playerId === playerId) {
                sessionDisabled.delete(key);
            }
        }
    }

    isTileFree(sessionId: string, x: number, y: number): boolean {
        if (this.getTileOccupant(sessionId, x, y)) {
            return false;
        }

        const tile = this.getTileAtPosition(sessionId, x, y);
        if (!tile) {
            return false;
        }

        let tileCost = TileCost[tile.kind];
        if (tile.kind === TileKind.DOOR) {
            tileCost = tile.open ? TileCost.DOOR_OPEN : -1;
        }

        if (tileCost === -1) {
            return false;
        }

        const placeables = this.getPlaceablesAtPosition(sessionId, x, y);
        for (const placeable of placeables) {
            if (placeable.kind === PlaceableKind.FIGHT || placeable.kind === PlaceableKind.HEAL) {
                return false;
            }
        }

        return true;
    }

    clearSessionGameCache(sessionId: string): void {
        this.sessionsGames.delete(sessionId);
        this.sessionsGameMaps.delete(sessionId);
        this.disabledPlaceables.delete(sessionId);
    }

    updatePlaceablePosition(sessionId: string, fromX: number, fromY: number, toX: number, toY: number): void {
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        const placeable = this.getPlaceableAtPosition(sessionId, fromX, fromY);
        if (!placeable) throw new NotFoundException('Placeable not found');
        placeable.x = toX;
        placeable.y = toY;

        this.eventEmitter.emit(ServerEvents.PlaceablePositionUpdated, {
            sessionId,
            placeable: {
                ...placeable,
                id: placeable._id?.toString() || '',
            },
        });
    }
}
