import { GameLogEventType } from '@common/enums/game-log-event-type.enum';

export interface GameLogEntry {
    id: string;
    timestamp: string;
    type: GameLogEventType;
    message: string;
    involvedPlayerIds: string[];
    involvedPlayerNames: string[];
    icon?: string;
    metadata?: Record<string, unknown>;
}
