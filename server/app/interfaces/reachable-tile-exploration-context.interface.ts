import { ReachableTile } from '@common/interfaces/reachable-tile.interface';
import { InGameSession } from '@common/interfaces/session.interface';

export interface ReachableTileExplorationContext {
    session: InGameSession;
    playerId: string;
    visited: Set<string>;
    queue: ReachableTile[];
    mapSize: number;
    isOnBoat: boolean;
}
