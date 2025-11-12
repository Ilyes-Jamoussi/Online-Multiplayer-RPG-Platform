import { ApiProperty } from '@nestjs/swagger';
import { GameLogEventType } from '@common/enums/game-log-event-type.enum';

export class GameLogEntryDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    timestamp!: string;

    @ApiProperty({ enum: GameLogEventType })
    type!: GameLogEventType;

    @ApiProperty()
    message!: string;

    @ApiProperty({ type: [String] })
    involvedPlayerIds!: string[];

    @ApiProperty({ type: [String] })
    involvedPlayerNames!: string[];

    @ApiProperty({ required: false })
    icon?: string;

    @ApiProperty({ required: false })
    metadata?: Record<string, unknown>;
}

