import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class GamePreviewDto {
    @ApiProperty({ example: '507f1f77bcf86cd799439011' })
    @IsString()
    @IsMongoId()
    readonly id: string;

    @ApiProperty({ example: 'Epic Adventure Game' })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({ enum: MapSize, example: MapSize.MEDIUM })
    @IsEnum(MapSize)
    readonly size: MapSize;

    @ApiProperty({ enum: GameMode, example: GameMode.CLASSIC })
    @IsEnum(GameMode)
    readonly mode: GameMode;

    @ApiProperty({ example: 'An exciting adventure awaits!' })
    @IsString()
    @IsNotEmpty()
    readonly description: string;

    @ApiProperty({ example: '2024-01-15T10:30:00Z' })
    @IsDateString()
    readonly lastModified: Date;

    @ApiProperty({ example: true })
    @IsBoolean()
    readonly visibility: boolean;

    @ApiProperty({ example: '/assets/grid-previews/game-123-preview.png' })
    @IsString()
    @IsNotEmpty()
    readonly gridPreviewUrl: string;
}
