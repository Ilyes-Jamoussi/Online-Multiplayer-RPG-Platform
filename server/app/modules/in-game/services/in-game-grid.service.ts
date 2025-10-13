import { Injectable } from '@nestjs/common';
import { Game } from '@app/modules/game-store/entities/game.entity';
import { Tile } from '@app/modules/game-store/entities/tile.entity';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { InGamePlayer } from '@common/models/player.interface';
import { MapSize } from '@common/enums/map-size.enum';

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

    /** Construit une grille jouable à partir d’un Game */
    createGridFromGame(game: Game): InGameGrid {
        const grid: InGameGrid = {
            id: game._id.toString(),
            size: game.size,
            tiles: game.tiles,
            objects: game.objects,
        };
        this.grids.set(grid.id, grid);
        return grid;
    }

    /** Extrait les points de départ depuis les objets de type START */
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

    /**
     * Assigne aléatoirement les startPoints aux joueurs.
     * Retourne les points assignés et la version mise à jour des joueurs.
     */
    assignStartPoints(startPoints: StartPoint[], players: InGamePlayer[]): { startPoints: StartPoint[]; players: InGamePlayer[] } {
        const available = [...startPoints];
        const assignedPoints: StartPoint[] = [];
        const assignedPlayers: InGamePlayer[] = [];

        for (const player of players) {
            if (available.length === 0) break;

            const randomIndex = Math.floor(Math.random() * available.length);
            const point = available.splice(randomIndex, 1)[0];

            assignedPoints.push({ ...point, playerId: player.id });
            assignedPlayers.push({ ...player, startPointId: point.id });
        }

        return { startPoints: assignedPoints, players: assignedPlayers };
    }

    /** Mélange aléatoire de l’ordre des tours */
    getRandomTurnOrderIndex(players: InGamePlayer[]): number[] {
        const order = players.map((_, i) => i);
        order.sort(() => Math.random() - SHUFFLE_FACTOR);
        return order;
    }

    /** Filtrage d’objets de la grille (exclut les START déjà utilisés) */
    buildGameGrid(grid: InGameGrid, startPoints: StartPoint[]): InGameGrid {
        const filteredObjects = grid.objects.filter((o) => {
            const isStart = o.kind === PlaceableKind.START;
            if (!isStart) return true;
            return startPoints.some((sp) => sp.id === o._id.toString());
        });

        return { ...grid, objects: filteredObjects };
    }

    getGrid(id: string): InGameGrid | undefined {
        return this.grids.get(id);
    }
}
