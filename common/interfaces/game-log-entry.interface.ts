import { GameLogEntryType } from '@common/enums/game-log-entry-type.enum';
import { GameLogMetadata } from '@common/types/game-log-metadata.type';

export interface GameLogEntry {
    id: string;
    timestamp: string;
    type: GameLogEntryType;
    message: string;
    involvedPlayerIds: string[];
    involvedPlayerNames: string[];
    icon?: string;
    metadata?: GameLogMetadata;
}
