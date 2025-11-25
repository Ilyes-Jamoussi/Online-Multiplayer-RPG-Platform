import { GameLogEntryType } from '@common/enums/game-log-entry-type.enum';
import { GameLogMetadata } from '@common/types/game-log-metadata.type';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsObject, IsString } from 'class-validator';

export class GameLogEntryBase {
    @ApiProperty({ enum: GameLogEntryType, enumName: 'GameLogEntryType' })
    @IsEnum(GameLogEntryType)
    type: GameLogEntryType;

    @ApiProperty()
    @IsString()
    message: string;

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    involvedPlayerIds: string[];

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    involvedPlayerNames: string[];

    @ApiProperty()
    @IsString()
    icon: string;
}

export class GameLogEntryWithMetadata extends GameLogEntryBase {
    @ApiProperty()
    @IsObject()
    metadata: GameLogMetadata;
}

