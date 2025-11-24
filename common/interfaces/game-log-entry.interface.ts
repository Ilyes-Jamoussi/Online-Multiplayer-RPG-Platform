import { GameLogEventType } from '@common/enums/game-log-event-type.enum';
import { GameLogMetadata } from '@common/types/game-log-metadata.type';

export interface GameLogEntry {
    id: string;
    timestamp: string;
    type: GameLogEventType;
    message: string;
    involvedPlayerIds: string[];
    involvedPlayerNames: string[];
    icon?: string;
    metadata?: GameLogMetadata;
}
