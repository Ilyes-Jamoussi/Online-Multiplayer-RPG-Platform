import { Orientation } from '@common/enums/orientation.enum';
import { TileKind } from '@common/enums/tile.enum';
import { Position } from '@common/interfaces/position.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { PathAction, PathActionType } from './vp-pathfinding.interface';

export interface PathNode {
    position: Position;
    costFromStart: number;
    estimatedCostToGoal: number;
    totalCost: number;
    parent: PathNode | null;
    actionToReach: PathAction | null;
    isOnBoat: boolean;
    actionsUsed: number;
}

export interface NeighborParams {
    current: PathNode;
    position: Position;
    moveCost: number;
    orientation: Orientation;
    actionType: PathActionType;
    isOnBoat: boolean;
    goal: Position;
    extraActions?: number;
}

export interface TileExploration {
    current: PathNode;
    nextPos: Position;
    tile: { kind: TileKind; open?: boolean };
    orientation: Orientation;
    goal: Position;
}

export interface ExplorationContext {
    session: InGameSession;
    mapSize: number;
    goal: Position;
}
