import { GameLogEventType } from '@common/enums/game-log-event-type.enum';
import { GameLogMetadata } from '@common/types/game-log-metadata.type';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class GameLogEntryDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    id: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    timestamp: string;

    @ApiProperty({ enum: GameLogEventType })
    @IsEnum(GameLogEventType)
    @IsNotEmpty()
    type: GameLogEventType;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    message: string;

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty()
    involvedPlayerIds: string[];

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty()
    involvedPlayerNames: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    icon: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsObject()
    metadata?: GameLogMetadata;
}

