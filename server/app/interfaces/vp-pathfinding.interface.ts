import { Orientation } from '@common/enums/orientation.enum';
import { Position } from '@common/interfaces/position.interface';

export type PathActionType = 'move' | 'openDoor' | 'boardBoat' | 'disembarkBoat' | 'teleport';

export interface PathAction {
    type: PathActionType;
    orientation?: Orientation;
    position: Position;
}

export interface PathResult {
    reachable: boolean;
    totalCost: number;
    actionsRequired: number;
    actions: PathAction[];
    destination: Position;
}

export interface EscapePoint {
    position: Position;
    path: PathResult;
    distanceFromEnemies: number;
}

export interface EnemyPosition {
    position: Position;
}
