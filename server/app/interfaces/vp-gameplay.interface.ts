import { PathResult } from './vp-pathfinding.interface';
import { Position } from '@common/interfaces/position.interface';
import { PointOfInterestType } from '@app/enums/point-of-interest-type.enum';

export interface PointOfInterest {
    type: PointOfInterestType;
    position: Position;
    playerId?: string;
    isHeld?: boolean;
}

export interface PointOfInterestWithPath extends PointOfInterest {
    path: PathResult;
}

export interface EvaluatedTarget extends PointOfInterestWithPath {
    priorityScore: number;
}

export interface MapScanResult {
    enemies: PointOfInterest[];
    healSanctuaries: PointOfInterest[];
    fightSanctuaries: PointOfInterest[];
    boats: PointOfInterest[];
    flags: PointOfInterest[];
    all: PointOfInterest[];
}

export interface MapScanWithDistances {
    enemies: PointOfInterestWithPath[];
    healSanctuaries: PointOfInterestWithPath[];
    fightSanctuaries: PointOfInterestWithPath[];
    boats: PointOfInterestWithPath[];
    flags: PointOfInterestWithPath[];
    all: PointOfInterestWithPath[];
}

export interface VPDecision {
    target: EvaluatedTarget | null;
    allEvaluatedTargets: EvaluatedTarget[];
    useDoubleAction: boolean;
}
