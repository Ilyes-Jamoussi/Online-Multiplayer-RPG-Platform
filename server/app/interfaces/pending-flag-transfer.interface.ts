import { Position } from '@common/interfaces/position.interface';

export interface PendingFlagTransfer {
    sessionId: string;
    fromPlayerId: string;
    toPlayerId: string;
    position: Position;
}
