// server/src/games/dto/create-game.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { MapSize } from '@common/enums/map-size.enum';
import { GameMode } from '@common/enums/game-mode.enum';

export class CreateGameDto {
    @ApiProperty({ enum: MapSize, example: MapSize.LARGE })
    @IsEnum(MapSize)
    readonly size: MapSize;

    @ApiProperty({ enum: GameMode, example: GameMode.CLASSIC })
    @IsEnum(GameMode)
    readonly mode: GameMode;

    @ApiProperty({ example: 'New game' })
    @IsString()
    @IsOptional()
    readonly name: string;

    @ApiProperty({ example: 'Description…' })
    @IsString()
    @IsOptional()
    readonly description: string;

    @ApiPropertyOptional({ example: false, description: 'Public (true) ou privé (false)' })
    @IsOptional()
    @IsBoolean()
    readonly visibility?: boolean;
}
