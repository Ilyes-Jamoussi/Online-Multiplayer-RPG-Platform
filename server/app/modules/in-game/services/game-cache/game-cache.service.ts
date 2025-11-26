import { ServerEvents } from '@app/enums/server-events.enum';
import { GameMap } from '@app/interfaces/game-map.interface';
import { Game } from '@app/modules/game-store/entities/game.entity';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { Tile } from '@app/modules/game-store/entities/tile.entity';
import { GameDocument } from '@app/types/mongoose-documents.types';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableFootprint, PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileCost, TileKind } from '@common/enums/tile.enum';
import { FlagData } from '@common/interfaces/flag-data.interface';
import { Player } from '@common/interfaces/player.interface';
import { Position } from '@common/interfaces/position.interface';
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

    hidePlaceable(sessionId: string, position: Position): void {
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        const placeable = this.getPlaceableAtPosition(sessionId, position);
        if (!placeable) throw new NotFoundException('Placeable not found');
        placeable.placed = false;
        this.eventEmitter.emit(ServerEvents.PlaceableUpdated, {
            sessionId,
            placeable: {
                ...placeable,
                id: placeable._id?.toString() || '',
            },
        });
    }

    showPlaceable(sessionId: string, position: Position): void {
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        const placeable = this.getPlaceableAtPosition(sessionId, position, false);
        if (!placeable) throw new NotFoundException('Placeable not found');
        placeable.placed = true;
        this.eventEmitter.emit(ServerEvents.PlaceableUpdated, {
            sessionId,
            placeable: {
                ...placeable,
                id: placeable._id?.toString() || '',
            },
        });
    }

    async fetchAndCacheGame(sessionId: string, gameId: string): Promise<Game> {
        const game = await this.gameModel.findById(gameId).lean();
        if (!game) throw new NotFoundException('Game not found');
        this.sessionsGames.set(sessionId, game);

        const expandedObjects: Placeable[] = [];
        for (const obj of game.objects) {
            if (!obj.placed) {
                continue;
            }

            const footprint = PlaceableFootprint[obj.kind] || 1;
            for (let offsetY = 0; offsetY < footprint; offsetY++) {
                for (let offsetX = 0; offsetX < footprint; offsetX++) {
                    const expanded = {
                        ...obj,
                        x: obj.x + offsetX,
                        y: obj.y + offsetY,
                    };
                    expandedObjects.push(expanded);
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

    getTileAtPosition(sessionId: string, position: Position): (Tile & { playerId: string | null }) | undefined {
        const game = this.getGameMapForSession(sessionId);
        const { tiles, size: mapSize } = game;
        const index = position.y * mapSize + position.x;
        return tiles[index];
    }

    getTeleportDestination(sessionId: string, position: Position): Position {
        const game = this.getGameForSession(sessionId);
        const teleportChannel = game.teleportChannels.find(
            (channel) =>
                (channel.tiles?.entryA?.x === position.x && channel.tiles?.entryA?.y === position.y) ||
                (channel.tiles?.entryB?.x === position.x && channel.tiles?.entryB?.y === position.y),
        );

        if (!teleportChannel?.tiles) {
            throw new NotFoundException('Teleport channel not found');
        }

        const entryA = teleportChannel.tiles.entryA;
        const entryB = teleportChannel.tiles.entryB;
        const isAtEntryA = entryA?.x === position.x && entryA?.y === position.y;

        if (isAtEntryA && entryB) {
            return { x: entryB.x, y: entryB.y };
        }
        if (!isAtEntryA && entryA) {
            return { x: entryA.x, y: entryA.y };
        }

        throw new NotFoundException('Teleport channel not found');
    }

    getNextPosition(sessionId: string, currentPosition: Position, orientation: Orientation): Position {
        const game = this.getGameForSession(sessionId);
        const { size: mapSize } = game;
        if (currentPosition.x < 0 || currentPosition.x >= mapSize || currentPosition.y < 0 || currentPosition.y >= mapSize) {
            throw new BadRequestException('Invalid position');
        }

        let nextX: number;
        let nextY: number;

        switch (orientation) {
            case Orientation.N:
                nextX = currentPosition.x;
                nextY = currentPosition.y - 1;
                break;
            case Orientation.E:
                nextX = currentPosition.x + 1;
                nextY = currentPosition.y;
                break;
            case Orientation.S:
                nextX = currentPosition.x;
                nextY = currentPosition.y + 1;
                break;
            case Orientation.W:
                nextX = currentPosition.x - 1;
                nextY = currentPosition.y;
                break;
        }

        if (nextX < 0 || nextX >= mapSize || nextY < 0 || nextY >= mapSize) {
            throw new BadRequestException('Next position is out of bounds');
        }

        return { x: nextX, y: nextY };
    }

    private getPlaceablesById(sessionId: string, id: string, placedOnly: boolean = true): Placeable[] {
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        return gameMap.objects.filter((obj) => (placedOnly ? obj.placed : true) && obj._id?.toString() === id);
    }

    getPlaceablesAtPosition(sessionId: string, position: Position, placedOnly: boolean = true): Placeable[] {
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        return gameMap.objects.filter((obj) => (placedOnly ? obj.placed : true) && obj.x === position.x && obj.y === position.y);
    }

    getPlaceableAtPosition(sessionId: string, position: Position, placedOnly: boolean = true): Placeable | undefined {
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        const found = gameMap.objects.find((obj) => (placedOnly ? obj.placed : true) && obj.x === position.x && obj.y === position.y);
        return found;
    }

    getFlagPlaceable(sessionId: string, placedOnly: boolean = true): Placeable | undefined {
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        return gameMap.objects.find((obj) => (placedOnly ? obj.placed : true) && obj.kind === PlaceableKind.FLAG);
    }

    private getPlaceableKey(placeable: Placeable): string {
        return `${placeable._id?.toString()}-${placeable.x}-${placeable.y}`;
    }

    getMapSize(sessionId: string): number {
        return this.getGameForSession(sessionId).size;
    }

    setTileOccupant(sessionId: string, position: Position, player: Player): void {
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        gameMap.tiles[position.y * gameMap.size + position.x].playerId = player.id;
    }

    moveTileOccupant(sessionId: string, position: Position, player: Player): void {
        this.clearTileOccupant(sessionId, { x: player.x, y: player.y });
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        gameMap.tiles[position.y * gameMap.size + position.x].playerId = player.id;
    }

    clearTileOccupant(sessionId: string, position: Position): void {
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        gameMap.tiles[position.y * gameMap.size + position.x].playerId = null;
    }

    getTileOccupant(sessionId: string, position: Position): string | null {
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        return gameMap.tiles[position.y * gameMap.size + position.x].playerId;
    }

    disablePlaceable(sessionId: string, position: Position, playerId: string): void {
        const object = this.getPlaceableAtPosition(sessionId, position);
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

    isPlaceableDisabled(sessionId: string, position: Position): boolean {
        const object = this.getPlaceableAtPosition(sessionId, position);
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

    isTileFree(sessionId: string, position: Position): boolean {
        if (this.getTileOccupant(sessionId, position)) {
            return false;
        }

        const tile = this.getTileAtPosition(sessionId, position);
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

        const placeables = this.getPlaceablesAtPosition(sessionId, position);
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

    updatePlaceablePosition(sessionId: string, fromPosition: Position, toPosition: Position): void {
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        const placeable = this.getPlaceableAtPosition(sessionId, fromPosition);
        if (!placeable) throw new NotFoundException('Placeable not found');
        placeable.x = toPosition.x;
        placeable.y = toPosition.y;

        this.eventEmitter.emit(ServerEvents.PlaceableUpdated, {
            sessionId,
            placeable: {
                ...placeable,
                id: placeable._id?.toString() || '',
            },
        });
    }

    getInitialFlagData(sessionId: string): FlagData | undefined {
        const session = this.sessionsGameMaps.get(sessionId);
        if (!session) throw new NotFoundException('Session not found');
        const flag = session.objects.find((obj) => obj.kind === PlaceableKind.FLAG);
        if (!flag) return undefined;
        return {
            position: { x: flag.x, y: flag.y },
            holderPlayerId: null,
        };
    }
}
