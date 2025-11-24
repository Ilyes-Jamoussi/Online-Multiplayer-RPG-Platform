import { GameLogEventType } from '@common/enums/game-log-event-type.enum';
import { GameLogMetadata } from '@common/types/game-log-metadata.type';

export interface GameLogEntryBase {
    type: GameLogEventType;
    message: string;
    involvedPlayerIds: string[];
    involvedPlayerNames: string[];
    icon: string;
}

export interface GameLogEntryWithMetadata extends GameLogEntryBase {
    metadata: GameLogMetadata;
}

