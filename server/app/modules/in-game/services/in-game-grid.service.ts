import { Injectable } from '@nestjs/common';
import { Game } from '@app/modules/game-store/entities/game.entity';
import { Tile } from '@app/modules/game-store/entities/tile.entity';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { InGamePlayer, Player } from '@common/models/player.interface';
import { MapSize } from '@common/enums/map-size.enum';
import { Session } from '@common/models/session.interface';

export interface InGameGrid {
    id: string;
    size: MapSize;
    tiles: Tile[];
    objects: Placeable[];
}

export interface StartPoint {
    x: number;
    y: number;
    id: string;
    playerId: string;
}

const SHUFFLE_FACTOR = 0.5;

@Injectable()
export class InGameGridService {
    private readonly grids = new Map<string, InGameGrid>();

    initGridForSession(session: Session, game: Game): { grid: InGameGrid; startPoints: StartPoint[]; players: InGamePlayer[] } {
        const initialGrid: InGameGrid = {
            id: game._id.toString(),
            size: game.size,
            tiles: game.tiles,
            objects: game.objects,
        };
        this.grids.set(session.id, initialGrid);
        const players = session.players;
        const startPoints = this.getStartPoints(game);
        const { startPoints: assignedPoints, players: assignedPlayers } = this.assignStartPoints(session.id, startPoints, players);
        const updatedGrid = this.filterGameGridObjects(session.id, assignedPoints);
        this.grids.set(session.id, updatedGrid);
        return { grid: updatedGrid, startPoints: assignedPoints, players: assignedPlayers };
    }

    getStartPoints(game: Game): StartPoint[] {
        return game.objects
            .filter((obj) => obj.kind === PlaceableKind.START)
            .map((o) => ({
                id: o._id.toString(),
                x: o.x,
                y: o.y,
                playerId: '',
            }));
    }

    assignStartPoints(sessionId: string, startPoints: StartPoint[], players: Player[]): { startPoints: StartPoint[]; players: InGamePlayer[] } {
        const available = [...startPoints];
        const assignedPoints: StartPoint[] = [];
        const assignedPlayers: InGamePlayer[] = [];

        for (const player of players) {
            if (available.length === 0) break;

            const randomIndex = Math.floor(Math.random() * available.length);
            const point = available.splice(randomIndex, 1)[0];

            assignedPoints.push({ ...point, playerId: player.id });
            assignedPlayers.push({
                ...player,
                startPointId: point.id,
                currentPosition: { x: point.x, y: point.y },
                isActive: false,
                joinedInGameSession: false,
            });
        }

        const updatedGrid = this.filterGameGridObjects(sessionId, assignedPoints);
        this.grids.set(sessionId, updatedGrid);
        return { startPoints: assignedPoints, players: assignedPlayers };
    }

    getRandomTurnOrderIndex(players: InGamePlayer[]): number[] {
        const order = players.map((_, i) => i);
        order.sort(() => Math.random() - SHUFFLE_FACTOR);
        return order;
    }

    filterGameGridObjects(sessionId: string, startPoints: StartPoint[]): InGameGrid {
        const grid = this.getGridForSession(sessionId);
        if (!grid) throw new Error('Grid not found');
        const filteredObjects = grid.objects.filter((o) => {
            const isStart = o.kind === PlaceableKind.START;
            if (!isStart) return o.placed;
            return startPoints.some((sp) => sp.id === o._id.toString());
        });
        return { ...grid, objects: filteredObjects };
    }

    getGridForSession(sessionId: string): InGameGrid | undefined {
        return this.grids.get(sessionId);
    }
}
