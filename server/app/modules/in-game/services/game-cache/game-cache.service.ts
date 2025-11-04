import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Game } from '@app/modules/game-store/entities/game.entity';
import { GameDocument } from '@app/types/mongoose-documents.types';
import { GameMap } from '@app/interfaces/game-map.interface';
import { Model } from 'mongoose';
import { Tile } from '@app/modules/game-store/entities/tile.entity';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { Orientation } from '@common/enums/orientation.enum';
import { Player } from '@common/models/player.interface';
import { MapSize } from '@common/enums/map-size.enum';
import { TileCost, TileKind } from '@common/enums/tile-kind.enum';
@Injectable()
export class GameCacheService {
    private readonly sessionsGames = new Map<string, Game>();
    private readonly sessionsGameMaps = new Map<string, GameMap>();

    constructor(
        @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>,
    ) {}

    async fetchAndCacheGame(sessionId: string, gameId: string): Promise<Game> {
        const game = await this.gameModel.findById(gameId).lean();
        if (!game) throw new NotFoundException('Game not found');
        this.sessionsGames.set(sessionId, game);
        this.sessionsGameMaps.set(sessionId, {
            tiles: game.tiles.map((tile) => ({ ...tile, playerId: null })),
            objects: game.objects,
            size: game.size,
        });
        return game;
    }

    getTileByPlayerId(sessionId: string, playerId: string): Tile & { playerId: string | null } | undefined {
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

    clearGameCache(sessionId: string): void {
        this.sessionsGames.delete(sessionId);
    }

    getTileAtPosition(sessionId: string, x: number, y: number): Tile & { playerId: string | null } | undefined {
        const game = this.getGameMapForSession(sessionId);
        const { tiles, size: mapSize } = game;
        const index = y * mapSize + x;
        return tiles[index];
    }

    getNextPosition(sessionId: string, currentX: number, currentY: number, orientation: Orientation): { x: number; y: number } {
        const game = this.getGameForSession(sessionId);
        const { size: mapSize } = game;
        if (currentX < 0 || currentX >= mapSize || currentY < 0 || currentY >= mapSize) {
            throw new BadRequestException('Invalid position');
        }
        switch (orientation) {
            case Orientation.N:
                return { x: currentX, y: currentY - 1 };
            case Orientation.E:
                return { x: currentX + 1, y: currentY };
            case Orientation.S:
                return { x: currentX, y: currentY + 1 };
            case Orientation.W:
                return { x: currentX - 1, y: currentY };
        }
    }

    getPlaceablesAtPosition(sessionId: string, x: number, y: number): Placeable[] {
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        return gameMap.objects.filter((obj) => obj.placed && obj.x === x && obj.y === y);
    }

    getMapSize(sessionId: string): number {
        return this.getGameForSession(sessionId).size;
    }

    setTileOccupant(sessionId: string, x: number, y: number, player: Player): void {
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        gameMap.tiles[y * gameMap.size + x].playerId = player.id;
    }

    moveTileOccupant(
        sessionId: string,
        x: number,
        y: number,
        player: Player,
    ): void {
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

    toggleDoorAtPosition(sessionId: string, x: number, y: number): void {
        const gameMap = this.sessionsGameMaps.get(sessionId);
        if (!gameMap) throw new NotFoundException('Game map not found');
        const tile = this.getTileAtPosition(sessionId, x, y);
        if (!tile) throw new NotFoundException('Tile not found');
        if (tile.kind !== TileKind.DOOR) throw new BadRequestException('Tile is not a door');
        tile.open = !tile.open;
        gameMap.tiles[y * gameMap.size + x] = tile;
    }

    isTileFree(sessionId: string, x: number, y: number): boolean {
        if (this.getTileOccupant(sessionId, x, y)) {
            return false;
        }

        const tile = this.getTileAtPosition(sessionId, x, y);
        if (!tile) {
            return false;
        }

        const tileCost = TileCost[tile.kind];
        if (tileCost === -1) {
            return false;
        }

        if (tile.kind === TileKind.DOOR && !tile.open) {
            return false;
        }

        return true;
    }
}
